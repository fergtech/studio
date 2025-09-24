import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface CreateSocietyFormProps {
  setOpen: (open: boolean) => void;
  onCreated?: (society: any) => void;
}

export function CreateSocietyForm({ setOpen, onCreated }: CreateSocietyFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = async (file: File): Promise<File | null> => {
    const maxSizeInMB = 10;
    
    if (file.size <= maxSizeInMB * 1024 * 1024) {
      return file;
    }

    try {
      const options = {
        maxSizeMB: maxSizeInMB,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: file.type,
      };
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Image compression failed:', error);
      return null;
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const compressedFile = await compressImage(file);
      if (!compressedFile) {
        throw new Error('Image compression failed');
      }

      setSelectedImage(compressedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast({
        title: 'Image Processing Failed',
        description: 'Failed to process the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to create a society.',
        variant: 'destructive',
      });
      return;
    }
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Society name is required.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      let imageUrl = image.trim() || undefined;
      
      // Upload image if selected
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const res = await fetch('/api/societies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          image: imageUrl,
          userId: session.user.id,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create society');
      }
      
      const society = await res.json();
      toast({
        title: 'Society Created!',
        description: `"${society.name}" is now live.`,
        variant: 'default',
      });
      
      // Reset form
      setOpen(false);
      setName('');
      setDescription('');
      setImage('');
      removeImage();
      
      if (onCreated) onCreated(society);
    } catch (error: any) {
      toast({
        title: 'Error Creating Society',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Society Name"
        required
        disabled={isSubmitting}
        className="min-h-[44px]"
      />
      <Textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description (optional)"
        disabled={isSubmitting}
        className="min-h-[80px] sm:min-h-[60px]"
      />
      {/* Image Upload Section */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Society Image (optional)</label>
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative h-32 w-full">
            <Image 
              src={imagePreview} 
              alt="Preview" 
              fill
              className="object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={removeImage}
              disabled={isSubmitting}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        {/* Upload Button */}
        {!imagePreview && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || isUploading}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Processing...' : 'Upload Image'}
            </Button>
          </div>
        )}
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        {/* URL Input Fallback */}
        {!imagePreview && (
          <div className="text-center text-sm text-muted-foreground">
            or
          </div>
        )}
        {!imagePreview && (
          <Input
            value={image}
            onChange={e => setImage(e.target.value)}
            placeholder="Paste image URL here..."
            disabled={isSubmitting}
            className="min-h-[44px]"
          />
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setOpen(false)} 
          disabled={isSubmitting || isUploading} 
          className="min-h-[44px]"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || isUploading} 
          className="min-h-[44px]"
        >
          {isSubmitting ? 'Creating...' : 'Create Society'}
        </Button>
      </div>
    </form>
  );
} 