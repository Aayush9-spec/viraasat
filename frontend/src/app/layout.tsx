import type { Metadata, Viewport } from 'next';
import './globals.css';
import { siteConfig } from '@/core/config/site';
import { AppProviders } from '@/core/providers';
import { AppShell } from '@/components/shared/layout/app-shell';

const inter = {
  variable: 'font-sans',
};

const cormorant = {
  variable: 'font-serif',
};

export const metadata: Metadata = {
  title: `${siteConfig.name} - ${siteConfig.tagline}`,
  description: siteConfig.description,
  applicationName: siteConfig.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: siteConfig.name,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: `${siteConfig.name} - ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  manifest: '/manifest.json',
  icons: { icon: [{ url: '/icons/viraasat-48.png', sizes: '48x48', type: 'image/png' }], apple: [{ url: '/icons/viraasat-180.png', sizes: '180x180', type: 'image/png' }] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#9c4221' },
    { media: '(prefers-color-scheme: dark)', color: '#5e2c18' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`clay ${inter.variable} ${cormorant.variable}`}>
            <head suppressHydrationWarning>
        <meta property="og:image" content="/viraasat-hero-cream.png" />
      </head>
      <body className="font-sans antialiased text-foreground bg-background" suppressHydrationWarning>
        <AppProviders>
          <AppShell>
            {children}
          </AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
