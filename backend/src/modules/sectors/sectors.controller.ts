// backend/src/modules/sectors/sectors.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema de validación
const sectorSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(1).max(20),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  requiresApproval: z.boolean().default(false),
  active: z.boolean().default(true),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
});

/**
 * GET /api/sectors
 * Listar todos los sectores
 */
export const getSectors = async (req: Request, res: Response) => {
  try {
    const { active, requiresApproval, search } = req.query;

    const where: any = {};

    if (active !== undefined) {
      where.active = active === 'true';
    }

    if (requiresApproval !== undefined) {
      where.requiresApproval = requiresApproval === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const sectors = await prisma.sector.findMany({
      where,
      include: {
        approvers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            reservations: true,
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });

    res.json(sectors);
  } catch (error) {
    console.error('Error al obtener sectores:', error);
    res.status(500).json({ error: 'Error al obtener sectores' });
  }
};

/**
 * GET /api/sectors/:id
 * Obtener un sector específico
 */
export const getSector = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sector = await prisma.sector.findUnique({
      where: { id },
      include: {
        approvers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        reservations: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            event: true,
            relatorMain: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });

    if (!sector) {
      return res.status(404).json({ error: 'Sector no encontrado' });
    }

    res.json(sector);
  } catch (error) {
    console.error('Error al obtener sector:', error);
    res.status(500).json({ error: 'Error al obtener sector' });
  }
};

/**
 * POST /api/sectors
 * Crear nuevo sector
 */
export const createSector = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = sectorSchema.parse(req.body);

    // Verificar que el código no exista
    const existing = await prisma.sector.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return res.status(400).json({ error: 'El código del sector ya existe' });
    }

    const sector = await prisma.sector.create({
      data,
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_SECTOR',
        entity: 'Sector',
        entityId: sector.id,
        newData: data,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Sector creado correctamente',
      sector,
    });
  } catch (error) {
    console.error('Error al crear sector:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'Error al crear sector' });
  }
};

/**
 * PUT /api/sectors/:id
 * Actualizar sector
 */
export const updateSector = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const data = sectorSchema.partial().parse(req.body);

    const existing = await prisma.sector.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Sector no encontrado' });
    }

    // Si se cambia el código, verificar que no exista
    if (data.code && data.code !== existing.code) {
      const codeExists = await prisma.sector.findUnique({
        where: { code: data.code },
      });

      if (codeExists) {
        return res.status(400).json({ error: 'El código ya está en uso' });
      }
    }

    const sector = await prisma.sector.update({
      where: { id },
      data,
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_SECTOR',
        entity: 'Sector',
        entityId: id,
        oldData: existing,
        newData: data,
      },
    });

    res.json({
      success: true,
      message: 'Sector actualizado correctamente',
      sector,
    });
  } catch (error) {
    console.error('Error al actualizar sector:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'Error al actualizar sector' });
  }
};

/**
 * DELETE /api/sectors/:id
 * Eliminar sector (soft delete)
 */
export const deleteSector = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const sector = await prisma.sector.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });

    if (!sector) {
      return res.status(404).json({ error: 'Sector no encontrado' });
    }

    // Verificar si tiene reservas activas
    if (sector._count.reservations > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar un sector con reservas',
        message: `Este sector tiene ${sector._count.reservations} reserva(s) asociada(s)`,
      });
    }

    // Soft delete
    await prisma.sector.update({
      where: { id },
      data: { active: false },
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_SECTOR',
        entity: 'Sector',
        entityId: id,
        oldData: sector,
      },
    });

    res.json({
      success: true,
      message: 'Sector desactivado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar sector:', error);
    res.status(500).json({ error: 'Error al eliminar sector' });
  }
};

/**
 * POST /api/sectors/:id/approvers
 * Asignar aprobador a un sector
 */
export const addApprover = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId: approverId } = req.body;
    const currentUserId = req.user!.id;

    if (!approverId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    // Verificar que el usuario sea APPROVER
    const approver = await prisma.user.findUnique({
      where: { id: approverId },
    });

    if (!approver || approver.role !== 'APPROVER') {
      return res.status(400).json({ error: 'El usuario debe tener rol APPROVER' });
    }

    // Verificar que no exista ya
    const existing = await prisma.sectorApprover.findFirst({
      where: {
        sectorId: id,
        userId: approverId,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'El aprobador ya está asignado' });
    }

    const assignment = await prisma.sectorApprover.create({
      data: {
        sectorId: id,
        userId: approverId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'ADD_SECTOR_APPROVER',
        entity: 'SectorApprover',
        entityId: assignment.id,
        newData: {
          sectorId: id,
          approverId,
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Aprobador asignado correctamente',
      assignment,
    });
  } catch (error) {
    console.error('Error al asignar aprobador:', error);
    res.status(500).json({ error: 'Error al asignar aprobador' });
  }
};

/**
 * DELETE /api/sectors/:id/approvers/:approverId
 * Remover aprobador de un sector
 */
export const removeApprover = async (req: Request, res: Response) => {
  try {
    const { id, approverId } = req.params;
    const userId = req.user!.id;

    const assignment = await prisma.sectorApprover.findFirst({
      where: {
        sectorId: id,
        userId: approverId,
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    await prisma.sectorApprover.delete({
      where: { id: assignment.id },
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'REMOVE_SECTOR_APPROVER',
        entity: 'SectorApprover',
        entityId: assignment.id,
        oldData: {
          sectorId: id,
          approverId,
        },
      },
    });

    res.json({
      success: true,
      message: 'Aprobador removido correctamente',
    });
  } catch (error) {
    console.error('Error al remover aprobador:', error);
    res.status(500).json({ error: 'Error al remover aprobador' });
  }
};

/**
 * GET /api/sectors/:id/stats
 * Estadísticas de un sector
 */
export const getSectorStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { eventId } = req.query;

    const where: any = { sectorId: id };
    if (eventId) {
      where.eventId = eventId as string;
    }

    const totalReservations = await prisma.reservation.count({ where });

    const byStatus = await prisma.reservation.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const totalGuests = await prisma.guest.count({
      where: {
        reservation: where,
      },
    });

    const totalRevenue = await prisma.reservation.aggregate({
      where: {
        ...where,
        status: 'APPROVED',
      },
      _sum: {
        paymentAmount: true,
      },
    });

    res.json({
      totalReservations,
      byStatus,
      totalGuests,
      totalRevenue: totalRevenue._sum.paymentAmount || 0,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
