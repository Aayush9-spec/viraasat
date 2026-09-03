import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Refund Policy · Viraasat',
  description: 'When and how Viraasat issues refunds for damaged, defective, or misdescribed items.',
};

const sections = [
  {
    title: '1. 7-Day Return Window',
    body: 'Buyers may request a refund within 7 calendar days of delivery. The item must be in its original condition, with all packaging and tags intact, and accompanied by a receipt or order confirmation.',
  },
  {
    title: '2. Eligible Reasons',
    body: 'Damage in transit; manufacturing defect; significant difference between listing and actual product (material, dimensions, design); non-delivery after 14 days past the estimated delivery date. Change-of-mind returns are accepted at the artisan\u2019s discretion and may incur a restocking fee.',
  },
  {
    title: '3. How to Request a Refund',
    body: 'Open the order in your account, click "Request Refund", and upload up to 4 photos showing the issue. Our team reviews requests within 2 business days. Approved refunds are issued to the original payment method within 5\u20137 business days. Razorpay processing times may vary.',
  },
  {
    title: '4. Damaged or Defective Items',
    body: 'If your item arrives damaged, please photograph the package before opening and contact us within 48 hours. We will arrange a free return pickup and a full refund, or send a replacement at the artisan\u2019s option.',
  },
  {
    title: '5. Artisan Cancellations',
    body: 'If an artisan cancels an order before shipment, you receive a full refund automatically within 5 business days. If shipment is delayed beyond the artisan\u2019s stated handling time by more than 7 days, you may cancel for a full refund.',
  },
  {
    title: '6. Non-Refundable Items',
    body: 'Custom or personalised orders; perishable goods; digital products; items marked "Final Sale".',
  },
  {
    title: '7. Disputes',
    body: 'If you are not satisfied with the resolution, you may escalate to [email protected]. We will engage an independent arbitrator under the Indian Consumer Protection Act, 2019.',
  },
  {
    title: '8. Contact',
    body: 'Refund questions: [email protected].',
  },
];

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Legal
            </p>
            <CardTitle className="text-3xl font-heading">
              Refund Policy
            </CardTitle>
            <p className="text-sm text-muted-foreground pt-2">
              Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-foreground">
                  {section.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {section.body}
                </p>
                <Separator className="mt-6" />
              </section>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
