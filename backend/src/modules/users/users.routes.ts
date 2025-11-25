// backend/src/modules/users/users.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { getUsers, getUser, createUser, updateUser, deleteUser } from './users.controller';

const router = Router();
router.use(authenticate);
router.use(authorize(['ADMIN']));

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
