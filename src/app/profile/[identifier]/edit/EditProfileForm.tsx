'use client';

import { useEffect, useState, useRef, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User } from '@prisma/client';

import { updateUserProfileAction, UpdateUserProfileActionState } from '@/app/actions/userActions';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';

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
  showLocation?: boolean;
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
  const [showLocation, setShowLocation] = useState(user.showLocation ?? true);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      // If user deselects file, revert to original image or null if none was there
      setImagePreview(user.image ?? null);
    }
  };

  const handleBannerFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    formData.append('showLocation', showLocation ? 'true' : 'false');
    // --- End new location fields ---

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
            <Label htmlFor="city">City</Label>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <Input 
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city"
              />
            </div>
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