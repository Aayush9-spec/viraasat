import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiSuccess, apiError, handleApiError } from '@/core/api/api-response';
import { checkRateLimit, getClientIp, SecurityRateLimits } from '@/lib/rate-limiter';
import { logSecurityEvent } from '@/lib/security-logger';
import fs from 'fs';
import path from 'path';

function getFilePath(): string {
  return path.join(process.cwd(), 'database', 'newsletter.json');
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limiting to prevent subscriber flooding
  const rateLimit = checkRateLimit(`newsletter:${ip}`, SecurityRateLimits.GENERAL_FORM);
  if (!rateLimit.allowed) {
    return apiError('Too many subscription attempts. Please wait a moment.', 429, 'RATE_LIMIT_EXCEEDED');
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 150) {
      return apiError('Valid email address is required', 400, 'INVALID_EMAIL');
    }

    const filePath = getFilePath();
    let subscribers: any[] = [];
    try {
      if (fs.existsSync(filePath)) {
        subscribers = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch {
      subscribers = [];
    }

    const alreadySubscribed = subscribers.some((s) => s.email === email);
    if (!alreadySubscribed) {
      subscribers.unshift({
        id: `sub_${Date.now()}`,
        email,
        subscribedAt: new Date().toISOString(),
        discountCodeSent: 'VIRAASAT1500',
      });
      try {
        fs.writeFileSync(filePath, JSON.stringify(subscribers, null, 2), 'utf8');
      } catch (err) {
        console.warn('Could not write newsletter.json:', err);
      }
    }

    return apiSuccess({
      success: true,
      message: 'Welcome to The Viraasat Circle. Your ₹1,500 inaugural credit has been issued.',
      email,
    });
  } catch (err) {
    return handleApiError(err, 'Failed to subscribe to newsletter');
  }
}

// GET - view subscribers (restricted strictly to admins)
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      logSecurityEvent({
        type: 'AUTH_UNAUTHORIZED_ACCESS',
        ip,
        path: '/api/newsletter',
        details: { action: 'unauthorized read of subscriber list' },
      });
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
    }

    const role = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role;
    if (role !== 'admin') {
      logSecurityEvent({
        type: 'RBAC_PRIVILEGE_VIOLATION',
        userId,
        ip,
        path: '/api/newsletter',
        details: { role, action: 'attempted to read newsletter subscriber PII' },
      });
      return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
    }

    const filePath = getFilePath();
    let subscribers = [];
    if (fs.existsSync(filePath)) {
      subscribers = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return apiSuccess({ subscribers, count: subscribers.length });
  } catch (err) {
    return handleApiError(err, 'Failed to fetch subscribers');
  }
}
