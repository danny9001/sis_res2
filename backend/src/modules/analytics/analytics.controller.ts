import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../utils/prisma';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, startDate, endDate } = req.query;

    const where: any = {};
    
    if (eventId) {
      where.eventId = eventId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    // Total de reservas
    const totalReservations = await prisma.reservation.count({ where });

    // Por estado
    const byStatus = await prisma.reservation.groupBy({
      by: ['status'],
      where,
      _count: true
    });

    // Por sector
    const bySector = await prisma.reservation.groupBy({
      by: ['sectorId'],
      where,
      _count: true,
      _sum: {
        paymentAmount: true
      }
    });

    // Total de invitados
    const totalGuests = await prisma.guest.count({
      where: {
        reservation: where
      }
    });

    // QRs validados
    const validatedQRs = await prisma.guest.count({
      where: {
        reservation: where,
        qrValidated: true
      }
    });

    // Top relacionadores
    const topRelators = await prisma.reservation.groupBy({
      by: ['relatorMainId'],
      where,
      _count: true,
      _sum: {
        paymentAmount: true
      },
      orderBy: {
        _count: {
          relatorMainId: 'desc'
        }
      },
      take: 10
    });

    res.json({
      totalReservations,
      byStatus,
      bySector,
      totalGuests,
      validatedQRs,
      topRelators,
      validationRate: totalGuests > 0 ? (validatedQRs / totalGuests) * 100 : 0
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

export const getRelatorStats = async (req: AuthRequest, res: Response) => {
  try {
    const { relatorId } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = {
      OR: [
        { relatorMainId: relatorId },
        { relatorSaleId: relatorId }
      ]
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        event: true,
        sector: true,
        guests: true
      }
    });

    const stats = {
      totalReservations: reservations.length,
      approved: reservations.filter(r => r.status === 'APPROVED').length,
      pending: reservations.filter(r => r.status === 'PENDING').length,
      rejected: reservations.filter(r => r.status === 'REJECTED').length,
      totalRevenue: reservations.reduce((sum, r) => sum + (r.paymentAmount || 0), 0),
      totalGuests: reservations.reduce((sum, r) => sum + r.guests.length, 0)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas de relacionador:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
