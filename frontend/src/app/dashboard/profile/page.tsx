'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { categories } from '@/lib/data';
import {
  Sparkles,
  Loader2,
  ShieldCheck,
  AlertCircle,
  IdCard,
  User,
  Camera,
  CheckCircle2,
  Globe,
  Youtube,
  Instagram,
  Facebook,
  CloudOff,
  Cloud,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateArtisanStory } from '@/ai/flows/generate-artisan-story';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUserRole } from '@/hooks/use-user-role';
import { supabase } from '@/services/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArtisanProfileData {
  full_name: string;
  shop_name: string;
  bio: string;
  craft: string;
  experience: number;
  instagram: string;
  facebook: string;
  youtube: string;
  website: string;
  profile_picture_url: string;
  verification_status: 'unverified' | 'pending' | 'verified';
  artisan_id: string | null;
}

const EMPTY_PROFILE: ArtisanProfileData = {
  full_name: '',
  shop_name: '',
  bio: '',
  craft: '',
  experience: 1,
  instagram: '',
  facebook: '',
  youtube: '',
  website: '',
  profile_picture_url: '',
  verification_status: 'unverified',
  artisan_id: null,
};

const LS_KEY = 'viraasat_artisan_profile_v2';
const LS_BUYER_KEY = 'viraasat_buyer_profile';

// ─── Supabase helpers ─────────────────────────────────────────────────────────

async function loadProfileFromSupabase(userId: string): Promise<ArtisanProfileData | null> {
  try {
    const { data, error } = await supabase
      .from('artisan_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[Profile] Supabase read error:', error.message);
      return null;
    }
    if (!data) return null;

    return {
      full_name: data.full_name ?? '',
      shop_name: data.shop_name ?? '',
      bio: data.bio ?? '',
      craft: data.craft ?? '',
      experience: data.experience ?? 1,
      instagram: data.instagram ?? '',
      facebook: data.facebook ?? '',
      youtube: data.youtube ?? '',
      website: data.website ?? '',
      profile_picture_url: data.profile_picture_url ?? '',
      verification_status: data.verification_status ?? 'unverified',
      artisan_id: data.artisan_id ?? null,
    };
  } catch {
    return null;
  }
}

async function upsertProfileToSupabase(
  userId: string,
  profile: Partial<ArtisanProfileData>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('artisan_profiles')
      .upsert({ user_id: userId, ...profile, updated_at: new Date().toISOString() }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.warn('[Profile] Supabase upsert error:', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Unknown error' };
  }
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useUser();
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();

  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/artisan')) {
    return <ArtisanProfile userId={user?.id ?? null} toast={toast} />;
  }

  if (roleLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (role === 'buyer') {
    return <BuyerProfile user={user} toast={toast} />;
  }

  return <ArtisanProfile userId={user?.id ?? null} toast={toast} />;
}

// ─── Buyer profile ────────────────────────────────────────────────────────────

function BuyerProfile({ user, toast }: { user: any; toast: any }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');

  useEffect(() => {
    // Try Supabase first, fall back to localStorage
    async function load() {
      let loaded = false;
      if (user?.id) {
        try {
          const { data } = await supabase
            .from('buyer_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            setDisplayName(data.display_name ?? user?.fullName ?? '');
            setPhone(data.phone ?? '');
            setAddressLine1(data.address_line1 ?? '');
            setAddressLine2(data.address_line2 ?? '');
            setCity(data.city ?? '');
            setStateName(data.state ?? '');
            setZipCode(data.zip_code ?? '');
            loaded = true;
          }
        } catch {
          // fall through to localStorage
        }
      }

      if (!loaded) {
        const saved = localStorage.getItem(LS_BUYER_KEY);
        if (saved) {
          try {
            const p = JSON.parse(saved);
            setDisplayName(p.displayName || user?.fullName || '');
            setPhone(p.phone || '');
            setAddressLine1(p.addressLine1 || '');
            setAddressLine2(p.addressLine2 || '');
            setCity(p.city || '');
            setStateName(p.state || '');
            setZipCode(p.zipCode || '');
          } catch { /* ignore */ }
        } else {
          setDisplayName(user?.fullName || '');
        }
      }
      setIsLoading(false);
    }
    load();
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    const profileData = {
      displayName, phone, addressLine1, addressLine2, city,
      state: stateName, zipCode,
    };

    // Always save to localStorage immediately
    localStorage.setItem(LS_BUYER_KEY, JSON.stringify(profileData));

    // Try Supabase
    let savedToCloud = false;
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('buyer_profiles')
          .upsert({
            user_id: user.id,
            display_name: displayName,
            phone,
            address_line1: addressLine1,
            address_line2: addressLine2,
            city,
            state: stateName,
            zip_code: zipCode,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (!error) savedToCloud = true;
      } catch { /* already saved locally */ }
    }

    toast({
      title: savedToCloud ? '✅ Profile saved to cloud' : '💾 Profile saved locally',
      description: savedToCloud
        ? 'Your details are synced across all devices.'
        : 'Saved to this browser. Sign in to sync across devices.',
    });
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Personal Information
          </CardTitle>
          <CardDescription>
            Manage your account details and default shipping address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-muted">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="text-lg">
                {displayName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.primaryEmailAddress?.emailAddress}</p>
              <p className="text-sm text-muted-foreground">Photo managed via Clerk — update in account settings.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>
        </CardContent>

        <CardHeader className="pt-0 pb-2">
          <CardTitle className="text-base">Default Shipping Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address Line 1</Label>
            <Input
              id="addressLine1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="House / Flat no., Street"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input
              id="addressLine2"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Area, Landmark (optional)"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Mumbai"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stateName">State</Label>
              <Input
                id="stateName"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="Maharashtra"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">PIN Code</Label>
              <Input
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="400001"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// ─── Artisan profile ──────────────────────────────────────────────────────────

function ArtisanProfile({ userId, toast }: { userId: string | null; toast: any }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [storageMode, setStorageMode] = useState<'cloud' | 'local'>('local');

  // Profile fields
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [bio, setBio] = useState('');
  const [craft, setCraft] = useState('');
  const [experience, setExperience] = useState(1);
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [youtube, setYoutube] = useState('');
  const [website, setWebsite] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');
  const [artisanId, setArtisanId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load from Supabase, fallback to localStorage ─────────────────────────
  useEffect(() => {
    async function load() {
      // 1. Try localStorage first for instant load
      const cached = localStorage.getItem(LS_KEY);
      if (cached) {
        try {
          const p: ArtisanProfileData = JSON.parse(cached);
          applyProfile(p);
        } catch { /* corrupt cache */ }
      }

      // 2. Try Supabase for fresh/persistent data
      if (userId) {
        const remote = await loadProfileFromSupabase(userId);
        if (remote) {
          applyProfile(remote);
          // Refresh cache
          localStorage.setItem(LS_KEY, JSON.stringify(remote));
          setStorageMode('cloud');
        } else {
          setStorageMode('local');
        }
      } else {
        setStorageMode('local');
      }

      setIsLoading(false);
    }
    load();
  }, [userId]);

  function applyProfile(p: ArtisanProfileData) {
    setName(p.full_name || '');
    setShopName(p.shop_name || '');
    setProfilePictureUrl(p.profile_picture_url || '');
    setBio(p.bio || '');
    setCraft(p.craft || categories[0]);
    setExperience(p.experience || 1);
    setInstagram(p.instagram || '');
    setFacebook(p.facebook || '');
    setYoutube(p.youtube || '');
    setWebsite(p.website || '');
    setVerificationStatus(p.verification_status || 'unverified');
    setArtisanId(p.artisan_id || null);
  }

  function buildCurrentProfile(overrides?: Partial<ArtisanProfileData>): ArtisanProfileData {
    return {
      full_name: name,
      shop_name: shopName,
      bio,
      craft,
      experience,
      instagram,
      facebook,
      youtube,
      website,
      profile_picture_url: profilePictureUrl,
      verification_status: verificationStatus,
      artisan_id: artisanId,
      ...overrides,
    };
  }

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 3MB.',
      });
      return;
    }

    // Try Supabase Storage upload
    if (userId) {
      try {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `artisan-avatars/${userId}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, file, { upsert: true, contentType: file.type });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          const publicUrl = urlData.publicUrl;
          setProfilePictureUrl(publicUrl);
          toast({ title: '📷 Photo uploaded', description: 'Profile picture saved to cloud.' });
          return;
        }
      } catch { /* fall through to base64 */ }
    }

    // Fallback: base64 in localStorage
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setProfilePictureUrl(dataUrl);
      toast({ title: '📷 Photo selected', description: "Save your profile to keep this picture." });
    };
    reader.readAsDataURL(file);
  };

  // ── Save section ──────────────────────────────────────────────────────────
  const handleSave = async (section: 'basic' | 'story' | 'social') => {
    setIsSaving(section);

    const profile = buildCurrentProfile();

    // 1. Always save to localStorage immediately (optimistic)
    localStorage.setItem(LS_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event('profile-updated'));

    // 2. Try Supabase
    let savedToCloud = false;
    if (userId) {
      const result = await upsertProfileToSupabase(userId, profile);
      savedToCloud = result.ok;
      if (result.ok) setStorageMode('cloud');
    }

    const sectionLabel =
      section === 'basic' ? 'Basic info' :
      section === 'story' ? 'Bio & story' : 'Social links';

    toast({
      title: savedToCloud ? `✅ ${sectionLabel} saved` : `💾 ${sectionLabel} saved locally`,
      description: savedToCloud
        ? 'Changes are synced to your account.'
        : 'Saved to this browser. Sign in to sync across devices.',
    });

    setIsSaving(null);
  };

  // ── AI story generation ───────────────────────────────────────────────────
  const handleGenerateStory = async () => {
    if (!name || !shopName || !craft) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in your Name, Shop Name, and Craft before generating a story.',
      });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateArtisanStory({
        artisanName: name,
        shopName,
        craftType: craft,
        yearsExperience: experience,
      });
      if (result.storyIdeas?.length > 0) {
        setBio(result.storyIdeas.join('\n\n'));
        toast({ title: '✨ Story Generated!', description: 'AI has drafted a bio. Edit it to make it yours.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Generation Failed', description: 'Could not generate story. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Verify & generate Artisan ID ──────────────────────────────────────────
  const handleVerify = async () => {
    const missing: string[] = [];
    if (!name) missing.push('Full Name');
    if (!shopName) missing.push('Shop Name');
    if (!craft) missing.push('Craft');
    if (!bio || bio.length < 20) missing.push('Bio (min 20 characters)');
    if (missing.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Profile',
        description: `Please complete: ${missing.join(', ')}`,
      });
      return;
    }

    setIsVerifying(true);
    await new Promise((r) => setTimeout(r, 1500));

    const newId = `ART-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    setVerificationStatus('verified');
    setArtisanId(newId);

    const profile = buildCurrentProfile({ verification_status: 'verified', artisan_id: newId });
    localStorage.setItem(LS_KEY, JSON.stringify(profile));
    window.dispatchEvent(new Event('profile-updated'));

    let savedToCloud = false;
    if (userId) {
      const result = await upsertProfileToSupabase(userId, profile);
      savedToCloud = result.ok;
    }

    toast({
      title: '🎉 Verification Successful!',
      description: `Artisan ID ${newId} generated${savedToCloud ? ' and saved to your account' : ' locally'}.`,
    });
    setIsVerifying(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Storage mode indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {storageMode === 'cloud' ? (
          <><Cloud className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-600">Synced to cloud — changes saved across all devices</span></>
        ) : (
          <><CloudOff className="h-3.5 w-3.5 text-amber-500" /><span className="text-amber-600">Browser storage only — sign in to sync across devices</span></>
        )}
      </div>

      {/* ── Artisan Identity card ─────────────────────────────────────────── */}
      <Card className={`border-l-4 ${verificationStatus === 'verified' ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 flex-wrap">
                Artisan Identity
                {verificationStatus === 'verified' ? (
                  <Badge className="bg-green-600 hover:bg-green-700 gap-1">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3 w-3" /> Unverified
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {verificationStatus === 'verified'
                  ? 'Your identity has been verified. You can now access all artisan features.'
                  : 'Verify your profile to generate your unique Artisan ID and start selling.'}
              </CardDescription>
            </div>

            {verificationStatus === 'verified' ? (
              <div className="bg-muted p-3 rounded-lg flex items-center gap-3">
                <IdCard className="h-8 w-8 opacity-50" />
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Artisan ID</div>
                  <div className="font-mono text-lg font-semibold">{artisanId}</div>
                </div>
              </div>
            ) : (
              <Button onClick={handleVerify} disabled={isVerifying}>
                {isVerifying
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <ShieldCheck className="mr-2 h-4 w-4" />}
                Verify & Generate ID
              </Button>
            )}
          </div>
        </CardHeader>
        {verificationStatus !== 'verified' && (
          <CardContent>
            <Alert className="bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>
                Fill in your <strong>Full Name</strong>, <strong>Shop Name</strong>, <strong>Craft</strong>, and <strong>Bio</strong> below, then click <em>Verify & Generate ID</em>.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* ── Profile / Basic Info ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your shop details and personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Avatar className="h-20 w-20 border-2 border-muted">
                <AvatarImage src={profilePictureUrl} className="object-cover" />
                <AvatarFallback className="text-2xl">{name.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Profile Picture</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 text-xs"
              >
                <Camera className="h-3.5 w-3.5" /> Change Photo
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP · max 3MB</p>
            </div>
          </div>

          {/* Name & Shop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Riya Sharma"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop Name <span className="text-red-500">*</span></Label>
              <Input
                id="shopName"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Riya's Creations"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button
            onClick={() => handleSave('basic')}
            disabled={isSaving === 'basic'}
            className="min-w-[130px]"
          >
            {isSaving === 'basic'
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Save Basic Info
          </Button>
        </CardFooter>
      </Card>

      {/* ── Your Story / Bio ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Your Story</CardTitle>
          <CardDescription>Share your journey as an artisan. Not sure what to write? Let AI help!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="craftType">Primary Craft <span className="text-red-500">*</span></Label>
              <Select value={craft} onValueChange={setCraft}>
                <SelectTrigger id="craftType">
                  <SelectValue placeholder="Select your craft" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="70"
                value={experience}
                onChange={(e) => setExperience(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">
                Bio <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-muted-foreground font-normal">(min 20 chars)</span>
              </Label>
              <span className={`text-xs ${bio.length < 20 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {bio.length} chars
              </span>
            </div>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={7}
              className="resize-none"
              placeholder="Tell us about your journey, your craft, and what makes your work unique..."
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-between items-center gap-4 flex-wrap">
          <Button variant="outline" onClick={handleGenerateStory} disabled={isGenerating}>
            {isGenerating
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <Sparkles className="mr-2 h-4 w-4 text-purple-500" />}
            Generate with AI
          </Button>
          <Button
            onClick={() => handleSave('story')}
            disabled={isSaving === 'story'}
            className="min-w-[110px]"
          >
            {isSaving === 'story'
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Save Bio
          </Button>
        </CardFooter>
      </Card>

      {/* ── Social Media Links ────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media & Links</CardTitle>
          <CardDescription>Help customers find and follow your work online.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-1.5">
                <Instagram className="h-3.5 w-3.5 text-pink-500" /> Instagram
              </Label>
              <Input
                id="instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-1.5">
                <Facebook className="h-3.5 w-3.5 text-blue-600" /> Facebook
              </Label>
              <Input
                id="facebook"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube" className="flex items-center gap-1.5">
                <Youtube className="h-3.5 w-3.5 text-red-500" /> YouTube
              </Label>
              <Input
                id="youtube"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtube.com/@yourchannel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-emerald-600" /> Website
              </Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourshop.com"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button
            onClick={() => handleSave('social')}
            disabled={isSaving === 'social'}
            className="min-w-[140px]"
          >
            {isSaving === 'social'
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Save Social Links
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
