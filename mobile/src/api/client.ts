import { Product, Artisan, Review, Order, GIScanResult } from '../types';

const API_BASE_URL = 'https://www.virrasat.in/api';

// Curated Fallback Crafts with authentic Indian lineage
export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Banarasi Katan Silk Zari Saree',
    nameHi: 'बनारसी कातान रेशम ज़री साड़ी',
    description: 'Referenced in the Rigveda as Kaseyyaka (Kashi gold cloth). Perfected during the Mughal era when Persian floral arabesques merged with Varanasi lotus motifs. Hand-spun from pure mulberry silk and electroplated gold Zari over 45 days.',
    descriptionHi: 'ऋग्वेद में कासेय्यक के नाम से उल्लेखित। शुद्ध मलबरी रेशम और सोने-चांदी की ज़री से 45 दिनों में तैयार हस्तनिर्मित साड़ी।',
    price: 18500,
    originalPrice: 22000,
    currency: 'INR',
    category: 'Handloom Textiles',
    region: 'Varanasi, Uttar Pradesh',
    artisanId: 'art-1',
    artisanName: 'Master Ansari & Sons',
    artisanGuild: 'Kashi Bunkar Sahkari Samiti',
    giCertified: true,
    giTagNumber: 'GI-IN-0023-UP',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'],
    rating: 4.9,
    reviewCount: 38,
    stock: 6,
    digitalPassportHash: '0x8f3b2a9e14c7e2d9b5420188',
    provenanceEra: '15th Century Mughal Lineage',
    featured: true,
  },
  {
    id: 'prod-2',
    name: 'Jaipur Blue Pottery Floral Urn',
    nameHi: 'जयपुर ब्लू पॉटरी पुष्प कलश',
    description: 'Brought to Rajasthan in the 19th century by Maharaja Sawai Ram Singh II. World\'s only pottery crafted completely clay-free—blended from ground quartz, Fuller’s earth, recycled glass, and natural gum, low-fired in wood kilns.',
    descriptionHi: '19वीं शताब्दी का शिल्प। विश्व का एकमात्र बिना मिट्टी का बर्तन, जो स्फटिक पत्थर और काँच के चूर्ण से बनता है।',
    price: 4200,
    originalPrice: 5000,
    currency: 'INR',
    category: 'Ceramics & Decor',
    region: 'Jaipur, Rajasthan',
    artisanId: 'art-2',
    artisanName: 'Shilp Guru Kripal Kumbhar',
    artisanGuild: 'Jaipur Traditional Potter Craft Guild',
    giCertified: true,
    giTagNumber: 'GI-IN-0045-RJ',
    images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'],
    rating: 4.8,
    reviewCount: 24,
    stock: 12,
    digitalPassportHash: '0x3c9a1b7e45d820fa89e17320',
    provenanceEra: '19th Century Sawai Ram Singh Era',
    featured: true,
  },
  {
    id: 'prod-3',
    name: 'Bastar Lost-Wax Dhokra Dancing Bull',
    nameHi: 'बस्तर ढोकरा कांस्य नंदी बैल',
    description: 'A 4,000-year-old metallurgical continuum unbroken since Mohenjo-daro\'s Dancing Girl. Hand-modelled with pure beeswax coils over a clay core, encased in riverbed mud, and cast in scrap bell metal.',
    descriptionHi: '4,000 वर्ष पुरानी सिंधु घाटी की ढोकरा धातु ढलाई कला। शुद्ध मधुमक्खी मोम की डोरियों से हाथ से गढ़ी गई अनूठी कलाकृति।',
    price: 6800,
    originalPrice: 8500,
    currency: 'INR',
    category: 'Metal Craft',
    region: 'Kondagaon, Chhattisgarh',
    artisanId: 'art-3',
    artisanName: 'Bannuram Baid (National Awardee)',
    artisanGuild: 'Bastar Bell Metal Crafts Cooperative',
    giCertified: true,
    giTagNumber: 'GI-IN-0082-CG',
    images: ['https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=800&q=80'],
    rating: 5.0,
    reviewCount: 42,
    stock: 4,
    digitalPassportHash: '0x7e2d9b5420188f3b2a9e14c0',
    provenanceEra: 'Harappan Lost-Wax Metallurgy',
    featured: true,
  },
  {
    id: 'prod-4',
    name: 'Kashmir Sozni Hand-Embroidered Pashmina Shawl',
    nameHi: 'कश्मीरी सोज़नी हाथ से काढ़ी गई पश्मीना शॉल',
    description: 'Harvested from Changthangi goats grazing at 14,000 ft in Ladakh. Hand-spun on yinder wheels and embroidered with fine silk needlework taking up to 180 days to complete.',
    descriptionHi: 'लद्दाख के 14,000 फीट ऊंचे पहाड़ों से लाई गई शुद्ध पश्मीना पर 180 दिनों में सोज़नी सुईकारी द्वारा निर्मित।',
    price: 24500,
    originalPrice: 28000,
    currency: 'INR',
    category: 'Handloom Textiles',
    region: 'Srinagar, Jammu & Kashmir',
    artisanId: 'art-4',
    artisanName: 'Ghulam Hassan Mir',
    artisanGuild: 'Kashmir Valley Artisans Council',
    giCertified: true,
    giTagNumber: 'GI-IN-0012-JK',
    images: ['https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=800&q=80'],
    rating: 4.9,
    reviewCount: 19,
    stock: 3,
    digitalPassportHash: '0x4f1a8c3d9e2b70451a8c9b20',
    provenanceEra: '14th Century Mir Sayyid Ali Hamadani',
    featured: true,
  },
  {
    id: 'prod-5',
    name: 'Madhubani Kohbar Painting on Handmade Paper',
    nameHi: 'मधुबनी कोहबर लोक चित्रकला',
    description: 'Practiced by women artisans of Mithila since the Ramayana era. Painted using bamboo twigs, cotton swabs, and natural pigments derived from lampblack, bilva leaves, and turmeric.',
    descriptionHi: 'रामायण कालीन मिथिला लोक चित्रकला। बांस की तीली और प्राकृतिक रंगों (हल्दी, बेल पत्र, काजल) से बनाई गई।',
    price: 5400,
    originalPrice: 6500,
    currency: 'INR',
    category: 'Traditional Art',
    region: 'Jitwarpur, Bihar',
    artisanId: 'art-5',
    artisanName: 'Baua Devi Mithila Studio',
    artisanGuild: 'Mithila Mahila Kala Samiti',
    giCertified: true,
    giTagNumber: 'GI-IN-0077-BR',
    images: ['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'],
    rating: 4.8,
    reviewCount: 31,
    stock: 8,
    digitalPassportHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f',
    provenanceEra: 'Ancient Mithila Civilization',
    featured: false,
  },
  {
    id: 'prod-6',
    name: 'Channapatna Wooden Toy Locomotive',
    nameHi: 'चन्नपटनम लकड़ी का खिलौना इंजन',
    description: 'Introduced by Tipu Sultan who invited Persian artisans to train local craftspeople. Made from ivory wood (Aale Mara) and coated with non-toxic vegetable-dyed lacquers.',
    descriptionHi: 'टीपू सुल्तान के काल की पारंपरिक काष्ठ कला। बच्चों के लिए सुरक्षित, प्राकृतिक वनस्पति लाख रंगों से रंजित।',
    price: 850,
    originalPrice: 1100,
    currency: 'INR',
    category: 'Woodcraft & Toys',
    region: 'Channapatna, Karnataka',
    artisanId: 'art-6',
    artisanName: 'Karnataka Toy Guild Craftsmen',
    artisanGuild: 'Channapatna Lacquerware Artisans',
    giCertified: true,
    giTagNumber: 'GI-IN-0018-KA',
    images: ['https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=800&q=80'],
    rating: 4.9,
    reviewCount: 52,
    stock: 25,
    digitalPassportHash: '0x18a7b6c5d4e3f2a1b0c9d8e7',
    provenanceEra: '18th Century Tipu Sultan Era',
    featured: false,
  }
];

export const FALLBACK_REVIEWS: Record<string, Review[]> = {
  'prod-1': [
    {
      id: 'rev-1',
      productId: 'prod-1',
      artisanId: 'art-1',
      customerName: 'Aditi Varma',
      rating: 5,
      title: 'Breathtaking Kashi Craftsmanship',
      comment: 'The drape and weave of this Banarasi saree is beyond majestic. You can feel the weight of pure gold zari. Wearing a true piece of living history for my wedding reception.',
      createdAt: '2026-10-18',
      verifiedPurchase: true,
      artisanResponse: {
        text: 'Dhanyawad Aditi ji! May this sacred Banarasi weave bring timeless joy and blessings to your family.',
        respondedAt: '2026-10-20',
      }
    },
    {
      id: 'rev-2',
      productId: 'prod-1',
      artisanId: 'art-1',
      customerName: 'Vikram Sengupta',
      rating: 5,
      title: 'Unmatched Silk Quality',
      comment: 'Certified GI hallmark was verified via the app camera scanner. The cryptographic passport gave complete peace of mind.',
      createdAt: '2026-10-25',
      verifiedPurchase: true,
    }
  ],
  'prod-3': [
    {
      id: 'rev-3',
      productId: 'prod-3',
      artisanId: 'art-3',
      customerName: 'Pooja Kashyap',
      rating: 5,
      title: 'Authentic Bastar Bronze Masterpiece',
      comment: 'The lost-wax texture is remarkably tactile. Bannuram ji has crafted a breathtaking representation of Bastar traditions.',
      createdAt: '2026-10-14',
      verifiedPurchase: true,
      artisanResponse: {
        text: 'Joohar Pooja ji! Our Bastar tribal cooperative thanks you deeply for supporting direct fair wages.',
        respondedAt: '2026-10-16',
      }
    }
  ]
};

export class ViraasatApiClient {
  static async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/products`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
      return FALLBACK_PRODUCTS;
    } catch {
      return FALLBACK_PRODUCTS;
    }
  }

  static async getReviews(productId: string): Promise<Review[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews?productId=${productId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) return data;
      return FALLBACK_REVIEWS[productId] || [];
    } catch {
      return FALLBACK_REVIEWS[productId] || [];
    }
  }

  static async submitReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    try {
      await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview),
      });
    } catch {
      // Local optimistic fallback
    }
    return newReview;
  }

  static async verifyGIHallmark(hallmarkCode: string): Promise<GIScanResult> {
    // Simulates cryptographic verification against backend ledger
    await new Promise((r) => setTimeout(r, 900));
    const isBanarasi = hallmarkCode.toUpperCase().includes('BANARASI') || hallmarkCode.includes('0023');
    const isDhokra = hallmarkCode.toUpperCase().includes('BASTAR') || hallmarkCode.includes('0082');

    if (isBanarasi) {
      return {
        verified: true,
        productName: 'Banarasi Katan Silk Zari Saree',
        artisanName: 'Master Ansari & Sons',
        region: 'Varanasi, Uttar Pradesh',
        giRegistryNumber: 'GI-IN-0023-UP',
        craftLineageEra: '15th Century Drawloom Tradition',
        blockHash: '0x8f3b2a9e14c7e2d9b5420188',
        hallmarkConfidence: 99.4,
      };
    }

    if (isDhokra) {
      return {
        verified: true,
        productName: 'Bastar Lost-Wax Dhokra Dancing Bull',
        artisanName: 'Bannuram Baid',
        region: 'Kondagaon, Chhattisgarh',
        giRegistryNumber: 'GI-IN-0082-CG',
        craftLineageEra: '4,000 BCE Harappan Continuum',
        blockHash: '0x7e2d9b5420188f3b2a9e14c0',
        hallmarkConfidence: 98.9,
      };
    }

    return {
      verified: true,
      productName: 'Jaipur Blue Pottery Floral Urn',
      artisanName: 'Shilp Guru Kripal Kumbhar',
      region: 'Jaipur, Rajasthan',
      giRegistryNumber: 'GI-IN-0045-RJ',
      craftLineageEra: '19th Century Sawai Ram Singh Era',
      blockHash: '0x3c9a1b7e45d820fa89e17320',
      hallmarkConfidence: 97.8,
    };
  }
}

