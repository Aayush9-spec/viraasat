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
import VoiceRecorder from './voice-recorder';
import ImageEnhancer from './image-enhancer';
import { generateProductInsights } from '@/ai/flows/generate-product-insights';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';
import { Sparkles, Trash2, X } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description is too short'),
  price: z.coerce.number().positive('Price must be a positive number'),
  category: z.string().min(1, 'Please select a category'),
});

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [features, setFeatures] = useState<string[]>(product?.aiInsights?.keyFeatures || []);
  const [styleTags, setStyleTags] = useState<string[]>(
    product?.aiInsights?.styleTags || []
  );
  const [useCases, setUseCases] = useState<string[]>(product?.aiInsights?.useCases || []);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price: product?.price || 0,
      category: product?.category || '',
    },
  });

  function onSubmit(values: z.infer<typeof productSchema>) {
    console.log({
      ...values,
      images,
      features,
      styleTags,
      useCases,
    });
    toast({
      title: 'Product Saved',
      description: `${values.name} has been successfully saved.`,
    });
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
                      <FormLabel>Description</FormLabel>
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
                <CardTitle>Product Images</CardTitle>
                <CardDescription>
                  Upload high-quality images. Use AI to enhance them.
                </CardDescription>
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
                <CardTitle>Pricing & Category</CardTitle>
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
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
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
              </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button type="submit" className="w-full">
                        {product ? 'Save Changes' : 'Create Product'}
                    </Button>
                </CardContent>
             </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
