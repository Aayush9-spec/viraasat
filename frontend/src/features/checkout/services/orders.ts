import { apiClient } from '@/core/api/client';

export interface CreateOrderPayload {
  amount: number;
  currency?: string;
  receipt?: string;
}

export interface CreateOrderResponse {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface VerifyPaymentPayload {
  order_id?: string;
  payment_id?: string;
  signature?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  message?: string;
  order_id?: string;
  payment_id?: string;
}

export const ordersApi = {
  /**
   * Create Razorpay payment order.
   */
  async createRazorpayOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    return apiClient.post<CreateOrderResponse>('create-order', payload);
  },

  /**
   * Verify Razorpay payment signature after customer payment.
   */
  async verifyPayment(payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> {
    return apiClient.post<VerifyPaymentResponse>('verify-payment', payload);
  },
};
