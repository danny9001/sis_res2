import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../utils/prisma';

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
