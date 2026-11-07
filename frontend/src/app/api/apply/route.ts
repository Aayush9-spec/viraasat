import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/services/supabase';
import { apiSuccess, apiError, handleApiError } from '@/core/api/api-response';
import { checkRateLimit, getClientIp, SecurityRateLimits } from '@/lib/rate-limiter';
import { logSecurityEvent } from '@/lib/security-logger';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limiting to prevent application submission spam / bot flooding
  const rateLimit = checkRateLimit(`artisan-apply:${ip}`, SecurityRateLimits.GENERAL_FORM);
  if (!rateLimit.allowed) {
    logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      ip,
      path: '/api/apply',
    });
    return apiError('Too many application attempts. Please wait before submitting again.', 429, 'RATE_LIMIT_EXCEEDED');
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { fullName, workshopName, email, phone, pincode, state, craft } = body;

    if (!fullName || !email) {
      return apiError('Full name and email are required', 400, 'MISSING_REQUIRED_FIELDS');
    }

    const emailStr = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      return apiError('Invalid email format', 400, 'INVALID_EMAIL');
    }

    const applicationRecord = {
      applicant_id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      full_name: String(fullName).trim().substring(0, 100),
      workshop_name: String(workshopName || `${fullName} Atelier`).trim().substring(0, 150),
      email: emailStr,
      phone: String(phone || '').trim().substring(0, 20),
      pincode: String(pincode || '000000').trim().substring(0, 10),
      state: String(state || 'India').trim().substring(0, 100),
      craft: String(craft || 'Traditional Handicrafts').trim().substring(0, 100),
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('artisan_applications')
      .insert([applicationRecord])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error in artisan_applications:', error);
      throw error;
    }

    return apiSuccess({
      success: true,
      message: 'Application submitted successfully to Viraasat Artisan Guild.',
      application: data,
    });
  } catch (err) {
    return handleApiError(err, 'Failed to submit artisan application');
  }
}

// GET - view artisan applications (strictly restricted to administrators)
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      logSecurityEvent({
        type: 'AUTH_UNAUTHORIZED_ACCESS',
        ip,
        path: '/api/apply',
        details: { action: 'unauthorized read of artisan applications' },
      });
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    const role = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role;
    if (role !== 'admin') {
      logSecurityEvent({
        type: 'RBAC_PRIVILEGE_VIOLATION',
        userId,
        ip,
        path: '/api/apply',
        details: { role, action: 'attempted to read artisan applicant PII' },
      });
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('artisan_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return apiSuccess({ applications: data || [], total: data ? data.length : 0 });
  } catch (err) {
    return handleApiError(err, 'Failed to fetch applications');
  }
}
