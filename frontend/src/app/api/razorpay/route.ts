import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
    try {
        const { amount, currency } = await req.json();

        // Use environment variables or fallback to test keys if not present
        // Note: In a real app, never hardcode secrets. These are placeholders.
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_SECRET'
        });

        const options = {
            amount: Math.round(amount * 100), // amount in smallest currency unit (paise for INR)
            currency: currency || 'INR',
            receipt: 'order_rcptid_' + Date.now(),
        };

        const order = await instance.orders.create(options);

        return NextResponse.json(order);
    } catch (error: any) {
        console.error('Error creating Razorpay order:', error);
        return NextResponse.json(
            { error: 'Error creating order', details: error.message },
            { status: 500 }
        );
    }
}
