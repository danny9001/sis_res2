import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../utils/prisma';

export const getSectors = async (req: AuthRequest, res: Response) => {
  try {
    const sectors = await prisma.sector.findMany({
      where: { active: true },
      include: {
        approvers: {
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
      orderBy: { name: 'asc' }
    });

    res.json(sectors);
  } catch (error) {
    console.error('Error al obtener sectores:', error);
    res.status(500).json({ error: 'Error al obtener sectores' });
  }
};

export const createSector = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, description, capacity, requiresApproval, isVIP, approverIds } = req.body;

    const sector = await prisma.sector.create({
      data: {
        name,
        code,
        description,
        capacity,
        requiresApproval,
        isVIP,
        approvers: approverIds ? {
          create: approverIds.map((approverId: string) => ({
            approverId
          }))
        } : undefined
      },
      include: {
        approvers: {
          include: {
            approver: true
          }
        }
      }
    });

    res.status(201).json(sector);
  } catch (error) {
    console.error('Error al crear sector:', error);
    res.status(500).json({ error: 'Error al crear sector' });
  }
};

export const updateSector = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, capacity, requiresApproval, isVIP, approverIds } = req.body;

    // Eliminar aprobadores existentes
    await prisma.sectorApprover.deleteMany({
      where: { sectorId: id }
    });

    const sector = await prisma.sector.update({
      where: { id },
      data: {
        name,
        description,
        capacity,
        requiresApproval,
        isVIP,
        approvers: approverIds ? {
          create: approverIds.map((approverId: string) => ({
            approverId
          }))
        } : undefined
      },
      include: {
        approvers: {
          include: {
            approver: true
          }
        }
      }
    });

    res.json(sector);
  } catch (error) {
    console.error('Error al actualizar sector:', error);
    res.status(500).json({ error: 'Error al actualizar sector' });
  }
};
