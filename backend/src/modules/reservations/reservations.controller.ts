import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { sendApprovalRequest } from '../../utils/emailService';

const prisma = new PrismaClient();

export const getReservations = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, status, relatorId } = req.query;

    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (status) {
      where.status = status;
    }

    if (req.user!.role === 'RELATOR') {
      where.OR = [
        { relatorMainId: req.user!.id },
        { relatorSaleId: req.user!.id }
      ];
    } else if (relatorId) {
      where.OR = [
        { relatorMainId: relatorId },
        { relatorSaleId: relatorId }
      ];
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        event: true,
        sector: true,
        relatorMain: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        relatorSale: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        guests: true,
        approval: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reservations);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    res.status(500).json({ error: 'Error al obtener reservas' });
  }
};

export const getReservationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        event: true,
        sector: {
          include: {
            approvers: {
              include: {
                approver: true
              }
            }
          }
        },
        relatorMain: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        relatorSale: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        guests: true,
        approval: {
          include: {
            approver: true
          }
        },
        auditLogs: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Verificar permisos
    if (req.user!.role === 'RELATOR') {
      if (reservation.relatorMainId !== req.user!.id && reservation.relatorSaleId !== req.user!.id) {
        return res.status(403).json({ error: 'No tienes permiso para ver esta reserva' });
      }
    }

    res.json(reservation);
  } catch (error) {
    console.error('Error al obtener reserva:', error);
    res.status(500).json({ error: 'Error al obtener reserva' });
  }
};

export const createReservation = async (req: AuthRequest, res: Response) => {
  try {
    const {
      eventId,
      sectorId,
      tableType,
      tableClass,
      paymentType,
      paymentAmount,
      relatorMainPhone,
      relatorSaleId,
      relatorSalePhone,
      responsibleName,
      responsiblePhone,
      notes,
      guests
    } = req.body;

    // Validar evento y sector
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventSectors: {
          where: { sectorId }
        }
      }
    });

    if (!event || !event.active) {
      return res.status(400).json({ error: 'Evento no disponible' });
    }

    if (event.eventSectors.length === 0) {
      return res.status(400).json({ error: 'Sector no disponible para este evento' });
    }

    // Obtener sector
    const sector = await prisma.sector.findUnique({
      where: { id: sectorId },
      include: {
        approvers: {
          include: {
            approver: true
          }
        }
      }
    });

    if (!sector) {
      return res.status(404).json({ error: 'Sector no encontrado' });
    }

    // Crear reserva
    const reservation = await prisma.reservation.create({
      data: {
        eventId,
        sectorId,
        tableType,
        tableClass,
        paymentType,
        paymentAmount,
        relatorMainId: req.user!.id,
        relatorMainPhone,
        relatorSaleId,
        relatorSalePhone,
        responsibleName,
        responsiblePhone,
        notes,
        status: sector.requiresApproval ? 'PENDING' : 'APPROVED',
        guests: {
          create: guests.map((guest: any) => ({
            name: guest.name,
            ci: guest.ci,
            phone: guest.phone,
            email: guest.email,
            birthDate: guest.birthDate ? new Date(guest.birthDate) : null,
            qrCode: uuidv4()
          }))
        }
      },
      include: {
        event: true,
        sector: true,
        relatorMain: true,
        guests: true
      }
    });

    // Crear registro de auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CREATE_RESERVATION',
        entity: 'Reservation',
        entityId: reservation.id,
        reservationId: reservation.id,
        newData: reservation as any,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    // Si requiere aprobación, crear solicitud y notificar
    if (sector.requiresApproval && sector.approvers.length > 0) {
      // Crear aprobación con el primer aprobador
      const firstApprover = sector.approvers[0].approver;
      
      await prisma.approval.create({
        data: {
          reservationId: reservation.id,
          approverId: firstApprover.id,
          status: 'PENDING'
        }
      });

      // Enviar email de notificación
      await sendApprovalRequest(
        firstApprover.email,
        firstApprover.name,
        {
          eventName: event.name,
          sectorName: sector.name,
          relatorName: req.user!.name,
          tableType
        }
      );

      // Notificar via WebSocket
      const io = req.app.get('io');
      io.emit('new-approval-request', {
        approverId: firstApprover.id,
        reservationId: reservation.id
      });
    }

    res.status(201).json(reservation);
  } catch (error) {
    console.error('Error al crear reserva:', error);
    res.status(500).json({ error: 'Error al crear reserva' });
  }
};

export const updateReservation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notes, responsibleName, responsiblePhone } = req.body;

    const existing = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Verificar permisos
    if (req.user!.role === 'RELATOR' && existing.relatorMainId !== req.user!.id) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta reserva' });
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        notes,
        responsibleName,
        responsiblePhone
      },
      include: {
        event: true,
        sector: true,
        guests: true
      }
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_RESERVATION',
        entity: 'Reservation',
        entityId: id,
        reservationId: id,
        oldData: existing as any,
        newData: reservation as any,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json(reservation);
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    res.status(500).json({ error: 'Error al actualizar reserva' });
  }
};

export const cancelReservation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.reservation.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    // Verificar permisos
    if (req.user!.role === 'RELATOR' && existing.relatorMainId !== req.user!.id) {
      return res.status(403).json({ error: 'No tienes permiso para cancelar esta reserva' });
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CANCEL_RESERVATION',
        entity: 'Reservation',
        entityId: id,
        reservationId: id,
        oldData: existing as any,
        newData: reservation as any,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json(reservation);
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    res.status(500).json({ error: 'Error al cancelar reserva' });
  }
};
