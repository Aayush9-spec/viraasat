import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Privacy Policy · Viraasat',
  description: 'How Viraasat collects, uses, and protects your personal information.',
};

// TODO(legal): This policy must be validated against the Digital Personal
// Data Protection Act, 2023 (India) and equivalent laws in every jurisdiction
// where you serve users. Pay special attention to: cross-border data transfers
// to Firebase Hosting, consent flows for analytics, cookie/DNT disclosures,
// and retention schedules per jurisdiction. Do not ship for production until
// reviewed by qualified counsel.

const sections = [
  {
    title: '1. What we collect',
    body: 'Account data (name, email, profile photo) from Clerk. Product listings, reviews, and messages you create. Payment metadata from Razorpay (we never store your full card number). Usage data (IP address, device, pages viewed) for analytics and abuse prevention. Optional voice recordings you submit to our AI tools — these are sent to Google Speech-to-Text and are not retained after transcription.',
  },
  {
    title: '2. How we use it',
    body: 'To provide and improve the marketplace, process payments, prevent fraud, comply with law, and respond to your requests. AI features use your content as input to Google Gemini; do not include sensitive personal data in AI prompts.',
  },
  {
    title: '3. AI & Third-Party Services',
    body: 'We use Google Gemini, Cloud Vision, and Speech-to-Text for AI features. Each request to these services includes only the minimum data needed (e.g. an image you uploaded). Stripe/Razorpay process payments under their own privacy terms. Sentry collects error and performance data to help us debug issues.',
  },
  {
    title: '4. Cookies',
    body: 'We use essential cookies for authentication (Clerk session) and optional analytics. You can disable non-essential cookies from the cookie banner.',
  },
  {
    title: '5. Your rights',
    body: 'You can access, correct, or delete your personal data from your account settings. To exercise rights that are not self-serve (e.g. data export), contact [email protected]. We respond within 30 days.',
  },
  {
    title: '6. Data retention',
    body: 'Account data is retained while your account is active. We delete Firestore user data within 30 days of account closure. Order records are retained for 7 years for tax-compliance purposes.',
  },
  {
    title: '7. Security',
    body: 'All traffic is encrypted in transit (TLS 1.2+). Storage rules restrict reads and writes by role. We perform regular access reviews and monitor for unusual activity. No system is perfectly secure; please use a strong unique password and enable two-factor authentication on your Clerk account.',
  },
  {
    title: '8. Children',
    body: 'Viraasat is not directed to children under 18. We do not knowingly collect data from children.',
  },
  {
    title: '9. International transfers',
    body: 'Some of our service providers (Google, Sentry, Razorpay) may process data outside India. We rely on the standard contractual clauses and the providers\u2019 published safeguards.',
  },
  {
    title: '10. Changes to this policy',
    body: 'We will notify you by email at least 14 days before any material change takes effect.',
  },
  {
    title: '11. Contact',
    body: 'Data Protection queries: [email protected].',
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Legal
            </p>
            <CardTitle className="text-3xl font-heading">
              Privacy Policy
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
