/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../route';

// Mock Supabase calls so API route tests run in-memory
jest.mock('@/services/supabase', () => {
  const createChainableMock = () => {
    const chain: any = {
      select: jest.fn(() => chain),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => chain),
      delete: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      or: jest.fn(() => chain),
      order: jest.fn(() => chain),
      limit: jest.fn(() => chain),
      then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
    };
    return chain;
  };

  return {
    supabase: {
      from: jest.fn(() => createChainableMock()),
      channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
      })),
      removeChannel: jest.fn(),
    },
  };
});

describe('Reviews API Routes (/api/reviews)', () => {
  describe('GET /api/reviews', () => {
    it('returns reviews and stats for a valid product', async () => {
      const req = new NextRequest('http://localhost:3000/api/reviews?productId=prod-1');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(Array.isArray(json.data.reviews)).toBe(true);
      expect(json.data.stats).toBeDefined();
      expect(typeof json.data.stats.averageRating).toBe('number');
      expect(typeof json.data.stats.totalReviews).toBe('number');
      expect(json.data.stats.distribution).toBeDefined();
    });

    it('returns artisan reviews and metrics for artisan dashboard', async () => {
      const req = new NextRequest('http://localhost:3000/api/reviews?artisanId=artisan-1');
      const res = await GET(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(Array.isArray(json.data.reviews)).toBe(true);
      expect(typeof json.data.totalReviews).toBe('number');
      expect(typeof json.data.averageRating).toBe('number');
      expect(typeof json.data.pendingRepliesCount).toBe('number');
      expect(typeof json.data.responseRate).toBe('number');
    });
  });

  describe('POST /api/reviews', () => {
    it('returns 400 when product ID is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: 5,
          comment: 'Valid comment with enough length but missing product ID.',
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      const errMsg = json.error?.message || json.error;
      expect(errMsg).toMatch(/Product ID is required/i);
    });

    it('returns 400 when rating is invalid', async () => {
      const req = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'prod-1',
          rating: 7,
          comment: 'Rating is 7 which is outside 1-5.',
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      const errMsg = json.error?.message || json.error;
      expect(errMsg).toMatch(/between 1 and 5/i);
    });

    it('submits a verified review successfully', async () => {
      const req = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'prod-4',
          rating: 5,
          title: 'Gorgeous Pashmina Weave',
          comment: 'Masterful loom precision. The fabric is light as air and the warmth is incredible.',
          reviewerId: 'customer-pashmina-buyer-1',
          reviewerName: 'Priya Mukherjee',
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.review).toBeDefined();
      expect(json.data.review.rating).toBe(5);
      expect(json.data.review.title).toBe('Gorgeous Pashmina Weave');
    });
  });

  describe('PUT /api/reviews', () => {
    it('returns 400 when reviewId is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'artisan_response',
          response: 'Thank you for your warm words!',
        }),
      });

      const res = await PUT(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      const errMsg = json.error?.message || json.error;
      expect(errMsg).toMatch(/Review ID is required/i);
    });

    it('submits artisan reply successfully', async () => {
      const req = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: 'seed-rev-1',
          response: 'Namaste! We are delighted that you cherish the handcrafted blue pottery.',
          artisanId: 'artisan-1',
          artisanName: 'Riya Sharma & Guild',
        }),
      });

      const res = await PUT(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.success).toBe(true);
    });
  });

  describe('DELETE /api/reviews', () => {
    it('returns 400 when review ID query parameter is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'DELETE',
      });

      const res = await DELETE(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      const errMsg = json.error?.message || json.error;
      expect(errMsg).toMatch(/Review ID is required/i);
    });
  });
});
