import { NextResponse } from 'next/server';
import { apiError, apiSuccess, handleApiError } from '@/core/api/api-response';
import { supabase } from '@/services/supabase';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role?: string;
  profile?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

// GET - list all users from Supabase
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, display_name as name, role');

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    return handleApiError(error, 'Failed to fetch users from Supabase');
  }
}

// POST - create or update a user in Supabase
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    if (!body.name || !body.email) {
      return apiError('Name and email are required', 400, 'MISSING_REQUIRED_FIELDS');
    }

    // Upsert user: update if email exists, otherwise insert
    const { data, error } = await supabase
      .from('users')
      .upsert(
        { 
          email: body.email.toLowerCase(), 
          display_name: body.name, 
          role: body.role || 'user' 
        }, 
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: data.id,
      name: data.display_name,
      email: data.email,
      role: data.role,
    }, { status: 200 });
  } catch (error) {
    return handleApiError(error, 'Failed to save user to Supabase');
  }
}