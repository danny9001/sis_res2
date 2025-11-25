import { Prisma } from '@prisma/client';

// Tipos para queries
export interface ReservationWhereInput {
  eventId?: string;
  status?: string;
  relatorMainId?: string;
  relatorSaleId?: string;
  OR?: Array<{
    relatorMainId?: string;
    relatorSaleId?: string;
  }>;
}

export interface ApprovalWhereInput {
  status?: string;
  approverId?: string;
}

// Tipos para Guest creation
export interface GuestCreateInput {
  name: string;
  ci: string;
  phone?: string;
  email?: string;
  birthDate?: string;
}

// Tipo para decoded JWT
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Tipos para email service
export interface ReservationDetailsForEmail {
  eventName: string;
  sectorName: string;
  relatorName: string;
  tableType: string;
}

export interface GuestWithQR {
  name: string;
  qrCode: string;
}
