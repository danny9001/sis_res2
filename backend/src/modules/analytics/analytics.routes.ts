// backend/src/modules/analytics/analytics.routes.ts

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  getDashboardStats,
  getEventAnalytics,
  getRelatorsPerformance,
  getSectorAnalytics,
  getRevenueAnalytics,
  exportAnalytics,
} from './analytics.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Dashboard general (todos los roles)
router.get('/dashboard', getDashboardStats);

// Analíticas de eventos (ADMIN, APPROVER)
router.get(
  '/events',
  authorize(['ADMIN', 'APPROVER']),
  getEventAnalytics
);

// Rendimiento de relacionadores (ADMIN, APPROVER)
router.get(
  '/relators',
  authorize(['ADMIN', 'APPROVER']),
  getRelatorsPerformance
);

// Analíticas de sectores (ADMIN, APPROVER)
router.get(
  '/sectors',
  authorize(['ADMIN', 'APPROVER']),
  getSectorAnalytics
);

// Analíticas de ingresos (ADMIN)
router.get(
  '/revenue',
  authorize(['ADMIN']),
  getRevenueAnalytics
);

// Exportar (ADMIN, APPROVER)
router.get(
  '/export',
  authorize(['ADMIN', 'APPROVER']),
  exportAnalytics
);

export default router;
