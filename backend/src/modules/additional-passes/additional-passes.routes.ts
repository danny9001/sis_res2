// RUTAS PARA ADDITIONAL PASSES
// backend/src/modules/additional-passes/additional-passes.routes.ts
// ============================================

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  createAdditionalPass,
  getAdditionalPasses,
  getAdditionalPass,
  revokeAdditionalPass,
  getPassQR,
  getPassesByReservation,
  getPassesStats,
} from './additional-passes.controller';

const passesRouter = Router();

// Todas las rutas requieren autenticación
passesRouter.use(authenticate);

// Estadísticas (ADMIN, APPROVER)
passesRouter.get(
  '/stats/overview',
  authorize(['ADMIN', 'APPROVER']),
  getPassesStats
);

// Crear pase (ADMIN, APPROVER, RELATOR)
passesRouter.post(
  '/',
  authorize(['ADMIN', 'APPROVER', 'RELATOR']),
  createAdditionalPass
);

// Listar pases
passesRouter.get(
  '/',
  authorize(['ADMIN', 'APPROVER', 'RELATOR', 'VALIDATOR']),
  getAdditionalPasses
);

// Pases por reserva
passesRouter.get(
  '/reservation/:reservationId',
  authorize(['ADMIN', 'APPROVER', 'RELATOR', 'VALIDATOR']),
  getPassesByReservation
);

// Detalles de un pase
