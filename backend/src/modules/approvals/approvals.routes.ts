import { Router } from 'express';
import { getPendingApprovals, approveReservation, rejectReservation } from './approvals.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/pending', authenticate, authorize('APPROVER', 'ADMIN'), getPendingApprovals);
router.post('/:id/approve', authenticate, authorize('APPROVER', 'ADMIN'), approveReservation);
router.post('/:id/reject', authenticate, authorize('APPROVER', 'ADMIN'), rejectReservation);

export default router;
