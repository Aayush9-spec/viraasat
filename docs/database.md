# Database Architecture and Schema Designs

This document defines the data structures used by Viraasat.

---

## 🔥 Cloud Firestore Schema

### 1. `products` Collection
```typescript
{
  id: string;
  artisanId: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  region: string;
  aiInsights?: {
    keyFeatures?: string[];
    styleTags?: string[];
  };
  createdAt: string;
}
```

### 2. `orders` Collection
```typescript
{
  id: string;
  buyerId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered';
  orderDate: string;
}
```

---

## 🕸️ Knowledge Graph Schema

*   **Nodes**: `[Craft, State, District, Material, Community, GITag]`
*   **Edges**: `[ORIGINATES_IN, MADE_FROM, DEVELOPED_BY, AUTHENTICATED_WITH]`
