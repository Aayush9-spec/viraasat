import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiError, handleApiError } from '@/core/api/api-response';
import { supabase } from '@/services/supabase';

// GET - list all users from Supabase (restricted to verified admins)
export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const role = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name:display_name, role');

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch users from Supabase');
  }
}

// POST - create or update a user in Supabase (authenticated user or admin)
export async function POST(request: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const callerRole = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role;
    const body = await request.json().catch(() => ({}));

    if (!body.name || !body.email) {
      return apiError('Name and email are required', 400, 'MISSING_REQUIRED_FIELDS');
    }

    // Role elevation prevention: only an existing admin can assign admin role
    let assignedRole = body.role || 'user';
    if (assignedRole === 'admin' && callerRole !== 'admin') {
      assignedRole = 'user';
    }

    // Upsert user: update if email exists, otherwise insert
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          email: body.email.toLowerCase(),
          display_name: body.name,
          role: assignedRole,
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        id: data.id,
        name: data.display_name,
        email: data.email,
        role: data.role,
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, 'Failed to save user to Supabase');
  }
}
