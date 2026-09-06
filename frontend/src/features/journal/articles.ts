export interface JournalArticle {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  region: string;
  readTime: string;
}

export const journalArticles: JournalArticle[] = [
  {
    slug: 'blue-pottery-rajasthan',
    title: 'The Living Art of Jaipur Blue Pottery',
    excerpt:
      'A cobalt-hued craft that survived empires, famines, and fads — and the families keeping its centuries-old chemistry alive.',
    category: 'Craft',
    region: 'Rajasthan',
    readTime: '6 min',
    body:
      'Jaipur blue pottery is neither blue by birth nor entirely pottery by convention — it begins as quartz, feldspar, and multani mitti kneaded into a pale dough, glazed with a cobalt-and-copper chemistry that has survived unchanged for three centuries. Because the base is soft, every piece is fired once, glazed, then fired again, and a single vase can take weeks to qualify for the kiln.\n\nThe craft came to Rajasthan through Persian artisans in the 18th century, was refined under the patronage of Sawai Pratap Singh, and nearly vanished with the decline of court patronage. Today a handful of families in Jaipur keep the tradition alive, adapting heritage motifs to lamps, tiles, and tableware. The distinctive oops — no two pieces share a single flaw — is precisely what collectors have come to prize.\n\nWhen you buy a piece of Viraasat blue pottery, you are funding more than an object: you are keeping a kiln alive, an apprenticeship open, and a three-hundred-year-old recipe recorded nowhere but in memory.',
  },
  {
    slug: 'kashmir-pashmina',
    title: 'Pashmina: Threads of the Himalayas',
    excerpt:
      'From the high pastures of Ladakh to the looms of Srinagar, tracing the slow and sacred journey of the world\u2019s finest wool.',
    category: 'Textiles',
    region: 'Kashmir',
    readTime: '8 min',
    body:
      'Pashmina begins at 13,000 feet, where the changthangi goat grows a fleece of extraordinary fineness to survive the Himalayan winter. The wool is gathered at spring moult, sorted by hand, and spun into yarn so fine that a single shawl can take a skilled artisan months of eight-hour days.\n\nThe weaving happens in Srinagar and the surrounding villages, on handlooms whose rhythms have changed little since the Mughal era. What follows is soot-free washing in springs, delicate embroidery in `sozni`, and a final finish that makes the fabric feel like air.\n\nAuthenticity matters profoundly in pashmina — mislabelled machine blends flood the market. Viraasat sources only from verified looms, and every piece is documented with its GI certification and the name of the family who wove it.',
  },
  {
    slug: 'kutch-embroidery',
    title: 'Kutch: A Map of Embroidered Memories',
    excerpt:
      'Every stitch in Kutch embroidery is a record — of droughts survived, migrations made, and a community\u2019s collective memory.',
    category: 'Embroidery',
    region: 'Kutch',
    readTime: '7 min',
    body:
      'The embroidery of Kutch is one of the world\u2019s great textile traditions, worked by communities who migrated into the region over centuries — each bringing its own mirrors, stitches, and motifs. The square mirrors of the Rabari, the chain-stitch of the Jat, the dense `kaathi` of the Mutwa: Kutch\u2019s cloth is a literal map of who came, when, and how they survived.\n\nHistorically, embroidery encoded identity — a woman\u2019s marital status, her community, even the region she hailed from. Today it is a livelihood lifeline, with government-backed cooperatives and self-help groups paying a premium for GI-tagged work.\n\nBuying Kutch embroidery is not merely acquiring decoration; it is underwriting an ecosystem where a craft once threatened by drought is now a family\u2019s proudest, most reliable income.',
  },
  {
    slug: 'gi-tags-india',
    title: 'What a GI Tag Really Proves',
    excerpt:
      'Geographical Indications protect more than provenance — they protect livelihoods. A plain-English guide to India\u2019s GI system.',
    category: 'Heritage',
    region: 'Pan-India',
    readTime: '5 min',
    body:
      'A Geographical Indication (GI) is a legal certificate that a product originates in a specific region and possesses qualities unique to that place — think of Darjeeling tea, Alphonso mangoes, or Banarasi silk. The tag does not guarantee quality by itself; it guarantees origin and the traditional knowledge bound to that origin.\n\nFor artisans, the benefits are concrete: protection against fakes, a marketing halo that commands premium prices, and legal recourse against imitation. India now has hundreds of registered GIs, from Moradabad metal crafts to Varanasi handlooms.\n\nAt Viraasat, every GI-certified product carries its registration in the digital passport — so the collector can verify the certificate itself, not just take the seller\u2019s word for it.',
  },
  {
    slug: 'digital-passports',
    title: 'The Digital Passport: Provenance Goes Online',
    excerpt:
      'How blockchain-backed product passports let a collector verify a craft\u2019s journey from artisan hands to their home.',
    category: 'Technology',
    region: 'Pan-India',
    readTime: '6 min',
    body:
      'A digital product passport is the birth certificate of an object. For a Viraasat piece, it chains together the artisan\u2019s identity verification, the GI certification of the craft, and every ownership transfer — recorded on a tamper-evident ledger.\n\nUnlike a paper certificate, a passport cannot be quietly edited. Anyone with the product\u2019s QR code can read the full history: where the materials were sourced, whose hands shaped them, when the piece was certified, and how it travelled to the collector.\n\nThis is provenance as a service — not a marketing claim, but an audit trail any buyer or reseller can check for themselves.',
  },
  {
    slug: 'village-women-artisans',
    title: 'Women Who Weave Economies',
    excerpt:
      'Self-help groups across India are turning craft into income, one cooperative loom at a time. The numbers may surprise you.',
    category: 'Impact',
    region: 'Pan-India',
    readTime: '5 min',
    body:
      'Roughly two-thirds of India\u2019s artisan workforce is female, and craft is often the only independent income available to women in rural households. Self-help groups (SHGs) have changed the arithmetic: training, pooled buying of raw materials, microcredit, and direct-to-consumer channels mean the craftswoman now earns a share of the retail price rather than a pittance from a middleman.\n\nStudies of craft SHGs report income gains of 40–60% within two years of formalization, alongside harder-to-measure gains in confidence, social standing, and daughters\u2019 schooling.\n\nWhen you purchase hand-embroidered cloth or hand-woven textiles from Viraasat, you are buying into that loop — where heritage is simultaneously a culture and a balance sheet.',
  },
];

export function findArticle(slug: string): JournalArticle | undefined {
  return journalArticles.find((article) => article.slug === slug);
}