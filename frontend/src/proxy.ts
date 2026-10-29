import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse, NextFetchEvent } from 'next/server';
const protectedPage = createRouteMatcher(['/admin(.*)', '/artisan(.*)', '/dashboard(.*)', '/orders(.*)', '/checkout(.*)', '/order-confirmation(.*)', '/select-role(.*)']);
const protectedApi = createRouteMatcher(['/api/users(.*)', '/api/orders(.*)', '/api/create-order', '/api/verify-payment', '/api/razorpay']);
const handler = clerkMiddleware(async (auth, req) => {
  if (protectedPage(req) || protectedApi(req) || (req.nextUrl.pathname === '/api/products' && req.method !== 'GET')) {
    const { userId } = await auth.protect();
    if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/artisan/')) {
      const user = await (await clerkClient()).users.getUser(userId);
      const role = user.publicMetadata?.role;
      const permitted = req.nextUrl.pathname.startsWith('/admin') ? role === 'admin' : role === 'admin' || role === 'artisan';
      if (!permitted) return NextResponse.json({ error: 'Insufficient permission' }, { status: 403 });
    }
  }
});
export default function proxy(req: NextRequest, event: NextFetchEvent) {
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    if (protectedPage(req) || protectedApi(req) || (req.nextUrl.pathname === '/api/products' && req.method !== 'GET')) {
      return NextResponse.json({ error: 'Authentication is temporarily unavailable' }, { status: 503 });
    }
    return NextResponse.next();
  }
  return handler(req, event);
}
export const config = { matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'] };
