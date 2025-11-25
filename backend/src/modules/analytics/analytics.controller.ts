// backend/src/modules/analytics/analytics.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/analytics/dashboard
 * Estadísticas generales para el dashboard
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.query;
    const userRole = req.user!.role;
    const userId = req.user!.id;

    // Filtros base
    const where: any = {};
    
    if (eventId) {
      where.eventId = eventId as string;
    }

    // Si es RELATOR, solo ver sus reservas
    if (userRole === 'RELATOR') {
      where.relatorMainId = userId;
    }

    // Total de reservas
    const totalReservations = await prisma.reservation.count({ where });

    // Reservas por estado
    const byStatus = await prisma.reservation.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // Total de invitados
    const totalGuests = await prisma.guest.count({
      where: {
        reservation: where,
      },
    });

    // Invitados validados
    const validatedGuests = await prisma.guest.count({
      where: {
        reservation: where,
        qrValidated: true,
      },
    });

    // Pases adicionales
    const additionalPassesActive = await prisma.additionalPass.count({
      where: {
        reservation: where,
        status: 'ACTIVE',
      },
    });

    const additionalPassesValidated = await prisma.additionalPass.count({
      where: {
        reservation: where,
        qrValidated: true,
      },
    });

    // Ingresos por tipo de pago
    const revenueByPaymentType = await prisma.reservation.groupBy({
      by: ['paymentType'],
      where: {
        ...where,
        status: 'APPROVED',
      },
      _sum: {
        paymentAmount: true,
      },
    });

    // Total de ingresos
    const totalRevenue = revenueByPaymentType.reduce(
      (sum, item) => sum + (item._sum.paymentAmount || 0),
      0
    );

    // Reservas por sector
    const bySector = await prisma.reservation.groupBy({
      by: ['sectorId'],
      where,
      _count: true,
    });

    // Obtener nombres de sectores
    const sectors = await prisma.sector.findMany({
      where: {
        id: {
          in: bySector.map((s) => s.sectorId),
        },
      },
      select: { id: true, name: true, code: true },
    });

    const sectorStats = bySector.map((s) => {
      const sector = sectors.find((sec) => sec.id === s.sectorId);
      return {
        sectorId: s.sectorId,
        sectorName: sector?.name || 'Desconocido',
        sectorCode: sector?.code || '',
        count: s._count,
      };
    });

    // Reservas por tipo de mesa
    const byTableType = await prisma.reservation.groupBy({
      by: ['tableType'],
      where,
      _count: true,
    });

    // Tendencia de reservas (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reservationsTrend = await prisma.reservation.groupBy({
      by: ['createdAt'],
      where: {
        ...where,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: true,
    });

    res.json({
      summary: {
        totalReservations,
        totalGuests,
        validatedGuests,
        validationPercentage: totalGuests > 0 
          ? Math.round((validatedGuests / totalGuests) * 100) 
          : 0,
        additionalPassesActive,
        additionalPassesValidated,
        totalRevenue,
      },
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      bySector: sectorStats,
      byTableType: byTableType.map((t) => ({
        tableType: t.tableType,
        count: t._count,
      })),
      revenueByPaymentType: revenueByPaymentType.map((r) => ({
        paymentType: r.paymentType,
        total: r._sum.paymentAmount || 0,
      })),
      trend: reservationsTrend,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

/**
 * GET /api/analytics/events
 * Analíticas por evento
 */
export const getEventAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};

    if (startDate && endDate) {
      where.eventDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        reservations: {
          include: {
            guests: true,
            additionalPasses: true,
          },
        },
      },
    });

    const analytics = events.map((event) => {
      const totalReservations = event.reservations.length;
      const approvedReservations = event.reservations.filter(
        (r) => r.status === 'APPROVED'
      ).length;

      const totalGuests = event.reservations.reduce(
        (sum, r) => sum + r.guests.length,
        0
      );

      const validatedGuests = event.reservations.reduce(
        (sum, r) => sum + r.guests.filter((g) => g.qrValidated).length,
        0
      );

      const totalRevenue = event.reservations
        .filter((r) => r.status === 'APPROVED')
        .reduce((sum, r) => sum + (r.paymentAmount || 0), 0);

      return {
        eventId: event.id,
        eventName: event.name,
        eventDate: event.eventDate,
        totalReservations,
        approvedReservations,
        totalGuests,
        validatedGuests,
        attendanceRate: totalGuests > 0 
          ? Math.round((validatedGuests / totalGuests) * 100) 
          : 0,
        totalRevenue,
      };
    });

    res.json(analytics);
  } catch (error) {
    console.error('Error al obtener analíticas de eventos:', error);
    res.status(500).json({ error: 'Error al obtener analíticas' });
  }
};

/**
 * GET /api/analytics/relators
 * Rendimiento de relacionadores
 */
export const getRelatorsPerformance = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.query;

    const where: any = {};
    if (eventId) {
      where.eventId = eventId as string;
    }

    const relators = await prisma.user.findMany({
      where: { role: 'RELATOR', active: true },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const performance = await Promise.all(
      relators.map(async (relator) => {
        const totalReservations = await prisma.reservation.count({
          where: {
            ...where,
            relatorMainId: relator.id,
          },
        });

        const approvedReservations = await prisma.reservation.count({
          where: {
            ...where,
            relatorMainId: relator.id,
            status: 'APPROVED',
          },
        });

        const totalGuests = await prisma.guest.count({
          where: {
            reservation: {
              ...where,
              relatorMainId: relator.id,
            },
          },
        });

        const totalRevenue = await prisma.reservation.aggregate({
          where: {
            ...where,
            relatorMainId: relator.id,
            status: 'APPROVED',
          },
          _sum: {
            paymentAmount: true,
          },
        });

        return {
          relatorId: relator.id,
          relatorName: relator.name,
          relatorEmail: relator.email,
          totalReservations,
          approvedReservations,
          approvalRate: totalReservations > 0
            ? Math.round((approvedReservations / totalReservations) * 100)
            : 0,
          totalGuests,
          totalRevenue: totalRevenue._sum.paymentAmount || 0,
        };
      })
    );

    // Ordenar por ingresos
    performance.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json(performance);
  } catch (error) {
    console.error('Error al obtener rendimiento de relacionadores:', error);
    res.status(500).json({ error: 'Error al obtener rendimiento' });
  }
};

/**
 * GET /api/analytics/sectors
 * Analíticas por sector
 */
export const getSectorAnalytics = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.query;

    const where: any = {};
    if (eventId) {
      where.eventId = eventId as string;
    }

    const sectors = await prisma.sector.findMany({
      where: { active: true },
    });

    const analytics = await Promise.all(
      sectors.map(async (sector) => {
        const totalReservations = await prisma.reservation.count({
          where: {
            ...where,
            sectorId: sector.id,
          },
        });

        const totalGuests = await prisma.guest.count({
          where: {
            reservation: {
              ...where,
              sectorId: sector.id,
            },
          },
        });

        const capacity = sector.capacity || 0;
        const occupancy = capacity > 0 ? (totalGuests / capacity) * 100 : 0;

        const totalRevenue = await prisma.reservation.aggregate({
          where: {
            ...where,
            sectorId: sector.id,
            status: 'APPROVED',
          },
          _sum: {
            paymentAmount: true,
          },
        });

        return {
          sectorId: sector.id,
          sectorName: sector.name,
          sectorCode: sector.code,
          capacity,
          totalReservations,
          totalGuests,
          occupancyPercentage: Math.round(occupancy),
          totalRevenue: totalRevenue._sum.paymentAmount || 0,
        };
      })
    );

    res.json(analytics);
  } catch (error) {
    console.error('Error al obtener analíticas de sectores:', error);
    res.status(500).json({ error: 'Error al obtener analíticas' });
  }
};

/**
 * GET /api/analytics/revenue
 * Analíticas de ingresos
 */
export const getRevenueAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const where: any = {
      status: 'APPROVED',
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // Total de ingresos
    const totalRevenue = await prisma.reservation.aggregate({
      where,
      _sum: {
        paymentAmount: true,
      },
    });

    // Por tipo de pago
    const byPaymentType = await prisma.reservation.groupBy({
      by: ['paymentType'],
      where,
      _sum: {
        paymentAmount: true,
      },
      _count: true,
    });

    // Por tipo de mesa
    const byTableType = await prisma.reservation.groupBy({
      by: ['tableType'],
      where,
      _sum: {
        paymentAmount: true,
      },
      _count: true,
    });

    // Por sector
    const bySector = await prisma.reservation.groupBy({
      by: ['sectorId'],
      where,
      _sum: {
        paymentAmount: true,
      },
    });

    const sectors = await prisma.sector.findMany({
      where: {
        id: {
          in: bySector.map((s) => s.sectorId),
        },
      },
      select: { id: true, name: true },
    });

    const revenueBySector = bySector.map((s) => {
      const sector = sectors.find((sec) => sec.id === s.sectorId);
      return {
        sectorName: sector?.name || 'Desconocido',
        revenue: s._sum.paymentAmount || 0,
      };
    });

    res.json({
      totalRevenue: totalRevenue._sum.paymentAmount || 0,
      byPaymentType: byPaymentType.map((p) => ({
        paymentType: p.paymentType,
        revenue: p._sum.paymentAmount || 0,
        count: p._count,
      })),
      byTableType: byTableType.map((t) => ({
        tableType: t.tableType,
        revenue: t._sum.paymentAmount || 0,
        count: t._count,
      })),
      bySector: revenueBySector,
    });
  } catch (error) {
    console.error('Error al obtener analíticas de ingresos:', error);
    res.status(500).json({ error: 'Error al obtener analíticas' });
  }
};

/**
 * GET /api/analytics/export
 * Exportar analíticas a CSV
 */
export const exportAnalytics = async (req: Request, res: Response) => {
  try {
    const { type = 'reservations', eventId } = req.query;

    let data: any[] = [];
    let headers: string[] = [];

    if (type === 'reservations') {
      const where: any = {};
      if (eventId) where.eventId = eventId as string;

      const reservations = await prisma.reservation.findMany({
        where,
        include: {
          event: true,
          sector: true,
          relatorMain: true,
          guests: true,
        },
      });

      headers = [
        'ID',
        'Evento',
        'Sector',
        'Tipo Mesa',
        'Responsable',
        'Relacionador',
        'Estado',
        'Invitados',
        'Monto',
        'Fecha Creación',
      ];

      data = reservations.map((r) => [
        r.id,
        r.event.name,
        r.sector.name,
        r.tableType,
        r.responsibleName,
        r.relatorMain.name,
        r.status,
        r.guests.length,
        r.paymentAmount || 0,
        r.createdAt.toISOString(),
      ]);
    }

    // Convertir a CSV
    const csv = [
      headers.join(','),
      ...data.map((row) => row.join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-${type}-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error al exportar analíticas:', error);
    res.status(500).json({ error: 'Error al exportar' });
  }
};
