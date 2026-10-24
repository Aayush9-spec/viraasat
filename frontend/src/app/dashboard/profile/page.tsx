'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Heart,
  Package,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/core/hooks/use-toast';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { supabase } from '@/services/supabase';
import { categories } from '@/lib/data';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export default function CustomerProfilePage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Shipping Address
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zip, setZip] = useState('');

  // Preferences
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from Clerk + localStorage on mount
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');

      // Load metadata or localStorage shipping address
      if (typeof window !== 'undefined') {
        try {
          const savedAddr = localStorage.getItem('customer_shipping_address');
          if (savedAddr) {
            const parsed = JSON.parse(savedAddr);
            if (parsed.address1) setAddress1(parsed.address1);
            if (parsed.address2) setAddress2(parsed.address2);
            if (parsed.city) setCity(parsed.city);
            if (parsed.stateName) setStateName(parsed.stateName);
            if (parsed.zip) setZip(parsed.zip);
            if (parsed.phone) setPhone(parsed.phone);
          }

          const savedPrefs = localStorage.getItem('customer_profile_preferences');
          if (savedPrefs) {
            const parsed = JSON.parse(savedPrefs);
            if (Array.isArray(parsed.interests)) {
              setSelectedInterests(parsed.interests);
            }
          }
        } catch {
          // ignore parsing error
        }
      }

      // Check Clerk unsafeMetadata fallback
      const meta = user.unsafeMetadata as Record<string, unknown> | undefined;
      if (meta?.phone && !phone) setPhone(String(meta.phone));
      if (meta?.interests && Array.isArray(meta.interests) && selectedInterests.length === 0) {
        setSelectedInterests(meta.interests as string[]);
      }
    }
  }, [user]);

  const toggleInterest = (category: string) => {
    setSelectedInterests((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      // 1. Update Clerk user profile (name and metadata)
      if (typeof user.update === 'function') {
        await user.update({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          unsafeMetadata: {
            ...user.unsafeMetadata,
            phone: phone.trim(),
            interests: selectedInterests,
            shippingAddress: {
              address1: address1.trim(),
              address2: address2.trim(),
              city: city.trim(),
              stateName: stateName.trim(),
              zip: zip.trim(),
            },
          },
        });
      }

      // 2. Save shipping address for 1-click checkout
      const shippingPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        city: city.trim(),
        stateName: stateName.trim(),
        zip: zip.trim(),
        phone: phone.trim(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'customer_shipping_address',
          JSON.stringify(shippingPayload)
        );
        localStorage.setItem(
          'customer_profile_preferences',
          JSON.stringify({ interests: selectedInterests })
        );
      }

      // 3. Upsert to Supabase
      try {
        await supabase.from('users').upsert({
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          display_name: `${firstName} ${lastName}`.trim() || user.fullName || 'Customer',
          role: 'buyer',
        });
      } catch (err) {
        console.warn('[Customer Profile] Supabase sync skipped:', err);
      }

      toast({
        title: 'Profile Updated',
        description: 'Your personal details, shipping address, and craft preferences have been saved.',
      });
    } catch (err: unknown) {
      console.error('Error saving customer profile:', err);
      toast({
        title: 'Update Failed',
        description: (err as Error)?.message || 'Could not save profile changes.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const email = user?.primaryEmailAddress?.emailAddress || '';
  const fullName = `${firstName} ${lastName}`.trim() || user?.fullName || 'Viraasat Patron';
  const avatarUrl = user?.imageUrl || '';
  const initial = (firstName?.[0] || user?.fullName?.[0] || 'C').toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <ProtectedRoute allowedRoles={['buyer', 'artisan']}>
      <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 md:p-8">
        {/* Header Hero Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-amber-800 via-primary to-amber-900 p-6 sm:p-8 text-white shadow-xl overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <Sparkles className="w-64 h-64" />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
            <Avatar className="h-20 w-20 ring-4 ring-white/20 shadow-md">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="bg-amber-950 text-white font-bold text-xl">
                {initial}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-heading font-bold">{fullName}</h1>
                <Badge className="bg-emerald-500/90 hover:bg-emerald-500 text-white border-none text-[11px] font-semibold gap-1">
                  <ShieldCheck className="h-3 w-3" /> Verified Patron
                </Badge>
              </div>
              <p className="text-amber-100/90 text-sm flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 opacity-80" /> {email}
              </p>
              <p className="text-xs text-amber-200/75">
                Member of Viraasat since {memberSince}
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto">
              <Button asChild size="sm" variant="secondary" className="bg-white/95 text-primary hover:bg-white font-semibold text-xs shadow-sm flex-1 sm:flex-initial">
                <Link href="/orders">
                  <Package className="mr-1.5 h-3.5 w-3.5" /> My Orders
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-semibold text-xs flex-1 sm:flex-initial">
                <Link href="/wishlist">
                  <Heart className="mr-1.5 h-3.5 w-3.5" /> My Wishlist
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="grid grid-cols-1 gap-6">
          {/* 1. Personal Information */}
          <Card className="border border-border shadow-md rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wide">
                <UserIcon className="h-4 w-4" /> Personal Details
              </div>
              <CardTitle className="text-xl font-heading">Your Identity</CardTitle>
              <CardDescription>
                Manage your name and contact number for order dispatches and account notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-semibold uppercase text-muted-foreground">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Priya"
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-semibold uppercase text-muted-foreground">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Sharma"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Verified via Clerk
                    </span>
                  </Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="h-11 bg-muted/50 cursor-not-allowed text-muted-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold uppercase text-muted-foreground">
                    Phone Number (for Courier & OTPs)
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-11 pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Default Shipping & Delivery Address */}
          <Card className="border border-border shadow-md rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wide">
                <MapPin className="h-4 w-4" /> Delivery Address
              </div>
              <CardTitle className="text-xl font-heading">Default Shipping Address</CardTitle>
              <CardDescription>
                Saved addresses are automatically pre-filled at checkout for instant 1-click purchasing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="address1" className="text-xs font-semibold uppercase text-muted-foreground">
                  Address Line 1 (House/Flat No., Building, Street)
                </Label>
                <Input
                  id="address1"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  placeholder="e.g. Flat 402, Royal Palms, MG Road"
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address2" className="text-xs font-semibold uppercase text-muted-foreground">
                  Address Line 2 (Landmark, Colony - Optional)
                </Label>
                <Input
                  id="address2"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  placeholder="e.g. Near City Heritage Garden"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-semibold uppercase text-muted-foreground">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Jaipur"
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stateName" className="text-xs font-semibold uppercase text-muted-foreground">
                    State
                  </Label>
                  <Select value={stateName} onValueChange={setStateName}>
                    <SelectTrigger id="stateName" className="h-11">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((st) => (
                        <SelectItem key={st} value={st}>
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="zip" className="text-xs font-semibold uppercase text-muted-foreground">
                    PIN Code (6 digits)
                  </Label>
                  <Input
                    id="zip"
                    maxLength={6}
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 302001"
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Heritage Interests */}
          <Card className="border border-border shadow-md rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wide">
                <Sparkles className="h-4 w-4" /> Heritage Curation
              </div>
              <CardTitle className="text-xl font-heading">Craft & Art Preferences</CardTitle>
              <CardDescription>
                Select your favorite traditional crafts to receive personalized recommendations from authentic artisans.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2.5">
                {categories.map((cat) => {
                  const isSelected = selectedInterests.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleInterest(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                          : 'bg-background hover:bg-muted text-foreground border-border'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '} {cat}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 4. Become an Artisan Banner */}
          <Card className="border border-amber-500/20 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-600" /> Are you an Indian artisan or master craftsperson?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Showcase your handcrafted creations, tell your heritage story, and reach conscious buyers across India and globally.
                </p>
              </div>
              <Button asChild className="bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white font-semibold text-xs px-5 h-11 shrink-0">
                <Link href="/apply">
                  Apply as Artisan <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Save Action */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="h-12 px-8 text-sm font-bold tracking-wide rounded-xl shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Save Profile & Address
              </>
            )}
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
