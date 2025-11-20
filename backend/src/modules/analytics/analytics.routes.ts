import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { getDashboardStats, getRelatorStats } from './analytics.controller';

const router = Router();

router.use(authenticate);

router.get('/dashboard', authorize('ADMIN', 'APPROVER'), getDashboardStats);
router.get('/relator/:relatorId', getRelatorStats);

export default router;
