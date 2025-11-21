import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Datos de entrada inválidos',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};

// Esquemas de validación para Auth
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

// Esquemas de validación para Reservations
export const createReservationSchema = z.object({
  eventId: z.string().uuid('ID de evento inválido'),
  sectorId: z.string().uuid('ID de sector inválido'),
  tableType: z.enum(['JET_15', 'FLY_10', 'JET_BIRTHDAY_15', 'FLY_BIRTHDAY_10']),
  tableClass: z.enum(['RESERVATION', 'GUEST', 'COLLABORATION']),
  paymentType: z.enum(['PAID', 'PARTIAL', 'GUEST']),
  paymentAmount: z.number().optional(),
  relatorMainPhone: z.string().min(8, 'Teléfono inválido'),
  relatorSaleId: z.string().uuid().optional(),
  relatorSalePhone: z.string().optional(),
  responsibleName: z.string().min(2, 'Nombre del responsable requerido'),
  responsiblePhone: z.string().min(8, 'Teléfono del responsable requerido'),
  notes: z.string().optional(),
  guests: z.array(z.object({
    name: z.string().min(2, 'Nombre del invitado requerido'),
    ci: z.string().min(5, 'CI requerido'),
    phone: z.string().optional(),
    email: z.string().email('Email inválido').optional(),
    birthDate: z.string().optional()
  })).min(1, 'Debe incluir al menos un invitado')
});

export const updateReservationSchema = z.object({
  notes: z.string().optional(),
  responsibleName: z.string().min(2).optional(),
  responsiblePhone: z.string().min(8).optional()
});

// Esquemas de validación para Approvals
export const approvalActionSchema = z.object({
  comments: z.string().optional()
});

export const rejectReservationSchema = z.object({
  comments: z.string().min(10, 'Debes proporcionar un motivo de rechazo (mínimo 10 caracteres)')
});

// Esquemas de validación para Users
export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  name: z.string().min(2, 'Nombre requerido'),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'APPROVER', 'RELATOR'])
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'APPROVER', 'RELATOR']).optional(),
  active: z.boolean().optional()
});

// Esquemas de validación para Sectors
export const createSectorSchema = z.object({
  name: z.string().min(2, 'Nombre del sector requerido'),
  code: z.string().min(2, 'Código del sector requerido'),
  description: z.string().optional(),
  capacity: z.number().int().positive('La capacidad debe ser un número positivo'),
  requiresApproval: z.boolean().default(false),
  isVIP: z.boolean().default(false),
  layout: z.any().optional()
});

export const updateSectorSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).optional(),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  requiresApproval: z.boolean().optional(),
  isVIP: z.boolean().optional(),
  layout: z.any().optional(),
  active: z.boolean().optional()
});

// Esquemas de validación para Events
export const createEventSchema = z.object({
  name: z.string().min(2, 'Nombre del evento requerido'),
  eventDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida'),
  description: z.string().optional(),
  sectors: z.array(z.object({
    sectorId: z.string().uuid(),
    availableTables: z.number().int().positive()
  })).optional()
});

export const updateEventSchema = z.object({
  name: z.string().min(2).optional(),
  eventDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida').optional(),
  description: z.string().optional(),
  active: z.boolean().optional()
});

// Esquema de validación para QR validation
export const validateQRSchema = z.object({
  qrCode: z.string().uuid('Código QR inválido')
});
