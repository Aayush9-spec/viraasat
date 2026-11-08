import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Security headers applied across all responses
function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.virrasat.in https://*.virrasat.in https://clerk.virasat.in https://*.virasat.in https://checkout.razorpay.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.virrasat.in https://*.virrasat.in https://clerk.virasat.in https://*.virasat.in https://cdn.jsdelivr.net https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://checkout.razorpay.com https://generativelanguage.googleapis.com https://*.onrender.com https://viraasat-backend-f0c1.onrender.com",
    "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.virrasat.in https://*.virrasat.in https://clerk.virasat.in https://*.virasat.in https://checkout.razorpay.com https://api.razorpay.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.razorpay.com",
  ].join('; ');

  res.headers.set('Content-Security-Policy', cspHeader);
  return res;
}

// Strictly define public routes. Sensitive dashboards, orders, artisan hubs,
// and mutative APIs are protected by Clerk server-side middleware.
const isPublicRoute = createRouteMatcher([
  '/',
  '/shop(.*)',
  '/product(.*)',
  '/products(.*)',
  '/category(.*)',
  '/artisans(.*)',
  '/auctions(.*)',
  '/psit(.*)',
  '/about(.*)',
  '/contact(.*)',
  '/journal(.*)',
  '/faq(.*)',
  '/shipping(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/refund(.*)',
  '/download(.*)',
  '/offline(.*)',
  '/manifest(.*)',
  '/favicon(.*)',
  '/icons(.*)',
  '/pwa-test(.*)',
  // Auth flow endpoints
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login(.*)',
  '/signup(.*)',
  '/select-role(.*)',
  '/sso-callback(.*)',
  // Public APIs
  '/api/chat(.*)',
  '/api/recommendations(.*)',
  '/api/newsletter(.*)',
  '/api/apply(.*)',
  '/api/razorpay/webhook(.*)',
  '/api/admin/verify-pin(.*)',
  '/api/ai(.*)',
]);

// Determine if valid Clerk keys exist in the environment
const hasClerkKeys = Boolean(
  (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY) &&
  (process.env.CLERK_SECRET_KEY)
);

let clerkHandler: any = null;
if (hasClerkKeys) {
  try {
    clerkHandler = clerkMiddleware(async (auth, req) => {
      // Allow GET requests on public product/artisan listings without blocking
      const pathname = req.nextUrl.pathname;
      const isPublicGetApi =
        req.method === 'GET' &&
        (pathname.startsWith('/api/products') ||
          pathname.startsWith('/api/artisans') ||
          pathname.startsWith('/api/reviews'));

      if (!isPublicRoute(req) && !isPublicGetApi) {
        try {
          await auth.protect();
        } catch (err: any) {
          if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
            throw err;
          }
          console.warn('[Viraasat Middleware] Access restricted by auth.protect():', pathname);
          // Return 401 JSON for unauthorized API calls
          if (pathname.startsWith('/api/')) {
            return applySecurityHeaders(
              NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 })
            );
          }
          throw err;
        }
      }
    });
  } catch (e) {
    console.warn('[Viraasat Middleware] Failed to initialize clerkMiddleware:', e);
  }
}

export default async function middleware(req: NextRequest, event: any) {
  if (!clerkHandler) {
    const res = NextResponse.next();
    return applySecurityHeaders(res);
  }

  try {
    const response = await clerkHandler(req, event);
    if (response instanceof NextResponse) {
      return applySecurityHeaders(response);
    }
    const res = NextResponse.next();
    return applySecurityHeaders(res);
  } catch (err) {
    console.warn('[Viraasat Middleware] Auth middleware handled redirect/error:', err);
    throw err;
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
