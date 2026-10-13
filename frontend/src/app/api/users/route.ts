import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { apiError, apiSuccess, handleApiError } from '@/lib/api-response';

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
    console.warn('[Users API] Could not write database/users.json (read-only environment):', err);
    return false;
  }
}

// GET - list all users
export function GET() {
  try {
    const users = readUsers();
    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch users');
  }
}

// POST - create a new user
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const users = readUsers();

    if (!body.name || !body.email) {
      return apiError('Name and email are required', 400, 'MISSING_REQUIRED_FIELDS');
    }

    const maxId =
      users.length > 0
        ? Math.max(
          ...users.map((u) => {
            const num = Number(u.id?.split('-')[1]);
            return isNaN(num) ? 0 : num;
          })
        )
        : 0;

    const newId = `user-${maxId + 1}`;

    const newUser: UserRecord = {
      id: newId,
      name: body.name,
      email: body.email,
      role: body.role || 'user',
      profile: body.profile || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Failed to save user');
  }
}