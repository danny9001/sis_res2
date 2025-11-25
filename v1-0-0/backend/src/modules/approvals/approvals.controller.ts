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
