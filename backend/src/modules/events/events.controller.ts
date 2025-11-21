import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../utils/prisma';

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
