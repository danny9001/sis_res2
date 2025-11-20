import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { getSectors, createSector, updateSector } from './sectors.controller';

const router = Router();

router.use(authenticate);

router.get('/', getSectors);
router.post('/', authorize('ADMIN'), createSector);
router.put('/:id', authorize('ADMIN'), updateSector);

export default router;
