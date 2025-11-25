// backend/src/server.ts
// Sistema de Reservas v2.1 - Servidor Principal

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Importar rutas existentes
import authRoutes from './modules/auth/auth.routes';
import reservationRoutes from './modules/reservations/reservations.routes';
import approvalRoutes from './modules/approvals/approvals.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import qrRoutes from './modules/qr/qr.routes';

// ============================================
// NUEVOS MÓDULOS V2.1
// ============================================
import settingsRoutes from './modules/settings/settings.routes';
import validatorRoutes from './modules/validator/validator.routes';
import additionalPassesRoutes from './modules/additional-passes/additional-passes.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import sectorsRoutes from './modules/sectors/sectors.routes';
import eventsRoutes from './modules/events/events.routes';
import usersRoutes from './modules/users/users.routes';
import auditRoutes from './modules/audit/audit.routes';

// Inicializar Express
const app = express();
const httpServer = createServer(app);

// Configurar Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Middleware de seguridad
app.use(helmet());
app.use(morgan('dev'));

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.1.0',
    modules: [
      'auth',
      'reservations',
      'approvals',
      'notifications',
      'qr',
      'settings',
      'validator',
      'additional-passes',
      'analytics',
      'sectors',
      'events',
      'users',
      'audit',
    ],
  });
});

// ============================================
// RUTAS EXISTENTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/qr', qrRoutes);

// ============================================
// NUEVAS RUTAS V2.1
// ============================================

// Personalización del sitio
app.use('/api/settings', settingsRoutes);

// Validador de entrada (porteros)
app.use('/api/validator', validatorRoutes);

// Pases adicionales
app.use('/api/additional-passes', additionalPassesRoutes);

// Analíticas
app.use('/api/analytics', analyticsRoutes);

// Sectores
app.use('/api/sectors', sectorsRoutes);

// Eventos
app.use('/api/events', eventsRoutes);

// Usuarios
app.use('/api/users', usersRoutes);

// Auditoría
app.use('/api/audit', auditRoutes);

// ============================================
// WEBSOCKETS
// ============================================
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    console.log(`Cliente ${socket.id} se unió a la sala ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Hacer io disponible globalmente
app.set('io', io);

// ============================================
// MANEJO DE ERRORES
// ============================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Ruta no encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path,
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Sistema de Reservas v2.1.0               ║');
  console.log('║   Servidor iniciado correctamente          ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 WebSocket habilitado`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('');
  console.log('📦 Módulos cargados:');
  console.log('   ✓ Auth');
  console.log('   ✓ Reservations');
  console.log('   ✓ Approvals');
  console.log('   ✓ Notifications');
  console.log('   ✓ QR');
  console.log('   ✓ Settings (Personalización)');
  console.log('   ✓ Validator (Porteros)');
  console.log('   ✓ Additional Passes (Pases Adicionales)');
  console.log('   ✓ Analytics (Analíticas)');
  console.log('   ✓ Sectors (Sectores)');
  console.log('   ✓ Events (Eventos)');
  console.log('   ✓ Users (Usuarios)');
  console.log('   ✓ Audit (Auditoría)');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

export default app;
