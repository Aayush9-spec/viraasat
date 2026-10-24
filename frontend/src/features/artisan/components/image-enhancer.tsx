'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/core/hooks/use-toast';
import { enhanceImageQuality } from '@/ai/flows/enhance-image-quality';
import { moderateImage } from '@/services/backend/moderation';
import { useAuth } from '@clerk/nextjs';

interface ImageEnhancerProps {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function ImageEnhancer({ images, setImages }: ImageEnhancerProps) {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isModerating, setIsModerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { getToken } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setOriginalImage(dataUrl);
        setEnhancedImage(null);
        // Automatically add the uploaded image so it is never dropped on form submission
        setImages((prev) => {
          if (prev.includes(dataUrl)) return prev;
          return [dataUrl, ...prev];
        });
        toast({
          title: 'Photo Added to Creation',
          description: 'Your craft photo has been attached. You can optionally enhance it with AI below.',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhance = async () => {
    if (!originalImage) return;

    setIsEnhancing(true);
    try {
      const { enhancedImageUri } = await enhanceImageQuality({ imageUri: originalImage });
      setEnhancedImage(enhancedImageUri);
      // Automatically update the images list to use the enhanced version
      setImages((prev) => prev.map((img) => (img === originalImage ? enhancedImageUri : img)));
      toast({ title: 'Image Enhanced!', description: 'AI has improved your craft image quality.' });
    } catch (error) {
      console.error('Image enhancement error:', error);
      toast({ variant: 'destructive', title: 'Enhancement Failed', description: 'Could not enhance image.' });
    } finally {
      setIsEnhancing(false);
    }
  };

  const addEnhancedImage = async () => {
    const targetImage = enhancedImage || originalImage;
    if (!targetImage || !originalFile) return;

    setIsModerating(true);
    try {
      const token = await getToken();
      const verdict = await moderateImage(originalFile, token);
      if (!verdict.allow) {
        toast({
          variant: 'destructive',
          title: 'Image rejected',
          description:
            verdict.reason === 'policy_violation'
              ? 'This image was flagged by our content moderation. Please upload a different image.'
              : `Image rejected: ${verdict.reason}`,
        });
        return;
      }
    } catch (error) {
      console.warn('Moderation check skipped/soft-passed:', error);
    } finally {
      setIsModerating(false);
    }

    setImages((prev) => [...prev, targetImage]);
    setOriginalImage(null);
    setOriginalFile(null);
    setEnhancedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Click to upload or drag and drop an image
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
      </div>

      {originalImage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="text-center">
            <h3 className="font-semibold mb-2">Original</h3>
            <Image src={originalImage} alt="Original" width={200} height={200} className="rounded-lg mx-auto" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold mb-2">Enhanced</h3>
            {enhancedImage ? (
              <Image src={enhancedImage} alt="Enhanced" width={200} height={200} className="rounded-lg mx-auto" />
            ) : (
              <div className="w-[200px] h-[200px] bg-muted rounded-lg flex items-center justify-center mx-auto">
                <p className="text-sm text-muted-foreground">Click Enhance for AI upgrade</p>
              </div>
            )}
          </div>
          <div className="md:col-span-2 flex justify-center gap-4">
            <Button type="button" onClick={handleEnhance} disabled={isEnhancing}>
              <Sparkles className="mr-2 h-4 w-4" />
              {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
            </Button>
            <Button
              type="button"
              onClick={addEnhancedImage}
              disabled={isModerating}
            >
              {isModerating ? 'Checking…' : 'Add to Product'}
            </Button>
          </div>
        </div>
      )}


      {images.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Product Images</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <Image src={img} alt={`Product image ${index + 1}`} width={150} height={150} className="rounded-lg w-full aspect-square object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
