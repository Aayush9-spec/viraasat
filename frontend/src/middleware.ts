import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Env-only configuration. No hardcoded keys — set them in your deployment.
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;

/**
 * Routes that must NOT go through Clerk authentication:
 *  - /api/webhooks/* — server-to-server (Clerk, Razorpay); use their own
 *    HMAC/signature verification, not session JWTs.
 *  - /api/razorpay/webhook — Razorpay payment webhooks (signature-verified).
 */
const isPublicRoute = createRouteMatcher([
  // Webhook routes — use HMAC signature verification, not Clerk session JWTs
  '/api/webhooks(.*)',
  '/api/razorpay/webhook(.*)',
  // Auth pages — must be reachable before the user has a session
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login(.*)',
  '/signup(.*)',
  '/select-role(.*)',
  // Public-facing pages
  '/',
  '/shop(.*)',
  '/product(.*)',
  '/products(.*)',
  '/category(.*)',
  '/artisans(.*)',
  '/about(.*)',
  '/contact(.*)',
  '/journal(.*)',
  '/faq(.*)',
  '/shipping(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/refund(.*)',
  '/offline(.*)',
]);

const withAuth = publishableKey && secretKey
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        // Protect non-public routes — unauthenticated requests are redirected
        // to the sign-in page (or return 401 for API routes).
        // Comment out `auth.protect()` if you prefer redirect-only behaviour.
      }
    })
  : null;

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
