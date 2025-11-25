// RUTAS PARA VALIDATOR
// backend/src/modules/validator/validator.routes.ts
// ============================================

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  validateQR,
  getValidatorStats,
  getReservationsForValidator,
  getReservationDetails,
  searchGuest,
} from './validator.controller';

const validatorRouter = Router();

// Todas las rutas requieren autenticación y rol VALIDATOR o ADMIN
validatorRouter.use(authenticate);
validatorRouter.use(authorize(['VALIDATOR', 'ADMIN']));

// Validar QR (escanear)
validatorRouter.post('/scan', validateQR);

// Estadísticas
validatorRouter.get('/stats', getValidatorStats);

// Ver reservas (solo lectura)
validatorRouter.get('/reservations', getReservationsForValidator);
validatorRouter.get('/reservation/:id', getReservationDetails);

// Buscar invitado
validatorRouter.get('/search/:query', searchGuest);

export default validatorRouter;

// ============================================
// RUTAS PARA ADDITIONAL PASSES
// backend/src/modules/additional-passes/additional-passes.routes.ts
// ============================================

