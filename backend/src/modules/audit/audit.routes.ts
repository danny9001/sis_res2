// backend/src/modules/audit/audit.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  getAuditLogs,
  getAuditLog,
  getAuditStats,
  getEntityHistory,
} from './audit.controller';

const router = Router();
router.use(authenticate);
router.use(authorize(['ADMIN', 'APPROVER']));

router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);
router.get('/:id', getAuditLog);
router.get('/entity/:entity/:entityId', getEntityHistory);

export default router;
