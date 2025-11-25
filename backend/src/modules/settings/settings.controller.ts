// backend/src/modules/settings/settings.controller.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validación de configuración
const settingsSchema = z.object({
  siteName: z.string().min(1).max(100).optional(),
  logoUrl: z.string().url().optional().nullable(),
  faviconUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  supportUrl: z.string().url().optional().nullable(),
  facebookUrl: z.string().url().optional().nullable(),
  instagramUrl: z.string().url().optional().nullable(),
  twitterUrl: z.string().url().optional().nullable(),
  defaultEventDuration: z.number().min(60).max(1440).optional(),
  maxGuestsPerTable: z.number().min(1).max(50).optional(),
  minAgeRequired: z.number().min(0).max(100).optional(),
  customTerms: z.string().optional().nullable(),
  welcomeMessage: z.string().optional().nullable(),
  enableEmailNotifications: z.boolean().optional(),
  enableSmsNotifications: z.boolean().optional(),
  enablePushNotifications: z.boolean().optional(),
});

/**
 * Obtener configuración del sitio
 * GET /api/settings
 */
export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await prisma.siteSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          siteName: 'Sistema de Reservas',
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981',
          accentColor: '#F59E0B',
        },
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error al obtener configuración del sitio' });
  }
};

/**
 * Actualizar configuración del sitio
 * PUT /api/settings
 */
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const data = settingsSchema.parse(req.body);
    
    let settings = await prisma.siteSettings.findFirst();
    
    if (settings) {
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data,
      });
    } else {
      settings = await prisma.siteSettings.create({
        data,
      });
    }
    
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'UPDATE_SETTINGS',
        entity: 'SiteSettings',
        entityId: settings.id,
        newData: data,
      },
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
};

/**
 * Obtener configuración pública
 * GET /api/settings/public
 */
export const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.siteSettings.findFirst({
      select: {
        siteName: true,
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        contactEmail: true,
        contactPhone: true,
        supportUrl: true,
        facebookUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        minAgeRequired: true,
        customTerms: true,
        welcomeMessage: true,
      },
    });
    
    res.json(settings || {
      siteName: 'Sistema de Reservas',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      accentColor: '#F59E0B',
    });
  } catch (error) {
    console.error('Error al obtener configuración pública:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
};
