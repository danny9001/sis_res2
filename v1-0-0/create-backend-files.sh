#!/bin/bash

echo "📦 Creando archivos del backend..."

# PRISMA SCHEMA
cat > backend/prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  phone     String?
  role      UserRole
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones
  createdReservations Reservation[] @relation("RelatorCreated")
  saleReservations    Reservation[] @relation("RelatorSale")
  approvedReservations Approval[]
  sectorApprovers     SectorApprover[]
  auditLogs           AuditLog[]

  @@map("users")
}

enum UserRole {
  ADMIN
  APPROVER
  RELATOR
}

model Sector {
  id          String   @id @default(uuid())
  name        String   @unique
  code        String   @unique
  description String?
  capacity    Int
  requiresApproval Boolean @default(false)
  isVIP       Boolean  @default(false)
  layout      Json?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relaciones
  reservations    Reservation[]
  approvers       SectorApprover[]
  eventSectors    EventSector[]

  @@map("sectors")
}

model SectorApprover {
  id        String   @id @default(uuid())
  sectorId  String
  approverId String
  createdAt DateTime @default(now())

  sector   Sector @relation(fields: [sectorId], references: [id], onDelete: Cascade)
  approver User   @relation(fields: [approverId], references: [id], onDelete: Cascade)

  @@unique([sectorId, approverId])
  @@map("sector_approvers")
}

model Event {
  id          String   @id @default(uuid())
  name        String
  eventDate   DateTime
  description String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relaciones
  reservations Reservation[]
  eventSectors EventSector[]

  @@map("events")
}

model EventSector {
  id             String   @id @default(uuid())
  eventId        String
  sectorId       String
  availableTables Int
  createdAt      DateTime @default(now())

  event  Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  sector Sector @relation(fields: [sectorId], references: [id], onDelete: Cascade)

  @@unique([eventId, sectorId])
  @@map("event_sectors")
}

model Reservation {
  id                String           @id @default(uuid())
  eventId           String
  sectorId          String
  tableType         TableType
  tableClass        TableClass
  paymentType       PaymentType
  paymentAmount     Float?
  paymentProof      String?
  relatorMainId     String
  relatorMainPhone  String
  relatorSaleId     String?
  relatorSalePhone  String?
  responsibleName   String
  responsiblePhone  String
  notes             String?
  status            ReservationStatus @default(PENDING)
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  // Relaciones
  event           Event     @relation(fields: [eventId], references: [id])
  sector          Sector    @relation(fields: [sectorId], references: [id])
  relatorMain     User      @relation("RelatorCreated", fields: [relatorMainId], references: [id])
  relatorSale     User?     @relation("RelatorSale", fields: [relatorSaleId], references: [id])
  guests          Guest[]
  approval        Approval?
  auditLogs       AuditLog[]

  @@map("reservations")
}

enum TableType {
  JET_15
  FLY_10
  JET_BIRTHDAY_15
  FLY_BIRTHDAY_10
}

enum TableClass {
  RESERVATION
  GUEST
  COLLABORATION
}

enum PaymentType {
  PAID
  PARTIAL
  GUEST
}

enum ReservationStatus {
  PENDING
  APPROVED
  REJECTED
  MODIFIED
  CANCELLED
}

model Guest {
  id            String   @id @default(uuid())
  reservationId String
  name          String
  ci            String
  phone         String?
  email         String?
  birthDate     DateTime?
  frequentGuest Boolean  @default(false)
  qrCode        String   @unique
  qrValidated   Boolean  @default(false)
  validatedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  reservation Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)

  @@map("guests")
}

model Approval {
  id            String         @id @default(uuid())
  reservationId String         @unique
  approverId    String
  status        ApprovalStatus
  comments      String?
  approvedAt    DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  reservation Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  approver    User        @relation(fields: [approverId], references: [id])

  @@map("approvals")
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
  MODIFIED
}

model AuditLog {
  id            String   @id @default(uuid())
  userId        String
  action        String
  entity        String
  entityId      String?
  reservationId String?
  oldData       Json?
  newData       Json?
  ipAddress     String?
  userAgent     String?
  createdAt     DateTime @default(now())

  user        User         @relation(fields: [userId], references: [id])
  reservation Reservation? @relation(fields: [reservationId], references: [id])

  @@map("audit_logs")
}
EOF

echo "✅ Prisma schema creado"

# SERVER.TS
mkdir -p backend/src
cat > backend/src/server.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import sectorRoutes from './modules/sectors/sectors.routes';
import eventRoutes from './modules/events/events.routes';
import reservationRoutes from './modules/reservations/reservations.routes';
import approvalRoutes from './modules/approvals/approvals.routes';
import guestRoutes from './modules/invitations/guests.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import auditRoutes from './modules/audit/audit.routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io
app.set('io', io);

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
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

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };
EOF

echo "✅ Server.ts creado"

