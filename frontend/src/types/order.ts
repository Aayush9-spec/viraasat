export type Order = {
  id: string;
  buyerId: string;
  userId?: string;
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
  orderDate: string;
  updatedAt: string;
};
