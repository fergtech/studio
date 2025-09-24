'use client';

import { useEffect, useState, useRef, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User } from '@prisma/client';
import imageCompression from 'browser-image-compression';

import { updateUserProfileAction, UpdateUserProfileActionState } from '@/app/actions/userActions';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Newspaper } from 'lucide-react';

import LocationInput from '@/components/LocationInput';
import { ResolvedLocation } from '@/services/location';

interface EditProfileUser {
  id: string;
  email?: string;
  name?: string | null;
  username?: string | null;
  image?: string | null;
  bannerImageUrl: string | null;
  bio?: string | null;
  primaryIntent?: string | null;
  websites?: string[];
  gender?: string | null;
  profession?: string | null;
  organization?: string | null;
  institution?: string | null;
  city: string | null;
  location: string | null; // JSON string of ResolvedLocation
  showLocation?: boolean;
  enableLocalNews?: boolean;
  newsRadius?: number | null;
  newsTypes?: string[];
}

interface EditProfileFormProps {
  user: EditProfileUser;
}

const initialState: UpdateUserProfileActionState = {
  message: '',
  success: false,
  updatedUsername: undefined,
};

export default function EditProfileForm({ user }: EditProfileFormProps) {
  const [formState, formAction] = useActionState(updateUserProfileAction, initialState);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState(user.name ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [username, setUsername] = useState(user.username ?? '');
  const [gender, setGender] = useState(user.gender ?? '');
  const [websites, setWebsites] = useState<string[]>(user.websites ?? []);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user.image ?? null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(user.bannerImageUrl ?? null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const [city, setCity] = useState(user.city ?? '');
  const [location, setLocation] = useState<ResolvedLocation | null>(
    user.location ? JSON.parse(user.location) : null
  );
  const [showLocation, setShowLocation] = useState(user.showLocation ?? true);

  // News preference state
  const [enableLocalNews, setEnableLocalNews] = useState(user.enableLocalNews ?? true);
  const [newsRadius, setNewsRadius] = useState(user.newsRadius ?? 25);
  const [newsTypes, setNewsTypes] = useState<string[]>(user.newsTypes ?? ['local', 'community', 'government']);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formState.success) {
      toast({
        title: 'Success!',
        description: formState.message,
      });
      // Redirect to the profile page after successful update using the updated username
      const redirectUsername = formState.updatedUsername || user.username;
      if (redirectUsername) {
        router.push(`/profile/${redirectUsername}`);
      } else {
        // Fallback to user ID if no username available
        router.push(`/profile/${user.id}`);
      }
    } else if (formState.message && !formState.success && (formState.errors || formState.message !== '')) {
      // Display general errors or specific field errors
      let description = formState.message;
      if (formState.errors?.general) {
        description = formState.errors.general.join(', ');
      } else if (formState.errors?.name) {
        description = `Name: ${formState.errors.name.join(', ')}`;
      } else if (formState.errors?.bio) {
        description = `Bio: ${formState.errors.bio.join(', ')}`;
      } else if (formState.errors?.imageUrl) {
        description = `Image: ${formState.errors.imageUrl.join(', ')}`;
      } else if (formState.errors?.bannerImageUrl) {
        description = `Banner Image: ${formState.errors.bannerImageUrl.join(', ')}`;
      }
      toast({
        title: 'Error updating profile',
        description: description,
        variant: 'destructive',
      });
    }
  }, [formState, router, toast, user.id]);

  const compressImage = async (file: File, maxSizeMB: number = 1) => {
    try {
      const options = {
        maxSizeMB,
        maxWidthOrHeight: file.name.includes('banner') ? 1200 : 800,
        useWebWorker: true,
        fileType: 'image/jpeg',
        quality: 0.8,
      };
      
      const compressedFile = await imageCompression(file, options);
      console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return compressedFile;
    } catch (error) {
      console.error('Image compression failed:', error);
      return file; // Return original if compression fails
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Show preview immediately with original file
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Only compress if it's an image file
      if (file.type.startsWith('image/')) {
        const compressedFile = await compressImage(file, 1);
        setSelectedFile(compressedFile);
      } else {
        // For videos and other files, use original
        setSelectedFile(file);
      }
    } else {
      setSelectedFile(null);
      // If user deselects file, revert to original image or null if none was there
      setImagePreview(user.image ?? null);
    }
  };

  const handleBannerFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Show preview immediately with original file
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Compress the file for upload (banner images can be slightly larger)
      const compressedFile = await compressImage(file, 1.5);
      setSelectedBannerFile(compressedFile);
    } else {
      setSelectedBannerFile(null);
      setBannerPreview((user.bannerImageUrl as string | null) ?? null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();

    formData.append('name', name);
    formData.append('bio', bio);
    formData.append('username', username);
    formData.append('gender', gender);
    websites.forEach(website => formData.append('websites', website));
    // --- New location fields ---
    formData.append('city', city);
    if (location) {
      formData.append('location', JSON.stringify(location));
    }
    formData.append('showLocation', showLocation ? 'true' : 'false');
    // --- End new location fields ---

    // --- News preference fields ---
    formData.append('enableLocalNews', enableLocalNews ? 'true' : 'false');
    formData.append('newsRadius', newsRadius.toString());
    newsTypes.forEach(type => formData.append('newsTypes', type));
    // --- End news preference fields ---

    let finalImageUrl = user.image; // Default to existing image
    let finalBannerImageUrl = user.bannerImageUrl ?? null; // Default to existing banner image

    if (selectedFile) {
      setIsUploadingImage(true);
      const imageFormData = new FormData();
      imageFormData.append('file', selectedFile);
      imageFormData.append('imageType', 'profile');
      console.log("Uploading profile image with imageType:", imageFormData.get('imageType'));

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData,
        });
        const result = await response.json();
        if (response.ok && result.imageUrl) {
          finalImageUrl = result.imageUrl;
        } else {
          toast({
            title: 'Image Upload Failed',
            description: result.message || result.error || 'Could not upload the new profile picture.',
            variant: 'destructive',
          });
          setIsUploadingImage(false);
          return; // Stop form submission if image upload fails
        }
      } catch (error) {
        toast({
          title: 'Image Upload Error',
          description: 'An error occurred while uploading the image.',
          variant: 'destructive',
        });
        setIsUploadingImage(false);
        return; // Stop form submission
      }
      setIsUploadingImage(false);
    }

    if (selectedBannerFile) {
      setIsUploadingBanner(true);
      const bannerFormData = new FormData();
      bannerFormData.append('file', selectedBannerFile);
      bannerFormData.append('imageType', 'banner');
      console.log("Uploading banner image with imageType:", bannerFormData.get('imageType'));

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: bannerFormData,
        });
        const result = await response.json();
        if (response.ok && result.imageUrl) {
          finalBannerImageUrl = result.imageUrl;
        } else {
          toast({
            title: 'Banner Upload Failed',
            description: result.message || result.error || 'Could not upload the new banner image.',
            variant: 'destructive',
          });
          setIsUploadingBanner(false);
          return; // Stop form submission if banner upload fails
        }
      } catch (error) {
        toast({
          title: 'Banner Upload Error',
          description: 'An error occurred while uploading the banner image.',
          variant: 'destructive',
        });
        setIsUploadingBanner(false);
        return; // Stop form submission
      }
      setIsUploadingBanner(false);
    }
    
    // If an image was successfully uploaded, or if no new file was selected but an old one exists
    if (finalImageUrl) {
      formData.append('imageUrl', finalImageUrl);
    } else if (!finalImageUrl && user.image) {
      // This case implies the user wants to remove the image.
      // The backend action needs to handle an empty or specific signal for removal.
      // For now, if finalImageUrl is null, it means no image or remove image.
      // The Zod schema allows optional imageUrl, so not appending it works for removal if DB field is nullable.
    }

    if (finalBannerImageUrl) {
      formData.append('bannerImageUrl', finalBannerImageUrl);
    } // Similar logic for removing banner image if needed

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Update your profile information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <LocationInput 
              initialLocation={location}
              onLocationChange={setLocation} 
            />
            <p className="text-xs text-muted-foreground">
              Start typing your city, zip code, or county to find your location.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showLocation"
              checked={showLocation}
              onChange={(e) => setShowLocation(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="showLocation">Show location on profile</Label>
          </div>

          {/* News Preferences Section */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center space-x-2">
              <Newspaper className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">News Preferences</h3>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableLocalNews"
                checked={enableLocalNews}
                onChange={(e) => setEnableLocalNews(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="enableLocalNews">Enable local news in your feed</Label>
            </div>

            {enableLocalNews && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newsRadius">News radius (miles)</Label>
                  <Input
                    id="newsRadius"
                    type="number"
                    min="1"
                    max="500"
                    value={newsRadius}
                    onChange={(e) => setNewsRadius(parseInt(e.target.value) || 25)}
                    placeholder="25"
                  />
                  <p className="text-xs text-muted-foreground">
                    How far from your location to search for local news (1-500 miles).
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>News categories</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'local', label: 'Local' },
                      { value: 'community', label: 'Community' },
                      { value: 'government', label: 'Government' },
                      { value: 'education', label: 'Education' },
                      { value: 'health', label: 'Health' },
                      { value: 'transportation', label: 'Transportation' },
                      { value: 'environment', label: 'Environment' },
                      { value: 'crime', label: 'Crime' },
                      { value: 'business', label: 'Business' },
                      { value: 'events', label: 'Events' }
                    ].map((category) => (
                      <div key={category.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`newsType-${category.value}`}
                          checked={newsTypes.includes(category.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewsTypes([...newsTypes, category.value]);
                            } else {
                              setNewsTypes(newsTypes.filter(type => type !== category.value));
                            }
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={`newsType-${category.value}`} className="text-sm">
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select the types of news you're interested in receiving.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Profile preview"
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? 'Uploading...' : 'Change Picture'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Banner Image</Label>
            <div className="space-y-4">
              {bannerPreview ? (
                <div className="relative">
                  <Image
                    src={bannerPreview}
                    alt="Banner preview"
                    width={400}
                    height={150}
                    className="rounded-lg object-cover w-full max-w-md"
                  />
                </div>
              ) : (
                <div className="w-full max-w-md h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">No banner image</span>
                </div>
              )}
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => bannerFileInputRef.current?.click()}
                  disabled={isUploadingBanner}
                >
                  {isUploadingBanner ? 'Uploading...' : 'Change Banner'}
                </Button>
                <input
                  ref={bannerFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Websites</Label>
            <div className="space-y-2">
              {[0, 1].map((index) => (
                <Input
                  key={index}
                  value={websites[index] || ''}
                  onChange={(e) => {
                    const newWebsites = [...websites];
                    newWebsites[index] = e.target.value;
                    setWebsites(newWebsites);
                  }}
                  placeholder={`Website ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending || isUploadingImage || isUploadingBanner}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 