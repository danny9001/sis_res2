// backend/src/modules/additional-passes/additional-passes.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import QRCode from 'qrcode';
import { emailService } from '../../utils/emailService';

const prisma = new PrismaClient();

// Schema de validación
const createPassSchema = z.object({
  reservationId: z.string().uuid(),
  guestName: z.string().min(2),
  guestCI: z.string().min(5),
  guestPhone: z.string().optional(),
  reason: z.string().min(10, 'La razón debe tener al menos 10 caracteres'),
});

/**
 * POST /api/additional-passes
 * Crear pase adicional para una mesa
 */
export const createAdditionalPass = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Validar datos
    const data = createPassSchema.parse(req.body);

    // Obtener reserva
    const reservation = await prisma.reservation.findUnique({
      where: { id: data.reservationId },
      include: {
        guests: true,
        additionalPasses: {
          where: {
            status: 'ACTIVE',
          },
        },
        sector: true,
        event: true,
        relatorMain: true,
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Verificar permisos
    if (userRole === 'RELATOR' && reservation.relatorMainId !== userId) {
      return res.status(403).json({ 
        error: 'Solo puedes crear pases para tus propias reservas' 
      });
    }

    // Verificar que la reserva esté aprobada
    if (reservation.status !== 'APPROVED') {
      return res.status(400).json({ 
        error: 'Solo se pueden crear pases para reservas aprobadas' 
      });
    }

    // Verificar capacidad de la mesa
    const capacityMap: Record<string, number> = {
      'JET_15': 15,
      'FLY_10': 10,
      'JET_BIRTHDAY_15': 15,
      'FLY_BIRTHDAY_10': 10,
    };

    const tableCapacity = capacityMap[reservation.tableType];
    const currentGuests = reservation.guests.length + reservation.additionalPasses.length;

    if (currentGuests >= tableCapacity) {
      return res.status(400).json({
        error: 'Capacidad máxima alcanzada',
        message: `La mesa ${reservation.tableType} tiene capacidad para ${tableCapacity} personas y ya hay ${currentGuests} invitados`,
      });
    }

    // Generar QR único
    const qrCode = `ADDITIONAL-${reservation.eventId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Crear pase adicional
    const additionalPass = await prisma.additionalPass.create({
      data: {
        reservationId: data.reservationId,
        guestName: data.guestName,
        guestCI: data.guestCI,
        guestPhone: data.guestPhone,
        qrCode,
        reason: data.reason,
        createdById: userId,
        status: 'ACTIVE',
      },
      include: {
        reservation: {
          include: {
            event: true,
            sector: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_ADDITIONAL_PASS',
        entity: 'AdditionalPass',
        entityId: additionalPass.id,
        changes: JSON.stringify({
          guestName: data.guestName,
          guestCI: data.guestCI,
          reason: data.reason,
          reservationId: reservation.id,
        }),
      },
    });

    // Enviar email con QR si tiene email
    if (reservation.relatorMain?.email) {
      try {
        await emailService.sendAdditionalPassQR(
          reservation.relatorMain.email,
          {
            reservation,
            pass: additionalPass,
            qrCode,
          }
        );
      } catch (emailError) {
        console.error('Error al enviar email:', emailError);
        // No fallar la creación por error en email
      }
    }

    res.status(201).json({
      success: true,
      message: 'Pase adicional creado correctamente',
      additionalPass,
    });
  } catch (error) {
    console.error('Error al crear pase adicional:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'Error al crear pase adicional' });
  }
};

/**
 * GET /api/additional-passes
 * Listar pases adicionales (con filtros)
 */
export const getAdditionalPasses = async (req: Request, res: Response) => {
  try {
    const { reservationId, eventId, status, validatorId } = req.query;
    const userRole = req.user!.role;
    const userId = req.user!.id;

    const where: any = {};

    if (reservationId) {
      where.reservationId = reservationId as string;
    }

    if (eventId) {
      where.reservation = {
        eventId: eventId as string,
      };
    }

    if (status) {
      where.status = status as string;
    }

    if (validatorId) {
      where.validatedById = validatorId as string;
    }

    // Si es RELATOR, solo ver sus propios pases
    if (userRole === 'RELATOR') {
      where.reservation = {
        ...where.reservation,
        relatorMainId: userId,
      };
    }

    const passes = await prisma.additionalPass.findMany({
      where,
      include: {
        reservation: {
          include: {
            event: true,
            sector: true,
            relatorMain: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(passes);
  } catch (error) {
    console.error('Error al obtener pases:', error);
    res.status(500).json({ error: 'Error al obtener pases adicionales' });
  }
};

/**
 * GET /api/additional-passes/:id
 * Obtener detalles de un pase
 */
export const getAdditionalPass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pass = await prisma.additionalPass.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            event: true,
            sector: true,
            relatorMain: true,
            guests: {
              select: {
                name: true,
                ci: true,
                qrValidated: true,
              },
            },
          },
        },
        createdBy: true,
      },
    });

    if (!pass) {
      return res.status(404).json({ error: 'Pase no encontrado' });
    }

    res.json(pass);
  } catch (error) {
    console.error('Error al obtener pase:', error);
    res.status(500).json({ error: 'Error al obtener pase' });
  }
};

/**
 * POST /api/additional-passes/:id/revoke
 * Revocar un pase adicional
 */
export const revokeAdditionalPass = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;

    if (!reason) {
      return res.status(400).json({ error: 'Se requiere una razón' });
    }

    const pass = await prisma.additionalPass.findUnique({
      where: { id },
      include: {
        reservation: true,
      },
    });

    if (!pass) {
      return res.status(404).json({ error: 'Pase no encontrado' });
    }

    if (pass.qrValidated) {
      return res.status(400).json({ 
        error: 'No se puede revocar un pase que ya fue validado' 
      });
    }

    // Revocar
    const updated = await prisma.additionalPass.update({
      where: { id },
      data: {
        status: 'REVOKED',
      },
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'REVOKE_ADDITIONAL_PASS',
        entity: 'AdditionalPass',
        entityId: id,
        changes: JSON.stringify({
          reservationId: pass.reservationId,
          oldStatus: pass.status,
          newStatus: 'REVOKED',
          reason,
        }),
      },
    });

    res.json({
      success: true,
      message: 'Pase revocado correctamente',
      pass: updated,
    });
  } catch (error) {
    console.error('Error al revocar pase:', error);
    res.status(500).json({ error: 'Error al revocar pase' });
  }
};

/**
 * GET /api/additional-passes/:id/qr
 * Obtener imagen QR de un pase
 */
export const getPassQR = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const pass = await prisma.additionalPass.findUnique({
      where: { id },
    });

    if (!pass) {
      return res.status(404).json({ error: 'Pase no encontrado' });
    }

    // Generar QR como imagen
    const qrImage = await QRCode.toDataURL(pass.qrCode, {
      width: 300,
      margin: 2,
    });

    res.json({
      qrCode: pass.qrCode,
      qrImage,
      guestName: pass.guestName,
      guestCI: pass.guestCI,
    });
  } catch (error) {
    console.error('Error al generar QR:', error);
    res.status(500).json({ error: 'Error al generar código QR' });
  }
};

/**
 * GET /api/additional-passes/reservation/:reservationId
 * Obtener todos los pases de una reserva
 */
export const getPassesByReservation = async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.params;

    const passes = await prisma.additionalPass.findMany({
      where: {
        reservationId,
      },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(passes);
  } catch (error) {
    console.error('Error al obtener pases:', error);
    res.status(500).json({ error: 'Error al obtener pases' });
  }
};

/**
 * GET /api/additional-passes/stats/overview
 * Estadísticas generales de pases adicionales
 */
export const getPassesStats = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.query;

    const where: any = {};
    if (eventId) {
      where.reservation = {
        eventId: eventId as string,
      };
    }

    const total = await prisma.additionalPass.count({ where });
    
    const active = await prisma.additionalPass.count({
      where: {
        ...where,
        status: 'ACTIVE',
      },
    });

    const used = await prisma.additionalPass.count({
      where: {
        ...where,
        status: 'USED',
      },
    });

    const revoked = await prisma.additionalPass.count({
      where: {
        ...where,
        status: 'REVOKED',
      },
    });

    const validated = await prisma.additionalPass.count({
      where: {
        ...where,
        qrValidated: true,
      },
    });

    res.json({
      total,
      active,
      used,
      revoked,
      validated,
      pending: active - validated,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
