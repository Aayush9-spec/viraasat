'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { products, categories, regions, saveLocalProduct } from '@/lib/data';
import type { Product } from '@/lib/types';
import VoiceRecorder from '@/features/ai/components/voice-recorder';
import ImageEnhancer from './image-enhancer';
import { generateProductInsights } from '@/ai/flows/generate-product-insights';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import {
  SUPPORTED_LANGUAGES,
  getLanguageCode,
  buildFallbackNativeDescription,
  buildFallbackEnglishDescription,
} from '@/ai/languages';
import { analyzeImage } from '@/ai/flows/analyze-image';
import { useToast } from '@/core/hooks/use-toast';
import { useBackend } from '@/hooks/use-backend';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/services/supabase';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Trash2,
  X,
  Wand2,
  Loader2,
  Cpu,
  Clock,
  Scale,
  Coins,
  Ruler,
  Hammer,
  Award,
  Layers,
  Package,
  Info,
  CheckCircle2,
  Globe2,
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';

const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  inputLanguage: z.string().default('Hindi'),
  descriptionLanguage: z.string().default('Hindi'),
  description: z.string().min(10, 'Description is too short'),
  englishDescription: z.string().optional(),
  price: z.coerce.number().positive('Price must be a positive number'),
  category: z.string().min(1, 'Please select a category'),
  region: z.string().min(1, 'Please select your state/region'),
  craftsmanship: z.enum(['handmade', 'semi_handmade', 'machine_assisted']).default('handmade'),
  material: z.string().default('Terracotta & Natural Clay'),
  
  // Intuitive Dimensions
  dimensionType: z.enum(['dimensions', 'apparel', 'circular', 'custom_sqft']).default('dimensions'),
  dimensionUnit: z.enum(['in', 'cm', 'ft']).default('in'),
  length: z.coerce.number().min(0).default(12),
  width: z.coerce.number().min(0).default(8),
  height: z.coerce.number().min(0).default(4),
  diameter: z.coerce.number().min(0).default(6),
  apparelSize: z.string().default('Free Size'),
  sizeSqft: z.coerce.number().default(0.67),

  // Labor & Crafting Duration
  laborTimeUnit: z.enum(['hours', 'days']).default('hours'),
  laborTimeValue: z.coerce.number().min(0.5, 'Must be at least 0.5').default(5),
  laborHours: z.coerce.number().default(5),

  // Deep Craft Details
  craftTechnique: z.string().optional(),
  weightGrams: z.coerce.number().optional(),
  giCertified: z.boolean().default(false),
  giCertificateNumber: z.string().optional(),
  careInstructions: z.string().optional(),
  packageContents: z.string().optional(),
});

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const { post: backendPost } = useBackend();
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [features, setFeatures] = useState<string[]>(product?.aiInsights?.keyFeatures || []);
  const [styleTags, setStyleTags] = useState<string[]>(
    product?.aiInsights?.styleTags || []
  );
  const [useCases, setUseCases] = useState<string[]>(product?.aiInsights?.useCases || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isPredictingPrice, setIsPredictingPrice] = useState(false);
  const [pricingInfo, setPricingInfo] = useState<any>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      inputLanguage: product?.originalLanguage || 'Hindi',
      descriptionLanguage: 'Hindi',
      description: product?.description || '',
      englishDescription: product?.englishDescription || product?.descriptions?.en || '',
      price: product?.price || 450,
      category: product?.category || 'Home Decor & Wall Art',
      region: product?.region || 'Rajasthan',
      craftsmanship: 'handmade',
      material: 'Terracotta & Natural Clay',
      dimensionType: 'dimensions',
      dimensionUnit: 'in',
      length: 12,
      width: 8,
      height: 4,
      diameter: 6,
      apparelSize: 'Free Size',
      sizeSqft: 0.67,
      laborTimeUnit: 'hours',
      laborTimeValue: 5,
      laborHours: 5,
      craftTechnique: '',
      weightGrams: 500,
      giCertified: false,
      giCertificateNumber: '',
      careInstructions: 'Wipe with soft clean cloth. Keep away from water and direct harsh sunlight.',
      packageContents: '1 Handcrafted piece, artisan provenance card',
    },
  });

  // Watch dimension & labor fields for live relatable calculations
  const dimensionType = form.watch('dimensionType');
  const dimensionUnit = form.watch('dimensionUnit');
  const lengthVal = form.watch('length') || 0;
  const widthVal = form.watch('width') || 0;
  const diameterVal = form.watch('diameter') || 0;
  const apparelSizeVal = form.watch('apparelSize');
  const laborTimeUnit = form.watch('laborTimeUnit');
  const laborTimeValue = form.watch('laborTimeValue') || 1;
  const craftsmanshipVal = form.watch('craftsmanship');
  const giCertifiedVal = form.watch('giCertified');
  const descriptionLanguageVal = form.watch('descriptionLanguage') || 'Native';
  const inputLanguageVal = form.watch('inputLanguage') || 'Hindi';
  const productNameVal = form.watch('name') || '';

  // Compute normalized size_sqft reactively
  const computedSizeSqft = (() => {
    if (dimensionType === 'custom_sqft') {
      return Number(form.watch('sizeSqft')) || 1;
    }
    if (dimensionType === 'apparel') {
      switch (apparelSizeVal) {
        case 'S': return 4.0;
        case 'M': return 5.0;
        case 'L': return 6.0;
        case 'XL': return 7.0;
        case 'XXL': return 8.0;
        case 'Saree (5.5m)': return 35.0;
        case 'Shawl / Stole': return 12.0;
        case 'Dhurrie / Rug (Small)': return 9.0;
        case 'Dhurrie / Rug (Medium)': return 24.0;
        default: return 5.5;
      }
    }
    if (dimensionType === 'circular') {
      // Area = pi * r^2
      const radius = (diameterVal || 1) / 2;
      let areaSqUnits = Math.PI * radius * radius;
      if (dimensionUnit === 'in') return Math.max(0.05, Number((areaSqUnits / 144).toFixed(2)));
      if (dimensionUnit === 'cm') return Math.max(0.05, Number((areaSqUnits / 929.03).toFixed(2)));
      return Math.max(0.05, Number(areaSqUnits.toFixed(2)));
    }
    // Standard length x width
    const l = Math.max(0.1, lengthVal);
    const w = Math.max(0.1, widthVal);
    const area = l * w;
    if (dimensionUnit === 'in') return Math.max(0.05, Number((area / 144).toFixed(2)));
    if (dimensionUnit === 'cm') return Math.max(0.05, Number((area / 929.03).toFixed(2)));
    return Math.max(0.05, Number(area.toFixed(2)));
  })();

  // Compute total labor hours reactively (1 artisan work day = 8 hours)
  const computedLaborHours = laborTimeUnit === 'days'
    ? Number((laborTimeValue * 8).toFixed(1))
    : Number(laborTimeValue);

  const handlePredictPrice = async () => {
    setIsPredictingPrice(true);
    try {
      const values = form.getValues();
      const finalHours = values.laborTimeUnit === 'days' ? (Number(values.laborTimeValue) || 1) * 8 : (Number(values.laborTimeValue) || 5);
      const data = await backendPost<{ recommended_price: number; craft_tier?: string; labor_cost?: number; material_factor?: number; sustainability_premium?: number; price_range?: { min: number; max: number } }>('/api/predict-price', {
        name: values.name || '',
        description: values.description || '',
        region: values.region || '',
        category: values.category || 'Home Decor & Wall Art',
        material: values.material || 'Terracotta & Natural Clay',
        labor_hours: finalHours,
        size_sqft: computedSizeSqft,
        craftsmanship: values.craftsmanship || 'handmade',
        is_organic: true,
      });
      setPricingInfo(data);
      form.setValue('price', data.recommended_price);
      toast({
        title: "AI Fair Artisan Price Applied!",
        description: `Suggested ₹${data.recommended_price} based on ${data.craft_tier || 'craft economics'} & local labor costs.`
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Pricing Prediction Failed",
        description: "Could not connect to the pricing model service."
      });
    } finally {
      setIsPredictingPrice(false);
    }
  };

  const handleVisionScan = async () => {
    if (images.length === 0) {
      toast({
        variant: 'destructive',
        title: "No Image Found",
        description: "Please upload an image to run a computer vision scan."
      });
      return;
    }
    
    setIsAnalyzingImage(true);
    try {
      const result = await analyzeImage({ imageDataUri: images[0] });
      form.setValue('name', result.predictedTitle);
      form.setValue('category', result.detectedCategory);
      form.setValue('material', result.detectedMaterial);
      
      // Set features and tags
      setStyleTags(result.suggestedTags || []);
      
      toast({
        title: "Computer Vision Scan Complete!",
        description: `Detected craft: ${result.predictedTitle} in category ${result.detectedCategory}.`
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Vision Scan Failed",
        description: "Could not analyze the image. Please try again."
      });
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  async function onSubmit(values: z.infer<typeof productSchema>) {
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const newId = product?.id || `creation-${Date.now()}`;
      const artisanId = user?.id || 'artisan-1';

      const isValidUuid = (val?: string) =>
        typeof val === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

      // Postgres requires a valid UUID for artisan_id column in Supabase
      const dbArtisanId = isValidUuid(artisanId) ? artisanId : '1e5f1a27-4c4e-5b84-b4dd-5227b40c755d';

      const numPrice = Number(values.price) || 0;
      const getContextualCraftImage = (name: string, category: string) => {
        const n = (name || '').toLowerCase();
        if (n.includes('diya') || n.includes('deepam') || n.includes('lamp') || n.includes('candle')) {
          return '/images/products/clean/handcrafted-terracotta-diya.jpg';
        }
        if (n.includes('pottery') || n.includes('vase') || n.includes('urn') || n.includes('ceramic')) {
          return '/images/products/clean/jaipur-blue-pottery-urn.jpg';
        }
        if (n.includes('channapatna') || n.includes('toy') || n.includes('train')) {
          return '/images/products/clean/channapatna-wooden-toy-train.jpg';
        }
        if (n.includes('shawl') || n.includes('pashmina') || n.includes('sozni')) {
          return '/images/products/clean/kashmiri-sozni-pashmina-shawl.jpg';
        }
        if (n.includes('brass') || n.includes('dhokra') || n.includes('idol') || n.includes('metal')) {
          return '/images/products/clean/moradabad-brass-ganesh-idol.jpg';
        }
        if (n.includes('carpet') || n.includes('dhurrie')) {
          return '/images/products/clean/bhadohi-hand-knotted-carpet.jpg';
        }
        if (n.includes('saree') || n.includes('silk') || n.includes('chikankari')) {
          return '/images/products/clean/banarasi-silk-saree.jpg';
        }
        return '/images/products/clean/handcrafted-terracotta-diya.jpg';
      };

      const finalImages = images.length > 0 ? images : [getContextualCraftImage(values.name, values.category)];

      const finalLaborHours = values.laborTimeUnit === 'days' ? (Number(values.laborTimeValue) || 1) * 8 : (Number(values.laborTimeValue) || 5);

      const dimensionsDescription = values.dimensionType === 'apparel'
        ? `Size: ${values.apparelSize}`
        : values.dimensionType === 'circular'
          ? `Diameter: ${values.diameter} ${values.dimensionUnit}, Depth/Height: ${values.height} ${values.dimensionUnit}`
          : values.dimensionType === 'custom_sqft'
            ? `${values.sizeSqft} sq ft`
            : `${values.length}L × ${values.width}W × ${values.height}H ${values.dimensionUnit}`;

      const craftDetails = {
        craftsmanship: values.craftsmanship,
        craftTechnique: values.craftTechnique || '',
        material: values.material,
        dimensions: dimensionsDescription,
        sizeSqft: computedSizeSqft,
        laborHours: finalLaborHours,
        laborDurationText: values.laborTimeUnit === 'days' ? `${values.laborTimeValue} days (~${finalLaborHours} hrs)` : `${values.laborTimeValue} hours`,
        weightGrams: values.weightGrams || 500,
        giCertified: values.giCertified,
        giCertificateNumber: values.giCertificateNumber || '',
        careInstructions: values.careInstructions || '',
        packageContents: values.packageContents || '',
      };

      const primaryLangCode = getLanguageCode(values.descriptionLanguage || 'Hindi');
      const descriptionsDict: Record<string, string> = {
        [primaryLangCode]: values.description.trim(),
      };
      if (values.englishDescription && values.englishDescription.trim()) {
        descriptionsDict['en'] = values.englishDescription.trim();
      }

      const supabasePayload = {
        artisan_id: dbArtisanId,
        name: values.name.trim(),
        description: values.description.trim(),
        original_language: values.inputLanguage || 'Hindi',
        category: values.category,
        region: values.region,
        price: numPrice,
        stock: 10,
        images: finalImages,
        ai_insights: {
          keyFeatures: features,
          styleTags: styleTags,
          useCases: useCases,
          craftDetails: craftDetails,
          descriptions: descriptionsDict,
          englishDescription: values.englishDescription || '',
          originalLanguage: values.inputLanguage || 'Hindi',
        },
        updated_at: now,
      };

      const localItem = {
        id: newId,
        artisan_id: artisanId,
        artisanId: artisanId,
        name: values.name.trim(),
        description: values.description.trim(),
        originalLanguage: values.inputLanguage || 'Hindi',
        englishDescription: values.englishDescription || '',
        descriptions: descriptionsDict,
        category: values.category,
        region: values.region,
        price: numPrice,
        stock: 10,
        images: finalImages,
        material: values.material,
        craftsmanship: values.craftsmanship,
        dimensions: dimensionsDescription,
        sizeSqft: computedSizeSqft,
        laborHours: finalLaborHours,
        craftDetails: craftDetails,
        ai_insights: {
          keyFeatures: features,
          styleTags: styleTags,
          useCases: useCases,
          craftDetails: craftDetails,
          descriptions: descriptionsDict,
          englishDescription: values.englishDescription || '',
          originalLanguage: values.inputLanguage || 'Hindi',
        },
        aiInsights: {
          keyFeatures: features,
          styleTags: styleTags,
          useCases: useCases,
          craftDetails: craftDetails,
          descriptions: descriptionsDict,
          englishDescription: values.englishDescription || '',
          originalLanguage: values.inputLanguage || 'Hindi',
        },
        created_at: now,
        createdAt: now,
        updated_at: now,
        status: 'Active',
        isActive: true,
      };

      // 1. Save to local storage & dispatch events for instantaneous reactive rendering across all pages
      saveLocalProduct(localItem);

      // 2. Persist to server / database/products.json via /api/products
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(localItem),
        });
      } catch (apiErr) {
        console.warn('API sync notice:', apiErr);
      }

      // 3. Sync to Supabase cloud database
      try {
        if (product && isValidUuid(product.id)) {
          await supabase.from('products').update(supabasePayload).eq('id', product.id);
        } else {
          await supabase.from('products').insert({ ...supabasePayload, created_at: now });
        }
      } catch (dbErr) {
        console.warn('Supabase DB sync notice:', dbErr);
      }

      toast({
        title: 'Product Published to Shop!',
        description: `${values.name} is now live in the artisan marketplace.`,
      });

      // Redirect directly to the shop page so artisan sees their new creation immediately
      router.push('/shop');
      router.refresh();

    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save product. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }


  const handleInsights = async () => {
    const { name, description, category } = form.getValues();
    if (!name || !description || !category) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description:
          'Please fill out Name, Description, and Category before generating insights.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const insights = await generateProductInsights({
        productName: name,
        productDescription: description,
        productCategory: category,
        artisanName: 'Viraasat Artisan', // Mock name
      });
      setFeatures(insights.features);
      setStyleTags(insights.styleTags);
      setUseCases(insights.useCases);
      toast({
        title: 'Insights Generated!',
        description: 'AI has generated features, tags, and use cases.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate AI insights. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDescription = async () => {
    const name = form.getValues('name');
    if (!name || name.trim().length < 3) {
      toast({
        variant: 'destructive',
        title: 'Product Name Required',
        description: 'Please enter a product name (at least 3 characters) before generating a description.',
      });
      return;
    }

    setIsGeneratingDesc(true);
    try {
      const inputLang = form.getValues('inputLanguage') || 'Hindi';
      const outLang = form.getValues('descriptionLanguage') || 'Hindi';
      const existingDesc = form.getValues('description') || '';
      const material = form.getValues('material');
      const region = form.getValues('region');
      const craftSpecs = [
        existingDesc.trim(),
        material ? `Material: ${material}` : '',
        region ? `Region: ${region}` : '',
      ]
        .filter(Boolean)
        .join('. ');

      const result = await generateProductDescription({
        productName: name.trim(),
        productDetails: craftSpecs || undefined,
        inputLanguage: inputLang,
        outputLanguage: outLang,
        generateEnglish: true,
      });

      form.setValue('description', result.description);
      if (result.englishDescription) {
        form.setValue('englishDescription', result.englishDescription);
      }

      toast({
        title: result.isFallback ? '✨ Description Ready (Heritage Fallback)' : '✨ Multilingual Description Generated!',
        description: `Generated authentic description in ${result.outputLanguage || outLang} and English.`,
      });
    } catch (error) {
      console.warn('Live generation failed, using instant heritage fallback:', error);
      const trimmed = name.trim();
      const outLang = form.getValues('descriptionLanguage') || 'Hindi';
      const existingDesc = form.getValues('description') || '';
      const fallbackNative = buildFallbackNativeDescription(trimmed, outLang, existingDesc);
      const fallbackEnglish = buildFallbackEnglishDescription(trimmed, existingDesc);

      form.setValue('description', fallbackNative);
      form.setValue('englishDescription', fallbackEnglish);

      toast({
        title: '✨ Description Ready (Heritage Fallback)',
        description: `Generated authentic description in ${outLang} and English.`,
      });
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const removeTag = (
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    tag: string
  ) => {
    setter(list.filter((t) => t !== tag));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Details</CardTitle>
                    <CardDescription>
                      Enter the main details for your product in your preferred language.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs gap-1 border-primary/20 text-[#8b4513]">
                    <Globe2 className="h-3 w-3" /> Multilingual AI
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Product Name (उत्पाद का नाम)</FormLabel>
                        <VoiceRecorder
                          variant="ghost"
                          size="sm"
                          buttonLabel="Speak Name"
                          className="h-6 text-xs text-primary hover:text-primary/80 gap-1 px-1.5"
                          defaultLanguage={inputLanguageVal}
                          title="Speak product name in your preferred language"
                          onTranscriptionComplete={(text) => form.setValue('name', text)}
                        />
                      </div>
                      <FormControl>
                        <Input placeholder="e.g. हाथ से बनी बनारसी रेशमी साड़ी, Azure Ceramic Vase..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Multilingual Controls for Name & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/30 border rounded-md">
                  <FormField
                    control={form.control}
                    name="inputLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <Globe2 className="h-3 w-3 text-primary" /> Product Name Language
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-xs h-8 bg-background">
                              <SelectValue placeholder="Input language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-56">
                            {SUPPORTED_LANGUAGES.map((l) => (
                              <SelectItem key={`in-${l.value}`} value={l.value} className="text-xs">
                                {l.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descriptionLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <Globe2 className="h-3 w-3 text-primary" /> Primary Description Language
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-xs h-8 bg-background">
                              <SelectValue placeholder="Output language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-56">
                            {SUPPORTED_LANGUAGES.map((l) => (
                              <SelectItem key={`out-${l.value}`} value={l.value} className="text-xs">
                                {l.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Primary Description in Selected Language */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="flex items-center gap-1.5">
                          Description ({descriptionLanguageVal})
                        </FormLabel>
                        <div className="flex items-center gap-1">
                          <VoiceRecorder
                            variant="ghost"
                            size="sm"
                            buttonLabel="Voice Details"
                            className="h-7 text-xs gap-1 text-primary hover:text-primary/80"
                            defaultLanguage={descriptionLanguageVal}
                            productName={productNameVal}
                            title="Speak craft specifications & generate multilingual descriptions"
                            onTranscriptionComplete={(text) => {
                              const current = form.getValues('description');
                              form.setValue('description', current ? `${current}\n${text}` : text);
                            }}
                            onDescriptionsGenerated={({ description, englishDescription }) => {
                              form.setValue('description', description);
                              if (englishDescription) {
                                form.setValue('englishDescription', englishDescription);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleGenerateDescription}
                            disabled={isGeneratingDesc}
                            className="h-7 text-xs gap-1.5 text-primary hover:text-primary/80"
                          >
                            {isGeneratingDesc ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-3 w-3" />
                                AI Generate (Native + English)
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="relative">
                        <FormControl>
                          <Textarea
                            placeholder="Describe your product in the selected language..."
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <div className="absolute bottom-2.5 right-2.5">
                          <VoiceRecorder
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full bg-background/90 shadow-sm border hover:bg-muted"
                            defaultLanguage={descriptionLanguageVal}
                            productName={productNameVal}
                            title="Speak product details & craft notes"
                            onTranscriptionComplete={(text) => {
                              const current = form.getValues('description');
                              form.setValue('description', current ? `${current}\n${text}` : text);
                            }}
                            onDescriptionsGenerated={({ description, englishDescription }) => {
                              form.setValue('description', description);
                              if (englishDescription) {
                                form.setValue('englishDescription', englishDescription);
                              }
                            }}
                          />
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Corresponding English Description (Editable & Saved) */}
                <FormField
                  control={form.control}
                  name="englishDescription"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          <Globe2 className="h-3.5 w-3.5 text-primary" />
                          English Description (अंग्रेजी विवरण / International Listing)
                        </FormLabel>
                        <span className="text-[11px] text-muted-foreground">Auto-generated or custom editable</span>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Corresponding English description for international buyers..."
                          rows={4}
                          className="text-xs bg-muted/10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Comprehensive Craft Specifications & Provenance */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#8b4513]" />
                  <div>
                    <CardTitle className="text-base">Authenticity & Product Specifications</CardTitle>
                    <CardDescription className="text-xs">
                      Provide technical craft details to build buyer trust and display on the provenance certificate.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="craftTechnique"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Craft Technique (शिल्प विधि)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Hand Block Print, Dhokra Casting, Zari Weaving" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weightGrams"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Weight (Approx grams)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-md space-y-3">
                  <FormField
                    control={form.control}
                    name="giCertified"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel className="text-xs font-semibold text-amber-950 flex items-center gap-1.5 cursor-pointer">
                            <Award className="h-3.5 w-3.5 text-amber-700" />
                            GI (Geographical Indication) Certified?
                          </FormLabel>
                          <p className="text-[11px] text-amber-800/80">
                            Check this if your craft has an official Government of India GI registration tag.
                          </p>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-amber-300 text-[#8b4513] focus:ring-[#8b4513]"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {giCertifiedVal && (
                    <FormField
                      control={form.control}
                      name="giCertificateNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[11px] font-medium text-amber-900">GI Registration / Tag No. (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. GI-APP-NO-124 (Jaipur Blue Pottery)" className="bg-white text-xs h-8" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="careInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Care & Maintenance Instructions</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Dry clean only, gentle damp cloth wipe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="packageContents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Package Contents (डिब्बे में क्या है)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 1 Ceramic Urn, 1 Artisan Provenance Card" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Images</CardTitle>
                    <CardDescription>
                      Upload high-quality images. Use AI to enhance them.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 border-primary/20 text-[#5e2c18]"
                    onClick={handleVisionScan}
                    disabled={isAnalyzingImage || images.length === 0}
                  >
                    {isAnalyzingImage ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Cpu className="h-3 w-3" />
                        Computer Vision Scan
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ImageEnhancer images={images} setImages={setImages} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>AI Generated Insights</CardTitle>
                <CardDescription>
                  Generate tags to help customers discover your product.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  onClick={handleInsights}
                  disabled={isGenerating}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGenerating
                    ? 'Generating...'
                    : 'Generate Insights with AI'}
                </Button>
                {[
                  { title: 'Features', list: features, setter: setFeatures },
                  {
                    title: 'Style Tags',
                    list: styleTags,
                    setter: setStyleTags,
                  },
                  { title: 'Use Cases', list: useCases, setter: setUseCases },
                ].map(
                  ({ title, list, setter }) =>
                    list.length > 0 && (
                      <div key={title}>
                        <h3 className="text-sm font-medium mb-2">{title}</h3>
                        <div className="flex flex-wrap gap-2">
                          {list.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                              <button
                                type="button"
                                className="ml-1"
                                onClick={() => removeTag(list, setter, tag)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pricing & Category</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 border-primary/20 text-[#5e2c18]"
                    onClick={handlePredictPrice}
                    disabled={isPredictingPrice}
                  >
                    {isPredictingPrice ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Coins className="h-3 w-3" />
                        AI Price Predictor
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span>
                          <Input type="number" placeholder="0.00" className="pl-7" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Craftsmanship Mode: Handmade vs Semi-Handmade vs Machine */}
                <FormField
                  control={form.control}
                  name="craftsmanship"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-1.5 font-semibold text-xs">
                        <Hammer className="h-3.5 w-3.5 text-[#8b4513]" />
                        Craftsmanship Mode (कारीगरी का प्रकार)
                      </FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => field.onChange('handmade')}
                          className={`p-2.5 rounded-md border text-left text-xs transition-all flex flex-col gap-1 ${
                            field.value === 'handmade'
                              ? 'border-[#8b4513] bg-amber-50 text-amber-950 ring-1 ring-[#8b4513]'
                              : 'border-border/60 hover:border-border hover:bg-muted/40'
                          }`}
                        >
                          <span className="font-bold flex items-center gap-1">
                            ✋ 100% Handmade
                          </span>
                          <span className="text-[10px] text-muted-foreground leading-tight">
                            शुद्ध हस्तनिर्मित
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => field.onChange('semi_handmade')}
                          className={`p-2.5 rounded-md border text-left text-xs transition-all flex flex-col gap-1 ${
                            field.value === 'semi_handmade'
                              ? 'border-[#8b4513] bg-amber-50 text-amber-950 ring-1 ring-[#8b4513]'
                              : 'border-border/60 hover:border-border hover:bg-muted/40'
                          }`}
                        >
                          <span className="font-bold flex items-center gap-1">
                            🧵 Semi / Handloom
                          </span>
                          <span className="text-[10px] text-muted-foreground leading-tight">
                            पारंपरिक हथकरघा
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => field.onChange('machine_assisted')}
                          className={`p-2.5 rounded-md border text-left text-xs transition-all flex flex-col gap-1 ${
                            field.value === 'machine_assisted'
                              ? 'border-[#8b4513] bg-amber-50 text-amber-950 ring-1 ring-[#8b4513]'
                              : 'border-border/60 hover:border-border hover:bg-muted/40'
                          }`}
                        >
                          <span className="font-bold flex items-center gap-1">
                            ⚙️ Machine-Assisted
                          </span>
                          <span className="text-[10px] text-muted-foreground leading-tight">
                            मशीन सहायता प्राप्त
                          </span>
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Craft Category (शिल्प श्रेणी)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Select a craft category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-60">
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat} className="text-xs">
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Craft Region / State (राज्य व क्षेत्र)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Select your State / Union Territory" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-60">
                          {regions.map((reg) => (
                            <SelectItem key={reg} value={reg} className="text-xs">
                              {reg}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Authentic Raw Material (कच्चा माल)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-xs">
                            <SelectValue placeholder="Select raw material" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-60">
                          {[
                            "Terracotta & Natural Clay",
                            "Multani Mitti & Quartz",
                            "Khadi Cotton",
                            "Mulberry & Tussar Silk",
                            "Natural Vegetable Dyes",
                            "Changthangi Cashmere Wool",
                            "Jute & Coir",
                            "Bamboo & Cane",
                            "Sikki Grass & Sabai Grass",
                            "Sheesham & Teak Wood",
                            "Sandalwood & Rosewood",
                            "Walnut Wood",
                            "Brass & Bell Metal",
                            "Copper & Bronze (Kansa)",
                            "Wrought Iron (Bastar Loha)",
                            "Pure Chandi / Silver Alloy",
                            "Makrana Marble & Soft Stone",
                            "Lac & Natural Resins",
                            "Glass & Mirror Beads",
                            "Vegetable Tanned Leather",
                            "Handmade Cotton Rag Paper",
                          ].map((mat) => (
                            <SelectItem key={mat} value={mat} className="text-xs">
                              {mat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Labor Time (Hours / Days with Quick Presets) */}
                <div className="space-y-2 p-3 bg-muted/30 border rounded-md">
                  <div className="flex items-center justify-between">
                    <FormLabel className="flex items-center gap-1.5 text-xs font-semibold">
                      <Clock className="h-3.5 w-3.5 text-primary" /> Crafting Time (बनाने में लगा समय)
                    </FormLabel>
                    <div className="flex items-center gap-1 text-[11px] bg-background p-0.5 rounded border">
                      <button
                        type="button"
                        onClick={() => form.setValue('laborTimeUnit', 'hours')}
                        className={`px-2 py-0.5 rounded ${
                          laborTimeUnit === 'hours' ? 'bg-[#8b4513] text-white font-semibold' : 'text-muted-foreground'
                        }`}
                      >
                        Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => form.setValue('laborTimeUnit', 'days')}
                        className={`px-2 py-0.5 rounded ${
                          laborTimeUnit === 'days' ? 'bg-[#8b4513] text-white font-semibold' : 'text-muted-foreground'
                        }`}
                      >
                        Days
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name="laborTimeValue"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              step={laborTimeUnit === 'days' ? '0.5' : '1'}
                              min="0.5"
                              placeholder={laborTimeUnit === 'days' ? 'e.g. 2' : 'e.g. 6'}
                              className="text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <span className="text-xs text-muted-foreground font-medium min-w-[70px]">
                      {laborTimeUnit === 'days' ? `Days (~${computedLaborHours}h)` : 'Total Hours'}
                    </span>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-muted-foreground">Quick:</span>
                    {(laborTimeUnit === 'hours' ? [2, 4, 8, 16] : [1, 2, 5, 10]).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => form.setValue('laborTimeValue', preset)}
                        className="text-[10px] px-2 py-0.5 rounded border bg-background hover:bg-muted text-muted-foreground"
                      >
                        {preset} {laborTimeUnit === 'hours' ? 'hrs' : 'days'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Relatable Dimensions & Size Selector */}
                <div className="space-y-2.5 p-3 bg-muted/30 border rounded-md">
                  <div className="flex items-center justify-between">
                    <FormLabel className="flex items-center gap-1.5 text-xs font-semibold">
                      <Ruler className="h-3.5 w-3.5 text-primary" /> Product Dimensions & Size
                    </FormLabel>
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                      ≈ {computedSizeSqft} sq ft
                    </span>
                  </div>

                  {/* Dimension Type Tabs */}
                  <div className="grid grid-cols-4 gap-1 text-[11px] bg-background p-0.5 rounded border">
                    <button
                      type="button"
                      onClick={() => form.setValue('dimensionType', 'dimensions')}
                      className={`py-1 text-center rounded transition-all ${
                        dimensionType === 'dimensions' ? 'bg-[#8b4513] text-white font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      L × W × H
                    </button>
                    <button
                      type="button"
                      onClick={() => form.setValue('dimensionType', 'apparel')}
                      className={`py-1 text-center rounded transition-all ${
                        dimensionType === 'apparel' ? 'bg-[#8b4513] text-white font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      Apparel / Fabric
                    </button>
                    <button
                      type="button"
                      onClick={() => form.setValue('dimensionType', 'circular')}
                      className={`py-1 text-center rounded transition-all ${
                        dimensionType === 'circular' ? 'bg-[#8b4513] text-white font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      Round / Pot
                    </button>
                    <button
                      type="button"
                      onClick={() => form.setValue('dimensionType', 'custom_sqft')}
                      className={`py-1 text-center rounded transition-all ${
                        dimensionType === 'custom_sqft' ? 'bg-[#8b4513] text-white font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      Sq Ft Direct
                    </button>
                  </div>

                  {/* Standard L x W x H */}
                  {dimensionType === 'dimensions' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Measurement Unit:</span>
                        <div className="flex items-center gap-1 text-[10px]">
                          {(['in', 'cm', 'ft'] as const).map((unit) => (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => form.setValue('dimensionUnit', unit)}
                              className={`px-2 py-0.5 rounded border ${
                                dimensionUnit === unit ? 'bg-[#8b4513] text-white font-semibold' : 'bg-background'
                              }`}
                            >
                              {unit === 'in' ? 'Inches (in)' : unit === 'cm' ? 'Centimeters (cm)' : 'Feet (ft)'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <FormField
                          control={form.control}
                          name="length"
                          render={({ field }) => (
                            <FormItem>
                              <span className="text-[10px] text-muted-foreground">Length ({dimensionUnit})</span>
                              <FormControl>
                                <Input type="number" step="0.5" className="text-xs h-8" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="width"
                          render={({ field }) => (
                            <FormItem>
                              <span className="text-[10px] text-muted-foreground">Width ({dimensionUnit})</span>
                              <FormControl>
                                <Input type="number" step="0.5" className="text-xs h-8" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="height"
                          render={({ field }) => (
                            <FormItem>
                              <span className="text-[10px] text-muted-foreground">Height ({dimensionUnit})</span>
                              <FormControl>
                                <Input type="number" step="0.5" className="text-xs h-8" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Apparel / Fabric Presets */}
                  {dimensionType === 'apparel' && (
                    <div className="space-y-2 pt-1">
                      <FormField
                        control={form.control}
                        name="apparelSize"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="text-xs h-8">
                                  <SelectValue placeholder="Select apparel size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[
                                  'Free Size',
                                  'S (Small)',
                                  'M (Medium)',
                                  'L (Large)',
                                  'XL (Extra Large)',
                                  'XXL (Double Extra Large)',
                                  'Saree (5.5m)',
                                  'Shawl / Stole',
                                  'Dhurrie / Rug (Small)',
                                  'Dhurrie / Rug (Medium)',
                                ].map((size) => (
                                  <SelectItem key={size} value={size} className="text-xs">
                                    {size}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Circular / Diameter */}
                  {dimensionType === 'circular' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Measurement Unit:</span>
                        <div className="flex items-center gap-1 text-[10px]">
                          {(['in', 'cm'] as const).map((unit) => (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => form.setValue('dimensionUnit', unit)}
                              className={`px-2 py-0.5 rounded border ${
                                dimensionUnit === unit ? 'bg-[#8b4513] text-white font-semibold' : 'bg-background'
                              }`}
                            >
                              {unit === 'in' ? 'Inches (in)' : 'Centimeters (cm)'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name="diameter"
                          render={({ field }) => (
                            <FormItem>
                              <span className="text-[10px] text-muted-foreground">Diameter ({dimensionUnit})</span>
                              <FormControl>
                                <Input type="number" step="0.5" className="text-xs h-8" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="height"
                          render={({ field }) => (
                            <FormItem>
                              <span className="text-[10px] text-muted-foreground">Height / Depth ({dimensionUnit})</span>
                              <FormControl>
                                <Input type="number" step="0.5" className="text-xs h-8" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Direct Sq Ft Input */}
                  {dimensionType === 'custom_sqft' && (
                    <div className="pt-1">
                      <FormField
                        control={form.control}
                        name="sizeSqft"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="1.0" className="text-xs h-8" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>

                {pricingInfo && (
                  <div className="p-3 bg-green-50/50 border border-green-200 text-left text-xs space-y-1.5 rounded-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-green-900">AI Fair Price Breakdown:</span>
                      {pricingInfo.craft_tier && (
                        <span className="text-[10px] bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded-full border border-green-300">
                          {pricingInfo.craft_tier}
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground flex justify-between">
                      <span>Artisan Labor Wage:</span>
                      <span className="font-semibold text-foreground">₹{pricingInfo.labor_cost}</span>
                    </div>
                    <div className="text-muted-foreground flex justify-between">
                      <span>Material Cost Factor:</span>
                      <span className="font-semibold text-foreground">x{pricingInfo.material_factor}</span>
                    </div>
                    <div className="text-muted-foreground flex justify-between">
                      <span>Sustainably Sourced Value:</span>
                      <span className="font-semibold text-foreground">+₹{pricingInfo.sustainability_premium}</span>
                    </div>
                    {pricingInfo.price_range && (
                      <div className="text-muted-foreground text-[11px] pt-1.5 border-t border-green-200 flex justify-between font-mono">
                        <span>Suggested Range:</span>
                        <span className="font-bold text-green-700">₹{pricingInfo.price_range.min} - ₹{pricingInfo.price_range.max}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : (product ? 'Save Changes' : 'Create Product')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
