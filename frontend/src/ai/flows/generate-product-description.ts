'use server';

/**
 * @fileOverview AI flow to generate culturally rich product descriptions
 * for traditional handmade items using Gemini.
 *
 * - generateProductDescription - Generates a compelling product description.
 * - GenerateProductDescriptionInput - Input type.
 * - GenerateProductDescriptionOutput - Output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  productName: z
    .string()
    .describe('The name of the traditional handmade product.'),
});
export type GenerateProductDescriptionInput = z.infer<
  typeof GenerateProductDescriptionInputSchema
>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe(
      'A beautiful, culturally rich product description for marketing purposes.'
    ),
});
export type GenerateProductDescriptionOutput = z.infer<
  typeof GenerateProductDescriptionOutputSchema
>;

// Craft-specific fallback descriptions for common Indian handicrafts
const CRAFT_DESCRIPTIONS: Record<string, string> = {
  'banarasi silk saree': `Woven on the ancient looms of Varanasi, the Banarasi Silk Saree is India's most celebrated textile treasure. Each yard of pure mulberry silk is interlaced with zari threads of real gold and silver, creating floral bootis and intricate jaal patterns that have adorned Indian brides for over five centuries. The fabric carries the weight of Mughal grandeur and the lightness of Indian grace — a masterpiece that is passed down as an heirloom, not merely worn.`,
  'chikankari kurta': `Born in the royal workshops of Nawabi Lucknow, Chikankari is the art of shadow — white thread stitched onto fine muslin in over 36 distinct stitches, each one named and mastered over a lifetime. This kurta is the handiwork of artisan women in the narrow lanes of Aminabad, who transform plain fabric into poetry using nothing but needle and thread. Breathable in summer, timeless in style, it is elegance distilled to its purest form.`,
  'terracotta horse': `In the red clay heartland of Gorakhpur, Uttar Pradesh, the Terracotta Horse stands as a vessel of devotion and folk memory. Shaped by hand from the sacred earth of the Terai, each horse is an offering to Baba Salim Shah — a deity whose legend weaves through the villages of eastern India. Kiln-fired without a glaze, its raw ochre surface records every thumbprint of the artisan's hands, making each piece a singular artifact of living heritage.`,
  'marble inlay plate': `The craft of Pietra Dura arrived in Agra with the Mughal emperor Jahangir and reached its zenith in the walls of the Taj Mahal. This marble plate carries that same legacy: slivers of lapis lazuli, malachite, and carnelian are cut to a fraction of a millimetre and pressed flush into white Makrana marble, forming flowers that seem to bloom from within the stone. It is a craft that demands a steady hand, unwavering patience, and an eye for beauty measured in fractions.`,
  'pashmina shawl': `High on the Changthang plateau of Ladakh, the Changra goats shed a fleece so fine it passes through a wedding ring. This Pashmina Shawl is spun from that fleece by hand in the valley of Srinagar, woven on traditional karkhana looms, and finished with weeks of hand-knotting into the intricate Kani motif. It weighs almost nothing and holds warmth like a second skin — a paradox of delicacy and resilience that mirrors Kashmir itself.`,
  'brass ganesh idol': `Cast in the dhokra technique that is four thousand years old, this Brass Ganesh Idol from Moradabad — India's Pital Nagri (City of Brass) — captures the beloved deity in a moment of serene abundance. Molten brass is poured into a wax mould packed in fine clay; when the wax melts away, the metal pours in and takes its form. No two pieces are ever identical. Polished by hand to a warm golden glow, this Ganesh brings both blessings and beauty to any home.`,
};

function buildFallbackDescription(productName: string): string {
  const lower = productName.toLowerCase().trim();

  // Check for known craft keywords
  for (const [key, desc] of Object.entries(CRAFT_DESCRIPTIONS)) {
    if (lower.includes(key.split(' ')[0]) || lower.includes(key.split(' ').slice(-1)[0])) {
      return desc;
    }
  }

  // Detect craft type from name and generate a targeted fallback
  const isSilk = /silk|saree|sari|dupatta|lehenga/i.test(productName);
  const isCeramic = /ceramic|pottery|clay|terracotta|earthenware|stoneware|porcelain|bowl|mug|vase|urn/i.test(productName);
  const isWood = /wood|wooden|carved|jaali|teak|sheesham|walnut|box|chest/i.test(productName);
  const isTextile = /cotton|linen|wool|weave|woven|handloom|quilt|tapestry|shawl|scarf|runner|dhurrie|carpet/i.test(productName);
  const isJewellery = /jhumka|earring|bangle|necklace|ring|bracelet|silver|gold|filigree/i.test(productName);
  const isMetal = /brass|bronze|copper|iron|metal|idol|statue|lamp|diya|chariot/i.test(productName);
  const isPainting = /painting|miniature|pichwai|madhubani|kalamkari|warli|pattachitra|art|print/i.test(productName);
  const isLeather = /leather|bag|wallet|messenger|satchel/i.test(productName);

  if (isSilk) {
    return `Drawn from centuries of loom mastery, this "${productName}" is a textile heirloom in the making. Woven from the finest natural fibres and dyed with heritage techniques — turmeric, indigo, pomegranate — its threads carry the stories of the weavers who gave it life. Draped across the body, it transforms the wearer into a living canvas of Indian tradition, as relevant today as it was the day the craft was born.`;
  }
  if (isCeramic) {
    return `Turned on a wheel that has not changed in form for three thousand years, this "${productName}" is shaped from earth and fired into permanence. The artisan's hands guided every curve; no two pieces are alike. Each subtle undulation in the glaze — rich, complex, alive — is the record of a human touch that no machine can replicate. It brings the warmth of the Indian studio potter's kiln directly to your table.`;
  }
  if (isWood) {
    return `Harvested from sustainably sourced forests and seasoned for months before a chisel ever touches it, this "${productName}" speaks in the language of grain and form. The master carver from Saharanpur or Jodhpur reads the wood's natural patterns, coaxing motifs of lotus, paisley, and flowing vines from the timber rather than imposing them. The result is furniture and craft that feel organic — as though the design always existed within the wood, waiting to be revealed.`;
  }
  if (isTextile) {
    return `On traditional pit looms where the rhythmic clack of the shuttle marks time like a heartbeat, this "${productName}" was born thread by thread. Natural plant dyes — indigo, madder, haldi — were chosen not merely for their beauty but for their permanence, deepening with each wash rather than fading. Every woven inch is a meditation practised by artisans who learned the craft from their grandmothers. It is utility elevated to art.`;
  }
  if (isJewellery) {
    return `Crafted in the silver lanes of Jaipur or the goldsmith workshops of Hyderabad, this "${productName}" is more than adornment — it is identity. The filigree work, drawn from wire thinner than a human hair, follows patterns that have been passed down orally through generations of craftspeople. Each piece carries the energy of celebration: weddings, festivals, the rites of passage that make life meaningful. Wear it, and carry that energy with you.`;
  }
  if (isMetal) {
    return `Cast using the lost-wax process that predates written history, this "${productName}" is a triumph of Indian metallurgy. The artisan sculpts every detail in beeswax, encases it in clay, then melts the wax away and pours molten metal into the void it leaves behind. What emerges is polished, chiselled, and sometimes gilded until it blazes with a presence that is both ancient and immediate — a devotional object and a work of art in equal measure.`;
  }
  if (isPainting) {
    return `Painted with brushes made from a single squirrel's hair, this "${productName}" belongs to a pictorial tradition that predates the Mughal courts. Natural pigments — lapis lazuli ground by hand, saffron, lamp black — are mixed with gum arabic and applied in dozens of minute layers. The composition follows a grammar of motifs — the sacred lotus, the divine peacock, the endless vine — that the artisan inherits and subtly reinterprets with each new work. It is living mythology rendered in colour.`;
  }
  if (isLeather) {
    return `Tanned in the workshops of Kanpur — India's leather capital since the nineteenth century — this "${productName}" is made from full-grain hide that has been selected, sorted, and finished entirely by hand. The stitching is waxed and hand-pulled for strength that will outlast decades of daily use. With each year of wear, the leather deepens in colour and develops a patina unique to its owner, becoming more personal, more characterful, more beautiful — the opposite of fast fashion.`;
  }

  // Generic but crafted fallback
  return `"${productName}" is more than an object — it is a conversation between the artisan's hands and centuries of inherited knowledge. Made using techniques refined across generations in the workshops and villages of India, every detail reflects a commitment to craft that the industrial age has never been able to replicate. It carries the memory of its making in every mark, every texture, every curve: a small but profound piece of living heritage.`;
}

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const generateProductDescriptionPrompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: { schema: GenerateProductDescriptionInputSchema },
  output: { schema: GenerateProductDescriptionOutputSchema },
  prompt: `You are an expert copywriter for a premium Indian artisan marketplace called "Viraasat" (meaning Heritage).

Write a beautiful, evocative product description for a traditional handmade item called "{{{productName}}}".

Your description must:
- Highlight the cultural significance and heritage behind the craft
- Describe the craftsmanship, materials, and techniques used
- Evoke emotional appeal — connect the buyer to the artisan's story
- Be poetic yet informative, suitable for a premium e-commerce listing
- Stay under 120 words

Write in English. Do not use bullet points. Write in flowing prose.`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await generateProductDescriptionPrompt({
        productName: input.productName,
      });
      if (output?.description) {
        return { description: output.description };
      }
    } catch (e) {
      console.warn('Genkit generateProductDescription call failed. Using craft-specific fallback.', e);
    }
    return { description: buildFallbackDescription(input.productName) };
  }
);
