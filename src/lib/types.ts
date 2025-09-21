export type Product = {
  id: string; // Product ID
  artisanId: string;
  name: string;
  category: string;
  description: string; // Enhanced Description
  tagline: string;
  originalDescription?: string;
  price: number;
  currency: string;
  stock: number;
  images: string[]; // Enhanced Image URLs
  originalImageUrls?: string[];
  shippingInfo?: string;
  aiInsights?: {
    keyFeatures?: string[];
    styleTags?: string[];
    useCases?: string[];
  };
  isActive: boolean;
  status: 'active' | 'archived'; // To be deprecated in favor of isActive
  features?: string[]; // To be deprecated in favor of aiInsights
  styleTags?: string[]; // To be deprecated in favor of aiInsights
  useCases?: string[]; // To be deprecated in favor of aiInsights
  createdAt: string;
  updatedAt: string;
};

export type Artisan = {
  id: string; // Artisan ID (same as User ID)
  name: string;
  shopName: string;
  bio: string;
  profilePicture: string; // Profile Image URL
  location: string;
  story: string;
  contactEmail?: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string; // Order ID
  buyerId: string;
  artisanId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    itemImageUrl: string;
  }[];
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phoneNumber?: string;
  };
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Paid' | 'Refunded' | 'Pending Payment';
  orderDate: string; // Created At
  updatedAt: string;
};

export type User = {
    id: string; // User ID
    email: string;
    role: 'artisan' | 'buyer';
    createdAt: string;
    lastLogin: string;
}
