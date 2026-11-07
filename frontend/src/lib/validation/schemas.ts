import { z } from 'zod';

// Order creation item schema
export const OrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required').max(100),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Quantity cannot exceed 99'),
});

// Shipping address schema
export const ShippingAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(150).optional().or(z.literal('')),
  addressLine1: z.string().min(5, 'Address line 1 is required').max(200),
  addressLine2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(100),
  zipCode: z.string().regex(/^\d{5,6}(-\d{4})?$/, 'Invalid postal / ZIP code'),
  country: z.string().max(60).default('India'),
  phoneNumber: z.string().regex(/^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$|^[0-9+() -]{7,20}$/, 'Invalid phone number').optional().or(z.literal('')),
});

// Razorpay order creation request schema
export const CreateOrderRequestSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'At least one item is required in cart'),
  shippingOption: z.enum(['standard', 'express']).default('standard'),
  idempotencyKey: z.string().min(8, 'Idempotency key too short').max(128),
  shipping: ShippingAddressSchema,
});

// Razorpay payment verification schema
export const VerifyPaymentSchema = z.object({
  order_id: z.string().min(5).max(100),
  payment_id: z.string().min(5).max(100),
  signature: z.string().min(32).max(128),
});

// Admin pin verification schema
export const AdminPinSchema = z.object({
  pin: z.string().min(4, 'PIN must be at least 4 characters').max(64, 'PIN too long'),
});

// Product creation & update schema
export const ProductMutationSchema = z.object({
  id: z.string().max(100).optional(),
  name: z.string().min(3, 'Product name must be at least 3 characters').max(150),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  price: z.number().positive('Price must be greater than zero').max(10000000, 'Price exceeds maximum threshold'),
  currency: z.string().default('INR'),
  category: z.string().min(2).max(100),
  originalLanguage: z.string().max(50).optional(),
  englishDescription: z.string().max(5000).optional(),
  images: z.array(z.string().url().or(z.string().startsWith('/'))).min(1, 'At least one image is required').max(10),
  aiInsights: z.any().optional(),
});

// Review creation schema
export const CreateReviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required').max(100),
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(5, 'Review must be at least 5 characters').max(2000, 'Review exceeds maximum length'),
  title: z.string().max(150).optional(),
  images: z.array(z.string()).max(5).optional(),
});

// Artisan review reply schema
export const ArtisanReplySchema = z.object({
  reviewId: z.string().min(1, 'Review ID is required'),
  response: z.string().min(3, 'Reply must be at least 3 characters').max(2000, 'Reply exceeds maximum length'),
});

// Auction bid schema
export const AuctionBidSchema = z.object({
  auctionId: z.string().min(1, 'Auction ID is required').max(100),
  amount: z.number().positive('Bid must be positive').int('Bid must be an integer in INR'),
});

// Artisan application schema
export const ArtisanApplicationSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  craft: z.string().min(2).max(100),
  experience: z.number().int().min(0).max(100),
  region: z.string().min(2).max(100),
  bio: z.string().max(2000).optional(),
});

