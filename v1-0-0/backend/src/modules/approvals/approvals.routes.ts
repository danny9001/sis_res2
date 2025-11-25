import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  getPendingApprovals,
  approveReservation,
  rejectReservation
} from './approvals.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('APPROVER', 'ADMIN'));

router.get('/pending', getPendingApprovals);
router.post('/:id/approve', approveReservation);
router.post('/:id/reject', rejectReservation);

export default router;
