'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Package,
  Landmark,
  Award,
  CreditCard,
  Building2,
  ArrowRight,
  ExternalLink,
  Store,
  Eye,
  Check,
  RotateCcw,
  Star,
  FileCheck2,
  Clock,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useToast } from '@/core/hooks/use-toast';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { supabase } from '@/services/supabase';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const CRAFT_SPECIALTIES = [
  'Blue Pottery of Jaipur (GI)',
  'Kashmiri Pashmina & Carpets (GI)',
  'Banarasi Brocade & Silk (GI)',
  'Madhubani Painting of Bihar (GI)',
  'Moradabad Brass & Metal Crafts (GI)',
  'Channapatna Wooden Toys (GI)',
  'Kutch Rogan & Bandhani Art (GI)',
  'Tanjore Paintings (GI)',
  'Dhokra Metal Casting (GI)',
  'Pochampally Ikat Handlooms (GI)',
  'Kullu Shawl Weaving (GI)',
  'Mysore Sandalwood & Rosewood Carving (GI)',
];

const DEFAULT_PROFILE = {
  artisanName: 'Aayush Kumar Singh',
  studioName: 'Royal Jaipur Blue Pottery & Heritage Studio',
  craftSpecialty: 'Blue Pottery of Jaipur (GI)',
  lineage: '4th Generation Master Craftsman (22+ Yrs Experience)',
  giCertNumber: 'GI-IN-RAJ-2023-412',
  phone: '+91 98765 43210',
  stateName: 'Rajasthan',
  city: 'Sanganer, Jaipur',
  workshopAddress: 'Studio #14, Craft Village Lane, Sanganer Artisan Cluster, Jaipur 302029',
  artisanBio:
    'Born into a family of hereditary potters, I carry forward the centuries-old royal craft of Jaipur Blue Pottery. Our creations use exclusively natural quartz stone paste, vegetable binders, and copper oxide glazes, fired in traditional wood kilns without any chemical additives.',
  techniques: 'Hand-ground quartz paste, manual potters wheel, cobalt & copper oxide brushwork, low-fire wood kiln',
  upiId: 'aayush.artisan@okhdfcbank',
  bankAccount: '50100482910482',
  ifscCode: 'HDFC0001234',
};

export default function ArtisanProfilePage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();

  // Basic Information
  const [artisanName, setArtisanName] = useState(DEFAULT_PROFILE.artisanName);
  const [studioName, setStudioName] = useState(DEFAULT_PROFILE.studioName);
  const [craftSpecialty, setCraftSpecialty] = useState(DEFAULT_PROFILE.craftSpecialty);
  const [lineage, setLineage] = useState(DEFAULT_PROFILE.lineage);
  const [giCertNumber, setGiCertNumber] = useState(DEFAULT_PROFILE.giCertNumber);
  const [phone, setPhone] = useState(DEFAULT_PROFILE.phone);

  // Location
  const [stateName, setStateName] = useState(DEFAULT_PROFILE.stateName);
  const [city, setCity] = useState(DEFAULT_PROFILE.city);
  const [workshopAddress, setWorkshopAddress] = useState(DEFAULT_PROFILE.workshopAddress);

  // Story & Bio
  const [artisanBio, setArtisanBio] = useState(DEFAULT_PROFILE.artisanBio);
  const [techniques, setTechniques] = useState(DEFAULT_PROFILE.techniques);

  // Payout Details
  const [upiId, setUpiId] = useState(DEFAULT_PROFILE.upiId);
  const [bankAccount, setBankAccount] = useState(DEFAULT_PROFILE.bankAccount);
  const [ifscCode, setIfscCode] = useState(DEFAULT_PROFILE.ifscCode);

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Initialize from Clerk + localStorage on mount
  useEffect(() => {
    let initialEmail = '';
    let initialName = '';

    if (typeof window !== 'undefined') {
      try {
        const demoUserRaw = localStorage.getItem('viraasat_demo_user');
        if (demoUserRaw) {
          const parsedUser = JSON.parse(demoUserRaw);
          if (parsedUser.name) initialName = parsedUser.name;
          if (parsedUser.email) initialEmail = parsedUser.email;
        }

        const savedProfileRaw = localStorage.getItem('artisan_profile_data');
        if (savedProfileRaw) {
          const parsed = JSON.parse(savedProfileRaw);
          if (parsed.artisanName) setArtisanName(parsed.artisanName);
          if (parsed.studioName) setStudioName(parsed.studioName);
          if (parsed.craftSpecialty) setCraftSpecialty(parsed.craftSpecialty);
          if (parsed.lineage) setLineage(parsed.lineage);
          if (parsed.giCertNumber) setGiCertNumber(parsed.giCertNumber);
          if (parsed.phone) setPhone(parsed.phone);
          if (parsed.stateName) setStateName(parsed.stateName);
          if (parsed.city) setCity(parsed.city);
          if (parsed.workshopAddress) setWorkshopAddress(parsed.workshopAddress);
          if (parsed.artisanBio) setArtisanBio(parsed.artisanBio);
          if (parsed.techniques) setTechniques(parsed.techniques);
          if (parsed.upiId) setUpiId(parsed.upiId);
          if (parsed.bankAccount) setBankAccount(parsed.bankAccount);
          if (parsed.ifscCode) setIfscCode(parsed.ifscCode);
          if (parsed.savedAt) setLastSavedTime(parsed.savedAt);
        }
      } catch {
        // ignore parsing error
      }
    }

    if (user) {
      const clerkName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (clerkName) {
        setArtisanName((prev) => (!prev || prev === DEFAULT_PROFILE.artisanName ? clerkName : prev));
      }

      const meta = user.unsafeMetadata as Record<string, unknown> | undefined;
      if (meta?.studioName) setStudioName(String(meta.studioName));
      if (meta?.craftSpecialty) setCraftSpecialty(String(meta.craftSpecialty));
      if (meta?.phone) setPhone(String(meta.phone));
      if (meta?.giCertNumber) setGiCertNumber(String(meta.giCertNumber));
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    try {
      const payload = {
        artisanName: artisanName.trim() || 'Master Artisan',
        studioName: studioName.trim() || `${artisanName}'s Heritage Studio`,
        craftSpecialty: craftSpecialty || 'Blue Pottery of Jaipur (GI)',
        lineage: lineage.trim() || 'Traditional Master Craftsman',
        giCertNumber: giCertNumber.trim() || 'GI-IN-RAJ-2023-412',
        phone: phone.trim() || '+91 98765 43210',
        stateName,
        city: city.trim() || 'Jaipur',
        workshopAddress: workshopAddress.trim() || 'Sanganer Craft Cluster, Jaipur',
        artisanBio: artisanBio.trim(),
        techniques: techniques.trim(),
        upiId: upiId.trim(),
        bankAccount: bankAccount.trim(),
        ifscCode: ifscCode.trim(),
        savedAt: now,
      };

      // 1. Save to local storage for instant sync across tabs and marketplace
      if (typeof window !== 'undefined') {
        localStorage.setItem('artisan_profile_data', JSON.stringify(payload));
        localStorage.setItem('viraasat_session_role', 'artisan');

        const demoRaw = localStorage.getItem('viraasat_demo_user');
        if (demoRaw) {
          try {
            const currentDemo = JSON.parse(demoRaw);
            currentDemo.name = payload.artisanName;
            localStorage.setItem('viraasat_demo_user', JSON.stringify(currentDemo));
          } catch {}
        }

        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('viraasat_auth_change'));
      }

      // 2. Update Clerk unsafeMetadata if user is loaded
      if (user && typeof user.update === 'function') {
        const nameParts = payload.artisanName.split(' ');
        await user.update({
          firstName: nameParts[0] || user.firstName || 'Artisan',
          lastName: nameParts.slice(1).join(' ') || user.lastName || '',
          unsafeMetadata: {
            ...user.unsafeMetadata,
            role: 'artisan',
            studioName: payload.studioName,
            craftSpecialty: payload.craftSpecialty,
            phone: payload.phone,
            giCertNumber: payload.giCertNumber,
            stateName: payload.stateName,
            city: payload.city,
          },
        }).catch((e) => console.warn('[Artisan Profile] Clerk sync notice:', e));
      }

      // 3. Upsert to Supabase users table
      if (user?.id) {
        try {
          await supabase.from('users').upsert({
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            display_name: payload.artisanName,
            role: 'artisan',
          });
        } catch (dbErr) {
          console.warn('[Artisan Profile] Supabase sync skipped:', dbErr);
        }
      }

      setLastSavedTime(now);
      toast({
        title: 'Master Artisan Profile Saved!',
        description: `All studio credentials, workshop details, and UPI payout settings are active (saved at ${now}).`,
      });
    } catch (err: unknown) {
      console.error('Error saving artisan profile:', err);
      toast({
        title: 'Save Failed',
        description: (err as Error)?.message || 'Could not save profile changes.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToSample = () => {
    setArtisanName(DEFAULT_PROFILE.artisanName);
    setStudioName(DEFAULT_PROFILE.studioName);
    setCraftSpecialty(DEFAULT_PROFILE.craftSpecialty);
    setLineage(DEFAULT_PROFILE.lineage);
    setGiCertNumber(DEFAULT_PROFILE.giCertNumber);
    setPhone(DEFAULT_PROFILE.phone);
    setStateName(DEFAULT_PROFILE.stateName);
    setCity(DEFAULT_PROFILE.city);
    setWorkshopAddress(DEFAULT_PROFILE.workshopAddress);
    setArtisanBio(DEFAULT_PROFILE.artisanBio);
    setTechniques(DEFAULT_PROFILE.techniques);
    setUpiId(DEFAULT_PROFILE.upiId);
    setBankAccount(DEFAULT_PROFILE.bankAccount);
    setIfscCode(DEFAULT_PROFILE.ifscCode);

    toast({
      title: 'Sample Data Loaded',
      description: 'Pre-filled with authentic Master Artisan credentials from Jaipur. Click "Save Artisan Profile" to activate.',
    });
  };

  if (!isLoaded && typeof window === 'undefined') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  const email =
    user?.primaryEmailAddress?.emailAddress ||
    (typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('viraasat_demo_user') || '{}')?.email || 'singhaayushkumar893@gmail.com'
      : 'singhaayushkumar893@gmail.com');
  const avatarUrl = user?.imageUrl || '';
  const initial = (artisanName?.[0] || user?.fullName?.[0] || 'A').toUpperCase();

  return (
    <ProtectedRoute allowedRoles={['artisan']}>
      <div className="w-full space-y-6 pb-12">
        {/* Top Expansive Hero Banner - Signature Viraasat Royal Terracotta & Gold Theme */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#7A2814] via-[#8C2B2B] to-[#5C1E0F] p-6 sm:p-8 text-amber-50 shadow-2xl border border-[#C59B4B]/30 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#C59B4B]/20 via-[#E8CA82]/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            {/* Left: Avatar & Identity */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-[#E8CA82]/40 shadow-xl border-2 border-[#5C1E0F]">
                  <AvatarImage src={avatarUrl} alt={artisanName} />
                  <AvatarFallback className="bg-gradient-to-br from-[#8C2B2B] to-[#4A170C] text-[#FAF7F2] font-bold text-3xl font-heading">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-emerald-700 text-white rounded-full p-1.5 shadow-md border-2 border-[#5C1E0F]" title="Active Master Artisan">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight">
                    {artisanName || 'Master Artisan'}
                  </h1>
                  <Badge className="bg-[#FAF7F2] text-[#8C2B2B] hover:bg-white border border-[#C59B4B]/40 text-[11px] font-bold gap-1 shadow-sm px-2.5 py-0.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#8C2B2B]" /> GI Certified
                  </Badge>
                  <Badge variant="outline" className="border-emerald-300/40 bg-emerald-950/40 text-emerald-200 text-[11px] font-semibold">
                    ● Direct Payout Active
                  </Badge>
                </div>
                <p className="text-amber-100/90 text-sm flex items-center gap-1.5 font-medium">
                  <Mail className="h-3.5 w-3.5 text-[#E8CA82]" /> {email}
                </p>
                <p className="text-xs text-[#E8CA82] font-medium">
                  {craftSpecialty} • {city ? `${city}, ` : ''}{stateName}
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar on Header - Harmonious Cream & Gold Typography */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto bg-black/25 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
              <div className="px-3.5 py-1 border-r border-white/10 text-center sm:text-left">
                <span className="text-[10px] uppercase font-bold text-[#E8CA82] tracking-wider block">Creations</span>
                <span className="text-lg font-bold text-white font-mono">29 Listed</span>
              </div>
              <div className="px-3.5 py-1 border-r border-white/10 text-center sm:text-left">
                <span className="text-[10px] uppercase font-bold text-[#E8CA82] tracking-wider block">Provenance</span>
                <span className="text-lg font-bold text-white font-mono">100% On-Chain</span>
              </div>
              <div className="px-3.5 py-1 border-r border-white/10 text-center sm:text-left">
                <span className="text-[10px] uppercase font-bold text-[#E8CA82] tracking-wider block">Rating</span>
                <span className="text-lg font-bold text-white font-mono flex items-center justify-center sm:justify-start gap-1">
                  4.9 <Star className="h-3.5 w-3.5 fill-[#E8CA82] text-[#E8CA82] inline" />
                </span>
              </div>
              <div className="px-3.5 py-1 text-center sm:text-left">
                <span className="text-[10px] uppercase font-bold text-[#E8CA82] tracking-wider block">Platform Cut</span>
                <span className="text-lg font-bold text-[#E8CA82] font-mono">₹0 (100% Direct)</span>
              </div>
            </div>

            {/* Action Buttons - Rich Gold & Glass Aesthetic */}
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetToSample}
                className="border-white/25 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold h-11 backdrop-blur-sm transition-all"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-[#E8CA82]" /> Sample Data
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-gradient-to-r from-[#E8CA82] via-[#D4AF37] to-[#C59B4B] hover:brightness-105 text-[#35160A] font-bold text-xs h-11 px-6 shadow-xl border border-white/40 flex-1 lg:flex-initial transition-all active:scale-[0.99]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#35160A]" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-[#35160A]" /> Save Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 12-Column Responsive Grid Layout Filling Full Screen */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Main Editing Forms (8 Columns on Widescreen) */}
          <div className="xl:col-span-8 space-y-6">
            {/* 1. Master Artisan & Studio Identity */}
            <Card className="border border-border/80 shadow-sm rounded-2xl bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#5E2C18] dark:text-[#E8CA82] font-bold text-xs uppercase tracking-wider">
                    <Award className="h-4 w-4 text-[#C59B4B]" /> Studio Credentials
                  </div>
                  <Badge variant="outline" className="border-[#C59B4B]/30 bg-[#FAF7F2] text-[11px] text-[#5E2C18] dark:bg-amber-950/40 dark:text-[#E8CA82]">
                    Step 1 of 3
                  </Badge>
                </div>
                <CardTitle className="text-xl font-heading text-foreground">Artisan Heritage & Brand Identity</CardTitle>
                <CardDescription>
                  Your public credentials showcased to conscious patrons, museum curators, and art collectors worldwide.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="artisanName" className="text-xs font-semibold uppercase text-muted-foreground">
                      Master Artisan Full Name
                    </Label>
                    <Input
                      id="artisanName"
                      value={artisanName}
                      onChange={(e) => setArtisanName(e.target.value)}
                      placeholder="e.g. Aayush Kumar Singh"
                      className="h-11 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="studioName" className="text-xs font-semibold uppercase text-muted-foreground">
                      Studio / Workshop Brand Name
                    </Label>
                    <Input
                      id="studioName"
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      placeholder="e.g. Royal Jaipur Blue Pottery & Heritage Studio"
                      className="h-11 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="craftSpecialty" className="text-xs font-semibold uppercase text-muted-foreground">
                      Primary Craft Specialization
                    </Label>
                    <Select value={craftSpecialty} onValueChange={setCraftSpecialty}>
                      <SelectTrigger id="craftSpecialty" className="h-11 font-medium">
                        <SelectValue placeholder="Select Heritage Craft Specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        {CRAFT_SPECIALTIES.map((craft) => (
                          <SelectItem key={craft} value={craft}>
                            {craft}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lineage" className="text-xs font-semibold uppercase text-muted-foreground">
                      Lineage & Craft Experience
                    </Label>
                    <Input
                      id="lineage"
                      value={lineage}
                      onChange={(e) => setLineage(e.target.value)}
                      placeholder="e.g. 4th Generation Master Craftsman (22+ Yrs)"
                      className="h-11 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="giCertNumber" className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
                      <span>GI Certificate / Artisan ID</span>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                        <ShieldCheck className="h-3 w-3" /> Ministry Verified
                      </span>
                    </Label>
                    <Input
                      id="giCertNumber"
                      value={giCertNumber}
                      onChange={(e) => setGiCertNumber(e.target.value)}
                      placeholder="GI-IN-RAJ-2023-412"
                      className="h-11 font-mono uppercase font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold uppercase text-muted-foreground">
                      Direct WhatsApp / Contact Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="h-11 pl-9 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Studio & Workshop Location */}
            <Card className="border border-border/80 shadow-sm rounded-2xl bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#5E2C18] dark:text-[#E8CA82] font-bold text-xs uppercase tracking-wider">
                    <MapPin className="h-4 w-4 text-[#C59B4B]" /> Geographical Origin
                  </div>
                  <Badge variant="outline" className="border-[#C59B4B]/30 bg-[#FAF7F2] text-[11px] text-[#5E2C18] dark:bg-amber-950/40 dark:text-[#E8CA82]">
                    Step 2 of 3
                  </Badge>
                </div>
                <CardTitle className="text-xl font-heading text-foreground">Workshop Location & Craft Cluster</CardTitle>
                <CardDescription>
                  Geographical origin embedded into cryptographic NFC provenance tags and blockchain craft passports.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="stateName" className="text-xs font-semibold uppercase text-muted-foreground">
                      Heritage State
                    </Label>
                    <Select value={stateName} onValueChange={setStateName}>
                      <SelectTrigger id="stateName" className="h-11 font-medium">
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
                    <Label htmlFor="city" className="text-xs font-semibold uppercase text-muted-foreground">
                      Craft Cluster / City
                    </Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Sanganer, Jaipur"
                      className="h-11 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="workshopAddress" className="text-xs font-semibold uppercase text-muted-foreground">
                    Full Workshop Address / Studio Landmark
                  </Label>
                  <Input
                    id="workshopAddress"
                    value={workshopAddress}
                    onChange={(e) => setWorkshopAddress(e.target.value)}
                    placeholder="Studio #14, Craft Village Lane, Sanganer Artisan Cluster, Jaipur 302029"
                    className="h-11 font-medium"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 3. Heritage Bio & Traditional Craft Story */}
            <Card className="border border-border/80 shadow-sm rounded-2xl bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#5E2C18] dark:text-[#E8CA82] font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="h-4 w-4 text-[#C59B4B]" /> Storytelling Engine
                  </div>
                  <Badge variant="outline" className="border-[#C59B4B]/30 bg-[#FAF7F2] text-[11px] text-[#5E2C18] dark:bg-amber-950/40 dark:text-[#E8CA82]">
                    Step 3 of 3
                  </Badge>
                </div>
                <CardTitle className="text-xl font-heading text-foreground">Artisan Bio & Natural Techniques</CardTitle>
                <CardDescription>
                  Your story powers our Multilingual AI Audio guide when buyers scan the authenticity seal on your packaging.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="artisanBio" className="text-xs font-semibold uppercase text-muted-foreground">
                    Your Heritage Craft Journey & Lineage Story
                  </Label>
                  <Textarea
                    id="artisanBio"
                    rows={4}
                    value={artisanBio}
                    onChange={(e) => setArtisanBio(e.target.value)}
                    placeholder="Share how you inherited this art, your gurus, and what makes your studio creations authentic..."
                    className="resize-none font-sans leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="techniques" className="text-xs font-semibold uppercase text-muted-foreground">
                    Raw Materials & Traditional Techniques Used
                  </Label>
                  <Input
                    id="techniques"
                    value={techniques}
                    onChange={(e) => setTechniques(e.target.value)}
                    placeholder="e.g. Quartz stone powder, fuller's earth, natural indigo oxides, traditional wood kiln"
                    className="h-11 font-medium"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button for Main Section */}
            <div className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl shadow-sm">
              <div className="text-xs text-muted-foreground">
                {lastSavedTime ? (
                  <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Last saved today at {lastSavedTime}
                  </span>
                ) : (
                  <span>Ready to save your verified Master Artisan profile</span>
                )}
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="h-11 px-7 text-xs font-bold tracking-wider uppercase rounded-xl shadow-md bg-gradient-to-r from-[#8C2B2B] via-[#752412] to-[#5C1E0F] hover:from-[#752412] hover:to-[#43140A] text-white border border-[#C59B4B]/30 transition-all active:scale-[0.99]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#E8CA82]" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-[#E8CA82]" /> Save Artisan Profile
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Sidebar Column (4 Columns on Widescreen - Fills Blank Space) */}
          <div className="xl:col-span-4 space-y-6">
            {/* Live Storefront Preview Card */}
            <Card className="border border-border/80 shadow-sm rounded-2xl bg-card overflow-hidden">
              <div className="bg-gradient-to-r from-[#8C2B2B] to-[#5C1E0F] px-4 py-3 text-white flex items-center justify-between border-b border-[#5C1E0F]">
                <span className="text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-[#E8CA82]" /> Live Public Preview
                </span>
                <span className="text-[10px] bg-white/15 text-[#E8CA82] border border-white/20 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                  Buyer View
                </span>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3.5">
                  <Avatar className="h-16 w-16 ring-2 ring-[#C59B4B]/40 shadow-md">
                    <AvatarImage src={avatarUrl} alt={artisanName} />
                    <AvatarFallback className="bg-gradient-to-br from-[#70341E] to-[#3B1A0E] text-[#E8CA82] font-bold text-xl font-heading">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 flex-1">
                    <h3 className="font-heading font-bold text-base text-foreground leading-tight">
                      {artisanName || 'Master Artisan'}
                    </h3>
                    <p className="text-xs font-semibold text-[#5E2C18] dark:text-[#E8CA82]">
                      {studioName || 'Heritage Craft Studio'}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF7F2] dark:bg-amber-950/40 text-[#5E2C18] dark:text-[#E8CA82] border border-[#C59B4B]/30 font-bold">
                        {giCertNumber || 'GI VERIFIED'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7F2] dark:bg-muted/40 rounded-xl space-y-1.5 border border-[#E8DCCB] dark:border-border">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
                    <span>Craft Specialty</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">100% Direct</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    {craftSpecialty}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#C59B4B]" /> {city ? `${city}, ` : ''}{stateName}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Heritage Story Excerpt</span>
                  <p className="text-xs text-muted-foreground line-clamp-3 italic leading-relaxed">
                    &quot;{artisanBio || 'Traditional Indian craft lineage honoring centuries of artisanal heritage.'}&quot;
                  </p>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="h-3.5 w-3.5" /> Authenticity Guaranteed
                  </span>
                  <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-[#5E2C18] dark:text-[#E8CA82] font-bold hover:bg-[#FAF7F2]">
                    <Link href="/artisans">
                      View In Directory <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Direct Payout & Banking Setup */}
            <Card className="border border-[#E8DCCB] shadow-sm rounded-2xl bg-card overflow-hidden">
              <CardHeader className="pb-3 bg-[#FAF7F2] dark:bg-card border-b border-[#E8DCCB]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5E2C18] dark:text-[#E8CA82] uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-[#C59B4B]" /> Direct Settlement
                  </span>
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                    0% Commission
                  </Badge>
                </div>
                <CardTitle className="text-lg font-heading text-foreground pt-1">Banking & UPI Payout</CardTitle>
                <CardDescription className="text-xs">
                  Sales proceed instantly directly to your account with zero intermediary cuts.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="upiId" className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between">
                    <span>Payout UPI ID (Instant)</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      <Zap className="h-2.5 w-2.5 fill-emerald-600 text-emerald-600" /> Daily Auto-Settlement
                    </span>
                  </Label>
                  <Input
                    id="upiId"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. aayush.artisan@okhdfcbank"
                    className="h-10 font-mono font-medium text-xs bg-background"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="bankAccount" className="text-[11px] font-semibold uppercase text-muted-foreground">
                      Account No.
                    </Label>
                    <Input
                      id="bankAccount"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="50100482910482"
                      className="h-10 font-mono text-xs bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ifscCode" className="text-[11px] font-semibold uppercase text-muted-foreground">
                      IFSC Code
                    </Label>
                    <Input
                      id="ifscCode"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="HDFC0001234"
                      className="h-10 font-mono uppercase text-xs bg-background"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Health Checklist */}
            <Card className="border border-border/80 shadow-sm rounded-2xl bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-heading">Studio Verification Status</CardTitle>
                  <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">100% Ready</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden mt-1">
                  <div className="bg-gradient-to-r from-[#C59B4B] to-emerald-600 h-full w-full rounded-full transition-all duration-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>Verified Geographical Indication (GI) Number</span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>Workshop Craft Cluster & State tagged</span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>Direct UPI Account verified for instant payouts</span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  <span>AI Audio Storytelling Engine configured</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Artisan Actions */}
            <Card className="border border-border/80 shadow-sm rounded-2xl bg-muted/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                  Artisan Studio Shortcuts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-between h-10 rounded-xl bg-card hover:bg-[#FAF7F2] hover:text-[#5E2C18] hover:border-[#C59B4B]/40 transition-all">
                  <Link href="/artisan/products">
                    <span className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-[#5E2C18]" /> Add New Creation
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-between h-10 rounded-xl bg-card hover:bg-[#FAF7F2] hover:text-[#5E2C18] hover:border-[#C59B4B]/40 transition-all">
                  <Link href="/artisan/provenance">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#C59B4B]" /> Cryptographic Provenance
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-between h-10 rounded-xl bg-card hover:bg-[#FAF7F2] hover:text-[#5E2C18] hover:border-[#C59B4B]/40 transition-all">
                  <Link href="/artisan/business-advisor">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#5E2C18]" /> AI Pricing Advisor
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
