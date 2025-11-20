#!/bin/bash

echo "📦 Creando módulos Sectors, Events y Reservations..."

# SECTORS MODULE
mkdir -p backend/src/modules/sectors
cat > backend/src/modules/sectors/sectors.controller.ts << 'EOF'
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';

const prisma = new PrismaClient();

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
EOF

cat > backend/src/modules/sectors/sectors.routes.ts << 'EOF'
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { getSectors, createSector, updateSector } from './sectors.controller';

const router = Router();

router.use(authenticate);

router.get('/', getSectors);
router.post('/', authorize('ADMIN'), createSector);
router.put('/:id', authorize('ADMIN'), updateSector);

export default router;
EOF

# EVENTS MODULE
mkdir -p backend/src/modules/events
cat > backend/src/modules/events/events.controller.ts << 'EOF'
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';

const prisma = new PrismaClient();

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const { active, upcoming } = req.query;

    const where: any = {};
    
    if (active !== undefined) {
      where.active = active === 'true';
    }

    if (upcoming === 'true') {
      where.eventDate = {
        gte: new Date()
      };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        eventSectors: {
          include: {
            sector: true
          }
        },
        _count: {
          select: {
            reservations: true
          }
        }
      },
      orderBy: { eventDate: 'desc' }
    });

    res.json(events);
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

export const getEventById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        eventSectors: {
          include: {
            sector: {
              include: {
                approvers: {
                  include: {
                    approver: true
                  }
                }
              }
            }
          }
        },
        reservations: {
          include: {
            sector: true,
            relatorMain: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            guests: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({ error: 'Error al obtener evento' });
  }
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { name, eventDate, description, sectorConfigs } = req.body;

    const event = await prisma.event.create({
      data: {
        name,
        eventDate: new Date(eventDate),
        description,
        eventSectors: {
          create: sectorConfigs.map((config: any) => ({
            sectorId: config.sectorId,
            availableTables: config.availableTables
          }))
        }
      },
      include: {
        eventSectors: {
          include: {
            sector: true
          }
        }
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ error: 'Error al crear evento' });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, eventDate, description, active } = req.body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        name,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        description,
        active
      },
      include: {
        eventSectors: {
          include: {
            sector: true
          }
        }
      }
    });

    res.json(event);
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
};
EOF

cat > backend/src/modules/events/events.routes.ts << 'EOF'
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent
} from './events.controller';

const router = Router();

router.use(authenticate);

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authorize('ADMIN'), createEvent);
router.put('/:id', authorize('ADMIN'), updateEvent);

export default router;
EOF

echo "✅ Módulos Sectors y Events creados"
