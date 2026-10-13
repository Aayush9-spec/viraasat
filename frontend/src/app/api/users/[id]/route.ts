import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { apiError, handleApiError } from '@/lib/api-response';

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

// GET - fetch a single user by id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

// PATCH - update a user
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const users = readUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return apiError('User not found', 404, 'NOT_FOUND');
    }
    users[index] = { ...users[index], ...body, updatedAt: new Date().toISOString() };
    writeUsers(users);
    return NextResponse.json(users[index]);
  } catch (error) {
    return handleApiError(error, 'Failed to update user');
  }
}

// DELETE - remove a user
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
