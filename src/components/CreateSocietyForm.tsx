import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, MapPin, Globe, Users, Lock } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import LocationInput from '@/components/LocationInput';
import { ResolvedLocation } from '@/services/location';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnlockProgress } from '@/components/UnlockProgress';
import { UserUnlockStatus } from '@/lib/gamification';

interface CreateSocietyFormProps {
  setOpen: (open: boolean) => void;
  onCreated?: (society: any) => void;
}

export function CreateSocietyForm({ setOpen, onCreated }: CreateSocietyFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<'user' | 'global' | 'custom'>('user');
  const [userLocation, setUserLocation] = useState<ResolvedLocation | null>(null);
  const [customLocation, setCustomLocation] = useState<ResolvedLocation | null>(null);
  const [image, setImage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [unlockStatus, setUnlockStatus] = useState<(UserUnlockStatus & { activityScore: number }) | null>(null);
  const [isLoadingUnlockStatus, setIsLoadingUnlockStatus] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's unlock status
  useEffect(() => {
    const fetchUnlockStatus = async () => {
      if (!session?.user?.id) {
        setIsLoadingUnlockStatus(false);
        return;
      }

      try {
        const response = await fetch('/api/user/unlock-status');
        if (response.ok) {
          const data = await response.json();
          setUnlockStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch unlock status:', error);
      } finally {
        setIsLoadingUnlockStatus(false);
      }
    };

    fetchUnlockStatus();
  }, [session?.user?.id]);

  // Fetch user's location data
  useEffect(() => {
    const fetchUserLocation = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/auth/me');
          if (response.ok) {
            const userData = await response.json();
            if (userData.location) {
              const parsedLocation: ResolvedLocation = JSON.parse(userData.location);
              setUserLocation(parsedLocation);
            }
          }
        } catch (error) {
          console.error('Failed to fetch user location:', error);
        }
      }
    };

    fetchUserLocation();
  }, [session?.user?.id]);

  const compressImage = async (file: File): Promise<File | null> => {
    const maxSizeInMB = 3.5; // Must be under 4MB for Vercel

    try {
      const options = {
        maxSizeMB: maxSizeInMB,
        maxWidthOrHeight: 1920,
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
    formData.append('filePath', 'societies/banners');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const data = await response.json();
    return data.imageUrl;
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

      // Get effective location data with coordinates
      const effectiveLocationData = selectedLocation === 'user' ? userLocation :
                                    selectedLocation === 'custom' ? customLocation :
                                    null;

      const res = await fetch('/api/societies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          location: effectiveLocationData?.displayName || undefined,
          latitude: effectiveLocationData?.coordinates.lat || undefined,
          longitude: effectiveLocationData?.coordinates.lng || undefined,
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
      setCustomLocation(null);
      setSelectedLocation('user');
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

  // Show loading state
  if (isLoadingUnlockStatus) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Checking eligibility...</p>
        </div>
      </div>
    );
  }

  // Show unlock progress if user hasn't unlocked society creation yet
  if (unlockStatus && !unlockStatus.canCreateSociety) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <Lock className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-900 dark:text-amber-100">
            Society creation is locked. Engage with debates to unlock this feature!
          </p>
        </div>
        <UnlockProgress
          unlockStatus={unlockStatus}
          activityScore={unlockStatus.activityScore}
        />
      </div>
    );
  }

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
      <div className="space-y-2">
        <label className="text-sm font-medium">Share Location (optional)</label>
        <Select onValueChange={(value) => setSelectedLocation(value as 'user' | 'global' | 'custom')} value={selectedLocation}>
          <SelectTrigger className="min-h-[44px]">
            <SelectValue placeholder="Select location scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user" disabled={!userLocation}>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <div>
                  <div>My Location</div>
                  {userLocation && <div className="text-xs text-muted-foreground">{userLocation.displayName}</div>}
                  {!userLocation && <div className="text-xs text-orange-600">Set in profile</div>}
                </div>
              </div>
            </SelectItem>
            <SelectItem value="global">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <div>Everywhere</div>
              </div>
            </SelectItem>
            <SelectItem value="custom">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <div>Other Location</div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {selectedLocation === 'custom' && (
          <div className="mt-2">
            <LocationInput
              initialLocation={customLocation}
              onLocationChange={setCustomLocation}
            />
          </div>
        )}
      </div>
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