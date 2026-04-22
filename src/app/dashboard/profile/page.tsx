'use client';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { artisans, categories } from "@/lib/data";
import { Sparkles, Loader2, ShieldCheck, AlertCircle, IdCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateArtisanStory } from '@/ai/flows/generate-artisan-story';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ProfilePage() {
  const { toast } = useToast();

  // State for all fields
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null); // Track which section is saving
  const [isVerifying, setIsVerifying] = useState(false);

  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [bio, setBio] = useState('');
  const [craft, setCraft] = useState('');
  const [experience, setExperience] = useState(1);
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');

  // Verification State
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');
  const [artisanId, setArtisanId] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = () => {
      const savedData = localStorage.getItem('viraasat_profile');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setName(parsed.name || '');
        setShopName(parsed.shopName || '');
        setProfilePicture(parsed.profilePicture || '');
        setBio(parsed.bio || '');
        setCraft(parsed.craft || categories[0]);
        setExperience(parsed.experience || 1);
        setInstagram(parsed.instagram || '');
        setFacebook(parsed.facebook || '');
        setVerificationStatus(parsed.verificationStatus || 'unverified');
        setArtisanId(parsed.artisanId || null);
      } else {
        // Fallback to mock data if no local storage
        const defaultUser = artisans[0];
        setName(defaultUser.name);
        setShopName(defaultUser.shopName);
        setProfilePicture(defaultUser.profilePicture);
        setBio(defaultUser.bio);
        setCraft(categories[0]);
        setExperience(5);
        setInstagram(defaultUser.socialLinks?.instagram || '');
        setFacebook(defaultUser.socialLinks?.facebook || '');
        // Default to unverified for demo purposes
        setVerificationStatus('unverified');
        setArtisanId(null);
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: 'destructive',
          title: "File too large",
          description: "Please upload an image smaller than 2MB.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
        toast({
          title: "Image Uploaded",
          description: "Don't forget to save your basic info.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveToLocalStorage = (updatedStatus?: 'verified' | 'unverified', newId?: string) => {
    const data = {
      name,
      shopName,
      profilePicture,
      bio,
      craft,
      experience,
      instagram,
      facebook,
      verificationStatus: updatedStatus || verificationStatus,
      artisanId: newId || artisanId
    };
    localStorage.setItem('viraasat_profile', JSON.stringify(data));
    window.dispatchEvent(new Event('profile-updated'));
  };

  const handleSave = async (section: 'basic' | 'story' | 'social') => {
    setIsSaving(section);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    saveToLocalStorage();

    toast({
      title: "Profile Updated",
      description: `Your ${section === 'basic' ? 'basic info' : section === 'story' ? 'story' : 'social links'} has been saved successfully.`,
    });
    setIsSaving(null);
  };

  const handleGenerateStory = async () => {
    if (!name || !shopName || !craft) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in your Name, Shop Name, and Craft before generating a story."
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateArtisanStory({
        artisanName: name,
        shopName: shopName,
        craftType: craft,
        yearsExperience: experience,
      });
      if (result.storyIdeas && result.storyIdeas.length > 0) {
        setBio(result.storyIdeas.join('\n\n'));
        toast({
          title: 'Story Ideas Generated!',
          description: 'AI has drafted a new bio for you. Feel free to edit it.',
        });
      }
    } catch (error) {
      console.error('Failed to generate story:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate story ideas. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerify = async () => {
    // 1. Check necessary details
    const missingFields = [];
    if (!name) missingFields.push("Name");
    if (!shopName) missingFields.push("Shop Name");
    if (!craft) missingFields.push("Craft");
    if (!bio || bio.length < 20) missingFields.push("Bio (at least 20 chars)");

    if (missingFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Incomplete Profile",
        description: `Please complete the following fields to verify: ${missingFields.join(', ')}.`,
      });
      return;
    }

    setIsVerifying(true);

    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate ID
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const newId = `ART-${new Date().getFullYear()}-${randomNum}`;

    setVerificationStatus('verified');
    setArtisanId(newId);
    saveToLocalStorage('verified', newId);

    toast({
      title: "Verification Successful!",
      description: "You are now a verified artisan. Your Artisan ID has been generated.",
    });

    setIsVerifying(false);
  };

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Verification Section */}
      <Card className={`border-l-4 ${verificationStatus === 'verified' ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                Artisan Identity
                {verificationStatus === 'verified' && <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>}
                {verificationStatus !== 'verified' && <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" /> Unverified</Badge>}
              </CardTitle>
              <CardDescription>
                {verificationStatus === 'verified'
                  ? "Your identity has been verified. You can now access all artisan features."
                  : "Verify your profile details to generate your unique Artisan ID and start selling."}
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
                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Verify & Generate ID
              </Button>
            )}
          </div>
        </CardHeader>
        {verificationStatus !== 'verified' && (
          <CardContent>
            <Alert className="bg-yellow-50/50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>
                To get your Artisan ID, please ensure your <strong>Full Name</strong>, <strong>Shop Name</strong>, <strong>Craft</strong>, and <strong>Bio</strong> are filled out correctly below.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your shop details and personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-muted">
              <AvatarImage src={profilePicture} className="object-cover" />
              <AvatarFallback className="text-lg">{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="grid gap-1.5 w-full max-w-sm">
              <Label htmlFor="picture">Profile Picture</Label>
              <Input id="picture" type="file" onChange={handleImageUpload} accept="image/*" className="cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Riya Sharma" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop Name <span className="text-red-500">*</span></Label>
              <Input id="shopName" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g. Riya's Creations" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={() => handleSave('basic')} disabled={isSaving === 'basic'}>
            {isSaving === 'basic' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Basic Info
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Story</CardTitle>
          <CardDescription>Share your journey. Not sure what to write? Let AI help you!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="craftType">Primary Craft <span className="text-red-500">*</span></Label>
              <Select value={craft} onValueChange={setCraft}>
                <SelectTrigger id="craftType">
                  <SelectValue placeholder="Select your craft" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input id="experience" type="number" min="0" value={experience} onChange={e => setExperience(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio <span className="text-red-500">*</span></Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={6}
              className="resize-none"
              placeholder="Tell us about your journey, your craft, and what makes your work unique..."
            />
            <p className="text-sm text-muted-foreground">
              A brief description of you and your craft.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-between items-center gap-4 flex-wrap">
          <Button variant="outline" onClick={handleGenerateStory} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4 text-purple-500" />}
            Generate with AI
          </Button>
          <Button onClick={() => handleSave('story')} disabled={isSaving === 'story'}>
            {isSaving === 'story' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Bio
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-medium">Social Media Links</h3>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input id="facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={() => handleSave('social')} disabled={isSaving === 'social'}>
            {isSaving === 'social' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Social Links
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
