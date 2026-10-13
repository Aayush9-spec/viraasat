/**
 * Site configuration and navigation routes.
 */

export const siteConfig = {
  name: 'Viraasat',
  tagline: 'Authentic Indian Artisan Marketplace',
  description:
    'A premium marketplace for authentic artisan crafts and heritage products, powered by AI.',
  url: 'https://viraasat.in',
  author: 'Viraasat Crafts Community',
  links: {
    instagram: 'https://instagram.com/viraasat_india',
    facebook: 'https://facebook.com/viraasat.india',
    twitter: 'https://twitter.com/viraasat_crafts',
    supportEmail: 'care@viraasat.in',
  },
  mainNav: [
    { title: 'nav.home', href: '/' },
    { title: 'nav.shop', href: '/shop' },
    { title: 'nav.products', href: '/products' },
    { title: 'nav.artisans', href: '/artisans' },
    { title: 'nav.journal', href: '/journal' },
    { title: 'nav.about', href: '/about' },
  ],
  artisanNav: [
    { title: 'Dashboard', href: '/artisan/dashboard' },
    { title: 'My Products', href: '/artisan/products' },
    { title: 'Orders', href: '/artisan/orders' },
    { title: 'Provenance & QR', href: '/artisan/provenance' },
    { title: 'AI Tools', href: '/artisan/ai-tools' },
    { title: 'Profile', href: '/artisan/profile' },
  ],
  footerNav: {
    explore: [
      { title: 'All Products', href: '/shop' },
      { title: 'Featured Artisans', href: '/artisans' },
      { title: 'Heritage Journal', href: '/journal' },
      { title: 'Craft Clusters', href: '/#regions' },
    ],
    support: [
      { title: 'Help & FAQ', href: '/faq' },
      { title: 'Shipping Policy', href: '/shipping' },
      { title: 'Returns & Refund', href: '/refund' },
      { title: 'Contact Us', href: '/contact' },
    ],
    legal: [
      { title: 'Privacy Policy', href: '/privacy' },
      { title: 'Terms of Service', href: '/terms' },
    ],
  },
} as const;

export type SiteConfig = typeof siteConfig;
