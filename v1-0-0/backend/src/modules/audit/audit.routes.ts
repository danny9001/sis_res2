import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { getAuditLogs, getReservationHistory } from './audit.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAuditLogs);
router.get('/reservation/:reservationId', getReservationHistory);

export default router;
