
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
import { GooglePayLogo, PaytmLogo, PhonePeLogo } from '@/components/payment-icons';
import { QrCode } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
    const { cartItems, getCartTotal } = useCart();
    const subtotal = getCartTotal();
    const shipping = 0; // Assuming free shipping for now
    const total = subtotal + shipping;
    const [showQr, setShowQr] = useState(false);

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
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 w-full border-b bg-card">
              <div className="container mx-auto flex h-16 items-center px-4">
                <ViraasatLogo />
              </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Payment Details Section */}
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Shipping Information</h1>
                        <p className="text-muted-foreground mb-6">Please enter your shipping details.</p>
                        <form className="space-y-4">
                            <Input placeholder="Full Name" />
                            <Input placeholder="Address Line 1" />
                            <div className="grid grid-cols-2 gap-4">
                                <Input placeholder="City" />
                                <Input placeholder="State / Province" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input placeholder="ZIP / Postal Code" />
                                <Input placeholder="Country" defaultValue="India" />
                            </div>
                            <Input placeholder="Phone Number" type="tel" />
                        </form>
                        
                        <Separator className="my-8" />

                        <h2 className="text-2xl font-bold mb-4">Payment</h2>
                        <Tabs defaultValue="upi" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="upi">UPI</TabsTrigger>
                                <TabsTrigger value="card">Card</TabsTrigger>
                                <TabsTrigger value="netbanking">Net Banking</TabsTrigger>
                            </TabsList>
                            <TabsContent value="upi">
                                <Card>
                                    <CardContent className="pt-6 space-y-6">
                                        <p className="text-sm text-muted-foreground">Select your preferred UPI app or enter your UPI ID.</p>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <Button variant="outline" className="h-14"><GooglePayLogo /></Button>
                                            <Button variant="outline" className="h-14"><PhonePeLogo /></Button>
                                            <Button variant="outline" className="h-14"><PaytmLogo /></Button>
                                            <Button variant="outline" className="h-14 flex-col gap-1" onClick={() => setShowQr(!showQr)}>
                                                <QrCode />
                                                <span className="text-xs">Scan QR</span>
                                            </Button>
                                        </div>
                                        {showQr && (
                                            <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
                                                <Image 
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?data=upi://pay?pa=viraasat@example&pn=Viraasat&am=${total.toFixed(2)}&cu=INR&tn=ViraasatOrder&size=200x200`}
                                                    alt="UPI QR Code"
                                                    width={200}
                                                    height={200}
                                                    data-ai-hint="qr code"
                                                />
                                                <p className="mt-4 text-sm text-muted-foreground">Scan with any UPI app</p>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-2">
                                            <Separator className="flex-1" /> <span className="text-xs text-muted-foreground">OR</span> <Separator className="flex-1" />
                                        </div>
                                        <Input placeholder="Enter your UPI ID (e.g. yourname@oksbi)" />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="card">
                                <Card>
                                    <CardContent className="pt-6 space-y-4">
                                        <Input placeholder="Card Number" />
                                        <Input placeholder="Name on Card" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input placeholder="Expiry Date (MM/YY)" />
                                            <Input placeholder="CVV" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                             <TabsContent value="netbanking">
                                <Card>
                                    <CardContent className="pt-6">
                                        <p className="text-center text-muted-foreground">You will be redirected to our secure payment gateway to select your bank.</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        <Button size="lg" className="w-full mt-6">Pay ₹{total.toFixed(2)}</Button>

                    </div>

                    {/* Order Summary Section */}
                    <div className="bg-muted/30 p-8 rounded-lg border">
                        <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                        <div className="space-y-4">
                            {cartItems.map(item => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <Image src={item.images[0]} alt={item.name} width={64} height={64} className="rounded-md" />
                                    <div className="flex-grow">
                                        <p className="font-medium">{item.name}</p>
                                    </div>
                                    <p className="font-medium">₹{item.price.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <Separator className="my-6" />
                        <div className="space-y-2 text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>{shipping === 0 ? 'Free' : `₹${shipping.toFixed(2)}`}</span>
                            </div>
                        </div>
                         <Separator className="my-6" />
                         <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                         </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
