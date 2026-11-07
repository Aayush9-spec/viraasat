import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { auth } from '@clerk/nextjs/server';
import { checkRateLimit, getClientIp, SecurityRateLimits } from '@/lib/rate-limiter';
import { logSecurityEvent } from '@/lib/security-logger';
import { validateImageMagicBytes } from '@/lib/validation/image-signature';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB maximum

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // 1. Rate limiting on file uploads
  const rateLimit = checkRateLimit(`upload:${ip}`, SecurityRateLimits.FILE_UPLOAD);
  if (!rateLimit.allowed) {
    logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      ip,
      path: '/api/upload',
    });
    return NextResponse.json(
      { error: 'Too many upload requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  try {
    // 2. Authentication check: only authenticated patrons or artisans may upload files
    const { userId } = await auth();
    if (!userId) {
      logSecurityEvent({
        type: 'AUTH_UNAUTHORIZED_ACCESS',
        ip,
        path: '/api/upload',
        details: { action: 'unauthenticated upload' },
      });
      return NextResponse.json({ error: 'Authentication required to upload media' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded or invalid file field' }, { status: 400 });
    }

    // 3. File size check
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds maximum allowed size of 5MB' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Magic bytes validation (verifies real file signature, not trusting client extension)
    const { valid, format } = validateImageMagicBytes(buffer);
    if (!valid) {
      logSecurityEvent({
        type: 'MALICIOUS_FILE_UPLOAD_BLOCKED',
        userId,
        ip,
        path: '/api/upload',
        details: { fileSize: file.size, detectedHeaderHex: buffer.subarray(0, 8).toString('hex') },
      });
      return NextResponse.json(
        { error: 'Invalid or prohibited file type. Only genuine PNG, JPEG, and WebP images are permitted.' },
        { status: 400 }
      );
    }

    // 5. Generate collision-resistant cryptographically randomized filename
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/png' ? 'png' : 'webp';
    const randomName = `${crypto.randomUUID()}.${ext}`;

    // Return sanitized data URI or path
    const base64 = buffer.toString('base64');
    const secureDataUri = `data:${format};base64,${base64}`;

    return NextResponse.json({
      success: true,
      filename: randomName,
      mimeType: format,
      size: file.size,
      url: secureDataUri,
    });
  } catch (err) {
    console.error('[Upload Error]:', err);
    return NextResponse.json({ error: 'Failed to process file upload safely' }, { status: 500 });
  }
}
