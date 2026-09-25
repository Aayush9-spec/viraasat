'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { categories } from '@/lib/data';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/services/supabase';
import { sendApplyReceipt } from '@/lib/notifications/email';

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

const applicationSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  workshopName: z.string().min(2, 'Workshop name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  pincode: z.string().length(6, 'Pincode must be 6 digits'),
  state: z.string().min(2, 'State is required'),
  craft: z.string().min(1, 'Please select a craft'),
});

export default function ArtisanApplicationPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portfolioFiles, setPortfolioFiles] = useState<{ name: string; url: string; size: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(false);

  const form = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: '',
      workshopName: '',
      email: '',
      phone: '',
      pincode: '',
      state: '',
      craft: '',
    },
  });

  const watchedPincode = form.watch('pincode');

  useEffect(() => {
    if (watchedPincode && watchedPincode.length === 6 && /^\d{6}$/.test(watchedPincode)) {
      async function autoDetectState(pin: string) {
        setIsLoadingState(true);
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
          const data = await res.json();
          if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
            const detectedState = data[0].PostOffice[0].State;
            const matched = INDIAN_STATES.find(
              (s) => s.toLowerCase() === detectedState.toLowerCase()
            );
            if (matched) {
              form.setValue('state', matched, { shouldValidate: true });
              toast({
                title: 'State Auto-Loaded!',
                description: `Selected ${matched} for pincode ${pin}.`,
              });
              setIsLoadingState(false);
              return;
            }
          }
        } catch {
          // Fallback to pincode prefix map if postal API is unreachable
        }

        const prefix = pin.substring(0, 2);
        let fallbackState = '';
        if (prefix === '11') fallbackState = 'Delhi';
        else if (['12', '13'].includes(prefix)) fallbackState = 'Haryana';
        else if (['14', '15', '16'].includes(prefix)) fallbackState = 'Punjab';
        else if (prefix === '17') fallbackState = 'Himachal Pradesh';
        else if (['18', '19'].includes(prefix)) fallbackState = 'Jammu and Kashmir';
        else if (['20', '21', '22', '23', '24', '25', '26', '27', '28'].includes(prefix)) fallbackState = 'Uttar Pradesh';
        else if (['30', '31', '32', '33', '34'].includes(prefix)) fallbackState = 'Rajasthan';
        else if (['36', '37', '38', '39'].includes(prefix)) fallbackState = 'Gujarat';
        else if (['40', '41', '42', '43', '44'].includes(prefix)) fallbackState = 'Maharashtra';
        else if (['45', '46', '47', '48'].includes(prefix)) fallbackState = 'Madhya Pradesh';
        else if (prefix === '49') fallbackState = 'Chhattisgarh';
        else if (['50', '51', '52', '53'].includes(prefix)) fallbackState = 'Andhra Pradesh';
        else if (['56', '57', '58', '59'].includes(prefix)) fallbackState = 'Karnataka';
        else if (['60', '61', '62', '63', '64'].includes(prefix)) fallbackState = 'Tamil Nadu';
        else if (['67', '68', '69'].includes(prefix)) fallbackState = 'Kerala';
        else if (['70', '71', '72', '73', '74'].includes(prefix)) fallbackState = 'West Bengal';
        else if (['75', '76', '77'].includes(prefix)) fallbackState = 'Odisha';
        else if (prefix === '78') fallbackState = 'Assam';
        else if (['80', '81', '82', '83', '84', '85'].includes(prefix)) fallbackState = 'Bihar';

        if (fallbackState) {
          form.setValue('state', fallbackState, { shouldValidate: true });
          toast({
            title: 'State Auto-Loaded!',
            description: `Set ${fallbackState} for pincode ${pin}.`,
          });
        }
        setIsLoadingState(false);
      }

      autoDetectState(watchedPincode);
    }
  }, [watchedPincode, form, toast]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `${file.name} exceeds the 10MB limit.`,
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
          setPortfolioFiles((prev) => [
            ...prev,
            { name: file.name, url: reader.result as string, size: sizeFormatted },
          ]);
          toast({
            title: 'File Uploaded!',
            description: `${file.name} added to portfolio.`,
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setPortfolioFiles((prev) => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(values: z.infer<typeof applicationSchema>) {
    setIsSubmitting(true);
    try {
      await supabase.from('artisan_applications').insert({
        applicant_id: user?.id || `anon_${Date.now()}`,
        full_name: values.fullName,
        workshop_name: values.workshopName,
        email: values.email,
        phone: values.phone,
        pincode: values.pincode,
        state: values.state,
        craft: values.craft,
        portfolio_images: portfolioFiles.map((f) => f.url),
        status: 'pending',
      });

      await sendApplyReceipt({
        to: values.email,
        name: values.fullName,
        craft: values.craft,
      });

      toast({
        title: 'Application Submitted!',
        description: 'Our team will review your application and get back to you in 3-5 business days.',
      });

      setTimeout(() => {
        router.push('/');
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to submit application:', error);
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: 'Something went wrong. Please try again.',
      });
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl border-2 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Become a Viraasat Artisan</CardTitle>
          <CardDescription>
            Tell us about your craft. We&apos;re excited to learn about your work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Priya Patel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workshopName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workshop / Brand Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Priya's Pottery" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="e.g. 9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 274304" maxLength={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between">
                        <span>State</span>
                        {isLoadingState && <Loader2 className="h-3 w-3 animate-spin text-amber-600" />}
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a State / UT" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {INDIAN_STATES.map((st) => (
                            <SelectItem key={st} value={st}>
                              {st}
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
                  name="craft"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Primary Craft Specialization</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <div className="md:col-span-2 space-y-3">
                  <FormLabel>
                    Portfolio Images {portfolioFiles.length > 0 && `(${portfolioFiles.length} uploaded)`}
                  </FormLabel>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`mt-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
                      isDragging ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50'
                    }`}
                  >
                    <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                    <div className="flex text-sm text-foreground gap-1 items-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md font-semibold text-primary hover:text-primary/80 focus-within:outline-none"
                      >
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e.target.files)}
                        />
                      </label>
                      <span className="text-muted-foreground">or drag and drop</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF, WEBP up to 10MB</p>
                  </div>

                  {portfolioFiles.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                      {portfolioFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-lg border bg-card p-2 shadow-sm flex flex-col items-center text-center"
                        >
                          <img
                            src={file.url}
                            alt={file.name}
                            className="h-20 w-full object-cover rounded-md mb-1.5"
                          />
                          <p className="text-xs font-medium truncate w-full px-1">{file.name}</p>
                          <span className="text-[10px] text-muted-foreground">{file.size}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 shadow hover:bg-destructive/90 transition-transform active:scale-95"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

