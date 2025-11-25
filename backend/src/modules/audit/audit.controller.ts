// backend/src/modules/audit/audit.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      entity,
      action,
      startDate,
      endDate,
      page = '1',
      limit = '50',
    } = req.query;

    const where: any = {};
    
    if (userId) where.userId = userId as string;
    if (entity) where.entity = entity as string;
    if (action) where.action = action as string;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener logs' });
  }
};

export const getAuditLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!log) return res.status(404).json({ error: 'Log no encontrado' });
    res.json(log);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener log' });
  }
};

export const getAuditStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [byAction, byEntity, byUser] = await Promise.all([
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['entity'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    const userIds = byUser.map((u) => u.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const byUserWithNames = byUser.map((u) => {
      const user = users.find((us) => us.id === u.userId);
      return {
        userId: u.userId,
        userName: user?.name || 'Desconocido',
        count: u._count,
      };
    });

    res.json({
      byAction,
      byEntity,
      byUser: byUserWithNames,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

export const getEntityHistory = async (req: Request, res: Response) => {
  try {
    const { entity, entityId } = req.params;

    const logs = await prisma.auditLog.findMany({
      where: {
        entity,
        entityId,
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
      orderBy: { createdAt: 'desc' },
    });

    res.json(logs);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};
