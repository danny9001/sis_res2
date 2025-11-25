// backend/src/modules/events/events.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { getEvents, getEvent, createEvent, updateEvent, deleteEvent } from './events.controller';

const router = Router();
router.use(authenticate);

router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/', authorize(['ADMIN']), createEvent);
router.put('/:id', authorize(['ADMIN']), updateEvent);
router.delete('/:id', authorize(['ADMIN']), deleteEvent);

export default router;
