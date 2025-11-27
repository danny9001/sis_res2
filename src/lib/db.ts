import fs from 'fs/promises';
import path from 'path';
import { DbSchema, User, Table, Client, Reservation } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const SEED_DATA: DbSchema = {
  users: [
    { id: '1', name: 'Admin User', username: 'admin', password: '123', role: 'admin' },
    { id: '2', name: 'Promoter User', username: 'promo', password: '123', role: 'promoter' },
    { id: '3', name: 'Approver User', username: 'approve', password: '123', role: 'approver' },
  ],
  tables: [
    { id: '1', name: 'Mesa 1', capacity: 4, status: 'available', location: 'Main Floor' },
    { id: '2', name: 'Mesa 2', capacity: 4, status: 'available', location: 'Main Floor' },
    { id: '3', name: 'VIP 1', capacity: 8, status: 'available', location: 'VIP Area' },
  ],
  clients: [
    { id: '1', name: 'Juan Perez', phone: '555-0101', isVip: false },
    { id: '2', name: 'Maria Garcia', phone: '555-0102', isVip: true },
  ],
  reservations: [],
  events: [],
};

async function ensureDb() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(SEED_DATA, null, 2));
  }
}

export async function getDb(): Promise<DbSchema> {
  await ensureDb();
  const data = await fs.readFile(DB_FILE, 'utf-8');
  return JSON.parse(data);
}

export async function saveDb(data: DbSchema) {
  await ensureDb();
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// Helpers
export const db = {
  users: {
    getAll: async () => (await getDb()).users,
    findById: async (id: string) => (await getDb()).users.find((u) => u.id === id),
    findByUsername: async (username: string) => (await getDb()).users.find((u) => u.username === username),
  },
  tables: {
    getAll: async () => (await getDb()).tables,
    update: async (table: Table) => {
      const data = await getDb();
      const index = data.tables.findIndex((t) => t.id === table.id);
      if (index !== -1) {
        data.tables[index] = table;
        await saveDb(data);
      }
    },
  },
  clients: {
    getAll: async () => (await getDb()).clients,
    create: async (client: Client) => {
      const data = await getDb();
      data.clients.push(client);
      await saveDb(data);
    },
  },
  reservations: {
    getAll: async () => (await getDb()).reservations,
    create: async (reservation: Reservation) => {
      const data = await getDb();
      data.reservations.push(reservation);
      await saveDb(data);
    },
    update: async (reservation: Reservation) => {
      const data = await getDb();
      const index = data.reservations.findIndex((r) => r.id === reservation.id);
      if (index !== -1) {
        data.reservations[index] = reservation;
        await saveDb(data);
      }
    },
  },
  events: {
    getAll: async () => (await getDb()).events,
    create: async (event: any) => {
      const data = await getDb();
      data.events.push(event);
      await saveDb(data);
    },
    update: async (event: any) => {
      const data = await getDb();
      const index = data.events.findIndex((e) => e.id === event.id);
      if (index !== -1) {
        data.events[index] = event;
        await saveDb(data);
      }
    },
  },
};
