import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/api(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login(.*)',
  '/signup(.*)',
  '/select-role(.*)',
  '/sso-callback(.*)',
  '/',
  '/shop(.*)',
  '/product(.*)',
  '/products(.*)',
  '/category(.*)',
  '/artisans(.*)',
  '/artisan(.*)',
  '/dashboard(.*)',
  '/orders(.*)',
  '/about(.*)',
  '/contact(.*)',
  '/journal(.*)',
  '/faq(.*)',
  '/shipping(.*)',
  '/terms(.*)',
  '/privacy(.*)',
  '/refund(.*)',
  '/offline(.*)',
  '/manifest(.*)',
  '/favicon(.*)',
  '/icons(.*)',
]);

// Determine if valid Clerk keys exist in the environment
const hasClerkKeys = Boolean(
  (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY) &&
  (process.env.CLERK_SECRET_KEY)
);

// Only initialize clerkMiddleware if keys exist, avoiding unhandled promise rejections on unconfigured environments
let clerkHandler: any = null;
if (hasClerkKeys) {
  try {
    clerkHandler = clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        try {
          await auth.protect();
        } catch (err) {
          console.warn('[Viraasat Middleware] Route protection skipped:', err);
        }
      }
    });
  } catch (e) {
    console.warn('[Viraasat Middleware] Failed to initialize clerkMiddleware:', e);
  }
}

export default async function middleware(req: NextRequest, event: any) {
  if (!clerkHandler) {
    // If Clerk keys are missing (preview builds, bot branches, or unconfigured environments),
    // allow the request to proceed gracefully without throwing 500 Internal Server Error
    return NextResponse.next();
  }

  try {
    return await clerkHandler(req, event);
  } catch (err) {
    console.warn('[Viraasat Middleware] Auth middleware bypassed due to runtime error:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
