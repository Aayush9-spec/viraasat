import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiError, handleApiError } from '@/core/api/api-response';
import { supabase } from '@/services/supabase';
import { checkRateLimit, getClientIp, SecurityRateLimits } from '@/lib/rate-limiter';
import { logSecurityEvent } from '@/lib/security-logger';

// GET - list all users from Supabase (restricted to verified admins)
export async function GET(request: Request) {
  const ip = getClientIp(request);
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      logSecurityEvent({
        type: 'AUTH_UNAUTHORIZED_ACCESS',
        ip,
        path: '/api/users',
        details: { action: 'unauthenticated list users' },
      });
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const role = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role;
    if (role !== 'admin') {
      // Non-admins can only retrieve their own record (preventing BOLA while eliminating 403 errors for authenticated users)
      const userEmail = (sessionClaims as any)?.email || (sessionClaims?.metadata as any)?.email;
      if (userEmail) {
        const { data: selfUser } = await supabase
          .from('users')
          .select('id, email, name:display_name, role')
          .eq('email', userEmail.toLowerCase())
          .maybeSingle();

        if (selfUser) {
          return NextResponse.json([selfUser]);
        }
      }

      return NextResponse.json([
        {
          id: userId,
          email: userEmail || '',
          name: (sessionClaims as any)?.name || 'Patron',
          role: role || 'user',
        },
      ]);
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
