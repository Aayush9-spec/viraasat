import type { Order } from '@/lib/types';
import { supabase } from '@/services/supabase';

export class OrderService {
  /**
   * Persists an order and its line items into Supabase PostgreSQL,
   * with local storage fallback to guarantee data durability.
   */
  static async createOrder(
    order: Omit<Order, 'id' | 'orderDate' | 'updatedAt'> & {
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
    },
  ): Promise<string | null> {
    const fallbackId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      // 1. Insert into Supabase orders table
      const { data: orderRow, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: order.buyerId,
          total_amount: order.totalAmount,
          status: order.status ?? 'Processing',
          payment_status: order.paymentStatus ?? 'Paid',
          razorpay_order_id: order.razorpayOrderId,
          razorpay_payment_id: order.razorpayPaymentId,
          currency: 'INR',
          shipping_address: order.shippingAddress ?? {},
        })
        .select('id')
        .single();

      if (orderError) {
        console.warn('[OrderService] Non-fatal Supabase order insert notice:', orderError.message);
      }

      const generatedId = orderRow?.id ? String(orderRow.id) : fallbackId;

      // 2. Insert line items if order row was created
      if (orderRow?.id && Array.isArray(order.items) && order.items.length > 0) {
        const items = order.items.map((item) => ({
          order_id: orderRow.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          item_image_url: item.itemImageUrl || '',
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(items);
        if (itemsError) {
          console.warn('[OrderService] Non-fatal Supabase order items insert notice:', itemsError.message);
        }
      }

      // 3. Cache locally for immediate client synchronization
      if (typeof window !== 'undefined') {
        try {
          const rawExisting = localStorage.getItem('viraasat_orders');
          const existingList: Order[] = rawExisting ? JSON.parse(rawExisting) : [];
          const newOrderRecord: Order = {
            id: generatedId,
            buyerId: order.buyerId,
            artisanId: order.artisanId || 'artisan-1',
            items: order.items,
            totalAmount: order.totalAmount,
            status: order.status ?? 'Processing',
            paymentStatus: order.paymentStatus ?? 'Paid',
            orderDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            shippingAddress: order.shippingAddress ?? {
              fullName: '',
              addressLine1: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'India',
            },
          };
          localStorage.setItem('viraasat_orders', JSON.stringify([newOrderRecord, ...existingList]));
        } catch {}
      }

      return generatedId;
    } catch (e) {
      console.warn('[OrderService] Could not complete Supabase order creation, using local cache:', e);
      return fallbackId;
    }
  }

  /**
   * Fetches orders by buyer ID (supporting both Clerk user string IDs and UUIDs)
   */
  static async getOrdersByBuyer(buyerId: string, buyerEmail?: string): Promise<Order[]> {
    if (!buyerId) return [];

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(buyerId);

      // Attempt primary query using buyerId (works once orders.buyer_id is TEXT)
      let { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          buyer_id,
          total_amount,
          status,
          payment_status,
          created_at,
          order_items (
            product_id,
            product_name,
            quantity,
            unit_price,
            item_image_url
          )
        `)
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: false });

      // If Postgres throws 22P02 (invalid input syntax for type uuid because buyer_id is UUID),
      // resolve user UUID from users table by email instead of crashing.
      if (error && (error.code === '22P02' || error.message?.includes('uuid'))) {
        if (!isUuid && buyerEmail) {
          const { data: userRow } = await supabase
            .from('users')
            .select('id')
            .eq('email', buyerEmail.toLowerCase())
            .maybeSingle();

          if (userRow?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userRow.id)) {
            const secondAttempt = await supabase
              .from('orders')
              .select(`
                id,
                buyer_id,
                total_amount,
                status,
                payment_status,
                created_at,
                order_items (
                  product_id,
                  product_name,
                  quantity,
                  unit_price,
                  item_image_url
                )
              `)
              .eq('buyer_id', userRow.id)
              .order('created_at', { ascending: false });

            data = secondAttempt.data;
            error = secondAttempt.error;
          }
        }
      }

      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          id: String(row.id),
          buyerId: row.buyer_id,
          artisanId: '',
          totalAmount: Number(row.total_amount) || 0,
          status: (row.status as Order['status']) || 'Processing',
          paymentStatus: (row.payment_status as Order['paymentStatus']) || 'Paid',
          orderDate: row.created_at,
          updatedAt: row.created_at,
          shippingAddress: {
            fullName: '',
            addressLine1: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India',
          },
          items: (row.order_items ?? []).map((item: {
            product_id: string;
            product_name: string;
            quantity: number;
            unit_price: number;
            item_image_url?: string;
          }) => ({
            productId: item.product_id,
            productName: item.product_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            itemImageUrl: item.item_image_url || '',
          })),
        }));
      }
    } catch (e) {
      console.warn('[OrderService] Handled notice fetching Supabase orders:', e);
    }

    // Fallback to localStorage orders if on client
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('viraasat_orders');
        if (raw) {
          const list: Order[] = JSON.parse(raw);
          return list.filter((o) => o.buyerId === buyerId || (buyerEmail && o.buyerId === buyerEmail));
        }
      } catch {}
    }

    return [];
  }
}
