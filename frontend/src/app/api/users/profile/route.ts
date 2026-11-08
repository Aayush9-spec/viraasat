import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/services/supabase';
import { validateName, validatePhoneNumber, sanitizeWhitespace } from '@/lib/validation/name-validation';
import { apiSuccess, handleApiError, apiError } from '@/core/api/api-response';
import { logSecurityEvent } from '@/lib/security-logger';
import { getClientIp } from '@/lib/rate-limiter';
import fs from 'node:fs';
import path from 'node:path';

const usersJsonPath = path.join(process.cwd(), '..', 'database', 'users.json');

function syncLocalJsonUser(id: string, email: string, name: string, profileMeta: Record<string, any>) {
  try {
    if (fs.existsSync(usersJsonPath)) {
      const content = fs.readFileSync(usersJsonPath, 'utf-8');
      const users = JSON.parse(content);
      const idx = users.findIndex((u: any) => u.id === id || u.email?.toLowerCase() === email.toLowerCase());
      const now = new Date().toISOString();

      if (idx >= 0) {
        users[idx] = {
          ...users[idx],
          name,
          updatedAt: now,
          profile: {
            ...(users[idx].profile || {}),
            ...profileMeta,
          },
        };
      } else {
        users.push({
          id,
          name,
          email,
          role: 'buyer',
          createdAt: now,
          updatedAt: now,
          profile: profileMeta,
        });
      }
      fs.writeFileSync(usersJsonPath, JSON.stringify(users, null, 2));
    }
  } catch (err) {
    console.warn('[Profile API] Local users.json sync skipped:', err);
  }
}

/**
 * GET /api/users/profile
 * Retrieves the authenticated customer's profile from Supabase and Clerk.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      logSecurityEvent({
        type: 'AUTH_UNAUTHORIZED_ACCESS',
        ip,
        path: '/api/users/profile',
        details: { action: 'unauthenticated read profile' },
      });
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    // Resolve user's primary email safely
    const clerkUser = await currentUser().catch(() => null);
    const email =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      (sessionClaims?.email as string) ||
      (sessionClaims?.primaryEmail as string) ||
      '';

    let dbProfile: any = null;
    if (email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (!error && data) {
        dbProfile = data;
      }
    }

    let parsedBioMeta: Record<string, any> = {};
    if (dbProfile?.bio) {
      try {
        parsedBioMeta = JSON.parse(dbProfile.bio);
      } catch {
        // Bio is plain text
      }
    }

    const clerkMeta = (clerkUser?.unsafeMetadata || {}) as Record<string, any>;

    const firstName = clerkUser?.firstName || dbProfile?.display_name?.split(' ')[0] || '';
    const lastName =
      clerkUser?.lastName ||
      (dbProfile?.display_name?.split(' ').slice(1).join(' ') || '');
    const phone = clerkMeta?.phone || parsedBioMeta?.phone || '';
    const state = clerkMeta?.state || dbProfile?.region || parsedBioMeta?.state || '';
    const city = clerkMeta?.city || parsedBioMeta?.city || '';
    const interests = Array.isArray(clerkMeta?.interests)
      ? clerkMeta.interests
      : Array.isArray(parsedBioMeta?.interests)
      ? parsedBioMeta.interests
      : [];

    return apiSuccess({
      profile: {
        userId,
        firstName,
        lastName,
        fullName: [firstName, lastName].filter(Boolean).join(' ') || dbProfile?.display_name || '',
        email,
        phone,
        state,
        city,
        interests,
        avatarUrl: clerkUser?.imageUrl || dbProfile?.avatar_url || '',
      },
    });
  } catch (err) {
    return handleApiError(err, 'Failed to fetch customer profile');
  }
}

/**
 * PATCH /api/users/profile
 * Validates and updates the authenticated customer's profile in Supabase and persistent store.
 */
export async function PATCH(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      logSecurityEvent({
        type: 'AUTH_UNAUTHORIZED_ACCESS',
        ip,
        path: '/api/users/profile',
        details: { action: 'unauthenticated update profile' },
      });
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // 1. Strict Name Validation (Preserving order, alphabetic English & Indic scripts)
    const firstNameValidation = validateName(body.firstName || '', 'First Name', true);
    if (!firstNameValidation.isValid) {
      return NextResponse.json(
        { error: firstNameValidation.error, field: 'firstName' },
        { status: 400 }
      );
    }

    const lastNameValidation = validateName(body.lastName || '', 'Last Name', false);
    if (!lastNameValidation.isValid) {
      return NextResponse.json(
        { error: lastNameValidation.error, field: 'lastName' },
        { status: 400 }
      );
    }

    // 2. Contact Phone Validation (Supporting +91 and international)
    const phoneValidation = validatePhoneNumber(body.phone || '', false);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { error: phoneValidation.error, field: 'phone' },
        { status: 400 }
      );
    }

    const cleanFirstName = firstNameValidation.value;
    const cleanLastName = lastNameValidation.value;
    const cleanFullName = [cleanFirstName, cleanLastName].filter(Boolean).join(' ');
    const cleanPhone = phoneValidation.value;
    const cleanState = sanitizeWhitespace(body.state || '');
    const cleanCity = sanitizeWhitespace(body.city || '');
    const cleanInterests = Array.isArray(body.interests)
      ? body.interests.map((it: any) => sanitizeWhitespace(String(it))).filter(Boolean)
      : [];

    // 3. Resolve user identity and verify email is managed by Clerk (read-only)
    const clerkUser = await currentUser().catch(() => null);
    const email =
      clerkUser?.primaryEmailAddress?.emailAddress ||
      (sessionClaims?.email as string) ||
      (sessionClaims?.primaryEmail as string) ||
      '';

    if (!email) {
      return apiError('Authenticated email could not be resolved', 400, 'MISSING_EMAIL');
    }

    const profileMeta = {
      phone: cleanPhone,
      interests: cleanInterests,
      city: cleanCity,
      state: cleanState,
      updatedAt: new Date().toISOString(),
    };

    // 4. Update Supabase users table without overwriting the authenticated email
    try {
      await supabase.from('users').upsert(
        {
          email: email.toLowerCase(),
          display_name: cleanFullName,
          region: cleanState || null,
          bio: JSON.stringify(profileMeta),
          role: 'buyer',
        },
        { onConflict: 'email' }
      );
    } catch (dbErr) {
      console.warn('[Profile API] Supabase profile upsert notice:', dbErr);
    }

    // 5. Sync to local database snapshot
    syncLocalJsonUser(userId, email, cleanFullName, profileMeta);

    return apiSuccess({
      message: 'Your profile has been updated successfully.',
      profile: {
        userId,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        fullName: cleanFullName,
        email,
        phone: cleanPhone,
        state: cleanState,
        city: cleanCity,
        interests: cleanInterests,
        avatarUrl: clerkUser?.imageUrl || '',
      },
    });
  } catch (err) {
    return handleApiError(err, 'Failed to update customer profile');
  }
}

