// backend/src/modules/sectors/sectors.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  getSectors,
  getSector,
  createSector,
  updateSector,
  deleteSector,
  addApprover,
  removeApprover,
  getSectorStats,
} from './sectors.controller';

const router = Router();
router.use(authenticate);

router.get('/', getSectors);
router.get('/:id', getSector);
router.get('/:id/stats', authorize(['ADMIN', 'APPROVER']), getSectorStats);
router.post('/', authorize(['ADMIN']), createSector);
router.put('/:id', authorize(['ADMIN']), updateSector);
router.delete('/:id', authorize(['ADMIN']), deleteSector);
router.post('/:id/approvers', authorize(['ADMIN']), addApprover);
router.delete('/:id/approvers/:approverId', authorize(['ADMIN']), removeApprover);

export default router;
