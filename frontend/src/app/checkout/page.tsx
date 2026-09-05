
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/cart-context";
import { ViraasatLogo } from "@/components/viraasat-logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { useRazorpay } from 'react-razorpay';
import { BACKEND_URL } from '@/services/backend/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { GooglePayLogo, PaytmLogo, PhonePeLogo, RazorpayLogo } from '@/components/payment-icons';
import { QrCode, ShoppingCart, CreditCard, ShieldCheck } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { db } from '@/services/firebase/firestore';
import { collection, addDoc } from 'firebase/firestore';

export default function CheckoutPage() {
    const { cartItems, getCartTotal, clearCart } = useCart();
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const subtotal = getCartTotal();
    const shipping: number = 0; // Assuming free shipping for now
    const total = subtotal + shipping;
    const [showQr, setShowQr] = useState(false);
    const { Razorpay, isLoading } = useRazorpay();
    const [isProcessing, setIsProcessing] = useState(false);

    // Shipping form states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [city, setCity] = useState('');
    const [stateName, setStateName] = useState('');
    const [zip, setZip] = useState('');
    const [phone, setPhone] = useState('');

    const validateForm = () => {
        if (!firstName.trim() || !lastName.trim()) {
            toast({ title: "Name Required", description: "Please enter your first and last name.", variant: "destructive" });
            return false;
        }
        if (!address1.trim() || !city.trim() || !stateName.trim() || !zip.trim()) {
            toast({ title: "Address Incomplete", description: "Please fill out address line 1, city, state, and ZIP code.", variant: "destructive" });
            return false;
        }
        if (!phone.trim()) {
            toast({ title: "Phone Required", description: "Please provide a valid contact number.", variant: "destructive" });
            return false;
        }
        return true;
    };

    const handleRazorpayPayment = async () => {
        if (!validateForm()) return;
        setIsProcessing(true);
        try {
            const response = await fetch('/api/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: total, currency: 'INR' }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to create order');
            }
            const order = await response.json();

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_1234567890',
                amount: order.amount,
                currency: order.currency,
                name: "Viraasat",
                description: "Purchase from Viraasat",
                order_id: order.id,
                handler: async function (razorpayResp: any) {
                    try {
                        // Verify signature server-side
                        const verifyResp = await fetch('/api/razorpay', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: razorpayResp.razorpay_order_id,
                                razorpay_payment_id: razorpayResp.razorpay_payment_id,
                                razorpay_signature: razorpayResp.razorpay_signature,
                            }),
                        });
                        const verifyResult = await verifyResp.json();
                        if (!verifyResult.verified) {
                            toast({ title: "Payment Verification Failed", description: "Invalid signature returned.", variant: "destructive" });
                            return;
                        }

                        const orderData = {
                            userId: user?.id || 'customer-1',
                            customerName: `${firstName} ${lastName}`.trim(),
                            items: cartItems.map(item => ({
                                productId: item.id,
                                productName: item.name,
                                quantity: item.quantity,
                                unitPrice: item.price,
                                itemImageUrl: item.images[0] || ''
                            })),
                            totalAmount: total,
                            orderDate: new Date().toISOString(),
                            status: 'Processing',
                            shippingAddress: {
                                addressLine1: address1,
                                addressLine2: address2 || '',
                                city: city,
                                state: stateName,
                                zipCode: zip,
                                country: 'India'
                            },
                            paymentId: razorpayResp.razorpay_payment_id
                        };
                        
                        if (db) {
                            await addDoc(collection(db, "orders"), orderData);
                        }
                    } catch (e) {
                        console.error("Failed to save order to Firestore:", e);
                    }

                    clearCart();
                    toast({
                        title: "Acquisition Confirmed!",
                        description: `Payment ID: ${razorpayResp.razorpay_payment_id}. Your masterpiece has been added to your collection.`,
                    });
                    router.push('/orders');
                },
                prefill: {
                    name: `${firstName} ${lastName}`.trim() || user?.fullName || "Customer",
                    email: user?.primaryEmailAddress?.emailAddress || "customer@example.com",
                    contact: phone || "9999999999"
                },
                theme: {
                    color: "#F37254"
                }
            };

            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function (resp: any) {
                toast({ title: "Payment Failed", description: resp.error.description, variant: "destructive" });
            });
            rzp.open();
        } catch (error: any) {
            console.error("Payment Error:", error);
            toast({ title: "Payment Initiation Error", description: error.message || "Please try again later.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center">
                <h1 className="text-2xl font-semibold mb-4">Your cart is empty.</h1>
                <p className="text-muted-foreground mb-8">Add items to your cart to proceed to checkout.</p>
                <Button asChild>
                    <Link href="/shop">Continue Shopping</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative">
            {/* Background elements are handled by Background3D now */}
            <div className="h-4" /> {/* Spacing after global navbar */}
            <main className="container mx-auto px-4 py-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Payment Details Section */}
                    <div>
                        <div className='mb-8'>
                            <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Checkout</h1>
                            <p className="text-muted-foreground">Complete your order by providing your details.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-card/50 backdrop-blur-sm border rounded-xl p-6 shadow-sm">
                                <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
                                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input placeholder="First Name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-background/50" required />
                                        <Input placeholder="Last Name *" value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-background/50" required />
                                    </div>
                                    <Input placeholder="Address Line 1 *" value={address1} onChange={(e) => setAddress1(e.target.value)} className="bg-background/50" required />
                                    <Input placeholder="Address Line 2 (Optional)" value={address2} onChange={(e) => setAddress2(e.target.value)} className="bg-background/50" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input placeholder="City *" value={city} onChange={(e) => setCity(e.target.value)} className="bg-background/50" required />
                                        <Input placeholder="State / Province *" value={stateName} onChange={(e) => setStateName(e.target.value)} className="bg-background/50" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input placeholder="ZIP / Postal Code *" value={zip} onChange={(e) => setZip(e.target.value)} className="bg-background/50" required />
                                        <Input placeholder="Country" defaultValue="India" readOnly className="bg-muted" />
                                    </div>
                                    <Input placeholder="Phone Number *" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background/50" required />
                                </form>
                            </div>

                            <div className="bg-card/50 backdrop-blur-sm border rounded-xl p-6 shadow-sm">
                                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                                <Tabs defaultValue="online" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4 mb-6">
                                        <TabsTrigger value="online">Online</TabsTrigger>
                                        <TabsTrigger value="upi">UPI</TabsTrigger>
                                        <TabsTrigger value="card">Card</TabsTrigger>
                                        <TabsTrigger value="netbanking">Net Banking</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="online">
                                        <div className="space-y-6 text-center py-4">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="p-4 bg-primary/5 rounded-full">
                                                    <ShieldCheck className="w-12 h-12 text-primary" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="font-semibold text-lg">Secure Online Payment</h3>
                                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                                        Pay securely using Credit/Debit Card, UPI, NetBanking, or Wallets via Razorpay.
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4 py-2">
                                                    <CreditCard className="w-6 h-6 text-muted-foreground" />
                                                    <RazorpayLogo />
                                                </div>
                                                <Button
                                                    onClick={handleRazorpayPayment}
                                                    disabled={isProcessing || isLoading}
                                                    className="w-full max-w-sm bg-primary hover:bg-primary/90 text-white font-semibold h-12 rounded-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                                                >
                                                    {isProcessing ? 'Processing...' : `Pay ₹${total.toFixed(2)} Securely`}
                                                </Button>
                                                <p className="text-xs text-muted-foreground">
                                                    By proceeding, you agree to our{' '}
                                                    <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link>,{' '}
                                                    <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>, and{' '}
                                                    <Link href="/refund" className="underline hover:text-foreground">Refund Policy</Link>.
                                                </p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="upi">
                                        <div className="space-y-6">
                                            <p className="text-sm text-muted-foreground">Select your preferred UPI app or click below to launch secure payment.</p>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                <Button variant="outline" onClick={handleRazorpayPayment} className="h-16 hover:border-primary/50 hover:bg-primary/5 transition-all"><GooglePayLogo /></Button>
                                                <Button variant="outline" onClick={handleRazorpayPayment} className="h-16 hover:border-primary/50 hover:bg-primary/5 transition-all"><PhonePeLogo /></Button>
                                                <Button variant="outline" onClick={handleRazorpayPayment} className="h-16 hover:border-primary/50 hover:bg-primary/5 transition-all"><PaytmLogo /></Button>
                                                <Button variant="outline" className={`h-16 flex-col gap-1 transition-all ${showQr ? 'border-primary bg-primary/5' : 'hover:border-primary/50 hover:bg-primary/5'}`} onClick={() => setShowQr(!showQr)}>
                                                    <QrCode className="h-5 w-5" />
                                                    <span className="text-[10px]">Scan QR</span>
                                                </Button>
                                            </div>

                                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showQr ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5">
                                                    <div className="p-2 bg-white rounded-lg shadow-md">
                                                        <Image
                                                            src={`https://api.qrserver.com/v1/create-qr-code/?data=upi://pay?pa=viraasat@example&pn=Viraasat&am=${total.toFixed(2)}&cu=INR&tn=ViraasatOrder&size=200x200`}
                                                            alt="UPI QR Code"
                                                            width={200}
                                                            height={200}
                                                            className="mix-blend-multiply"
                                                        />
                                                    </div>
                                                    <p className="mt-4 text-sm font-medium text-primary">Scan with any UPI app to pay ₹{total.toFixed(2)}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">GPay, PhonePe, Paytm, etc.</p>
                                                </div>
                                            </div>

                                            <Button onClick={handleRazorpayPayment} disabled={isProcessing} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 rounded-lg shadow-lg shadow-primary/20">
                                                Proceed to UPI Payment (₹{total.toFixed(2)})
                                            </Button>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="card">
                                        <div className="text-center py-6 space-y-4">
                                            <div className="p-4 bg-primary/5 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                                                <CreditCard className="w-8 h-8 text-primary" />
                                            </div>
                                            <h3 className="font-semibold text-lg">PCI-DSS Compliant Card Checkout</h3>
                                            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                                For your security, card details are entered directly into Razorpay's encrypted PCI-DSS Level 1 compliant gateway.
                                            </p>
                                            <Button onClick={handleRazorpayPayment} disabled={isProcessing} className="w-full max-w-xs bg-primary hover:bg-primary/90 text-white font-semibold h-12 rounded-lg shadow-lg shadow-primary/20">
                                                Pay ₹{total.toFixed(2)} via Card
                                            </Button>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="netbanking">
                                        <div className="text-center py-8 space-y-4">
                                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>
                                            </div>
                                            <p className="text-muted-foreground">Select your bank securely in the Razorpay payment modal.</p>
                                            <Button onClick={handleRazorpayPayment} disabled={isProcessing} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12 rounded-lg shadow-lg shadow-primary/20 mt-2">
                                                Proceed to Net Banking
                                            </Button>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary Section */}
                    <div>
                        <div className="bg-card/80 backdrop-blur-md p-8 rounded-xl border shadow-lg sticky top-24">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-primary" />
                                Order Summary
                            </h2>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 group">
                                        <div className="relative overflow-hidden rounded-md border w-16 h-16 shrink-0">
                                            <Image
                                                src={item.images[0]}
                                                alt={item.name}
                                                fill
                                                className="object-cover transition-transform group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-semibold text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-6" />
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span className="text-green-600 font-medium">{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>₹0.00</span>
                                </div>
                            </div>
                            <Separator className="my-6" />
                            <div className="flex justify-between font-bold text-lg items-end">
                                <span>Total</span>
                                <span className="text-2xl text-primary">₹{total.toFixed(2)}</span>
                            </div>

                            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check text-green-600"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>
                                    Secure Checkout powered by Evo
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
