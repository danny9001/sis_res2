#!/bin/bash

echo "✅ Creando módulos Approvals, Guests, Analytics y Audit..."

# APPROVALS MODULE
mkdir -p backend/src/modules/approvals
cat > backend/src/modules/approvals/approvals.controller.ts << 'EOF'
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import { sendReservationQRs } from '../../utils/emailService';

const prisma = new PrismaClient();

export const getPendingApprovals = async (req: AuthRequest, res: Response) => {
  try {
    let where: any = {
      status: 'PENDING'
    };

    // Si es aprobador, solo sus sectores
    if (req.user!.role === 'APPROVER') {
      where.approverId = req.user!.id;
    }

    const approvals = await prisma.approval.findMany({
      where,
      include: {
        reservation: {
          include: {
            event: true,
            sector: true,
            relatorMain: true,
            guests: true
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(approvals);
  } catch (error) {
    console.error('Error al obtener aprobaciones:', error);
    res.status(500).json({ error: 'Error al obtener aprobaciones' });
  }
};

export const approveReservation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            event: true,
            sector: true,
            relatorMain: true,
            guests: true
          }
        }
      }
    });

    if (!approval) {
      return res.status(404).json({ error: 'Aprobación no encontrada' });
    }

    if (approval.approverId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para aprobar esta reserva' });
    }

    if (approval.status !== 'PENDING') {
      return res.status(400).json({ error: 'Esta reserva ya fue procesada' });
    }

    // Actualizar aprobación
    await prisma.approval.update({
      where: { id },
      data: {
        status: 'APPROVED',
        comments,
        approvedAt: new Date()
      }
    });

    // Actualizar reserva
    await prisma.reservation.update({
      where: { id: approval.reservationId },
      data: {
        status: 'APPROVED'
      }
    });

    // Enviar QRs por email
    const guests = approval.reservation.guests.map(g => ({
      name: g.name,
      qrCode: g.qrCode
    }));

    await sendReservationQRs(
      approval.reservation.relatorMain.email,
      approval.reservation.relatorMain.name,
      guests,
      approval.reservation.event.name,
      approval.reservation.event.eventDate.toLocaleDateString()
    );

    // Auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'APPROVE_RESERVATION',
        entity: 'Approval',
        entityId: id,
        reservationId: approval.reservationId,
        newData: { status: 'APPROVED', comments } as any,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Notificar via WebSocket
    const io = req.app.get('io');
    io.emit('reservation-approved', {
      reservationId: approval.reservationId,
      relatorId: approval.reservation.relatorMainId
    });

    res.json({ message: 'Reserva aprobada exitosamente' });
  } catch (error) {
    console.error('Error al aprobar reserva:', error);
    res.status(500).json({ error: 'Error al aprobar reserva' });
  }
};

export const rejectReservation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    if (!comments) {
      return res.status(400).json({ error: 'Debes proporcionar un motivo de rechazo' });
    }

    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        reservation: true
      }
    });

    if (!approval) {
      return res.status(404).json({ error: 'Aprobación no encontrada' });
    }

    if (approval.approverId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para rechazar esta reserva' });
    }

    // Actualizar aprobación
    await prisma.approval.update({
      where: { id },
      data: {
        status: 'REJECTED',
        comments,
        approvedAt: new Date()
      }
    });

    // Actualizar reserva
    await prisma.reservation.update({
      where: { id: approval.reservationId },
      data: {
        status: 'REJECTED'
      }
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'REJECT_RESERVATION',
        entity: 'Approval',
        entityId: id,
        reservationId: approval.reservationId,
        newData: { status: 'REJECTED', comments } as any,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Notificar
    const io = req.app.get('io');
    io.emit('reservation-rejected', {
      reservationId: approval.reservationId,
      relatorId: approval.reservation.relatorMainId
    });

    res.json({ message: 'Reserva rechazada' });
  } catch (error) {
    console.error('Error al rechazar reserva:', error);
    res.status(500).json({ error: 'Error al rechazar reserva' });
  }
};
EOF

cat > backend/src/modules/approvals/approvals.routes.ts << 'EOF'
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  getPendingApprovals,
  approveReservation,
  rejectReservation
} from './approvals.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('APPROVER', 'ADMIN'));

router.get('/pending', getPendingApprovals);
router.post('/:id/approve', approveReservation);
router.post('/:id/reject', rejectReservation);

export default router;
EOF

# GUESTS MODULE
mkdir -p backend/src/modules/invitations
cat > backend/src/modules/invitations/guests.controller.ts << 'EOF'
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';

const prisma = new PrismaClient();

export const validateQR = async (req: AuthRequest, res: Response) => {
  try {
    const { qrCode } = req.body;

    const guest = await prisma.guest.findUnique({
      where: { qrCode },
      include: {
        reservation: {
          include: {
            event: true,
            sector: true
          }
        }
      }
    });

    if (!guest) {
      return res.status(404).json({ error: 'QR inválido' });
    }

    if (guest.qrValidated) {
      return res.status(400).json({ 
        error: 'QR ya utilizado',
        validatedAt: guest.validatedAt
      });
    }

    // Validar QR
    await prisma.guest.update({
      where: { id: guest.id },
      data: {
        qrValidated: true,
        validatedAt: new Date()
      }
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'VALIDATE_QR',
        entity: 'Guest',
        entityId: guest.id,
        reservationId: guest.reservationId,
        newData: { qrCode, validated: true } as any,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json({
      message: 'QR validado exitosamente',
      guest: {
        name: guest.name,
        ci: guest.ci,
        event: guest.reservation.event.name,
        sector: guest.reservation.sector.name
      }
    });
  } catch (error) {
    console.error('Error al validar QR:', error);
    res.status(500).json({ error: 'Error al validar QR' });
  }
};

export const getFrequentGuests = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { ci: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const guests = await prisma.guest.groupBy({
      by: ['name', 'ci'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 50
    });

    res.json(guests);
  } catch (error) {
    console.error('Error al obtener invitados frecuentes:', error);
    res.status(500).json({ error: 'Error al obtener invitados' });
  }
};
EOF

cat > backend/src/modules/invitations/guests.routes.ts << 'EOF'
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validateQR, getFrequentGuests } from './guests.controller';

const router = Router();

router.use(authenticate);

router.post('/validate', authorize('ADMIN', 'APPROVER'), validateQR);
router.get('/frequent', getFrequentGuests);

export default router;
EOF

# ANALYTICS MODULE
mkdir -p backend/src/modules/analytics
cat > backend/src/modules/analytics/analytics.controller.ts << 'EOF'
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, startDate, endDate } = req.query;

    const where: any = {};
    
    if (eventId) {
      where.eventId = eventId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    // Total de reservas
    const totalReservations = await prisma.reservation.count({ where });

    // Por estado
    const byStatus = await prisma.reservation.groupBy({
      by: ['status'],
      where,
      _count: true
    });

    // Por sector
    const bySector = await prisma.reservation.groupBy({
      by: ['sectorId'],
      where,
      _count: true,
      _sum: {
        paymentAmount: true
      }
    });

    // Total de invitados
    const totalGuests = await prisma.guest.count({
      where: {
        reservation: where
      }
    });

    // QRs validados
    const validatedQRs = await prisma.guest.count({
      where: {
        reservation: where,
        qrValidated: true
      }
    });

    // Top relacionadores
    const topRelators = await prisma.reservation.groupBy({
      by: ['relatorMainId'],
      where,
      _count: true,
      _sum: {
        paymentAmount: true
      },
      orderBy: {
        _count: {
          relatorMainId: 'desc'
        }
      },
      take: 10
    });

    res.json({
      totalReservations,
      byStatus,
      bySector,
      totalGuests,
      validatedQRs,
      topRelators,
      validationRate: totalGuests > 0 ? (validatedQRs / totalGuests) * 100 : 0
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

export const getRelatorStats = async (req: AuthRequest, res: Response) => {
  try {
    const { relatorId } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = {
      OR: [
        { relatorMainId: relatorId },
        { relatorSaleId: relatorId }
      ]
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        event: true,
        sector: true,
        guests: true
      }
    });

    const stats = {
      totalReservations: reservations.length,
      approved: reservations.filter(r => r.status === 'APPROVED').length,
      pending: reservations.filter(r => r.status === 'PENDING').length,
      rejected: reservations.filter(r => r.status === 'REJECTED').length,
      totalRevenue: reservations.reduce((sum, r) => sum + (r.paymentAmount || 0), 0),
      totalGuests: reservations.reduce((sum, r) => sum + r.guests.length, 0)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas de relacionador:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
EOF

cat > backend/src/modules/analytics/analytics.routes.ts << 'EOF'
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { getDashboardStats, getRelatorStats } from './analytics.controller';

const router = Router();

router.use(authenticate);

router.get('/dashboard', authorize('ADMIN', 'APPROVER'), getDashboardStats);
router.get('/relator/:relatorId', getRelatorStats);

export default router;
EOF

# AUDIT MODULE
mkdir -p backend/src/modules/audit
cat > backend/src/modules/audit/audit.controller.ts << 'EOF'
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';

const prisma = new PrismaClient();

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { entity, entityId, userId, action, startDate, endDate } = req.query;

    const where: any = {};

    if (entity) {
      where.entity = entity;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        reservation: {
          select: {
            id: true,
            event: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json(logs);
  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error);
    res.status(500).json({ error: 'Error al obtener logs' });
  }
};

export const getReservationHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { reservationId } = req.params;

    const logs = await prisma.auditLog.findMany({
      where: {
        reservationId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(logs);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};
EOF

cat > backend/src/modules/audit/audit.routes.ts << 'EOF'
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { getAuditLogs, getReservationHistory } from './audit.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAuditLogs);
router.get('/reservation/:reservationId', getReservationHistory);

export default router;
EOF

echo "✅ Todos los módulos del backend creados"
