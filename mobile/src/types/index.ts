export interface Product {
  id: string;
  name: string;
  nameHi?: string;
  description: string;
  descriptionHi?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  category: string;
  region: string;
  artisanId: string;
  artisanName: string;
  artisanGuild?: string;
  giCertified: boolean;
  giTagNumber?: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  materials?: string[];
  dimensions?: string;
  weight?: string;
  digitalPassportHash?: string;
  provenanceEra?: string;
  featured?: boolean;
}

export interface Review {
  id: string;
  productId: string;
  artisanId: string;
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  verifiedPurchase: boolean;
  customerImages?: string[];
  artisanResponse?: {
    text: string;
    respondedAt: string;
  };
}

export interface Artisan {
  id: string;
  name: string;
  craftSpecialty: string;
  region: string;
  village: string;
  bio: string;
  avatar: string;
  experienceYears: number;
  giRegistrationNo?: string;
  rating: number;
  totalProducts: number;
  fairTradePercent: number;
  contactEmail?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  artisanName: string;
}

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  deliveryAddress: string;
  paymentMethod: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'artisan' | 'admin';
  phone?: string;
  artisanId?: string;
  addresses?: Array<{
    id: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  }>;
}

export interface GIScanResult {
  verified: boolean;
  productName: string;
  artisanName: string;
  region: string;
  giRegistryNumber: string;
  craftLineageEra: string;
  blockHash: string;
  hallmarkConfidence: number;
}

