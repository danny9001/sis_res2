// RUTAS PARA SETTINGS
// backend/src/modules/settings/settings.routes.ts
// ============================================

import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import {
  getSettings,
  updateSettings,
  uploadLogo,
  uploadFavicon,
  deleteLogo,
  getPublicSettings,
  upload,
} from './settings.controller';

const router = Router();

// Ruta pública (sin autenticación)
router.get('/public', getPublicSettings);

// Rutas protegidas
router.get('/', authenticate, getSettings);

router.put(
  '/',
  authenticate,
  authorize(['ADMIN']),
  updateSettings
);

router.post(
  '/logo',
  authenticate,
  authorize(['ADMIN']),
  upload.single('logo'),
  uploadLogo
);

router.post(
