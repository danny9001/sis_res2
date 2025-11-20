import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent
} from './events.controller';

const router = Router();

router.use(authenticate);

router.get('/', getEvents);
router.get('/:id', getEventById);
router.post('/', authorize('ADMIN'), createEvent);
router.put('/:id', authorize('ADMIN'), updateEvent);

export default router;
