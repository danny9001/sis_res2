// backend/src/modules/transfers/transfers.routes.ts

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  transferReservation,
  getTransferHistory,
  cancelTransfer,
} from './transfers.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * POST /api/transfers
 * Transferir una reserva
 * Roles: ADMIN, APPROVER, RELATOR (solo sus propias reservas)
 */
router.post(
  '/',
  authorize(['ADMIN', 'APPROVER', 'RELATOR']),
  transferReservation
);

/**
 * GET /api/transfers/history/:reservationId
 * Obtener historial de transferencias de una reserva
 * Roles: ADMIN, APPROVER, RELATOR
 */
router.get(
  '/history/:reservationId',
  authorize(['ADMIN', 'APPROVER', 'RELATOR']),
  getTransferHistory
);

/**
 * POST /api/transfers/:transferId/cancel
 * Cancelar una transferencia pendiente
 * Roles: ADMIN, APPROVER
 */
router.post(
  '/:transferId/cancel',
  authorize(['ADMIN', 'APPROVER']),
  cancelTransfer
);

export default router;
