export class RazorpayPayments {
  static getOptions(order: any, total: number, successHandler: (res: any) => void) {
    return {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_1234567890',
      amount: order.amount,
      currency: order.currency,
      name: "Viraasat",
      description: "Heritage Purchase",
      order_id: order.id,
      handler: successHandler,
      theme: {
        color: "#5e2c18"
      }
    };
  }
}
