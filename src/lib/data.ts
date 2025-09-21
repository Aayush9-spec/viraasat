import type { Product, Artisan, Order, User } from './types';

export const users: User[] = [
  {
    id: 'artisan-1',
    email: 'riya.sharma@example.com',
    role: 'artisan',
    createdAt: '2023-01-10T10:00:00Z',
    lastLogin: '2023-11-01T12:30:00Z',
  },
  {
    id: 'artisan-2',
    email: 'aarav.patel@example.com',
    role: 'artisan',
    createdAt: '2023-02-15T11:00:00Z',
    lastLogin: '2023-10-30T18:00:00Z',
  },
  {
    id: 'user-123',
    email: 'buyer1@example.com',
    role: 'buyer',
    createdAt: '2023-03-20T14:00:00Z',
    lastLogin: '2023-11-01T20:00:00Z',
  },
];

export const artisans: Artisan[] = [
  {
    id: 'artisan-1',
    name: 'Riya Sharma',
    shopName: 'Riya\'s Creations',
    bio: 'Creating beautiful handcrafted pottery from the heart of Rajasthan.',
    profilePicture: 'https://picsum.photos/seed/artisan1/100/100',
    location: 'Jaipur, India',
    story: 'From a young age, I was fascinated by the pottery wheels in my village. I spent years learning from the masters, and now I blend those traditional techniques with my own modern aesthetic. Each piece tells a story of the earth, my hands, and a centuries-old tradition.',
    contactEmail: 'support@riyascreations.com',
    socialLinks: {
      instagram: 'https://instagram.com/riyascreations',
      facebook: 'https://facebook.com/riyascreations',
    },
    createdAt: '2023-01-10T10:00:00Z',
    updatedAt: '2023-10-25T09:00:00Z',
  },
  {
    id: 'artisan-2',
    name: 'Aarav Patel',
    shopName: 'Woven Dreams',
    bio: 'Specializing in handwoven textiles and tapestries, blending modern designs with age-old techniques.',
    profilePicture: 'https://picsum.photos/seed/artisan2/100/100',
    location: 'Kutch, India',
    story: 'Weaving is in my family\'s blood. I learned the art of the loom from my grandmother, and I am passionate about keeping this beautiful craft alive. I source my materials locally and use natural dyes to create textiles that are both beautiful and sustainable.',
    socialLinks: {
      twitter: 'https://twitter.com/wovendreams',
    },
    createdAt: '2023-02-15T11:00:00Z',
    updatedAt: '2023-10-28T14:20:00Z',
  },
];

export const products: Product[] = [
  {
    id: 'prod-1',
    artisanId: 'artisan-1',
    name: 'Azure Ceramic Vase',
    description: 'A stunning handcrafted ceramic vase, glazed in a deep azure blue. Perfect as a centerpiece or for holding your favorite flowers. Its unique shape is inspired by the waves of the ocean.',
    price: 45.0,
    currency: 'USD',
    category: 'Home Decor',
    stock: 15,
    images: [
      'https://picsum.photos/seed/prod1-1/600/600',
      'https://picsum.photos/seed/prod1-2/600/600',
      'https://picsum.photos/seed/prod1-3/600/600',
    ],
    shippingInfo: 'Ships within 3-5 business days.',
    aiInsights: {
        keyFeatures: ['Hand-thrown pottery', 'Lead-free glaze', 'Unique azure color'],
        styleTags: ['Minimalist', 'Coastal', 'Modern'],
        useCases: ['Flower arrangement', 'Statement decor piece', 'Bookshelf styling'],
    },
    isActive: true,
    status: 'active', // Legacy
    createdAt: '2023-05-01T10:00:00Z',
    updatedAt: '2023-10-20T11:00:00Z',
  },
  {
    id: 'prod-2',
    artisanId: 'artisan-2',
    name: 'Sunset Tapestry',
    description: 'A large, handwoven wall tapestry depicting a vibrant sunset over the desert. Made with naturally dyed wool and cotton fibers.',
    price: 120.0,
    currency: 'USD',
    category: 'Textiles',
    stock: 5,
    images: [
      'https://picsum.photos/seed/prod2-1/600/600',
      'https://picsum.photos/seed/prod2-2/600/600',
    ],
    shippingInfo: 'Made to order. Ships within 1-2 weeks.',
     aiInsights: {
        keyFeatures: ['100% natural fibers', 'Handwoven on a traditional loom', 'Rich, warm color palette'],
        styleTags: ['Bohemian', 'Rustic', 'Eclectic'],
        useCases: ['Living room wall art', 'Above a bed headboard', 'Meditation space focus'],
    },
    isActive: true,
    status: 'active', // Legacy
    createdAt: '2023-06-15T14:30:00Z',
    updatedAt: '2023-10-22T18:00:00Z',
  },
  {
    id: 'prod-3',
    name: 'Earthenware Mug Set',
    artisanId: 'artisan-1',
    description: 'Set of two rustic earthenware mugs, perfect for your morning coffee or tea. The textured finish provides a comfortable, earthy grip.',
    price: 30.0,
    currency: 'USD',
    stock: 25,
    category: 'Kitchenware',
    images: ['https://picsum.photos/seed/prod3-1/600/600'],
    isActive: true,
    status: 'active', // Legacy
    createdAt: '2023-07-01T09:00:00Z',
    updatedAt: '2023-09-30T10:00:00Z',
  },
  {
    id: 'prod-4',
    name: 'Geometric Print Scarf',
    artisanId: 'artisan-2',
    description: 'A lightweight cotton scarf with a hand-block printed geometric pattern. Versatile and stylish for any season.',
    price: 25.0,
    currency: 'USD',
    stock: 50,
    category: 'Accessories',
    images: ['https://picsum.photos/seed/prod4-1/600/600'],
    isActive: true,
    status: 'active', // Legacy
    createdAt: '2023-07-20T18:00:00Z',
    updatedAt: '2023-10-15T12:00:00Z',
  },
  {
    id: 'prod-5',
    name: 'Terracotta Planter',
    artisanId: 'artisan-1',
    description: 'A simple yet elegant terracotta planter with a subtle etched pattern. Includes a drainage hole and matching saucer.',
    price: 28.0,
    currency: 'USD',
    stock: 0,
    category: 'Gardening',
    images: ['https://picsum.photos/seed/prod5-1/600/600'],
    isActive: false,
    status: 'archived', // Legacy
    createdAt: '2023-08-10T11:45:00Z',
    updatedAt: '2023-10-25T16:00:00Z',
  },
];

export const orders: Order[] = [
  {
    id: 'ord-001',
    buyerId: 'user-123',
    artisanId: 'artisan-1',
    items: [{ productId: 'prod-1', productName: 'Azure Ceramic Vase', quantity: 1, unitPrice: 45.0, itemImageUrl: 'https://picsum.photos/seed/prod1-1/600/600' }],
    totalAmount: 45.0,
    shippingAddress: {
        fullName: "Alice Johnson",
        addressLine1: "123 Market St",
        city: "San Francisco",
        state: "CA",
        zipCode: "94103",
        country: "USA",
    },
    status: 'Delivered',
    paymentStatus: 'Paid',
    orderDate: '2023-10-15T10:30:00Z',
    updatedAt: '2023-10-20T15:00:00Z',
  },
  {
    id: 'ord-002',
    buyerId: 'user-456',
    artisanId: 'artisan-2',
    items: [
      { productId: 'prod-3', productName: 'Earthenware Mug Set', quantity: 1, unitPrice: 30.0, itemImageUrl: 'https://picsum.photos/seed/prod3-1/600/600' },
      { productId: 'prod-4', productName: 'Geometric Print Scarf', quantity: 1, unitPrice: 25.0, itemImageUrl: 'https://picsum.photos/seed/prod4-1/600/600' },
    ],
    totalAmount: 55.0,
    shippingAddress: {
        fullName: "Bob Williams",
        addressLine1: "456 Oak Ave",
        city: "Chicago",
        state: "IL",
        zipCode: "60607",
        country: "USA"
    },
    status: 'Shipped',
    paymentStatus: 'Paid',
    orderDate: '2023-10-28T11:00:00Z',
    updatedAt: '2023-10-29T18:00:00Z',
  },
  {
    id: 'ord-003',
    buyerId: 'user-789',
    artisanId: 'artisan-2',
    items: [{ productId: 'prod-2', productName: 'Sunset Tapestry', quantity: 1, unitPrice: 120.0, itemImageUrl: 'https://picsum.photos/seed/prod2-1/600/600' }],
    totalAmount: 120.0,
    shippingAddress: {
        fullName: "Charlie Brown",
        addressLine1: "789 Pine Ln",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "USA"
    },
    status: 'Pending',
    paymentStatus: 'Pending Payment',
    orderDate: '2023-11-01T12:00:00Z',
    updatedAt: '2023-11-01T12:00:00Z',
  },
];

export const categories: string[] = [
  'Home Decor',
  'Textiles',
  'Kitchenware',
  'Accessories',
  'Gardening',
  'Jewelry',
  'Painting',
];
