// RUTAS PARA SETTINGS
// backend/src/modules/settings/settings.routes.ts
// ============================================

import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../../middleware/auth';
import {
  getPublicSettings,
  getSettings,
  updateSettings,
  uploadLogo,
  uploadFavicon,
  deleteLogo,
  deleteFavicon,
} from './settings.controller';

const router = Router();

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  },
});

// Rutas públicas
router.get('/public', getPublicSettings);

// Rutas protegidas (solo ADMIN)
router.get('/', authenticate, authorize(['ADMIN']), getSettings);
router.put('/', authenticate, authorize(['ADMIN']), updateSettings);
router.post('/logo', authenticate, authorize(['ADMIN']), upload.single('logo'), uploadLogo);
router.post('/favicon', authenticate, authorize(['ADMIN']), upload.single('favicon'), uploadFavicon);
router.delete('/logo', authenticate, authorize(['ADMIN']), deleteLogo);
router.delete('/favicon', authenticate, authorize(['ADMIN']), deleteFavicon);

export default router;