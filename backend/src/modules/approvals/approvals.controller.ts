import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPendingApprovals = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const sectors = await prisma.sector.findMany({
      where: {
        approvers: {
          some: { id: userId },
        },
      },
      select: { id: true },
    });

    const sectorIds = sectors.map(s => s.id);

    const reservations = await prisma.reservation.findMany({
      where: {
        sectorId: { in: sectorIds },
        status: 'PENDING',
      },
      include: {
        event: true,
        sector: true,
        relatorMain: true,
        guests: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reservations);
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const approveReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { comments } = req.body;

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    await prisma.approval.create({
      data: {
        reservationId: id,
        approverId: userId,
        approved: true,
        comments,
      },
    });

    res.json(reservation);
  } catch (error) {
    console.error('Approve reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const rejectReservation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { comments } = req.body;

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    await prisma.approval.create({
      data: {
        reservationId: id,
        approverId: userId,
        approved: false,
        comments,
      },
    });

    res.json(reservation);
  } catch (error) {
    console.error('Reject reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
