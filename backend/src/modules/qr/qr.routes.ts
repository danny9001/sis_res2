import { Router } from 'express';
import { validateQR, getQRDetails } from './qr.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/validate', authenticate, validateQR);
router.get('/:qrCode', getQRDetails);

export default router;
