// backend/src/modules/validator/validator.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

/**
 * POST /api/validator/scan
 * Validar código QR (escanear en la entrada)
 */
export const validateQR = async (req: Request, res: Response) => {
  try {
    const { qrCode } = req.body;
    const validatorId = req.user!.id;

    if (!qrCode) {
      return res.status(400).json({ error: 'Código QR requerido' });
    }

    // Buscar en invitados regulares
    let guest = await prisma.guest.findUnique({
      where: { qrCode },
      include: {
        reservation: {
          include: {
            event: true,
            sector: true,
            relatorMain: true,
          },
        },
      },
    });

    let additionalPass = null;
    let isAdditionalPass = false;

    // Si no se encuentra, buscar en pases adicionales
    if (!guest) {
      additionalPass = await prisma.additionalPass.findUnique({
        where: { qrCode },
        include: {
          reservation: {
            include: {
              event: true,
              sector: true,
              relatorMain: true,
            },
          },
        },
      });

      if (!additionalPass) {
        return res.status(404).json({
          error: 'QR no válido',
          message: 'Este código QR no existe en el sistema',
        });
      }

      isAdditionalPass = true;
    }

    // Verificar estado
    if (isAdditionalPass) {
      if (additionalPass!.status !== 'ACTIVE') {
        return res.status(400).json({
          error: 'Pase inválido',
          message: `Este pase ha sido ${additionalPass!.status === 'REVOKED' ? 'revocado' : 'usado'}`,
        });
      }

      if (additionalPass!.qrValidated) {
        return res.status(400).json({
          error: 'QR ya validado',
          message: 'Este pase adicional ya fue escaneado anteriormente',
          validatedAt: additionalPass!.validatedAt,
        });
      }
    } else {
      if (guest!.qrValidated) {
        return res.status(400).json({
          error: 'QR ya validado',
          message: 'Este invitado ya ingresó al evento',
          validatedAt: guest!.validatedAt,
        });
      }
    }

    // Verificar que la reserva esté aprobada
    const reservation = isAdditionalPass ? additionalPass!.reservation : guest!.reservation;

    if (reservation.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'Reserva no aprobada',
        message: 'Esta reserva no ha sido aprobada aún',
      });
    }

    // Validar QR
    if (isAdditionalPass) {
      await prisma.additionalPass.update({
        where: { id: additionalPass!.id },
        data: {
          qrValidated: true,
          validatedAt: new Date(),
          status: 'USED',
        },
      });
    } else {
      await prisma.guest.update({
        where: { id: guest!.id },
        data: {
          qrValidated: true,
          validatedAt: new Date(),
        },
      });
    }

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: validatorId,
        action: isAdditionalPass ? 'VALIDATE_ADDITIONAL_PASS' : 'VALIDATE_QR',
        entity: isAdditionalPass ? 'AdditionalPass' : 'Guest',
        entityId: isAdditionalPass ? additionalPass!.id : guest!.id,
        changes: JSON.stringify({
          reservationId: reservation.id,
          qrCode,
          validatedAt: new Date(),
        }),
      },
    });

    // Respuesta exitosa
    res.json({
      success: true,
      message: '✅ Acceso permitido',
      guest: {
        name: isAdditionalPass ? additionalPass!.guestName : guest!.name,
        ci: isAdditionalPass ? additionalPass!.guestCI : guest!.ci,
        isAdditionalPass,
      },
      reservation: {
        id: reservation.id,
        responsibleName: reservation.responsibleName,
        tableType: reservation.tableType,
        sector: reservation.sector.name,
      },
      event: {
        name: reservation.event.name,
        date: reservation.event.eventDate,
      },
      validatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error al validar QR:', error);
    res.status(500).json({ error: 'Error al validar QR' });
  }
};

/**
 * GET /api/validator/stats
 * Estadísticas del validador
 */
export const getValidatorStats = async (req: Request, res: Response) => {
  try {
    const validatorId = req.user!.id;
    const { eventId } = req.query;

    // Filtros
    const where: any = {};
    if (eventId) {
      where.reservation = {
        eventId: eventId as string,
      };
    }

    // Total validados (invitados regulares)
    const totalValidated = await prisma.guest.count({
      where: {
        qrValidated: true,
        ...where,
      },
    });

    // Total pases adicionales validados
    const totalAdditionalValidated = await prisma.additionalPass.count({
      where: {
        qrValidated: true,
        ...where,
      },
    });

    // Validaciones por este validador (desde auditoría)
    const myValidations = await prisma.auditLog.count({
      where: {
        userId: validatorId,
        action: {
          in: ['VALIDATE_QR', 'VALIDATE_ADDITIONAL_PASS'],
        },
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)), // Hoy
        },
      },
    });

    // Última validación
    const lastValidation = await prisma.auditLog.findFirst({
      where: {
        userId: validatorId,
        action: {
          in: ['VALIDATE_QR', 'VALIDATE_ADDITIONAL_PASS'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      totalValidated,
      totalAdditionalValidated,
      myValidationsToday: myValidations,
      lastValidation: lastValidation?.createdAt,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

/**
 * GET /api/validator/reservations
 * Ver lista de reservas (sin poder modificar)
 */
export const getReservationsForValidator = async (req: Request, res: Response) => {
  try {
    const { eventId, sectorId, status, search } = req.query;

    const where: any = {
      status: 'APPROVED', // Solo aprobadas
    };

    if (eventId) {
      where.eventId = eventId as string;
    }

    if (sectorId) {
      where.sectorId = sectorId as string;
    }

    if (search) {
      where.OR = [
        { responsibleName: { contains: search as string, mode: 'insensitive' } },
        { relatorMain: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            eventDate: true,
          },
        },
        sector: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        guests: {
          select: {
            id: true,
            name: true,
            ci: true,
            qrValidated: true,
            validatedAt: true,
          },
        },
        additionalPasses: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
            guestName: true,
            guestCI: true,
            qrValidated: true,
            validatedAt: true,
            reason: true,
          },
        },
        relatorMain: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Agregar estadísticas por reserva
    const reservationsWithStats = reservations.map(r => {
      const totalGuests = r.guests.length + r.additionalPasses.length;
      const validatedGuests = r.guests.filter(g => g.qrValidated).length;
      const validatedPasses = r.additionalPasses.filter(p => p.qrValidated).length;
      const totalValidated = validatedGuests + validatedPasses;

      return {
        ...r,
        stats: {
          totalGuests,
          totalValidated,
          pending: totalGuests - totalValidated,
          percentage: totalGuests > 0 ? Math.round((totalValidated / totalGuests) * 100) : 0,
        },
      };
    });

    res.json(reservationsWithStats);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
};

/**
 * GET /api/validator/reservation/:id
 * Ver detalles de una reserva específica
 */
export const getReservationDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        event: true,
        sector: true,
        guests: {
          orderBy: { name: 'asc' },
        },
        additionalPasses: {
          where: {
            status: { not: 'REVOKED' },
          },
          orderBy: { createdAt: 'desc' },
        },
        relatorMain: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    res.status(500).json({ error: 'Error al obtener reserva' });
  }
};

/**
 * GET /api/validator/search/:query
 * Buscar invitado por nombre o CI
 */
export const searchGuest = async (req: Request, res: Response) => {
  try {
    const { query } = req.params;
    const { eventId } = req.query;

    if (!query || query.length < 3) {
      return res.status(400).json({ 
        error: 'La búsqueda debe tener al menos 3 caracteres' 
      });
    }

    const where: any = {
      reservation: {
        status: 'APPROVED',
      },
    };

    if (eventId) {
      where.reservation.eventId = eventId as string;
    }

    // Buscar en invitados regulares
    const guests = await prisma.guest.findMany({
      where: {
        ...where,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { ci: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        reservation: {
          include: {
            event: true,
            sector: true,
          },
        },
      },
      take: 20,
    });

    // Buscar en pases adicionales
    const additionalPasses = await prisma.additionalPass.findMany({
      where: {
        ...where,
        status: 'ACTIVE',
        OR: [
          { guestName: { contains: query, mode: 'insensitive' } },
          { guestCI: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        reservation: {
          include: {
            event: true,
            sector: true,
          },
        },
      },
      take: 20,
    });

    res.json({
      guests,
      additionalPasses,
      total: guests.length + additionalPasses.length,
    });
  } catch (error) {
    console.error('Error al buscar invitado:', error);
    res.status(500).json({ error: 'Error al buscar invitado' });
  }
};
