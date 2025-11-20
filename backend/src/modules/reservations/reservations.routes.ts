import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  cancelReservation
} from './reservations.controller';

const router = Router();

router.use(authenticate);

router.get('/', getReservations);
router.get('/:id', getReservationById);
router.post('/', createReservation);
router.put('/:id', updateReservation);
router.delete('/:id', cancelReservation);

export default router;
