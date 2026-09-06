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
import { products, categories } from '@/lib/data';
import type { Product } from '@/lib/types';
import VoiceRecorder from '@/features/ai/components/voice-recorder';
import ImageEnhancer from './image-enhancer';
import { generateProductInsights } from '@/ai/flows/generate-product-insights';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { analyzeImage } from '@/ai/flows/analyze-image';
import { useToast } from '@/hooks/use-toast';
import { useBackend } from '@/hooks/use-backend';
import { Badge } from '@/components/ui/badge';
import { db } from '@/services/firebase/firestore';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Sparkles, Trash2, X, Wand2, Loader2, Cpu, Clock, Scale, Coins } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description is too short'),
  price: z.coerce.number().positive('Price must be a positive number'),
  category: z.string().min(1, 'Please select a category'),
  laborHours: z.coerce.number().default(5),
  sizeSqft: z.coerce.number().default(1),
  material: z.string().default('Natural Vegetable Dyes'),
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
      description: product?.description || '',
      price: product?.price || 0,
      category: product?.category || '',
      laborHours: 5,
      sizeSqft: 1,
      material: 'Natural Vegetable Dyes',
    },
  });

  const handlePredictPrice = async () => {
    setIsPredictingPrice(true);
    try {
      const values = form.getValues();
      const data = await backendPost<{ recommended_price: number }>('/api/predict-price', {
        category: values.category || 'Home Decor',
        material: values.material || 'Natural Vegetable Dyes',
        labor_hours: Number(values.laborHours) || 5,
        size_sqft: Number(values.sizeSqft) || 1,
        is_organic: true,
      });
      setPricingInfo(data);
      form.setValue('price', data.recommended_price);
        toast({
          title: "AI Suggested Price Applied!",
          description: `Suggested price: ₹${data.recommended_price} based on labor & materials.`
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
      const productData = {
        artisanId: user?.id || 'artisan-1',
        name: values.name,
        description: values.description,
        category: values.category,
        price: values.price,
        currency: 'INR',
        stock: 10, // Default stock
        images: images,
        tagline: values.description.substring(0, 50) + '...', // Generate tagline from description
        isActive: true,
        status: 'active',
        aiInsights: {
          keyFeatures: features,
          styleTags: styleTags,
          useCases: useCases
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (product) {
        // Update existing product logic would go here
        const localProducts = JSON.parse(localStorage.getItem('viraasat_local_products') || '[]');
        const updatedLocal = localProducts.map((p: any) => p.id === product.id ? { ...p, ...productData } : p);
        localStorage.setItem('viraasat_local_products', JSON.stringify(updatedLocal));
      } else {
        // Fallback/Demo sync: Save product to local storage so it registers in the marketplace
        const localProducts = JSON.parse(localStorage.getItem('viraasat_local_products') || '[]');
        const newProduct = { ...productData, id: `local-prod-${Date.now()}` };
        localProducts.push(newProduct);
        localStorage.setItem('viraasat_local_products', JSON.stringify(localProducts));

        if (db) {
          await addDoc(collection(db, "products"), productData);
        } else {
          console.warn("Firebase DB not initialized. Product saved locally only.");
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      toast({
        title: 'Product Saved',
        description: `${values.name} has been successfully saved.`,
      });

      router.push('/artisan/products');
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
    if (!name || name.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Product Name Required',
        description: 'Please enter a product name (at least 3 characters) before generating a description.',
      });
      return;
    }

    setIsGeneratingDesc(true);
    try {
      const result = await generateProductDescription({ productName: name });
      form.setValue('description', result.description);
      toast({
        title: '✨ Description Generated!',
        description: 'AI has crafted a culturally rich description for your product.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate description. Please try again.',
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
                <CardTitle>Product Details</CardTitle>
                <CardDescription>
                  Enter the main details for your product.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Azure Ceramic Vase" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Description</FormLabel>
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
                              AI Generate
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="relative">
                        <FormControl>
                          <Textarea
                            placeholder="Describe your product..."
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <VoiceRecorder
                          onTranscriptionComplete={(text) =>
                            form.setValue('description', text)
                          }
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
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
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raw Material</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            "Natural Vegetable Dyes",
                            "Multani Mitti & Quartz",
                            "Changthangi Cashmere Wool",
                            "Pure Chandi / Silver Alloy",
                            "Khadi Cotton"
                          ].map((mat) => (
                            <SelectItem key={mat} value={mat}>
                              {mat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="laborHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 opacity-60" /> Labor Hours</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sizeSqft"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><Scale className="h-3.5 w-3.5 opacity-60" /> Size (sq ft)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {pricingInfo && (
                  <div className="p-3 bg-green-50/50 border border-green-200 text-left text-xs space-y-1 rounded-sm">
                    <div className="font-bold text-green-800">Suggested Price Details:</div>
                    <div>Estimated Labor Cost: ₹{pricingInfo.labor_cost}</div>
                    <div>Material Multiplier: x{pricingInfo.material_factor}</div>
                    <div>Sustainability Sourcing Premium: +₹{pricingInfo.sustainability_premium}</div>
                    <div className="text-muted-foreground text-[10px] mt-1 font-mono">Suggested Range: ₹{pricingInfo.price_range.min} - ₹{pricingInfo.price_range.max}</div>
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
