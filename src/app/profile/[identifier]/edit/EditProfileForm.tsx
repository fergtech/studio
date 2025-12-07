'use client';

import { useEffect, useState, useRef, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User } from '@prisma/client';
import imageCompression from 'browser-image-compression';
import { User as UserIcon, Image as ImageIcon } from 'lucide-react';

import { updateUserProfileAction, UpdateUserProfileActionState } from '@/app/actions/userActions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { MapPin } from 'lucide-react';

import LocationInput from '@/components/LocationInput';
import { ResolvedLocation } from '@/services/location';
import PasswordResetButton from '@/components/PasswordResetButton';

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
  location: string | null;
  showLocation?: boolean;
  enableLocalNews?: boolean;
  newsRadius?: number | null;
  newsTypes?: string[];
  emailNotifications?: boolean;
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
  const [profession, setProfession] = useState(user.profession ?? '');
  const [organization, setOrganization] = useState(user.organization ?? '');
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

  const [enableLocalNews, setEnableLocalNews] = useState(user.enableLocalNews ?? true);
  const [newsRadius, setNewsRadius] = useState(user.newsRadius ?? 25);
  const [newsTypes, setNewsTypes] = useState<string[]>(user.newsTypes ?? ['local', 'community', 'government']);
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications ?? true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formState.success) {
      toast({
        title: 'Success!',
        description: formState.message,
      });
      const redirectUsername = formState.updatedUsername || user.username;
      if (redirectUsername) {
        router.push(`/profile/${redirectUsername}`);
      } else {
        router.push(`/profile/${user.id}`);
      }
    } else if (formState.message && !formState.success) {
      toast({
        title: 'Error updating profile',
        description: formState.message,
        variant: 'destructive',
      });
    }
  }, [formState, router, toast, user.id, user.username]);

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
      return compressedFile;
    } catch (error) {
      console.error('Image compression failed:', error);
      return file;
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      const compressedFile = await compressImage(file);
      setSelectedFile(compressedFile);
    }
  };

  const handleBannerFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      const compressedFile = await compressImage(file, 2);
      setSelectedBannerFile(compressedFile);
    }
  };

  const handleBannerDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      const compressedFile = await compressImage(file, 2);
      setSelectedBannerFile(compressedFile);
    }
  };

  const handleBannerDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    setIsUploadingImage(selectedFile !== null);
    setIsUploadingBanner(selectedBannerFile !== null);

    const formData = new FormData();

    let finalImageUrl = user.image;
    let finalBannerImageUrl = user.bannerImageUrl;

    if (selectedFile) {
      const imageFormData = new FormData();
      imageFormData.append('file', selectedFile);
      imageFormData.append('imageType', 'profile');
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
            description: result.message || 'Could not upload profile picture.',
            variant: 'destructive',
          });
          setIsUploadingImage(false);
          return;
        }
      } catch (error) {
        toast({
          title: 'Image Upload Error',
          description: 'An error occurred while uploading the image.',
          variant: 'destructive',
        });
        setIsUploadingImage(false);
        return;
      }
    }

    if (selectedBannerFile) {
      const bannerFormData = new FormData();
      bannerFormData.append('file', selectedBannerFile);
      bannerFormData.append('imageType', 'banner');
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
            description: result.message || 'Could not upload banner image.',
            variant: 'destructive',
          });
          setIsUploadingBanner(false);
          return;
        }
      } catch (error) {
        toast({
          title: 'Banner Upload Error',
          description: 'An error occurred while uploading the banner.',
          variant: 'destructive',
        });
        setIsUploadingBanner(false);
        return;
      }
    }

    formData.append('name', name);
    formData.append('bio', bio);
    formData.append('username', username);
    formData.append('gender', gender);
    formData.append('profession', profession);
    formData.append('organization', organization);
    websites.forEach(website => formData.append('websites', website));
    formData.append('city', city);
    if (location) {
      formData.append('location', JSON.stringify(location));
    }
    formData.append('showLocation', showLocation ? 'true' : 'false');
    formData.append('enableLocalNews', enableLocalNews ? 'true' : 'false');
    formData.append('newsRadius', newsRadius.toString());
    newsTypes.forEach(type => formData.append('newsTypes', type));
    formData.append('emailNotifications', emailNotifications ? 'true' : 'false');

    if (finalImageUrl) {
      formData.append('imageUrl', finalImageUrl);
    }
    if (finalBannerImageUrl) {
      formData.append('bannerImageUrl', finalBannerImageUrl);
    }

    startTransition(() => {
      formAction(formData);
    });

    setIsUploadingImage(false);
    setIsUploadingBanner(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      {/* Profile Section */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-3">
        <div className="px-4 sm:px-0">
          <h2 className="text-base font-semibold leading-7">Profile</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            This information will be displayed publicly so be careful what you share.
          </p>
        </div>

        <div className="bg-card shadow-sm ring-1 ring-border sm:rounded-xl md:col-span-2">
          <div className="px-4 py-6 sm:p-8">
            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              {/* Username */}
              <div className="sm:col-span-4">
                <label htmlFor="username" className="block text-sm font-medium leading-6">
                  Username
                </label>
                <div className="mt-2">
                  <div className="flex rounded-md bg-muted/50 ring-1 ring-inset ring-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring">
                    <span className="flex select-none items-center pl-3 text-muted-foreground sm:text-sm">
                      societyplus.app/profile/
                    </span>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="flex-1 border-0 bg-transparent py-1.5 pl-1 focus:ring-0 sm:text-sm sm:leading-6"
                      placeholder="janesmith"
                      suppressHydrationWarning
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="col-span-full">
                <label htmlFor="bio" className="block text-sm font-medium leading-6">
                  Bio
                </label>
                <div className="mt-2">
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="block w-full rounded-md border-0 bg-muted/50 py-1.5 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                    placeholder="Write a few sentences about yourself..."
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Write a few sentences about yourself.
                </p>
              </div>

              {/* Profile Photo */}
              <div className="col-span-full">
                <label htmlFor="photo" className="block text-sm font-medium leading-6">
                  Photo
                </label>
                <div className="mt-2 flex items-center gap-x-3">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Profile preview"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="inline-block h-12 w-12 overflow-hidden rounded-full bg-muted">
                      <UserIcon className="h-full w-full text-muted-foreground" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-md bg-muted/50 px-3 py-2 text-sm font-semibold shadow-sm hover:bg-muted/80"
                    suppressHydrationWarning
                  >
                    Change
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </div>
              </div>

              {/* Cover Photo */}
              <div className="col-span-full">
                <label htmlFor="cover-photo" className="block text-sm font-medium leading-6">
                  Cover photo
                </label>
                <div
                  className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10"
                  onDrop={handleBannerDrop}
                  onDragOver={handleBannerDragOver}
                >
                  <div className="text-center">
                    {bannerPreview ? (
                      <Image
                        src={bannerPreview}
                        alt="Banner preview"
                        width={600}
                        height={200}
                        className="mx-auto max-h-48 rounded-lg object-cover"
                      />
                    ) : (
                      <ImageIcon aria-hidden="true" className="mx-auto h-12 w-12 text-muted-foreground" />
                    )}
                    <div className="mt-4 flex text-sm leading-6 text-muted-foreground justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md font-semibold text-primary hover:text-primary/80"
                      >
                        <span>Upload a file</span>
                        <input
                          ref={bannerFileInputRef}
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleBannerFileChange}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-t border-border pt-12 md:grid-cols-3">
        <div className="px-4 sm:px-0">
          <h2 className="text-base font-semibold leading-7">Personal Information</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Share more about yourself to help others connect with you.
          </p>
        </div>

        <div className="bg-card shadow-sm ring-1 ring-border sm:rounded-xl md:col-span-2">
          <div className="px-4 py-6 sm:p-8">
            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              {/* Name */}
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium leading-6">
                  Full name
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="block w-full rounded-md border-0 bg-muted/50 py-1.5 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* Email (read-only) */}
              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium leading-6">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={user.email || ''}
                    disabled
                    autoComplete="email"
                    className="block w-full rounded-md border-0 bg-muted/30 py-1.5 text-muted-foreground shadow-sm ring-1 ring-inset ring-border sm:text-sm sm:leading-6 cursor-not-allowed"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* Password Reset */}
              <div className="col-span-full">
                <label htmlFor="password" className="block text-sm font-medium leading-6">
                  Password
                </label>
                <div className="mt-2">
                  <PasswordResetButton email={user.email || ''} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Click the button above to generate a secure password reset link
                </p>
              </div>

              {/* Gender */}
              <div className="sm:col-span-3">
                <label htmlFor="gender" className="block text-sm font-medium leading-6">
                  Gender
                </label>
                <div className="mt-2">
                  <select
                    id="gender"
                    name="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="block w-full rounded-md border-0 bg-muted/50 py-1.5 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                    suppressHydrationWarning
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="other">Other</option>
                    <option value="train">Train</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Profession */}
              <div className="sm:col-span-3">
                <label htmlFor="profession" className="block text-sm font-medium leading-6">
                  Profession
                </label>
                <div className="mt-2">
                  <input
                    id="profession"
                    name="profession"
                    type="text"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="block w-full rounded-md border-0 bg-muted/50 py-1.5 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* Organization */}
              <div className="col-span-full">
                <label htmlFor="organization" className="block text-sm font-medium leading-6">
                  Organization
                </label>
                <div className="mt-2">
                  <input
                    id="organization"
                    name="organization"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="block w-full rounded-md border-0 bg-muted/50 py-1.5 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* Location */}
              <div className="col-span-full">
                <label className="block text-sm font-medium leading-6 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Location
                </label>
                <LocationInput
                  initialLocation={location}
                  onLocationChange={(loc: ResolvedLocation | null) => {
                    setLocation(loc);
                    setCity(loc ? loc.city || loc.county || '' : '');
                  }}
                />
                {location && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {location.displayName}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-x-3">
                  <input
                    id="show-location"
                    name="show-location"
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-muted/50 text-primary focus:ring-2 focus:ring-ring"
                  />
                  <label htmlFor="show-location" className="text-sm leading-6">
                    Show location on my profile
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences Section */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-t border-border pt-12 md:grid-cols-3">
        <div className="px-4 sm:px-0">
          <h2 className="text-base font-semibold leading-7">Notification Preferences</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Manage how you receive notifications from Society+.
          </p>
        </div>

        <div className="bg-card shadow-sm ring-1 ring-border sm:rounded-xl md:col-span-2">
          <div className="px-4 py-6 sm:p-8">
            <div className="max-w-2xl space-y-10">
              <fieldset>
                <div className="space-y-6">
                  <div className="flex gap-x-3">
                    <div className="flex h-6 items-center">
                      <input
                        id="email-notifications"
                        name="email-notifications"
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)}
                        className="h-4 w-4 rounded border-border bg-muted/50 text-primary focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="text-sm leading-6">
                      <label htmlFor="email-notifications" className="font-medium">
                        Email Notifications
                      </label>
                      <p className="text-muted-foreground">
                        Receive email notifications when you get messages, new followers, and other important updates
                      </p>
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </div>

      {/* News Preferences Section */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 border-t border-border pt-12 md:grid-cols-3">
        <div className="px-4 sm:px-0">
          <h2 className="text-base font-semibold leading-7">News Preferences</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Customize what news you'd like to see based on your location.
          </p>
        </div>

        <div className="bg-card shadow-sm ring-1 ring-border sm:rounded-xl md:col-span-2">
          <div className="px-4 py-6 sm:p-8">
            <div className="max-w-2xl space-y-10">
              <fieldset>
                <div className="space-y-6">
                  <div className="flex gap-x-3">
                    <div className="flex h-6 items-center">
                      <input
                        id="enable-local-news"
                        name="enable-local-news"
                        type="checkbox"
                        checked={enableLocalNews}
                        onChange={(e) => setEnableLocalNews(e.target.checked)}
                        className="h-4 w-4 rounded border-border bg-muted/50 text-primary focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="text-sm leading-6">
                      <label htmlFor="enable-local-news" className="font-medium">
                        Enable local news
                      </label>
                      <p className="text-muted-foreground">
                        Get personalized news based on your location
                      </p>
                    </div>
                  </div>

                  {enableLocalNews && (
                    <div className="ml-9 space-y-4">
                      <div>
                        <label htmlFor="news-radius" className="block text-sm font-medium leading-6">
                          News radius: {newsRadius} miles
                        </label>
                        <input
                          id="news-radius"
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          value={newsRadius}
                          onChange={(e) => setNewsRadius(parseInt(e.target.value))}
                          className="mt-2 w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </fieldset>
            </div>
          </div>
          <div className="flex items-center justify-end gap-x-6 border-t border-border px-4 py-4 sm:px-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-semibold leading-6"
              suppressHydrationWarning
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={isPending || isUploadingImage || isUploadingBanner}
              className="rounded-md px-3 py-2 text-sm font-semibold"
            >
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
