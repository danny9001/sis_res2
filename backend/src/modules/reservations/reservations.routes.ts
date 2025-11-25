import { Router } from 'express';
import {
  createReservation,
  getReservations,
  getReservation,
  updateReservation,
  deleteReservation,
} from './reservations.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.post('/', authenticate, createReservation);
router.get('/', authenticate, getReservations);
router.get('/:id', authenticate, getReservation);
router.patch('/:id', authenticate, updateReservation);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteReservation);

export default router;
