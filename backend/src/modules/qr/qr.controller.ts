import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const validateQR = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrCode } = req.body;
    const userId = req.user!.id;

    // Check if it's a guest QR
    const guest = await prisma.guest.findUnique({
      where: { qrCode },
      include: {
        reservation: {
          include: {
            event: true,
            sector: true,
          },
        },
      },
    });

    if (guest) {
      if (guest.qrValidated) {
        res.status(400).json({ error: 'QR code already validated' });
        return;
      }

      await prisma.guest.update({
        where: { id: guest.id },
        data: {
          qrValidated: true,
          validatedAt: new Date(),
        },
      });

      await prisma.qRValidation.create({
        data: {
          reservationId: guest.reservationId,
          guestId: guest.id,
          validatedBy: userId,
        },
      });

      res.json({ success: true, type: 'guest', guest });
      return;
    }

    // Check if it's an additional pass QR
    const pass = await prisma.additionalPass.findUnique({
      where: { qrCode },
      include: {
        reservation: {
          include: {
            event: true,
            sector: true,
          },
        },
      },
    });

    if (pass) {
      if (pass.qrValidated) {
        res.status(400).json({ error: 'QR code already validated' });
        return;
      }

      await prisma.additionalPass.update({
        where: { id: pass.id },
        data: {
          qrValidated: true,
          validatedAt: new Date(),
        },
      });

      await prisma.qRValidation.create({
        data: {
          reservationId: pass.reservationId,
          passId: pass.id,
          validatedBy: userId,
        },
      });

      res.json({ success: true, type: 'pass', pass });
      return;
    }

    res.status(404).json({ error: 'QR code not found' });
  } catch (error) {
    console.error('Validate QR error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getQRDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { qrCode } = req.params;

    const guest = await prisma.guest.findUnique({
      where: { qrCode },
      include: {
        reservation: {
          include: {
            event: true,
            sector: true,
            relatorMain: true,
          },
        },
      },
    });

    if (guest) {
      res.json({ type: 'guest', data: guest });
      return;
    }

    const pass = await prisma.additionalPass.findUnique({
      where: { qrCode },
      include: {
        reservation: {
          include: {
            event: true,
            sector: true,
            relatorMain: true,
          },
        },
      },
    });

    if (pass) {
      res.json({ type: 'pass', data: pass });
      return;
    }

    res.status(404).json({ error: 'QR code not found' });
  } catch (error) {
    console.error('Get QR details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
