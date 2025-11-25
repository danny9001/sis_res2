import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

export const createReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const data = req.body;

    const reservation = await prisma.reservation.create({
      data: {
        eventId: data.eventId,
        sectorId: data.sectorId,
        tableType: data.tableType,
        responsibleName: data.responsibleName,
        responsiblePhone: data.responsiblePhone,
        responsibleEmail: data.responsibleEmail,
        responsibleCI: data.responsibleCI,
        observations: data.observations,
        paymentType: data.paymentType,
        paymentAmount: data.paymentAmount,
        relatorMainId: userId,
        relatorSupportId: data.relatorSupportId,
        guests: {
          create: data.guests?.map((guest: any) => ({
            name: guest.name,
            ci: guest.ci,
            phone: guest.phone,
            qrCode: `GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          })) || [],
        },
      },
      include: {
        event: true,
        sector: true,
        relatorMain: true,
        relatorSupport: true,
        guests: true,
      },
    });

    res.status(201).json(reservation);
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getReservations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const where: any = {};

    if (userRole === 'RELATOR') {
      where.OR = [
        { relatorMainId: userId },
        { relatorSupportId: userId },
      ];
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        event: true,
        sector: true,
        relatorMain: true,
        relatorSupport: true,
        guests: true,
        approvals: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reservations);
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        event: true,
        sector: true,
        relatorMain: true,
        relatorSupport: true,
        guests: true,
        approvals: {
          include: {
            approver: true,
          },
        },
        additionalPasses: true,
      },
    });

    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }

    res.json(reservation);
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        tableType: data.tableType,
        responsibleName: data.responsibleName,
        responsiblePhone: data.responsiblePhone,
        responsibleEmail: data.responsibleEmail,
        responsibleCI: data.responsibleCI,
        observations: data.observations,
        paymentType: data.paymentType,
        paymentAmount: data.paymentAmount,
        status: data.status,
      },
      include: {
        event: true,
        sector: true,
        guests: true,
      },
    });

    res.json(reservation);
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.reservation.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
