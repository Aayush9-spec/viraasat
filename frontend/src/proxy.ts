import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Env-only configuration. No hardcoded keys — set them in your deployment.
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

const withAuth = publishableKey && secretKey ? clerkMiddleware() : null;

if (!withAuth) {
  console.warn(
    '[Viraasat] Clerk keys are not configured. Auth middleware is disabled; ' +
      'sign-in/sign-up and Clerk-protected features are unavailable for this deployment.',
  );
}

export default function middleware(request: NextRequest) {
  if (!withAuth) return NextResponse.next();
  return withAuth(request, {} as Parameters<typeof withAuth>[1]);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
};
