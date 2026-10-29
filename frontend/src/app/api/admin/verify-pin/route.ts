import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { pin } = await req.json().catch(() => ({}));
    const expectedPin = process.env.ADMIN_PIN || process.env.NEXT_PUBLIC_ADMIN_PIN || 'Viraasat@Admin2026';

    if (!pin || String(pin).trim() !== expectedPin) {
      return NextResponse.json(
        { valid: false, error: 'Invalid Administrator Security Passcode. Access denied.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Internal verification error.' },
      { status: 500 }
    );
  }
}
