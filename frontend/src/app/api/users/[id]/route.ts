import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { auth } from '@clerk/nextjs/server';
import { apiError, handleApiError } from '@/core/api/api-response';

const usersFilePath = path.join(process.cwd(), '..', 'database', 'users.json');

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role?: string;
  profile?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

function readUsers(): UserRecord[] {
  try {
    if (fs.existsSync(usersFilePath)) {
      const data = fs.readFileSync(usersFilePath, 'utf-8');
      return JSON.parse(data) as UserRecord[];
    }
  } catch (err) {
    console.warn('[Users API] Could not read database/users.json:', err);
  }
  return [];
}

function writeUsers(users: UserRecord[]): boolean {
  try {
    const dir = path.dirname(usersFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    return true;
  } catch (err) {
    console.warn('[Users API] Could not write database/users.json:', err);
    return false;
  }
}

// GET - fetch a single user by id (owner or admin only)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const role = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role;

    if (userId !== id && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Cannot access another user profile' }, { status: 403 });
    }

    const users = readUsers();
    const user = users.find((u) => u.id === id);
    if (!user) {
      return apiError('User not found', 404, 'NOT_FOUND');
    }
    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch user');
  }
}

// PATCH - update a user (owner or admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const role = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role;

    if (userId !== id && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Cannot modify another user profile' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const users = readUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return apiError('User not found', 404, 'NOT_FOUND');
    }

    // Role elevation prevention: cannot self-assign admin role
    if (body.role === 'admin' && role !== 'admin') {
      delete body.role;
    }

    users[index] = { ...users[index], ...body, updatedAt: new Date().toISOString() };
    writeUsers(users);
    return NextResponse.json(users[index]);
  } catch (error) {
    return handleApiError(error, 'Failed to update user');
  }
}

// DELETE - remove a user (admin only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const role = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required to delete accounts' }, { status: 403 });
    }

    const { id } = await params;
    const users = readUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return apiError('User not found', 404, 'NOT_FOUND');
    }
    const [deleted] = users.splice(index, 1);
    writeUsers(users);
    return NextResponse.json({ success: true, user: deleted });
  } catch (error) {
    return handleApiError(error, 'Failed to delete user');
  }
}
