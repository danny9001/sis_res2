'use server';

import { cookies } from 'next/headers';
import { db } from './db';
import { User } from '@/types';

const COOKIE_NAME = 'disco_session';

export async function login(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const user = await db.users.findByUsername(username);

  if (user && user.password === password) {
    // In a real app, use a signed JWT or session ID
    (await cookies()).set(COOKIE_NAME, user.id, { httpOnly: true, path: '/' });
    return { success: true, user };
  }

  return { success: false, error: 'Invalid credentials' };
}

export async function logout() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(COOKIE_NAME)?.value;

  if (!userId) return null;

  const user = await db.users.findById(userId);
  return user || null;
}
