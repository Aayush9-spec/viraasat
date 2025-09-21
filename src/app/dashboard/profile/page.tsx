'use client';
import { useState } from 'react';
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
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateArtisanStory } from '@/ai/flows/generate-artisan-story';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProfilePage() {
  const user = artisans[0]; // Mock user
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [bio, setBio] = useState(user.bio);
  const [craft, setCraft] = useState(categories[0]);
  const [experience, setExperience] = useState(5);

  const handleGenerateStory = async () => {
    setIsGenerating(true);
    try {
      const result = await generateArtisanStory({
        artisanName: user.name,
        shopName: user.shopName,
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your shop details and personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                  <AvatarImage src={user.profilePicture} data-ai-hint="person portrait" />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                  <Label htmlFor="picture">Profile Picture</Label>
                  <Input id="picture" type="file" className="w-full max-w-sm" />
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={user.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input id="shopName" defaultValue={user.shopName} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save Basic Info</Button>
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
              <Label htmlFor="craftType">Primary Craft</Label>
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
              <Input id="experience" type="number" value={experience} onChange={e => setExperience(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={6} />
            <p className="text-sm text-muted-foreground">
              A brief description of you and your craft.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-between items-center">
           <Button onClick={handleGenerateStory} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate with AI
          </Button>
          <Button>Save Bio</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
            <h3 className="text-lg font-medium">Social Media Links</h3>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" defaultValue={user.socialLinks.instagram} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input id="facebook" defaultValue={user.socialLinks.facebook} placeholder="https://facebook.com/..." />
            </div>
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
          <Button>Save Social Links</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
