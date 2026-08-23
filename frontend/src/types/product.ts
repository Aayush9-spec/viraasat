export type Product = {
  id: string;
  artisanId: string;
  name: string;
  category: string;
  description: string;
  tagline: string;
  originalDescription?: string;
  price: number;
  currency: string;
  stock: number;
  images: string[];
  originalImageUrls?: string[];
  shippingInfo?: string;
  aiInsights?: {
    keyFeatures?: string[];
    styleTags?: string[];
    useCases?: string[];
  };
  region: string;
  artisanName?: string;
  isActive: boolean;
  status: 'active' | 'archived';
  features?: string[];
  styleTags?: string[];
  useCases?: string[];
  createdAt: string;
  updatedAt: string;
};

export type Artisan = {
  id: string;
  name: string;
  shopName: string;
  bio: string;
  profilePicture: string;
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
