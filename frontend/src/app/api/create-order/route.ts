import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { auth } from '@clerk/nextjs/server';
import { env } from '@/core/config/env';
import { apiError } from '@/core/api/api-response';
import { products } from '@/lib/data';
import { checkRateLimit, getClientIp, SecurityRateLimits } from '@/lib/rate-limiter';
import { logSecurityEvent } from '@/lib/security-logger';

export const runtime = 'nodejs';

const CATALOG = new Map(products.map((p) => [p.id, p]));

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // 1. Rate limiting: max 10 order creation attempts per minute
  const rateLimit = checkRateLimit(`order-create:${ip}`, SecurityRateLimits.ORDER_CREATION);
  if (!rateLimit.allowed) {
    logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      ip,
      path: '/api/create-order',
    });
    return apiError('Too many order requests. Please wait a moment before trying again.', 429, 'RATE_LIMIT_EXCEEDED');
  }

  try {
    // 2. Authentication enforcement: order creation requires authenticated patron
    const { userId } = await auth();
    if (!userId) {
      logSecurityEvent({
        type: 'AUTH_UNAUTHORIZED_ACCESS',
        ip,
        path: '/api/create-order',
        details: { reason: 'Anonymous checkout attempt' },
      });
      return apiError('Authentication required to create a purchase order', 401, 'UNAUTHORIZED');
    }

    const keyId = env.razorpay.keyId;
    const keySecret = env.razorpay.keySecret;

    if (!keyId || !keySecret) {
      return apiError('Razorpay API keys are not configured', 500, 'PAYMENT_CONFIG_MISSING');
    }

    const body = await req.json().catch(() => ({}));
    let { amount, currency = 'INR', receipt, items, shippingOption = 'standard' } = body || {};

    let verifiedAmountPaise = 0;

    // 3. Server-side price verification
    if (Array.isArray(items) && items.length > 0) {
      let subtotal = 0;
      for (const item of items) {
        if (!item || typeof item.productId !== 'string' || typeof item.quantity !== 'number') {
          return apiError('Invalid cart item structure', 400, 'INVALID_CART_ITEM');
        }
        const qty = Math.floor(item.quantity);
        if (qty < 1 || qty > 99) {
          return apiError('Invalid item quantity', 400, 'INVALID_QUANTITY');
        }
        const catalogProduct = CATALOG.get(item.productId);
        if (!catalogProduct) {
          return apiError(`Product "${item.productId}" not found in catalog`, 400, 'PRODUCT_NOT_FOUND');
        }
        subtotal += catalogProduct.price * qty;
      }

      const shippingFee = shippingOption === 'express' ? 149 : 0;
      const tax = Math.round(subtotal * 0.18 * 100) / 100;
      const totalRupees = subtotal + shippingFee + tax;
      verifiedAmountPaise = Math.round(totalRupees * 100);

      // If client supplied an amount, verify it matches server calculation (tampering prevention)
      if (typeof amount === 'number' && Math.abs(amount - verifiedAmountPaise) > 100) {
        logSecurityEvent({
          type: 'PAYMENT_PRICE_TAMPERING_ATTEMPT',
          userId,
          ip,
          path: '/api/create-order',
          details: { clientAmount: amount, verifiedAmountPaise },
        });
        return apiError('Calculated order total does not match catalog pricing. Tampering detected.', 400, 'PRICE_TAMPERING');
      }
    } else if (typeof amount === 'number' && !isNaN(amount) && amount >= 100) {
      // Direct amount pass-through validated against minimum threshold
      verifiedAmountPaise = Math.round(amount);
    } else {
      return apiError('Invalid or missing amount and cart items', 400, 'INVALID_AMOUNT');
    }

    if (!receipt) {
      receipt = `rcpt_${userId.slice(-6)}_${Date.now()}`;
    }

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await instance.orders.create({
      amount: verifiedAmountPaise,
      currency: currency.toUpperCase(),
      receipt,
      notes: {
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error: unknown) {
    console.error('[Create Order Error]:', error);
    const message = error instanceof Error ? error.message : 'Razorpay API error';
    return apiError('Failed to create order', 500, 'ORDER_CREATION_FAILED', { details: message });
  }
}
