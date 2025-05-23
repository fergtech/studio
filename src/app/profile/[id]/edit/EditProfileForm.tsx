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

interface EditProfileFormProps {
  user: User;
}

const initialState: UpdateUserProfileActionState = {
  message: '',
  success: false,
};

export default function EditProfileForm({ user }: EditProfileFormProps) {
  const [formState, formAction] = useActionState(updateUserProfileAction, initialState);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState(user.name ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user.image);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(user.bannerImageUrl ?? null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formState.success) {
      toast({
        title: 'Success!',
        description: formState.message,
      });
      // Redirect to the profile page after successful update
      router.push(`/profile/${user.id}`);
      router.refresh(); // Ensure the page data is refreshed
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
      setImagePreview(user.image);
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
      setBannerPreview(user.bannerImageUrl ?? null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();

    formData.append('name', name);
    formData.append('bio', bio);

    let finalImageUrl = user.image; // Default to existing image
    let finalBannerImageUrl = user.bannerImageUrl ?? null; // Default to existing banner image

    if (selectedFile) {
      setIsUploadingImage(true);
      const imageFormData = new FormData();
      imageFormData.append('file', selectedFile);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: imageFormData,
        });
        const result = await response.json();
        if (result.success && result.url) {
          finalImageUrl = result.url;
        } else {
          toast({
            title: 'Image Upload Failed',
            description: result.message || 'Could not upload the new profile picture.',
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

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: bannerFormData,
        });
        const result = await response.json();
        if (result.success && result.url) {
          finalBannerImageUrl = result.url;
        } else {
          toast({
            title: 'Banner Upload Failed',
            description: result.message || 'Could not upload the new banner image.',
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
          <CardDescription>Update your name, bio, profile picture, and banner image.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              name="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Your full name"
            />
            {formState.errors?.name && (
              <p className="text-sm text-red-500">{formState.errors.name.join(', ')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a little about yourself..."
              rows={5}
            />
            {formState.errors?.bio && (
              <p className="text-sm text-red-500">{formState.errors.bio.join(', ')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profilePicture">Profile Picture</Label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {imagePreview ? (
                  <Image 
                    src={imagePreview} 
                    alt="Profile preview" 
                    width={96} 
                    height={96} 
                    className="object-cover w-full h-full" 
                  />
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Preview</span>
                )}
              </div>
              <Input 
                id="profilePicture" 
                name="profilePicture" 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="max-w-xs"
              />
            </div>
            {formState.errors?.imageUrl && (
              <p className="text-sm text-red-500">{formState.errors.imageUrl.join(', ')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bannerImage">Banner Image</Label>
            <div className="flex flex-col items-start space-y-2">
              <div className="w-full h-32 relative rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {bannerPreview ? (
                  <Image 
                    src={bannerPreview} 
                    alt="Banner preview" 
                    layout="fill" 
                    objectFit="cover"
                    className="w-full h-full"
                  />
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Banner Preview</span>
                )}
              </div>
              <Input 
                id="bannerImage" 
                name="bannerImage" 
                type="file" 
                accept="image/*" 
                ref={bannerFileInputRef} 
                onChange={handleBannerFileChange}
                className="w-full"
              />
            </div>
            {formState.errors?.bannerImageUrl && (
              <p className="text-sm text-red-500">{formState.errors.bannerImageUrl.join(', ')}</p>
            )}
          </div>

        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUploadingImage || isPending || (formState.message === 'Updating...' && !formState.success && !formState.errors) }>
            {isUploadingImage ? 'Uploading Image...' : (isPending ? 'Saving...' : 'Save Changes')}
          </Button>
        </CardFooter>
      </form>
      {formState.message && !formState.success && formState.errors?.general && (
        <p className="text-sm text-red-500 p-4">{formState.errors.general.join(', ')}</p>
      )}
    </Card>
  );
}
