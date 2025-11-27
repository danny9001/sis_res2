'use server';

import { db, saveDb, getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Reservation, Table, Client, User, Event } from '@/types';

export async function createEvent(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') throw new Error('Unauthorized');

  const name = formData.get('name') as string;
  const date = formData.get('date') as string;
  const totalTables = parseInt(formData.get('totalTables') as string);

  const newEvent: Event = {
    id: Math.random().toString(36).substring(7),
    name,
    date,
    totalTables,
    status: 'active'
  };

  const currentDb = await getDb();
  await saveDb({ ...currentDb, events: [...currentDb.events, newEvent] });

  revalidatePath('/events');
  redirect('/events');
}

export async function createTable(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !['admin', 'promoter'].includes(user.role)) throw new Error('Unauthorized');

  const name = formData.get('name') as string;
  const capacity = parseInt(formData.get('capacity') as string);
  const location = formData.get('location') as string;

  const newTable: Table = {
    id: Math.random().toString(36).substring(7),
    name,
    capacity,
    location,
    status: 'available'
  };

  const tables = await db.tables.getAll();
  tables.push(newTable);
  const currentDb = await getDb();
  await saveDb({ ...currentDb, tables: [...currentDb.tables, newTable] });

  revalidatePath('/tables');
  redirect('/tables');
}

export async function createClient(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !['admin', 'promoter'].includes(user.role)) throw new Error('Unauthorized');

  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const isVip = formData.get('isVip') === 'on';

  const newClient: Client = {
    id: Math.random().toString(36).substring(7),
    name,
    phone,
    isVip
  };

  const clients = await db.clients.getAll();
  const currentDb = await getDb();
  await saveDb({ ...currentDb, clients: [...currentDb.clients, newClient] });

  revalidatePath('/clients');
  redirect('/clients');
}

export async function createUser(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') throw new Error('Unauthorized');

  const name = formData.get('name') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as any;

  const newUser: User = {
    id: Math.random().toString(36).substring(7),
    name,
    username,
    password,
    role
  };

  const currentDb = await getDb();
  await saveDb({ ...currentDb, users: [...currentDb.users, newUser] });

  revalidatePath('/users');
  redirect('/users');
}

export async function createReservation(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const eventId = formData.get('eventId') as string;
  const clientId = formData.get('clientId') as string;
  const tableId = formData.get('tableId') as string;
  // Date is now derived from Event, but we might keep it for specific time if needed.
  // For now, let's assume reservation date = event date.
  
  const event = (await db.events.getAll()).find(e => e.id === eventId);
  if (!event) throw new Error('Event not found');

  const newReservation: Reservation = {
    id: Math.random().toString(36).substring(7),
    eventId,
    clientId,
    tableId,
    date: event.date, // Use event date
    status: 'pending',
    createdBy: user.id,
    createdAt: new Date().toISOString(),
  };

  await db.reservations.create(newReservation);
  revalidatePath('/reservations');
  revalidatePath('/dashboard');
  redirect('/reservations');
}

export async function approveReservation(id: string) {
  const user = await getCurrentUser();
  if (!user || !['admin', 'approver'].includes(user.role)) {
    throw new Error('Unauthorized');
  }

  const reservation = (await db.reservations.getAll()).find(r => r.id === id);
  if (!reservation) throw new Error('Reservation not found');

  // Generate QR Code content (simple JSON string for now)
  const qrContent = JSON.stringify({
    id: reservation.id,
    client: reservation.clientId,
    table: reservation.tableId,
    date: reservation.date,
    valid: true
  });

  await db.reservations.update({
    ...reservation,
    status: 'approved',
    approvedBy: user.id,
    qrCode: qrContent
  });

  revalidatePath(`/reservations/${id}`);
  revalidatePath('/reservations');
  revalidatePath('/dashboard');
}

export async function rejectReservation(id: string) {
  const user = await getCurrentUser();
  if (!user || !['admin', 'approver'].includes(user.role)) {
    throw new Error('Unauthorized');
  }

  const reservation = (await db.reservations.getAll()).find(r => r.id === id);
  if (!reservation) throw new Error('Reservation not found');

  await db.reservations.update({
    ...reservation,
    status: 'rejected',
    approvedBy: user.id
  });

  revalidatePath(`/reservations/${id}`);
  revalidatePath('/reservations');
  revalidatePath('/dashboard');
}

export async function changeReservationTable(reservationId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !['admin', 'promoter'].includes(user.role)) {
    throw new Error('Unauthorized');
  }

  const newTableId = formData.get('tableId') as string;
  const reservation = (await db.reservations.getAll()).find(r => r.id === reservationId);
  if (!reservation) throw new Error('Reservation not found');

  await db.reservations.update({
    ...reservation,
    tableId: newTableId
  });

  revalidatePath(`/reservations/${reservationId}`);
  revalidatePath('/reservations');
}

export async function changeReservationClient(reservationId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !['admin', 'promoter'].includes(user.role)) {
    throw new Error('Unauthorized');
  }

  const newClientId = formData.get('clientId') as string;
  const reservation = (await db.reservations.getAll()).find(r => r.id === reservationId);
  if (!reservation) throw new Error('Reservation not found');

  await db.reservations.update({
    ...reservation,
    clientId: newClientId
  });

  revalidatePath(`/reservations/${reservationId}`);
  revalidatePath('/reservations');
}
