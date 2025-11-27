export type Role = 'admin' | 'promoter' | 'approver';

export interface User {
  id: string;
  name: string;
  username: string;
  password: string; // Stored in plain text for prototype
  role: Role;
}

export type TableStatus = 'available' | 'reserved' | 'occupied';

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  location: string; // e.g., "VIP Area", "Main Floor"
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isVip: boolean;
}

export interface Event {
  id: string;
  name: string;
  date: string; // ISO string
  totalTables: number;
  status: 'active' | 'closed';
}

export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Reservation {
  id: string;
  eventId: string; // Link to Event
  clientId: string;
  tableId: string;
  date: string; // ISO string
  status: ReservationStatus;
  createdBy: string; // User ID (Promoter)
  approvedBy?: string; // User ID (Approver)
  qrCode?: string; // Content of the QR code
  createdAt: string;
}

export interface DbSchema {
  users: User[];
  tables: Table[];
  clients: Client[];
  reservations: Reservation[];
  events: Event[];
}
