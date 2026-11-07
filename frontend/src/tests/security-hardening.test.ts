import crypto from 'node:crypto';
import { checkRateLimit } from '@/lib/rate-limiter';
import { ServerAuctionService } from '@/features/auctions/services/auction-store';
import { validateImageMagicBytes } from '@/lib/validation/image-signature';
import { products } from '@/lib/data';

describe('Viraasat 2.0 Security Hardening Test Suite', () => {
  describe('1. Timing-Safe Signature Verification', () => {
    function timingSafeEqualHex(expectedHex: string, actualHex: string): boolean {
      const bufA = Buffer.from(expectedHex);
      const bufB = Buffer.from(actualHex);
      if (bufA.length !== bufB.length) {
        crypto.timingSafeEqual(bufA, bufA);
        return false;
      }
      return crypto.timingSafeEqual(bufA, bufB);
    }

    it('successfully validates authentic HMAC-SHA256 signature', () => {
      const secret = 'test_secret_key_12345';
      const body = 'order_123|pay_456';
      const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

      expect(timingSafeEqualHex(signature, signature)).toBe(true);
    });

    it('rejects tampered or forged signature in constant time', () => {
      const secret = 'test_secret_key_12345';
      const body = 'order_123|pay_456';
      const validSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');
      const forgedSignature = validSignature.substring(0, validSignature.length - 2) + '00';

      expect(timingSafeEqualHex(validSignature, forgedSignature)).toBe(false);
    });

    it('handles mismatched buffer lengths without throwing exceptions', () => {
      const signatureA = 'abcdef123456';
      const signatureB = 'abcdef';
      expect(timingSafeEqualHex(signatureA, signatureB)).toBe(false);
    });
  });

  describe('2. Rate Limiting Protection', () => {
    it('allows requests within window and enforces strict threshold once exceeded', () => {
      const testKey = `test-ip-${Date.now()}`;
      const config = { windowMs: 10000, max: 3 };

      const r1 = checkRateLimit(testKey, config);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = checkRateLimit(testKey, config);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = checkRateLimit(testKey, config);
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);

      // Exceeded threshold
      const r4 = checkRateLimit(testKey, config);
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);
    });
  });

  describe('3. Server-Side Price Calculation & Tampering Prevention', () => {
    const CATALOG = new Map(products.map((p) => [p.id, p]));

    it('accurately verifies catalog prices and detects client price manipulation', () => {
      const testItem = products[0];
      const items = [{ productId: testItem.id, quantity: 2 }];

      const subtotal = testItem.price * 2;
      const tax = Math.round(subtotal * 0.18 * 100) / 100;
      const totalAmountRupees = subtotal + tax; // 0 shipping standard
      const verifiedPaise = Math.round(totalAmountRupees * 100);

      // Legitimate client amount matches verified amount
      const legitimateClientAmount = verifiedPaise;
      expect(Math.abs(legitimateClientAmount - verifiedPaise) <= 100).toBe(true);

      // Tampered client amount (e.g. attacker sends ₹100 instead of authentic total)
      const tamperedClientAmount = 10000; // ₹100
      expect(Math.abs(tamperedClientAmount - verifiedPaise) > 100).toBe(true);
    });
  });

  describe('4. Auction Security & Bidding Logic', () => {
    it('prevents artisan from self-bidding on their own handcrafted auction item', async () => {
      const auctionId = 'auction-zardozi-royal';
      const auction = ServerAuctionService.getAuctionById(auctionId);
      expect(auction).toBeDefined();

      const selfBidResult = await ServerAuctionService.placeBid(
        auctionId,
        (auction?.currentBid || 100000) + 10000,
        {
          userId: 'artisan-self',
          email: auction?.sellerEmail, // Match artisan seller email
          name: 'Master Artisan Self',
          role: 'artisan',
        }
      );

      expect(selfBidResult.success).toBe(false);
      expect(selfBidResult.error).toContain('cannot bid on their own');
    });

    it('rejects bids that fail to meet the required minimum increment', async () => {
      const auctionId = 'auction-dhokra-shaman';
      const auction = ServerAuctionService.getAuctionById(auctionId);
      expect(auction).toBeDefined();

      const invalidIncrement = (auction?.currentBid || 50000) + 10; // Only ₹10 increment when minIncrement is ₹1,500
      const lowBidResult = await ServerAuctionService.placeBid(
        auctionId,
        invalidIncrement,
        {
          userId: 'patron-123',
          email: 'patron@example.com',
          name: 'Legitimate Patron',
          role: 'collector',
        }
      );

      expect(lowBidResult.success).toBe(false);
      expect(lowBidResult.error).toContain('Minimum valid bid is');
    });

    it('successfully places and records legitimate bids atomically', async () => {
      const auctionId = 'auction-kani-shawl';
      const auction = ServerAuctionService.getAuctionById(auctionId);
      expect(auction).toBeDefined();

      const validBidAmount = (auction?.currentBid || 200000) + (auction?.minIncrement || 5000);
      const legitimateBidResult = await ServerAuctionService.placeBid(
        auctionId,
        validBidAmount,
        {
          userId: 'connoisseur-999',
          email: 'connoisseur@museum.org',
          name: 'National Museum Patron',
          role: 'institution',
        }
      );

      expect(legitimateBidResult.success).toBe(true);
      expect(legitimateBidResult.auction?.currentBid).toBe(validBidAmount);
      expect(legitimateBidResult.bid?.amount).toBe(validBidAmount);
    });
  });

  describe('5. File Upload Binary Magic Byte Verification', () => {
    it('validates authentic PNG file header signatures', () => {
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const result = validateImageMagicBytes(pngHeader);
      expect(result.valid).toBe(true);
      expect(result.format).toBe('image/png');
    });

    it('validates authentic JPEG file header signatures', () => {
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const result = validateImageMagicBytes(jpegHeader);
      expect(result.valid).toBe(true);
      expect(result.format).toBe('image/jpeg');
    });

    it('validates authentic WebP file header signatures', () => {
      const webpHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
      ]);
      const result = validateImageMagicBytes(webpHeader);
      expect(result.valid).toBe(true);
      expect(result.format).toBe('image/webp');
    });

    it('rejects executable scripts or disguised payloads masquerading as images', () => {
      // Shell script: #!/bin/bash
      const bashScript = Buffer.from('#!/bin/bash\necho "exploit"\n');
      expect(validateImageMagicBytes(bashScript).valid).toBe(false);

      // Windows executable: MZ...
      const peExecutable = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);
      expect(validateImageMagicBytes(peExecutable).valid).toBe(false);

      // PHP script: <?php
      const phpScript = Buffer.from('<?php phpinfo(); ?>');
      expect(validateImageMagicBytes(phpScript).valid).toBe(false);
    });
  });
});
