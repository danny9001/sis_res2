import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { validateEnv, env } from './utils/env';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { apiLimiter } from './middleware/rateLimiter';
import logger, { morganStream } from './utils/logger';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import sectorRoutes from './modules/sectors/sectors.routes';
import eventRoutes from './modules/events/events.routes';
import reservationRoutes from './modules/reservations/reservations.routes';
import approvalRoutes from './modules/approvals/approvals.routes';
import guestRoutes from './modules/invitations/guests.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import auditRoutes from './modules/audit/audit.routes';

// Validar variables de entorno al inicio
validateEnv();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.frontendUrl,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: env.frontendUrl,
  credentials: true
}));
app.use(morgan('combined', { stream: morganStream }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', apiLimiter);

// Socket.io
app.set('io', io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('No autorizado - Token requerido'));
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.verify(token, env.jwtSecret) as any;

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, active: true }
    });

    await prisma.$disconnect();

    if (!user || !user.active) {
      return next(new Error('Usuario no válido'));
    }

    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  logger.info(`Cliente conectado: ${socket.id} - Usuario: ${socket.data.user?.email}`);

  socket.on('disconnect', () => {
    logger.info(`Cliente desconectado: ${socket.id}`);
  });
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sectors', sectorRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

httpServer.listen(env.port, () => {
  logger.info(`🚀 Servidor corriendo en puerto ${env.port}`);
  logger.info(`📊 Environment: ${env.nodeEnv}`);
});

export { io };
