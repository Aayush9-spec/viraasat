import type { Order } from '@/lib/types';
import { supabase } from '@/services/supabase';

export class OrderService {
  static async createOrder(
    order: Omit<Order, 'id' | 'orderDate' | 'updatedAt'>,
  ): Promise<string | null> {
    try {
      // Insert the order row
      const { data: orderRow, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: order.buyerId,
          total_amount: order.totalAmount,
          status: order.status ?? 'pending',
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // Insert each line item
      const items = order.items.map((item) => ({
        order_id: orderRow.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw itemsError;

      return orderRow.id as string;
    } catch (e) {
      console.error('Failed to create order:', e);
      return null;
    }
  }

  static async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          buyer_id,
          total_amount,
          status,
          created_at,
          order_items (
            product_id,
            product_name,
            quantity,
            unit_price
          )
        `)
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        buyerId: row.buyer_id,
        artisanId: '',
        totalAmount: row.total_amount,
        status: row.status as Order['status'],
        paymentStatus: 'Paid' as Order['paymentStatus'],
        orderDate: row.created_at,
        updatedAt: row.created_at,
        shippingAddress: {
          fullName: '',
          addressLine1: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
        items: (row.order_items ?? []).map((item: {
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
        }) => ({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          itemImageUrl: '',
        })),
      }));
    } catch (e) {
      console.warn('Failed to fetch orders from Supabase: returning empty list.', e);
      return [];
    }
  }
}
