import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Terms of Service · Viraasat',
  description: 'The terms that govern your use of the Viraasat marketplace.',
};

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By creating an account, listing a product, or making a purchase on Viraasat, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, do not use the Service.',
  },
  {
    title: '2. Eligibility',
    body: 'You must be at least 18 years old to buy or sell on Viraasat. Artisans must complete identity and workshop verification before listing products for sale. We may refuse or revoke verification at our sole discretion.',
  },
  {
    title: '3. Accounts & Roles',
    body: 'Each user picks a role (Buyer or Artisan) during onboarding. Role determines available features. You are responsible for keeping your Clerk-issued credentials secure and for all activity under your account.',
  },
  {
    title: '4. Listings & Prohibited Content',
    body: 'Artisans may only list products they have created or that they are authorised to resell. Listings must not contain prohibited content including: illegal items, counterfeit goods, products that violate animal-welfare laws, hate symbols, sexually explicit material, or anything that infringes the intellectual-property rights of a third party. We use automated image moderation and may remove listings or suspend accounts that violate this section.',
  },
  {
    title: '5. Pricing & Payment',
    body: 'Prices are listed in Indian Rupees (INR) and include applicable GST. Payments are processed by Razorpay. By submitting payment information you authorise us to charge the amount due. Viraasat retains a platform commission on each sale; the remaining amount is paid out to the artisan per our payout schedule.',
  },
  {
    title: '6. Shipping, Returns & Refunds',
    body: 'See our Refund Policy. Buyers may request a refund within 7 days of delivery for damaged, defective, or materially misdescribed items. Refunds are issued to the original payment method after the item is returned to the artisan.',
  },
  {
    title: '7. AI-Generated Content',
    body: 'Viraasat uses generative AI (Google Gemini) to enhance product images, draft descriptions, and answer questions about Indian heritage. AI output is provided "as is" without warranty of accuracy. You agree not to use the Service to generate content that is unlawful, defamatory, or that infringes the rights of any third party.',
  },
  {
    title: '8. Intellectual Property',
    body: 'You retain all rights to the photographs and descriptions you upload. You grant Viraasat a worldwide, non-exclusive, royalty-free licence to host, display, and promote your listings on the Service. The Viraasat brand, logo, and software are owned by us and may not be used without written permission.',
  },
  {
    title: '9. Termination',
    body: 'We may suspend or terminate your account at any time if we reasonably believe you have violated these Terms. You may close your account at any time from your account settings.',
  },
  {
    title: '10. Disclaimers & Liability',
    body: 'The Service is provided "as is" without warranties of any kind. To the maximum extent permitted by law, Viraasat is not liable for any indirect, incidental, or consequential damages arising from your use of the Service.',
  },
  {
    title: '11. Governing Law',
    body: 'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.',
  },
  {
    title: '12. Contact',
    body: 'Questions about these Terms can be sent to [email protected].',
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Legal
            </p>
            <CardTitle className="text-3xl font-heading">
              Terms of Service
            </CardTitle>
            <p className="text-sm text-muted-foreground pt-2">
              Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="space-y-6 prose prose-sm max-w-none">
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
