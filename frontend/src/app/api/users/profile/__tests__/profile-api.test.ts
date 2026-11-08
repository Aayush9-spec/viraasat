/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, PATCH } from '../route';

// Mock Clerk server auth
let mockAuthUser: { userId: string | null; sessionClaims?: any } = {
  userId: 'user_test123',
  sessionClaims: { email: 'aayush.test@viraasat.in' },
};

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(async () => mockAuthUser),
  currentUser: jest.fn(async () => {
    if (!mockAuthUser.userId) return null;
    return {
      id: mockAuthUser.userId,
      firstName: 'Aayush',
      lastName: 'Singh',
      primaryEmailAddress: { emailAddress: 'aayush.test@viraasat.in' },
      imageUrl: 'https://example.com/avatar.jpg',
      unsafeMetadata: { phone: '+91 98765 43210', state: 'Rajasthan', interests: ['Jaipur Blue Pottery'] },
    };
  }),
}));

// Mock Supabase
jest.mock('@/services/supabase', () => {
  const chain: any = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    maybeSingle: jest.fn(() =>
      Promise.resolve({
        data: {
          id: 'user_test123',
          email: 'aayush.test@viraasat.in',
          display_name: 'Aayush Singh',
          region: 'Rajasthan',
          bio: JSON.stringify({ phone: '+91 98765 43210', interests: ['Jaipur Blue Pottery'] }),
        },
        error: null,
      })
    ),
    upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
  };

  return {
    supabase: {
      from: jest.fn(() => chain),
    },
  };
});

describe('Customer Profile API (/api/users/profile)', () => {
  beforeEach(() => {
    mockAuthUser = {
      userId: 'user_test123',
      sessionClaims: { email: 'aayush.test@viraasat.in' },
    };
  });

  describe('GET /api/users/profile', () => {
    it('returns 401 Unauthorized when not signed in', async () => {
      mockAuthUser = { userId: null };
      const req = new NextRequest('http://localhost:3000/api/users/profile');
      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain('Unauthorized');
    });

    it('returns the profile details for authenticated customer', async () => {
      const req = new NextRequest('http://localhost:3000/api/users/profile');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.profile).toBeDefined();
      expect(json.data.profile.email).toBe('aayush.test@viraasat.in');
      expect(json.data.profile.firstName).toBe('Aayush');
    });
  });

  describe('PATCH /api/users/profile', () => {
    it('returns 401 Unauthorized when not signed in', async () => {
      mockAuthUser = { userId: null };
      const req = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: 'Aayush' }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(401);
    });

    it('rejects first name containing numeric digits', async () => {
      const req = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: 'Aayush9' }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('First Name cannot contain numbers.');
      expect(json.field).toBe('firstName');
    });

    it('rejects names containing disallowed special characters', async () => {
      const req = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: 'Aayush@Singh' }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('can only contain letters, spaces, hyphens, and apostrophes');
    });

    it('rejects invalid phone numbers', async () => {
      const req = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: 'Aayush', phone: '123' }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Please enter a valid phone number');
      expect(json.field).toBe('phone');
    });

    it('successfully updates profile with valid name and phone', async () => {
      const req = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'aayush kumar',
          lastName: 'singh',
          phone: '9876543210',
          state: 'Rajasthan',
          interests: ['Jaipur Blue Pottery', 'Bastar Lost-Wax Dhokra'],
        }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.profile.firstName).toBe('Aayush Kumar');
      expect(json.data.profile.lastName).toBe('Singh');
      expect(json.data.profile.fullName).toBe('Aayush Kumar Singh');
      expect(json.data.profile.phone).toBe('+91 98765 43210');
      expect(json.data.message).toBe('Your profile has been updated successfully.');
    });

    it('supports and preserves Indian scripts in names', async () => {
      const req = new NextRequest('http://localhost:3000/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'आकाश',
          lastName: 'शर्मा',
          phone: '+91 98765 43210',
          state: 'Uttar Pradesh',
        }),
      });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.profile.firstName).toBe('आकाश');
      expect(json.data.profile.lastName).toBe('शर्मा');
      expect(json.data.profile.fullName).toBe('आकाश शर्मा');
    });
  });
});
