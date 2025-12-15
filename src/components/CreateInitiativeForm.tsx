"use client";

import { useState, useEffect, useRef } from 'react'; // Import useEffect and useRef
import { useForm, useFieldArray, FieldValues, FieldArrayPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { useSession } from 'next-auth/react';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
// Use Prisma's InitiativeStatus for type safety with the server action & Zod schema
import { InitiativeStatus as PrismaInitiativeStatus } from '@prisma/client';
import { Upload, X, Plus, Tag, AlertCircle, Palette, MapPin, Globe, Users, Lock } from 'lucide-react';
import { createInitiative } from '@/app/actions/initiativeActions'; // Import the server action
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import imageCompression from 'browser-image-compression';
import LocationInput from '@/components/LocationInput';
import { ResolvedLocation } from '@/services/location';
// Removed UnlockProgress - initiatives now immediately accessible to all users

// Define fallback enum values in case Prisma client is not available during build
const FALLBACK_INITIATIVE_STATUS = {
  PLANNING: 'PLANNING',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ON_HOLD: 'ON_HOLD',
  CANCELLED: 'CANCELLED'
} as const;

// Use Prisma enum if available, otherwise use fallback
const InitiativeStatusEnum = PrismaInitiativeStatus || FALLBACK_INITIATIVE_STATUS;

// Define background options like in CreatePostForm
const backgroundOptions = [
  'linear-gradient(to right, #ff7e5f, #feb47b)', // Peach
  'linear-gradient(to right, #6a11cb, #2575fc)', // Purple/Blue
  'linear-gradient(to right, #00c6ff, #0072ff)', // Sky Blue
  'linear-gradient(to right, #f7971e, #ffd200)', // Orange/Yellow
  'linear-gradient(to right, #d38312, #a83279)', // Brown/Pink
  '#333333', // Dark Grey
];

// Update Zod type for status options to align with Prisma
const initiativeStatusOptions = Object.values(InitiativeStatusEnum);

// Format status for display
const formatStatus = (status: string): string => {
  return status.replace(/([A-Z])/g, ' $1').trim();
};

// Define the form schema
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000),
  imageFile: z.any().optional(), // Accept file or undefined
  backgroundColor: z.string().optional(),
  roles: z.array(z.string().max(30)).optional().default([]),
  status: z.enum(Object.values(InitiativeStatusEnum) as [string, ...string[]], {
    errorMap: (issue, ctx) => ({ message: "Please select a valid status." })
  }),
});

type InitiativeFormData = z.infer<typeof formSchema>;

interface CreateInitiativeFormProps {
  setOpen?: (open: boolean) => void; // Prop to control dialog visibility (optional for society use)
  onCreated?: (initiative: any) => void;
  onSuccess?: () => void; // New prop for society initiative creation
  societyId?: string; // New prop for society initiatives
  initialTitle?: string | null; // Pre-fill title from modal context
  initialDescription?: string | null; // Pre-fill description from modal context
  initialImageUrl?: string | null; // Pre-fill image from modal context
  originatingIssueId?: string | null; // Issue this initiative addresses
  originatingIdeaId?: string | null; // Idea this initiative implements
}

export function CreateInitiativeForm({ 
  setOpen, 
  onCreated, 
  onSuccess, 
  societyId, 
  initialTitle,
  initialDescription, 
  initialImageUrl,
  originatingIssueId, 
  originatingIdeaId 
}: CreateInitiativeFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string>(backgroundOptions[1]);
  const [selectedLocation, setSelectedLocation] = useState<'user' | 'global' | 'custom'>('user');
  const [userLocation, setUserLocation] = useState<ResolvedLocation | null>(null);
  const [customLocation, setCustomLocation] = useState<ResolvedLocation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get values from props or URL query params
  const initialTitleValue = initialTitle || "";
  const initialDescriptionValue = initialDescription || searchParams.get('postContent') || "";

  const form = useForm<InitiativeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialTitleValue,
      description: decodeURIComponent(initialDescriptionValue),
      imageFile: undefined,
      backgroundColor: selectedBackground,
      roles: [],
      status: PrismaInitiativeStatus.Planning,
    },
  });

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

  // Set initial image if provided
  useEffect(() => {
    if (initialImageUrl) {
      setMediaPreview(initialImageUrl);
      // Note: We can't set selectedMedia to a File object from a URL,
      // but the form will use the existing image URL when submitting
    }
  }, [initialImageUrl]);

  // Effect to update description if query param changes after initial load (optional, but good practice)
  useEffect(() => {
    const postContentFromQuery = searchParams.get('postContent');
    if (postContentFromQuery) {
      // Only update if it's different from current form value to avoid unnecessary re-renders/resets
      if (decodeURIComponent(postContentFromQuery) !== form.getValues("description")) {
        form.setValue("description", decodeURIComponent(postContentFromQuery));
      }
    }
  }, [searchParams, form]);

  // Handle image preview
  const handleMediaChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Strictly compress to under 1MB for Next.js server action compatibility
        let options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        let compressedFile = await imageCompression(file, options);
        // If still too large, try more aggressive compression
        if (compressedFile.size > 1 * 1024 * 1024) {
          options = {
            maxSizeMB: 0.7,
            maxWidthOrHeight: 1024,
            useWebWorker: true,
          };
          compressedFile = await imageCompression(file, options);
        }
        if (compressedFile.size > 1 * 1024 * 1024) {
          toast({
            title: "Image Too Large",
            description: "Image is still too large after compression (must be under 1MB). Please choose a smaller image.",
            variant: "destructive",
          });
          setSelectedMedia(null);
          setMediaPreview(null);
          form.setValue("imageFile", undefined);
          return;
        }
        setSelectedMedia(compressedFile);
        // Create a preview URL for display only
        const previewUrl = URL.createObjectURL(compressedFile);
        setMediaPreview(previewUrl);
        form.setValue("imageFile", compressedFile);
        setSelectedBackground(''); // Clear background if media is selected
      } catch (err) {
        console.error('Image compression error:', err);
        toast({
          title: "Image Compression Error",
          description: "Could not compress the image. Please try a different file.",
          variant: "destructive",
        });
        setSelectedMedia(null);
        setMediaPreview(null);
        form.setValue("imageFile", undefined);
      }
    } else {
      setSelectedMedia(null);
      setMediaPreview(null);
      form.setValue("imageFile", undefined);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const roleArray = useFieldArray({
    control: form.control,
    name: "roles" as FieldArrayPath<InitiativeFormData> // Corrected type assertion
  });

  // Ensure there's always at least one role field
  useEffect(() => {
    if (roleArray.fields.length === 0) {
      roleArray.append("");
    }
  }, [roleArray]);

  async function onSubmit(values: InitiativeFormData) {
    console.log("Form submitted with values:", values);
    if (!session?.user?.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create an initiative.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    
    // Filter out empty roles
    const filteredRoles = values.roles.filter(role => role.trim() !== '');
    if (filteredRoles.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one role/skill must be provided.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    values.roles = filteredRoles;
    let imageUrl: string | undefined = undefined;
    let backgroundColor: string | undefined = undefined;

    // Upload image first if provided
    if (values.imageFile) {
      const file = values.imageFile as File;
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filePath', 'initiatives/images');
        formData.append('imageType', 'initiative');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Image upload failed with status: ${response.status}`);
        }

        const result = await response.json();
        imageUrl = result.imageUrl;
      } catch (uploadError: any) {
        console.error("Error uploading image:", uploadError);
        toast({
          title: "Image Upload Failed",
          description: uploadError.message || "Could not upload the image. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    } else if (initialImageUrl) {
      // Use the initial image URL from the issue/idea
      imageUrl = initialImageUrl;
    } else {
      backgroundColor = selectedBackground;
    }

    // Get effective location data with coordinates
    const effectiveLocationData = selectedLocation === 'user' ? userLocation :
                                  selectedLocation === 'custom' ? customLocation :
                                  null;

    try {
      const result = await createInitiative({
        ...values,
        status: values.status as PrismaInitiativeStatus, // Ensure proper typing
        imageUrl: imageUrl || undefined,
        location: effectiveLocationData?.displayName || undefined,
        latitude: effectiveLocationData?.coordinates.lat || undefined,
        longitude: effectiveLocationData?.coordinates.lng || undefined,
        societyId: societyId || undefined,
        originatingIssueId: originatingIssueId || undefined,
        originatingIdeaId: originatingIdeaId || undefined,
      });
      if (result.success && result.initiative) {
        toast({
          title: "Initiative Created!",
          description: `"${result.initiative.title}" is now live.`,
          variant: "default",
        });
        
        // Handle different callback flows
        if (onSuccess) {
          // Society initiative creation flow
          onSuccess();
        } else {
          // Original modal flow
          if (setOpen) {
            setOpen(false);
          }
          if (onCreated) onCreated(result.initiative);
          
          // Navigate to initiative page when used as route (no modal)
          if (!setOpen) {
            router.push(`/initiatives/${result.initiative.id}`);
          }
        }
        
        form.reset();
        setSelectedMedia(null);
        setMediaPreview(null);
        setSelectedBackground(backgroundOptions[1]);
        setCustomLocation(null);
        setSelectedLocation('user');
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast({
          title: "Error Creating Initiative",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        });
        console.error("Failed to create initiative:", result.error);
      }
    } catch (error) {
      console.error("Error submitting initiative form:", error);
      toast({
        title: "Submission Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!session?.user) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-2" />
        <p className="text-lg font-medium">Authentication Required</p>
        <p className="text-sm text-muted-foreground">Please log in to create an initiative.</p>
        <Button onClick={() => router.push('/login')} className="mt-4">Login</Button>
      </div>
    );
  }

  // Initiatives are now immediately accessible to all users - no eligibility check needed

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        {/* Collaboration messaging banner */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Start a Personal or Group Project</h3>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-200">
            Projects can be solo (like starting a business, learning a skill, or a personal goal) or collaborative (study group, book club, community initiative). Invite others to join and work together!
          </p>
        </div>
        {/* Media Preview or Selected Background Preview */}
        {(mediaPreview || !selectedMedia) && (
          <div
            className="h-32 bg-cover bg-center relative flex items-center justify-center text-muted-foreground rounded-lg"
            style={
              mediaPreview
                ? { backgroundImage: `url(${mediaPreview})` }
                : { background: selectedBackground }
            }
          >
            {!mediaPreview && <Palette className="w-8 h-8" />}
            {mediaPreview && <div className="absolute inset-0 bg-black/20"></div>}
          </div>
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initiative Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Community Tech Tutoring Program" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your project goals and what you want to achieve. Working with others? Mention how people can contribute or join in!"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                Tip: Once created, you can invite members from the project page to collaborate with you.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Media Upload and Background Selection */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleMediaChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <Button type="button" variant="outline" onClick={triggerFileInput} className="min-h-[44px] flex-1 sm:flex-initial">
            <Upload className="mr-2 h-4 w-4" />
            {mediaPreview ? "Change Image" : "Upload Image"}
          </Button>

          {!selectedMedia && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" type="button" className="min-h-[44px] flex-1 sm:flex-initial">
                  <Palette className="mr-2 h-4 w-4" />
                  Background
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="grid grid-cols-3 gap-2">
                  {backgroundOptions.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      className={`min-w-[44px] min-h-[44px] rounded border ${selectedBackground === bg ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      style={{ background: bg }}
                      onClick={() => setSelectedBackground(bg)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <FormItem>
          <FormLabel>Roles/Skills Needed</FormLabel>
          <div className="space-y-2">
            {roleArray.fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`roles.${index}`}
                render={({ field: roleField }) => (
                  <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <FormControl>
                        <Input placeholder="e.g., Designer, Developer" {...roleField} className="min-h-[44px]" />
                      </FormControl>
                    </div>
                    {roleArray.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => roleArray.remove(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px] min-w-[44px] self-center sm:self-auto"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove Role</span>
                      </Button>
                    )}
                  </FormItem>
                )}
              />
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => roleArray.append("")}
            className="mt-2 min-h-[44px] w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Role
          </Button>
          <FormMessage>{form.formState.errors.roles?.message || form.formState.errors.roles?.root?.message}</FormMessage>
        </FormItem>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the current status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {initiativeStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>{formatStatus(status)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Share Location (Optional)</FormLabel>
          <Select onValueChange={(value) => setSelectedLocation(value as 'user' | 'global' | 'custom')} value={selectedLocation}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select location scope" />
              </SelectTrigger>
            </FormControl>
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
          <FormDescription>Specify a location if this initiative is geographically specific.</FormDescription>
        </FormItem>

        <Button type="submit" className="w-full min-h-[44px]" disabled={isSubmitting}>
          {isSubmitting ? "Creating Initiative..." : "Create Initiative"}
        </Button>
      </form>
    </Form>
  );
}
