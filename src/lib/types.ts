export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  artisanId: string;
  features?: string[];
  styleTags?: string[];
  useCases?: string[];
  status: 'active' | 'archived';
};

export type Artisan = {
  id: string;
  name: string;
  shopName: string;
  bio: string;
  profilePicture: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
};

export type Order = {
  id: string;
  buyerId: string;
  items: { productId: string; quantity: number }[];
  totalAmount: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  orderDate: string;
};
