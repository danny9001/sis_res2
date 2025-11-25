// backend/src/modules/events/events.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const eventSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().optional(),
  eventDate: z.string().datetime(),
  location: z.string().optional(),
  maxCapacity: z.number().int().positive().optional(),
  active: z.boolean().default(true),
});

export const getEvents = async (req: Request, res: Response) => {
  try {
    const { active, upcoming, search } = req.query;
    const where: any = {};
    
    if (active !== undefined) where.active = active === 'true';
    if (upcoming === 'true') where.eventDate = { gte: new Date() };
    if (search) where.name = { contains: search as string, mode: 'insensitive' };

    const events = await prisma.event.findMany({
      where,
      include: {
        _count: { select: { reservations: true } },
      },
      orderBy: { eventDate: 'desc' },
    });

    res.json(events);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

export const getEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        reservations: {
          include: {
            sector: true,
            relatorMain: { select: { name: true } },
          },
        },
        _count: { select: { reservations: true } },
      },
    });

    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(event);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener evento' });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = eventSchema.parse(req.body);
    
    const event = await prisma.event.create({
      data: { ...data, eventDate: new Date(data.eventDate) },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_EVENT',
        entity: 'Event',
        entityId: event.id,
        newData: data,
      },
    });

    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error('Error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'Error al crear evento' });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const data = eventSchema.partial().parse(req.body);

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Evento no encontrado' });

    const updateData: any = { ...data };
    if (data.eventDate) updateData.eventDate = new Date(data.eventDate);

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_EVENT',
        entity: 'Event',
        entityId: id,
        oldData: existing,
        newData: data,
      },
    });

    res.json({ success: true, event });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { reservations: true } } },
    });

    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

    if (event._count.reservations > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar evento con reservas',
      });
    }

    await prisma.event.update({
      where: { id },
      data: { active: false },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_EVENT',
        entity: 'Event',
        entityId: id,
        oldData: event,
      },
    });

    res.json({ success: true, message: 'Evento desactivado' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
};
