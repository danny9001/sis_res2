import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validateQR, getFrequentGuests } from './guests.controller';

const router = Router();

router.use(authenticate);

router.post('/validate', authorize('ADMIN', 'APPROVER'), validateQR);
router.get('/frequent', getFrequentGuests);

export default router;
