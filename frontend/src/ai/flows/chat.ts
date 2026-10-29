'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { products } from '@/lib/data';
import fs from 'fs';
import path from 'path';
import { guardInput, guardOutput } from '@/ai/safety';

const HeritageChatInputSchema = z.object({
  message: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional(),
  imageDataUri: z.string().optional(),
});

export type HeritageChatInput = z.infer<typeof HeritageChatInputSchema>;

const HeritageChatOutputSchema = z.object({
  response: z.string(),
  suggestedProductIds: z.array(z.string()).optional(),
  activeAgent: z.string().optional(),
  refused: z.boolean().optional(),
});

export type HeritageChatOutput = z.infer<typeof HeritageChatOutputSchema>;

// ─── Smart local fallback engine ─────────────────────────────────────────────
// Answers questions from the product catalog and craft knowledge when Gemini is
// unavailable (invalid API key, network error, etc.)

const CRAFT_KNOWLEDGE: Record<string, string> = {
  pottery: `Pottery in India is one of the world's oldest living crafts. The Indus Valley Civilisation produced wheel-thrown ceramics over 4,000 years ago. Today, distinct regional traditions survive: Blue Pottery of Jaipur (quartz-based, low-fire, Persian-influenced), Khurja ceramics from UP (high-fire, food-safe, brightly glazed), and terracotta folk traditions across Gorakhpur, Molela, and Bishnupur. Indian potters — called Kumhars — still use the traditional kick-wheel, and each region's clay and glaze formulas are kept as closely guarded family secrets.`,
  textile: `India's handloom tradition is the largest in the world after China. Major traditions include: Banarasi silk (Varanasi, zari gold-thread weaving, Mughal patterns), Chanderi (Madhya Pradesh, sheer cotton-silk blend), Pochampally Ikat (Telangana, warp-and-weft resist dyeing), Kanjivaram silk (Tamil Nadu, temple-border motifs), Patola (Gujarat, double-ikat silk, complex geometric patterns), and Kantha embroidery (Bengal, running-stitch on recycled saris). GI tags protect many of these traditions from imitation.`,
  embroidery: `Indian embroidery traditions include Chikankari (Lucknow — white-on-white thread on fine muslin, 36 distinct stitches), Zardozi (gold-silver wire embroidery, originally for royal garments), Phulkari (Punjab, vibrant silk floss on khaddar cloth), Kashmiri Crewel (wool thread on cotton, dense floral motifs), and Kutch mirror-work (Gujarat, tiny mirrors embedded in geometric patterns). Each tradition has GI protection and is practiced primarily by women artisan communities.`,
  painting: `India's painting traditions span folk, classical, and tribal styles. Madhubani/Mithila (Bihar — natural pigments, mythological themes, geometric borders), Warli (Maharashtra — white rice-paste on mud walls, tribal motifs), Pattachitra (Odisha — palm-leaf or cloth scrolls, Jagannath temple themes), Pichwai (Rajasthan — detailed cloth paintings of Krishna), Miniature (Rajput/Mughal — intricate court scenes on ivory or wasli paper), Kalamkari (Andhra Pradesh — hand-painted or block-printed cotton with natural dyes).`,
  jewelry: `Indian jewelry traditions include: Kundan (Rajasthan — gemstones set in 24-karat gold foil), Meenakari (cloisonné enamel on gold, vibrant colors), Thewa (Pratapgarh — gold on glass), Bidriware (Karnataka — silver inlay in blackened zinc-copper alloy), Dokra/Dhokra (lost-wax cast tribal brass from Bastar/West Bengal), and Filigree/Tarkashi (Varanasi, Cuttack — twisted wire in lace-like patterns). Silver jhumkas, temple jewelry, and tribal ornaments are among the most recognizable.`,
  woodwork: `Major woodcraft traditions: Saharanpur carved Sheesham furniture (intricate jaali/lattice work, exported globally), Sandalwood carving (Karnataka/Mysuru — figurines, incense boxes), Bidriware (Karnataka), Channapatna lacquerware toys (Karnataka — UNESCO-recognized, turned on lathe, lac-coated), Nirmal painted furniture (Telangana), and Kashmiri walnut wood carving (deep relief floral and chinar motifs on household items).`,
  brass: `Moradabad in Uttar Pradesh is called "Pital Nagri" (City of Brass) — India's largest brassware export hub. Craftsmen here use the repoussé technique (hammering from the back) to create ornamental plates, idols, and utensils. Dhokra brass casting (Chhattisgarh, West Bengal) uses the ancient lost-wax technique to create tribal figurines. Thanjavur plates and Nakkashi work from Maharashtra are other distinct brass traditions.`,
  leather: `Kanpur has been India's leather capital since the colonial era. High-quality full-grain leather bags, belts, and accessories are handcrafted here. Kolhapuri chappals (Maharashtra/Karnataka) are hand-stitched flat sandals with GI protection. Mojari shoes from Rajasthan feature intricate embroidery and pointed toes. Leather puppets from Andhra Pradesh (shadow puppetry) are another distinct craft.`,
  carpet: `Bhadohi (UP) is the Carpet City of India — one of the world's top 3 hand-knotted carpet exporters. Persian-knotted wool carpets with 80-200 knots per square inch are woven here. Kashmiri silk carpets (Srinagar) use finer Persian and Turkish knots in pure silk for museum-quality pieces. Warangal Durries (Telangana) are flat-woven cotton rugs with bold geometric patterns. Each carpet's knot count, fiber, and dye quality determines value.`,
  silk: `India produces all four varieties of natural silk: mulberry (Karnataka, West Bengal), tussar (Jharkhand, Chhattisgarh), eri (Assam), and muga (Assam — golden-hued, only produced in India). Banarasi silk from Varanasi features gold/silver brocade and is the gold standard of bridal sarees. Kanjivaram from Tamil Nadu has heavier silk with contrasting borders. Assam's Mekhela Chador uses muga and pat silk in temple motifs.`,
  terracotta: `India's terracotta tradition is over 5,000 years old, tracing back to Indus Valley figurines. Major living traditions: Gorakhpur horses (UP — offered to local deities, UNESCO-recognized), Molela votive plaques (Rajasthan — deity figures made for Bhil tribes), Bishnupur terracotta temples (West Bengal), Bankura horses (West Bengal — stylized, symbolic). All use locally sourced natural clay, are hand-modeled, and kiln-fired without glaze.`,
  block_printing: `Block-printing on textiles is one of India's most widespread folk crafts. Bagru and Sanganer (Rajasthan) use hand-carved wooden blocks with natural indigo and iron/rust mordants. Ajrakh (Kutch/Sindh) involves 16+ steps of resist-printing with natural dyes — recognized as a UNESCO Intangible Heritage. Kalamkari printing (Andhra Pradesh) uses bamboo/palm pens and natural dyes. Each tradition has distinct color palettes and pattern vocabularies tied to local ecology.`,
};

const REGION_INFO: Record<string, string> = {
  rajasthan: `Rajasthan is India's largest state and one of its richest craft regions. Major craft traditions: Blue Pottery (Jaipur), Block Printing (Bagru, Sanganer), Miniature Painting (Jaipur, Udaipur), Kundan & Meenakari jewelry (Jaipur), Leather Mojari (Jodhpur), Stone inlay Pietra Dura (Kota), Dhurrie weaving (Bikaner), Bandhani tie-dye (Jodhpur, Barmer). The "Pink City" of Jaipur alone has over 200,000 artisans registered with government craft councils.`,
  gujarat: `Gujarat has the most diverse craft density of any Indian state. Key traditions: Patola double-ikat silk (Patan — only 3 families worldwide know the technique), Bandhani tie-dye (Jamnagar), Kutch embroidery and mirror-work (Bhuj), Rogan painting (Kutch — cold-paste painting, only 1 family preserves this), Kite-making (Ahmedabad — world's largest kite festival), and Ajrakh block printing. The Kutch district alone has over 20 distinct embroidery traditions.`,
  uttar_pradesh: `UP is India's handicraft powerhouse. Major clusters: Varanasi (Banarasi silk, Zardozi, Silver filigree/Tarkashi), Moradabad (Brassware exports — $1B annually), Agra (Marble inlay Pietra Dura, leather), Lucknow (Chikankari embroidery), Bhadohi (Hand-knotted carpets — world's 3rd largest exporter), Khurja (Ceramics), Firozabad (Glassware — bangles, decoratives), Aligarh (Locks), Saharanpur (Wood carving), Mirzapur (Dhurries).`,
  kashmir: `Kashmir's craft traditions are among India's most refined. Pashmina shawls (from Changra goat fleece of Ladakh — the world's finest natural fiber), Kashmiri Kani shawls (woven on specialized looms with hundreds of color bobbins), Walnut wood carving (deep-relief chinar and floral motifs), Papier-mâché (lacquered boxes and decoratives), Kashmiri silk carpets (finest in Asia), and Sozni embroidery (delicate needle-point on Pashmina). Many artisans hold GI certifications.`,
  west_bengal: `Bengal's craft heritage spans millennia. Kantha embroidery (running stitch on recycled saris — now on fashion garments), Bankura horses and Bishnupur terracotta, Dokra/Dhokra brass casting (tribal lost-wax figurines), Baluchari silk sarees (Bishnupur — mythological scenes woven in brocade), Muslin weaving (Dhaka/Murshidabad — the legendary "woven air" fabric), and Darjeeling tea crafts. Shantiniketan leather goods (hand-painted bags) and Kalighat paintings (folk scroll art) are also internationally recognized.`,
  odisha: `Odisha's crafts center on the Jagannath temple tradition. Pattachitra scroll painting (palm-leaf or cloth, Lord Jagannath imagery, lacquered with natural gum), Dokra metal casting (Dhenkanal district), Sambalpuri ikat silk (complex warp-weft tie-dye), Kotpad natural-dye cotton, Dhokra brass (lost-wax), Silver filigree (Cuttack Tarakasi — the finest silver wire work in India), Pipili appliqué (bright fabric cut-work canopies), and stone sculpture from Konark village artisans.`,
};

function buildLocalResponse(message: string, history: Array<{role?: string, content?: string}> = []): { text: string; agent: string; productIds: string[] } {
  const q = message.toLowerCase().trim();
  const historyText = history.map(h => h.content).join(' ').toLowerCase();

  // ── Greetings ────────────────────────────────────────────────────────────
  if (/^(hi|hello|hey|namaste|hola|greetings|good\s*(morning|afternoon|evening))/.test(q)) {
    return {
      text: `[Buyer Agent] Namaste! 🙏 Welcome to Viraasat — India's premier handcrafted heritage marketplace. I can help you with:\n\n• **Finding the perfect craft** — tell me what you're looking for (a gift, home decor, jewelry, textiles...)\n• **Cultural knowledge** — ask about any Indian craft tradition, GI tag, or artisan technique\n• **Product recommendations** — I'll suggest pieces from our catalog that match your needs\n\nWhat would you like to explore today?`,
      agent: 'Buyer Agent',
      productIds: [],
    };
  }

  // ── Questions about Viraasat/the platform ────────────────────────────────
  if (q.includes('viraasat') || q.includes('this platform') || q.includes('what is this') || q.includes('about this')) {
    return {
      text: `[Buyer Agent] Viraasat (meaning "Heritage" in Hindi) is India's dedicated marketplace for authentic handcrafted goods. We connect village artisans directly with buyers who care about cultural authenticity.\n\n**What makes us different:**\n• All products carry GI (Geographical Indication) provenance certificates\n• Each item has a blockchain-verified authenticity passport\n• 100% of artisan earnings go directly to the craftsperson\n• We work with artisan clusters from 15+ Indian states\n\nWe currently carry ${products.length} unique handcrafted products across ${[...new Set(products.map(p => p.category))].length} craft categories.`,
      agent: 'Buyer Agent',
      productIds: [],
    };
  }

  // ── Price / budget queries ───────────────────────────────────────────────
  const budgetMatch = q.match(/under\s+(?:rs\.?|₹|inr)?\s*(\d+)/i) || q.match(/budget.*?(\d+)/i) || q.match(/(\d+)\s*(?:rs|rupees|₹)/i);
  if (budgetMatch || q.includes('cheap') || q.includes('affordable') || q.includes('budget') || q.includes('price')) {
    const budget = budgetMatch ? parseInt(budgetMatch[1]) : 2000;
    const affordable = products.filter(p => p.price <= budget).sort((a, b) => b.price - a.price).slice(0, 4);
    if (affordable.length > 0) {
      const list = affordable.map(p => `• **${p.name}** (${p.region}) — ₹${p.price}`).join('\n');
      return {
        text: `[Buyer Agent] Namaste! Here are our best handcrafted picks under ₹${budget}:\n\n${list}\n\nAll of these are made by certified village artisans. Would you like more details about any of these pieces?`,
        agent: 'Buyer Agent',
        productIds: affordable.map(p => p.id),
      };
    }
  }

  // ── Gift queries ─────────────────────────────────────────────────────────
  if (q.includes('gift') || q.includes('present') || q.includes('for her') || q.includes('for him') || q.includes('for wife') || q.includes('for mother') || q.includes('wedding')) {
    const giftProducts = products.filter(p =>
      ['Jewelry', 'Textiles', 'Home Decor', 'Accessories'].includes(p.category)
    ).slice(0, 4);
    const list = giftProducts.map(p => `• **${p.name}** — ₹${p.price} (${p.region})`).join('\n');
    return {
      text: `[Buyer Agent] What a thoughtful choice! Handcrafted gifts carry meaning that no factory-made product can match. Here are my top recommendations:\n\n${list}\n\nEach comes with provenance documentation and a cultural story card. Would you like to filter by budget or recipient?`,
      agent: 'Buyer Agent',
      productIds: giftProducts.map(p => p.id),
    };
  }

  // ── Category queries ─────────────────────────────────────────────────────
  const categoryMap: Record<string, string> = {
    jewelry: 'Jewelry', jewellery: 'Jewelry', earring: 'Jewelry', necklace: 'Jewelry', bangle: 'Jewelry',
    textile: 'Textiles', fabric: 'Textiles', saree: 'Textiles', scarf: 'Textiles', quilt: 'Textiles', cushion: 'Textiles',
    pottery: 'Kitchenware', ceramic: 'Kitchenware', bowl: 'Kitchenware', mug: 'Kitchenware', vase: 'Home Decor',
    decor: 'Home Decor', home: 'Home Decor', painting: 'Painting', carpet: 'Home Decor', dhurrie: 'Home Decor',
    bag: 'Accessories', leather: 'Accessories', accessory: 'Accessories',
  };

  for (const [keyword, category] of Object.entries(categoryMap)) {
    if (q.includes(keyword)) {
      const catProducts = products.filter(p => p.category === category).slice(0, 4);
      if (catProducts.length > 0) {
        const list = catProducts.map(p => `• **${p.name}** (${p.region}) — ₹${p.price}`).join('\n');
        return {
          text: `[Buyer Agent] Here are our finest handcrafted ${category} pieces, each made by certified artisans:\n\n${list}\n\nAll pieces carry GI provenance certificates. Shall I filter by region or tell you more about any of these?`,
          agent: 'Buyer Agent',
          productIds: catProducts.map(p => p.id),
        };
      }
    }
  }

  // ── Region queries ───────────────────────────────────────────────────────
  const regions: Array<[string, string]> = [
    ['rajasthan', 'Rajasthan'], ['jaipur', 'Rajasthan'],
    ['gujarat', 'Gujarat'], ['kutch', 'Gujarat'],
    ['uttar pradesh', 'Uttar Pradesh'], ['varanasi', 'Uttar Pradesh'], ['lucknow', 'Uttar Pradesh'],
    ['kashmir', 'Jammu & Kashmir'], ['assam', 'Assam'],
    ['bengal', 'West Bengal'], ['odisha', 'Odisha'],
  ];
  for (const [keyword, region] of regions) {
    if (q.includes(keyword)) {
      const regionProducts = products.filter(p =>
        (p.region ?? '').toLowerCase().includes(keyword) || (p.region ?? '').toLowerCase() === region.toLowerCase()
      ).slice(0, 4);
      const regionKey = keyword.replace(' ', '_');
      const regionInfo = REGION_INFO[regionKey] || REGION_INFO[keyword] || '';
      const productText = regionProducts.length > 0
        ? `\n\n**From our ${region} collection:**\n${regionProducts.map(p => `• **${p.name}** — ₹${p.price}`).join('\n')}`
        : '';
      return {
        text: `[Cultural Research Agent] ${regionInfo || `${region} is renowned for its rich craft heritage.`}${productText}`,
        agent: 'Cultural Research Agent',
        productIds: regionProducts.map(p => p.id),
      };
    }
  }

  // ── Craft knowledge queries ──────────────────────────────────────────────
  const craftKeys: Array<[string, string]> = [
    ['pottery', 'pottery'], ['ceramic', 'pottery'], ['clay', 'pottery'], ['terracotta', 'terracotta'],
    ['textile', 'textile'], ['weaving', 'textile'], ['handloom', 'textile'],
    ['embroidery', 'embroidery'], ['chikankari', 'embroidery'], ['zardozi', 'embroidery'], ['kantha', 'embroidery'],
    ['painting', 'painting'], ['madhubani', 'painting'], ['warli', 'painting'], ['pattachitra', 'painting'],
    ['jewelry', 'jewelry'], ['jewellery', 'jewelry'], ['kundan', 'jewelry'], ['meenakari', 'jewelry'],
    ['wood', 'woodwork'], ['carving', 'woodwork'], ['furniture', 'woodwork'],
    ['brass', 'brass'], ['metal', 'brass'], ['bronze', 'brass'],
    ['leather', 'leather'], ['bag', 'leather'],
    ['carpet', 'carpet'], ['rug', 'carpet'], ['dhurrie', 'carpet'],
    ['silk', 'silk'], ['banarasi', 'silk'], ['pashmina', 'silk'], ['shawl', 'silk'],
    ['block print', 'block_printing'], ['ajrakh', 'block_printing'], ['batik', 'block_printing'],
  ];

  for (const [keyword, craftKey] of craftKeys) {
    if (q.includes(keyword)) {
      const knowledge = CRAFT_KNOWLEDGE[craftKey];
      if (knowledge) {
        const relatedProducts = products.filter(p =>
          p.name.toLowerCase().includes(keyword) ||
          p.category.toLowerCase().includes(keyword) ||
          p.description.toLowerCase().includes(keyword)
        ).slice(0, 3);
        return {
          text: `[Cultural Research Agent] ${knowledge}${relatedProducts.length > 0 ? `\n\n**Related products in our catalog:**\n${relatedProducts.map(p => `• **${p.name}** (${p.region}) — ₹${p.price}`).join('\n')}` : ''}`,
          agent: 'Cultural Research Agent',
          productIds: relatedProducts.map(p => p.id),
        };
      }
    }
  }

  // ── GI Tag / authenticity questions ─────────────────────────────────────
  if (q.includes('gi tag') || q.includes('geographical indication') || q.includes('authentic') || q.includes('original') || q.includes('verified') || q.includes('blockchain') || q.includes('provenance')) {
    return {
      text: `[Cultural Research Agent] Geographical Indication (GI) tags are India's most important tool for protecting traditional crafts from imitation.\n\n**How GI works:** A GI tag is granted to a product from a specific geographic origin that has qualities, reputation, or characteristics essentially attributable to that origin. India currently has 635+ GI-tagged products — the most of any country.\n\n**On Viraasat:** Every product in our catalog comes with:\n• GI provenance documentation from the Handicrafts Development Board\n• A blockchain passport (Proof-of-Work ledger chain) verifiable by scanning the QR code on the product\n• Direct artisan sourcing — no middlemen\n\nThis means when you buy a "Banarasi Silk Saree" from us, you are guaranteed it was woven in Varanasi — not a factory in Surat.`,
      agent: 'Cultural Research Agent',
      productIds: [],
    };
  }

  // ── Stock / availability queries ─────────────────────────────────────────
  if (q.includes('stock') || q.includes('available') || q.includes('inventory') || q.includes('in stock') || q.includes('out of stock')) {
    const inStock = products.filter(p => (p.stock ?? 0) > 0);
    const lowStock = products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5);
    return {
      text: `[Inventory Agent] Namaste! Here's our current stock overview:\n\n• **${inStock.length} products** currently available\n• **${lowStock.length} products** have very limited stock (5 or fewer units)\n\n**Low stock — order soon:**\n${lowStock.slice(0, 4).map(p => `• ${p.name} — only ${p.stock} left`).join('\n')}\n\nAll products ship within 3-7 business days from the artisan's workshop. Would you like to know about a specific product's availability?`,
      agent: 'Inventory Agent',
      productIds: lowStock.slice(0, 4).map(p => p.id),
    };
  }

  // ── Shipping / delivery questions ────────────────────────────────────────
  if (q.includes('shipping') || q.includes('delivery') || q.includes('how long') || q.includes('when will') || q.includes('dispatch')) {
    return {
      text: `[Inventory Agent] Shipping information for Viraasat orders:\n\n• **Standard delivery:** 5-7 business days across India\n• **Express delivery:** 2-3 business days (available in metro cities)\n• **International shipping:** 10-14 business days\n\nSince each product is handcrafted-to-order directly from the artisan's workshop, some items — especially made-to-order pieces like large tapestries or custom sarees — may take 10-14 days for production before dispatch.\n\nAll shipments include tracking and are insured against damage. Fragile ceramics and glassware are triple-packed with biodegradable materials.`,
      agent: 'Inventory Agent',
      productIds: [],
    };
  }

  // ── Return / refund questions ────────────────────────────────────────────
  if (q.includes('return') || q.includes('refund') || q.includes('exchange') || q.includes('cancel')) {
    return {
      text: `[Buyer Agent] Our return policy:\n\n• **7-day return window** from delivery date\n• **Free returns** for damaged or incorrect items — we arrange pickup\n• **Exchange available** for size issues on textiles and accessories\n• **Non-returnable:** Custom/made-to-order items, perishable goods\n\nTo initiate a return, email [email protected] with your order ID and photos. Our team responds within 24 hours.\n\nNote: Handcrafted items will have natural variations in color, texture, and pattern — these are features of authentic craftsmanship, not defects.`,
      agent: 'Buyer Agent',
      productIds: [],
    };
  }

  // ── Artisan / seller questions ───────────────────────────────────────────
  if (q.includes('artisan') || q.includes('seller') || q.includes('become') || q.includes('sell') || q.includes('join')) {
    return {
      text: `[Buyer Agent] Viraasat is always looking for skilled artisans to join our community!\n\n**To become a Viraasat artisan seller:**\n1. Go to **Artisan Portal** (top navigation)\n2. Create your artisan profile with your craft specialty\n3. Submit 3-5 product photos for review\n4. Get your Artisan ID after verification\n5. Start listing products!\n\n**Benefits for artisans:**\n• 0% commission on first ₹50,000 in sales\n• Free provenance certification and blockchain passport generation\n• Access to AI tools for product descriptions and translation\n• Direct buyer contact — no middlemen\n\nHave questions? Email [email protected]`,
      agent: 'Buyer Agent',
      productIds: [],
    };
  }

  // ── Specific product search ──────────────────────────────────────────────
  const matchedProducts = products.filter(p => {
    const name = p.name.toLowerCase();
    const desc = p.description.toLowerCase();
    const words = q.split(/\s+/).filter(w => w.length > 3);
    return words.some(w => name.includes(w) || desc.includes(w));
  }).slice(0, 4);

  if (matchedProducts.length > 0) {
    const list = matchedProducts.map(p => `• **${p.name}** (${p.region}) — ₹${p.price}\n  ${p.description.slice(0, 80)}...`).join('\n\n');
    return {
      text: `[Buyer Agent] I found these handcrafted pieces matching your search:\n\n${list}\n\nAll are sourced directly from certified village artisans with full provenance documentation. Would you like more details?`,
      agent: 'Buyer Agent',
      productIds: matchedProducts.map(p => p.id),
    };
  }

  // ── General fallback ─────────────────────────────────────────────────────
  const randomProducts = products.sort(() => Math.random() - 0.5).slice(0, 3);
  return {
    text: `[Buyer Agent] Namaste! I'd love to help you find the perfect piece of Indian heritage craft. I can assist with:\n\n• **Product search** — describe what you're looking for (e.g. "blue pottery vase" or "silk saree under ₹5000")\n• **Cultural knowledge** — ask about any Indian craft tradition or region\n• **Gift suggestions** — tell me the occasion and budget\n• **Order support** — shipping, returns, authenticity verification\n\nHere are some of our featured pieces today:\n${randomProducts.map(p => `• **${p.name}** (${p.region}) — ₹${p.price}`).join('\n')}`,
    agent: 'Buyer Agent',
    productIds: randomProducts.map(p => p.id),
  };
}

// ─── Main flow ────────────────────────────────────────────────────────────────

const heritageChatFlow = ai.defineFlow(
  {
    name: 'heritageChatFlow',
    inputSchema: HeritageChatInputSchema,
    outputSchema: HeritageChatOutputSchema,
  },
  async (input) => {
    // Input guard
    const inputGuard = guardInput(input.message);
    if (!inputGuard.ok) {
      return {
        response: inputGuard.refusalMessage ?? "I'm sorry, I can't help with that.",
        suggestedProductIds: undefined,
        activeAgent: 'Safety',
        refused: true,
      };
    }

    // RAG document retrieval
    let docsContext = '';
    try {
      const docsPath = fs.existsSync(path.join(process.cwd(), 'database/documents.json'))
        ? path.join(process.cwd(), 'database/documents.json')
        : path.join(process.cwd(), '../database/documents.json');
      if (fs.existsSync(docsPath)) {
        const docs = JSON.parse(fs.readFileSync(docsPath, 'utf8'));
        const queryWords = input.message.toLowerCase().split(/\s+/);
        const matchedDocs = docs.filter((d: any) =>
          queryWords.some(word => word.length > 3 && (d.text.toLowerCase().includes(word) || d.title.toLowerCase().includes(word)))
        );
        if (matchedDocs.length > 0) {
          docsContext = matchedDocs.map((d: any) => `[Source: ${d.title}]\n${d.text}`).join('\n\n');
        }
      }
    } catch { /* no docs available */ }

    const productCatalog = products.map(p => ({
      id: p.id, name: p.name, region: p.region,
      category: p.category, price: p.price, description: p.description,
    }));

    // Build conversation history for multi-turn context
    const historyMessages = (input.history ?? []).map(h => ({
      role: h.role as 'user' | 'model',
      content: [{ text: h.content }],
    }));

    const systemPrompt = `You are the Viraasat Intelligent Multi-Agent Coordinator. You coordinate three specialized agents:
1. **Buyer Agent**: Recommends products, suggests gifts, handles shopping queries, pricing, returns, and shipping.
2. **Cultural Research Agent**: Answers questions about craft origins, GI tags, techniques, regional traditions, festivals, and history.
3. **Inventory Agent**: Handles stock availability, dispatch timelines, and logistics.

ALWAYS start your response by identifying the active agent: "[Buyer Agent]", "[Cultural Research Agent]", or "[Inventory Agent]".

CONTENT POLICY: Do not produce hateful, violent, sexually explicit, or illegal content. Only answer questions about Indian heritage, crafts, and marketplace support. Decline anything else politely.

KNOWLEDGE BASE (RAG):
${docsContext || "Use your built-in knowledge about Indian handicrafts."}

PRODUCT CATALOG (${productCatalog.length} items):
${JSON.stringify(productCatalog, null, 2)}

Guidelines:
- Be warm, culturally rich, and specific — cite artisan traditions, regions, techniques
- When recommending products, mention the artisan's region and the craft tradition
- Use Namaste and ₹ symbol appropriately
- Keep responses under 300 words unless the question demands detail`;

    const promptParts: any[] = [];
    if (input.imageDataUri) {
      promptParts.push({ media: { url: input.imageDataUri } });
      promptParts.push({ text: `Analyze this image in the context of: "${input.message}"` });
    } else {
      promptParts.push({ text: input.message });
    }

    let text = '';
    let activeAgent = 'Buyer Agent';

    try {
      if (process.env.MOCK_AI === 'true') throw new Error('Forced simulation mode');

      const response = await ai.generate({
        system: systemPrompt,
        messages: historyMessages,
        prompt: promptParts,
      });
      text = guardOutput(response.text);

      if (text.includes('[Cultural Research Agent]')) activeAgent = 'Cultural Research Agent';
      else if (text.includes('[Inventory Agent]')) activeAgent = 'Inventory Agent';
    } catch (e) {
      console.warn('Genkit generate failed. Using smart local fallback.', (e as Error).message);
      const fallback = buildLocalResponse(input.message, input.history ?? []);
      text = guardOutput(fallback.text);
      activeAgent = fallback.agent;

      return {
        response: text,
        suggestedProductIds: fallback.productIds.length > 0 ? fallback.productIds : undefined,
        activeAgent,
      };
    }

    // Extract product IDs mentioned in the Gemini response
    const suggestedProductIds = products
      .filter(p =>
        text.toLowerCase().includes(p.name.toLowerCase()) ||
        text.toLowerCase().includes(p.id.toLowerCase())
      )
      .map(p => p.id)
      .slice(0, 3);

    return {
      response: text,
      suggestedProductIds: suggestedProductIds.length > 0 ? suggestedProductIds : undefined,
      activeAgent,
    };
  }
);

/**
 * Server Action entry point for heritage chat flow.
 * Adheres to Next.js 'use server' requirement of exporting only async functions.
 */
export async function runHeritageChat(input: HeritageChatInput): Promise<HeritageChatOutput> {
  return heritageChatFlow(input);
}

