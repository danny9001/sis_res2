import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import prisma from '../../utils/prisma';

export const validateQR = async (req: AuthRequest, res: Response) => {
  try {
    const { qrCode } = req.body;

    const guest = await prisma.guest.findUnique({
      where: { qrCode },
      include: {
        reservation: {
          include: {
            event: true,
            sector: true
          }
        }
      }
    });

    if (!guest) {
      return res.status(404).json({ error: 'QR inválido' });
    }

    if (guest.qrValidated) {
      return res.status(400).json({ 
        error: 'QR ya utilizado',
        validatedAt: guest.validatedAt
      });
    }

    // Validar QR
    await prisma.guest.update({
      where: { id: guest.id },
      data: {
        qrValidated: true,
        validatedAt: new Date()
      }
    });

    // Auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'VALIDATE_QR',
        entity: 'Guest',
        entityId: guest.id,
        reservationId: guest.reservationId,
        newData: { qrCode, validated: true } as any,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json({
      message: 'QR validado exitosamente',
      guest: {
        name: guest.name,
        ci: guest.ci,
        event: guest.reservation.event.name,
        sector: guest.reservation.sector.name
      }
    });
  } catch (error) {
    console.error('Error al validar QR:', error);
    res.status(500).json({ error: 'Error al validar QR' });
  }
};

export const getFrequentGuests = async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { ci: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const guests = await prisma.guest.groupBy({
      by: ['name', 'ci'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 50
    });

    res.json(guests);
  } catch (error) {
    console.error('Error al obtener invitados frecuentes:', error);
    res.status(500).json({ error: 'Error al obtener invitados' });
  }
};
