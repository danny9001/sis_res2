// backend/src/modules/transfers/transfers.controller.ts

import { Request, Response } from 'express';
import { PrismaClient, ReservationStatus } from '@prisma/client';
import { z } from 'zod';
import { emailService } from '../../utils/emailService';

const prisma = new PrismaClient();

// Validación de transferencia
const transferSchema = z.object({
  reservationId: z.string().uuid(),
  transferType: z.enum(['SECTOR', 'EVENT', 'RELATOR', 'TABLE_TYPE', 'MERGE', 'SPLIT']),
  newSectorId: z.string().uuid().optional(),
  newEventId: z.string().uuid().optional(),
  newRelatorId: z.string().uuid().optional(),
  newTableType: z.enum(['JET_15', 'FLY_10', 'JET_BIRTHDAY_15', 'FLY_BIRTHDAY_10']).optional(),
  reason: z.string().min(10),
  notifyUsers: z.boolean().default(true),
  // Para fusión
  mergeWithReservationId: z.string().uuid().optional(),
  // Para división
  splitGuestIds: z.array(z.string().uuid()).optional(),
  newResponsibleName: z.string().optional(),
});

/**
 * Transferir una reserva
 * POST /api/transfers
 */
export const transferReservation = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // Validar datos
    const data = transferSchema.parse(req.body);
    
    // Obtener reserva original
    const originalReservation = await prisma.reservation.findUnique({
      where: { id: data.reservationId },
      include: {
        guests: true,
        sector: true,
        event: true,
        relatorMain: true,
        relatorSale: true,
      },
    });
    
    if (!originalReservation) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    
    // Verificar permisos
    if (userRole === 'RELATOR' && originalReservation.relatorMainId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para transferir esta reserva' });
    }
    
    // Verificar que la reserva esté aprobada
    if (originalReservation.status !== ReservationStatus.APPROVED) {
      return res.status(400).json({ 
        error: 'Solo se pueden transferir reservas aprobadas' 
      });
    }
    
    let result;
    
    // Ejecutar transferencia según tipo
    switch (data.transferType) {
      case 'SECTOR':
        result = await transferToNewSector(originalReservation, data, userId!);
        break;
      case 'EVENT':
        result = await transferToNewEvent(originalReservation, data, userId!);
        break;
      case 'RELATOR':
        result = await transferToNewRelator(originalReservation, data, userId!);
        break;
      case 'TABLE_TYPE':
        result = await changeTableType(originalReservation, data, userId!);
        break;
      case 'MERGE':
        result = await mergeReservations(originalReservation, data, userId!);
        break;
      case 'SPLIT':
        result = await splitReservation(originalReservation, data, userId!);
        break;
      default:
        return res.status(400).json({ error: 'Tipo de transferencia no válido' });
    }
    
    // Enviar notificaciones si está habilitado
    if (data.notifyUsers && result.newReservation) {
      await notifyTransfer(originalReservation, result.newReservation, data);
    }
    
    res.json({
      success: true,
      message: 'Transferencia realizada exitosamente',
      transfer: result,
    });
    
  } catch (error) {
    console.error('Error en transferencia:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'Error al transferir reserva' });
  }
};

/**
 * Transferir a nuevo sector
 */
async function transferToNewSector(
  original: any,
  data: any,
  userId: string
) {
  if (!data.newSectorId) {
    throw new Error('newSectorId es requerido');
  }
  
  // Verificar que el sector existe
  const newSector = await prisma.sector.findUnique({
    where: { id: data.newSectorId },
  });
  
  if (!newSector || !newSector.active) {
    throw new Error('Sector no válido');
  }
  
  // Crear auditoría de transferencia
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'TRANSFER_SECTOR',
      entity: 'Reservation',
      entityId: original.id,
      reservationId: original.id,
      oldData: {
        sectorId: original.sectorId,
        sectorName: original.sector.name,
      },
      newData: {
        sectorId: data.newSectorId,
        sectorName: newSector.name,
        reason: data.reason,
      },
    },
  });
  
  // Si el nuevo sector requiere aprobación y el anterior no
  let newStatus = original.status;
  if (newSector.requiresApproval && !original.sector.requiresApproval) {
    newStatus = ReservationStatus.PENDING;
    
    // Crear nueva aprobación
    const approvers = await prisma.sectorApprover.findMany({
      where: { sectorId: newSector.id },
    });
    
    if (approvers.length > 0) {
      await prisma.approval.create({
        data: {
          reservationId: original.id,
          approverId: approvers[0].userId,
          status: 'PENDING',
          comments: `Transferido desde ${original.sector.name}. Razón: ${data.reason}`,
        },
      });
    }
  }
  
  // Actualizar reserva
  const updatedReservation = await prisma.reservation.update({
    where: { id: original.id },
    data: {
      sectorId: data.newSectorId,
      status: newStatus,
      notes: `${original.notes || ''}\n\n[TRANSFERENCIA] De ${original.sector.name} a ${newSector.name}. Razón: ${data.reason}`,
    },
    include: {
      guests: true,
      sector: true,
    },
  });
  
  return {
    type: 'SECTOR',
    originalReservation: original,
    newReservation: updatedReservation,
    changes: {
      from: original.sector.name,
      to: newSector.name,
    },
  };
}

/**
 * Transferir a nuevo evento
 */
async function transferToNewEvent(
  original: any,
  data: any,
  userId: string
) {
  if (!data.newEventId) {
    throw new Error('newEventId es requerido');
  }
  
  const newEvent = await prisma.event.findUnique({
    where: { id: data.newEventId },
    include: {
      sectors: {
        where: { sectorId: original.sectorId },
      },
    },
  });
  
  if (!newEvent || !newEvent.active) {
    throw new Error('Evento no válido');
  }
  
  // Verificar que el sector esté disponible en el nuevo evento
  if (newEvent.sectors.length === 0) {
    throw new Error('El sector no está disponible en el nuevo evento');
  }
  
  // Crear auditoría
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'TRANSFER_EVENT',
      entity: 'Reservation',
      entityId: original.id,
      reservationId: original.id,
      oldData: {
        eventId: original.eventId,
        eventName: original.event.name,
        eventDate: original.event.eventDate,
      },
      newData: {
        eventId: data.newEventId,
        eventName: newEvent.name,
        eventDate: newEvent.eventDate,
        reason: data.reason,
      },
    },
  });
  
  // Los QR deben regenerarse
  const updatedGuests = await Promise.all(
    original.guests.map(async (guest: any) => {
      const newQR = `${newEvent.id}-${guest.id}-${Date.now()}`;
      return prisma.guest.update({
        where: { id: guest.id },
        data: { 
          qrCode: newQR,
          qrValidated: false,
          validatedAt: null,
        },
      });
    })
  );
  
  // Actualizar reserva
  const updatedReservation = await prisma.reservation.update({
    where: { id: original.id },
    data: {
      eventId: data.newEventId,
      status: ReservationStatus.PENDING, // Requiere nueva aprobación
      notes: `${original.notes || ''}\n\n[TRANSFERENCIA] De evento "${original.event.name}" a "${newEvent.name}". Razón: ${data.reason}`,
    },
    include: {
      guests: true,
      event: true,
    },
  });
  
  return {
    type: 'EVENT',
    originalReservation: original,
    newReservation: updatedReservation,
    regeneratedQRs: true,
    changes: {
      from: original.event.name,
      to: newEvent.name,
    },
  };
}

/**
 * Transferir a nuevo relacionador
 */
async function transferToNewRelator(
  original: any,
  data: any,
  userId: string
) {
  if (!data.newRelatorId) {
    throw new Error('newRelatorId es requerido');
  }
  
  const newRelator = await prisma.user.findUnique({
    where: { id: data.newRelatorId },
  });
  
  if (!newRelator || newRelator.role !== 'RELATOR') {
    throw new Error('Relacionador no válido');
  }
  
  // Crear auditoría
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'TRANSFER_RELATOR',
      entity: 'Reservation',
      entityId: original.id,
      reservationId: original.id,
      oldData: {
        relatorMainId: original.relatorMainId,
        relatorName: original.relatorMain.name,
      },
      newData: {
        relatorMainId: data.newRelatorId,
        relatorName: newRelator.name,
        reason: data.reason,
      },
    },
  });
  
  // Actualizar reserva
  const updatedReservation = await prisma.reservation.update({
    where: { id: original.id },
    data: {
      relatorMainId: data.newRelatorId,
      notes: `${original.notes || ''}\n\n[TRANSFERENCIA] De relacionador "${original.relatorMain.name}" a "${newRelator.name}". Razón: ${data.reason}`,
    },
    include: {
      guests: true,
      relatorMain: true,
    },
  });
  
  return {
    type: 'RELATOR',
    originalReservation: original,
    newReservation: updatedReservation,
    changes: {
      from: original.relatorMain.name,
      to: newRelator.name,
    },
  };
}

/**
 * Cambiar tipo de mesa
 */
async function changeTableType(
  original: any,
  data: any,
  userId: string
) {
  if (!data.newTableType) {
    throw new Error('newTableType es requerido');
  }
  
  // Validar capacidad
  const capacityMap: Record<string, number> = {
    'JET_15': 15,
    'FLY_10': 10,
    'JET_BIRTHDAY_15': 15,
    'FLY_BIRTHDAY_10': 10,
  };
  
  const newCapacity = capacityMap[data.newTableType];
  const currentGuests = original.guests.length;
  
  if (currentGuests > newCapacity) {
    throw new Error(
      `La nueva mesa tiene capacidad para ${newCapacity} personas pero hay ${currentGuests} invitados`
    );
  }
  
  // Crear auditoría
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CHANGE_TABLE_TYPE',
      entity: 'Reservation',
      entityId: original.id,
      reservationId: original.id,
      oldData: {
        tableType: original.tableType,
      },
      newData: {
        tableType: data.newTableType,
        reason: data.reason,
      },
    },
  });
  
  // Actualizar reserva
  const updatedReservation = await prisma.reservation.update({
    where: { id: original.id },
    data: {
      tableType: data.newTableType,
      notes: `${original.notes || ''}\n\n[CAMBIO] Tipo de mesa de ${original.tableType} a ${data.newTableType}. Razón: ${data.reason}`,
    },
    include: {
      guests: true,
    },
  });
  
  return {
    type: 'TABLE_TYPE',
    originalReservation: original,
    newReservation: updatedReservation,
    changes: {
      from: original.tableType,
      to: data.newTableType,
    },
  };
}

/**
 * Fusionar dos reservas
 */
async function mergeReservations(
  original: any,
  data: any,
  userId: string
) {
  if (!data.mergeWithReservationId) {
    throw new Error('mergeWithReservationId es requerido');
  }
  
  const targetReservation = await prisma.reservation.findUnique({
    where: { id: data.mergeWithReservationId },
    include: { guests: true },
  });
  
  if (!targetReservation) {
    throw new Error('Reserva destino no encontrada');
  }
  
  // Verificar que ambas estén en el mismo evento
  if (original.eventId !== targetReservation.eventId) {
    throw new Error('Las reservas deben estar en el mismo evento');
  }
  
  // Verificar capacidad total
  const totalGuests = original.guests.length + targetReservation.guests.length;
  const capacityMap: Record<string, number> = {
    'JET_15': 15,
    'FLY_10': 10,
    'JET_BIRTHDAY_15': 15,
    'FLY_BIRTHDAY_10': 10,
  };
  
  const targetCapacity = capacityMap[targetReservation.tableType];
  if (totalGuests > targetCapacity) {
    throw new Error(
      `Capacidad insuficiente. Mesa destino: ${targetCapacity}, Total invitados: ${totalGuests}`
    );
  }
  
  // Crear auditoría
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'MERGE_RESERVATIONS',
      entity: 'Reservation',
      entityId: original.id,
      reservationId: original.id,
      oldData: {
        reservationId: original.id,
        guestCount: original.guests.length,
      },
      newData: {
        mergedIntoId: data.mergeWithReservationId,
        totalGuests: totalGuests,
        reason: data.reason,
      },
    },
  });
  
  // Transferir invitados
  await prisma.guest.updateMany({
    where: { reservationId: original.id },
    data: { reservationId: data.mergeWithReservationId },
  });
  
  // Cancelar reserva original
  await prisma.reservation.update({
    where: { id: original.id },
    data: {
      status: ReservationStatus.CANCELLED,
      notes: `${original.notes || ''}\n\n[FUSIONADA] Fusionada con reserva #${targetReservation.id}. Razón: ${data.reason}`,
    },
  });
  
  // Actualizar notas de reserva destino
  const updatedTarget = await prisma.reservation.update({
    where: { id: data.mergeWithReservationId },
    data: {
      notes: `${targetReservation.notes || ''}\n\n[FUSIÓN] Recibió ${original.guests.length} invitados de reserva #${original.id}`,
    },
    include: { guests: true },
  });
  
  return {
    type: 'MERGE',
    originalReservation: original,
    newReservation: updatedTarget,
    mergedGuests: original.guests.length,
    totalGuests: totalGuests,
  };
}

/**
 * Dividir una reserva
 */
async function splitReservation(
  original: any,
  data: any,
  userId: string
) {
  if (!data.splitGuestIds || data.splitGuestIds.length === 0) {
    throw new Error('splitGuestIds es requerido');
  }
  
  // Validar que todos los invitados pertenezcan a la reserva
  const guestsToSplit = original.guests.filter((g: any) => 
    data.splitGuestIds.includes(g.id)
  );
  
  if (guestsToSplit.length !== data.splitGuestIds.length) {
    throw new Error('Algunos invitados no pertenecen a esta reserva');
  }
  
  if (guestsToSplit.length === original.guests.length) {
    throw new Error('No puedes mover todos los invitados');
  }
  
  // Crear nueva reserva para los invitados divididos
  const newReservation = await prisma.reservation.create({
    data: {
      eventId: original.eventId,
      sectorId: original.sectorId,
      tableType: original.tableType,
      tableClass: original.tableClass,
      paymentType: original.paymentType,
      paymentAmount: 0, // Se debe configurar manualmente
      relatorMainId: original.relatorMainId,
      relatorSaleId: original.relatorSaleId,
      responsibleName: data.newResponsibleName || original.responsibleName,
      status: ReservationStatus.PENDING,
      notes: `[DIVISIÓN] Creada desde reserva #${original.id}. Razón: ${data.reason}`,
    },
  });
  
  // Crear auditoría
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'SPLIT_RESERVATION',
      entity: 'Reservation',
      entityId: original.id,
      reservationId: original.id,
      oldData: {
        guestCount: original.guests.length,
      },
      newData: {
        newReservationId: newReservation.id,
        splitGuestCount: guestsToSplit.length,
        remainingGuestCount: original.guests.length - guestsToSplit.length,
        reason: data.reason,
      },
    },
  });
  
  // Mover invitados a la nueva reserva
  await prisma.guest.updateMany({
    where: {
      id: { in: data.splitGuestIds },
    },
    data: {
      reservationId: newReservation.id,
    },
  });
  
  // Actualizar notas de reserva original
  await prisma.reservation.update({
    where: { id: original.id },
    data: {
      notes: `${original.notes || ''}\n\n[DIVISIÓN] ${guestsToSplit.length} invitados movidos a reserva #${newReservation.id}`,
    },
  });
  
  // Obtener la nueva reserva con invitados
  const updatedNewReservation = await prisma.reservation.findUnique({
    where: { id: newReservation.id },
    include: { guests: true },
  });
  
  return {
    type: 'SPLIT',
    originalReservation: original,
    newReservation: updatedNewReservation,
    splitGuestCount: guestsToSplit.length,
  };
}

/**
 * Enviar notificaciones de transferencia
 */
async function notifyTransfer(
  original: any,
  updated: any,
  data: any
) {
  try {
    // Notificar al relacionador principal
    if (original.relatorMain?.email) {
      await emailService.sendTransferNotification(
        original.relatorMain.email,
        {
          reservationId: original.id,
          transferType: data.transferType,
          reason: data.reason,
          changes: `Reserva modificada. Revisa los detalles en el sistema.`,
        }
      );
    }
    
    // Si cambió de relacionador, notificar al nuevo
    if (data.transferType === 'RELATOR' && updated.relatorMain?.email) {
      await emailService.sendTransferNotification(
        updated.relatorMain.email,
        {
          reservationId: updated.id,
          transferType: 'NEW_ASSIGNMENT',
          reason: 'Se te ha asignado una nueva reserva',
          changes: `Has recibido la reserva #${updated.id}`,
        }
      );
    }
  } catch (error) {
    console.error('Error al enviar notificaciones:', error);
    // No fallar la transferencia por error en notificaciones
  }
}

/**
 * Obtener historial de transferencias
 * GET /api/transfers/history/:reservationId
 */
export const getTransferHistory = async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.params;
    
    const history = await prisma.auditLog.findMany({
      where: {
        reservationId,
        action: {
          in: [
            'TRANSFER_SECTOR',
            'TRANSFER_EVENT',
            'TRANSFER_RELATOR',
            'CHANGE_TABLE_TYPE',
            'MERGE_RESERVATIONS',
            'SPLIT_RESERVATION',
          ],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json(history);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial de transferencias' });
  }
};

/**
 * Cancelar transferencia (si está pendiente de aprobación)
 * POST /api/transfers/:transferId/cancel
 */
export const cancelTransfer = async (req: Request, res: Response) => {
  try {
    const { transferId } = req.params;
    const userId = req.user?.id;
    
    // Implementar lógica de cancelación
    // Esto dependería de cómo manejes las transferencias pendientes
    
    res.json({ message: 'Funcionalidad en desarrollo' });
  } catch (error) {
    console.error('Error al cancelar transferencia:', error);
    res.status(500).json({ error: 'Error al cancelar transferencia' });
  }
};
