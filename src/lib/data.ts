import type { Product, Artisan, Order } from './types';

export const artisans: Artisan[] = [
  {
    id: 'artisan-1',
    name: 'Riya Sharma',
    shopName: 'Riya\'s Creations',
    bio: 'Creating beautiful handcrafted pottery from the heart of Rajasthan. Each piece tells a story of tradition and passion.',
    profilePicture: 'https://picsum.photos/seed/artisan1/100/100',
    socialLinks: {
      instagram: 'https://instagram.com/riyascreations',
      facebook: 'https://facebook.com/riyascreations',
    },
  },
  {
    id: 'artisan-2',
    name: 'Aarav Patel',
    shopName: 'Woven Dreams',
    bio: 'Specializing in handwoven textiles and tapestries, blending modern designs with age-old techniques.',
    profilePicture: 'https://picsum.photos/seed/artisan2/100/100',
    socialLinks: {
      twitter: 'https://twitter.com/wovendreams',
    },
  },
];

export const products: Product[] = [
  {
    id: 'prod-1',
    name: 'Azure Ceramic Vase',
    description: 'A stunning handcrafted ceramic vase, glazed in a deep azure blue. Perfect as a centerpiece or for holding your favorite flowers. Its unique shape is inspired by the waves of the ocean.',
    price: 45.0,
    category: 'Home Decor',
    images: [
      'https://picsum.photos/seed/prod1-1/600/600',
      'https://picsum.photos/seed/prod1-2/600/600',
      'https://picsum.photos/seed/prod1-3/600/600',
    ],
    artisanId: 'artisan-1',
    features: ['Hand-thrown pottery', 'Lead-free glaze', 'Unique azure color'],
    styleTags: ['Minimalist', 'Coastal', 'Modern'],
    useCases: ['Flower arrangement', 'Statement decor piece', 'Bookshelf styling'],
    status: 'active',
  },
  {
    id: 'prod-2',
    name: 'Sunset Tapestry',
    description: 'A large, handwoven wall tapestry depicting a vibrant sunset over the desert. Made with naturally dyed wool and cotton fibers.',
    price: 120.0,
    category: 'Textiles',
    images: [
      'https://picsum.photos/seed/prod2-1/600/600',
      'https://picsum.photos/seed/prod2-2/600/600',
    ],
    artisanId: 'artisan-2',
    features: ['100% natural fibers', 'Handwoven on a traditional loom', 'Rich, warm color palette'],
    styleTags: ['Bohemian', 'Rustic', 'Eclectic'],
    useCases: ['Living room wall art', 'Above a bed headboard', 'Meditation space focus'],
    status: 'active',
  },
  {
    id: 'prod-3',
    name: 'Earthenware Mug Set',
    description: 'Set of two rustic earthenware mugs, perfect for your morning coffee or tea. The textured finish provides a comfortable, earthy grip.',
    price: 30.0,
    category: 'Kitchenware',
    images: ['https://picsum.photos/seed/prod3-1/600/600'],
    artisanId: 'artisan-1',
    status: 'active',
  },
  {
    id: 'prod-4',
    name: 'Geometric Print Scarf',
    description: 'A lightweight cotton scarf with a hand-block printed geometric pattern. Versatile and stylish for any season.',
    price: 25.0,
    category: 'Accessories',
    images: ['https://picsum.photos/seed/prod4-1/600/600'],
    artisanId: 'artisan-2',
    status: 'active',
  },
  {
    id: 'prod-5',
    name: 'Terracotta Planter',
    description: 'A simple yet elegant terracotta planter with a subtle etched pattern. Includes a drainage hole and matching saucer.',
    price: 28.0,
    category: 'Gardening',
    images: ['https://picsum.photos/seed/prod5-1/600/600'],
    artisanId: 'artisan-1',
    status: 'archived',
  },
];

export const orders: Order[] = [
  {
    id: 'ord-001',
    buyerId: 'user-123',
    items: [{ productId: 'prod-1', quantity: 1 }],
    totalAmount: 45.0,
    status: 'Delivered',
    orderDate: '2023-10-15',
  },
  {
    id: 'ord-002',
    buyerId: 'user-456',
    items: [
      { productId: 'prod-3', quantity: 1 },
      { productId: 'prod-4', quantity: 1 },
    ],
    totalAmount: 55.0,
    status: 'Shipped',
    orderDate: '2023-10-28',
  },
  {
    id: 'ord-003',
    buyerId: 'user-789',
    items: [{ productId: 'prod-2', quantity: 1 }],
    totalAmount: 120.0,
    status: 'Pending',
    orderDate: '2023-11-01',
  },
];

export const categories: string[] = [
  'Home Decor',
  'Textiles',
  'Kitchenware',
  'Accessories',
  'Gardening',
];
