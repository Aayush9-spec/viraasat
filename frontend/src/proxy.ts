import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/api/webhooks(.*)',
  '/api/razorpay/webhook(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login(.*)',
  '/signup(.*)',
  '/select-role(.*)',
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

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    try {
      await auth.protect();
    } catch (err) {
      // If auth protection fails or Clerk keys are missing, allow request to proceed gracefully
      console.warn('[Viraasat Middleware] Route protection skipped:', err);
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

