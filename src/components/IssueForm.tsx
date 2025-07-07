"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { AlertCircle, Paperclip, Palette } from 'lucide-react';
import { createIssue, updateIssue, getIssueById } from '@/app/actions/issueActions';
import { Issue, Prisma } from '@prisma/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Define background options like in CreatePostForm
const backgroundOptions = [
  'linear-gradient(to right, #ff7e5f, #feb47b)', // Peach
  'linear-gradient(to right, #6a11cb, #2575fc)', // Purple/Blue
  'linear-gradient(to right, #00c6ff, #0072ff)', // Sky Blue
  'linear-gradient(to right, #f7971e, #ffd200)', // Orange/Yellow
  'linear-gradient(to right, #d38312, #a83279)', // Brown/Pink
  '#333333', // Dark Grey
];

// Explicitly define the type for the fetched issue data to match the `include` in getIssueById
interface FetchedMediaItem {
  url: string;
  type: string;
}

interface FetchedCreator {
  id: string;
  name: string | null;
  image: string | null;
}

interface IssueType extends Omit<Issue, 'media' | 'creator'> {
  media?: FetchedMediaItem[]; // Make optional to handle no media
  creator?: FetchedCreator | null; // Make optional to handle no creator or null
}

// Define the form schema for an Issue
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000),
  tags: z.string().optional(), // Optional string, not array
  location: z.string().optional().nullable(), // Allow null for location
  mediaUrl: z.string().optional().nullable(), // Allow null for mediaUrl to support removal
});

type IssueFormData = z.infer<typeof formSchema>;

interface CreateIssueFormProps {
  setOpen: (open: boolean) => void;
  onCreated?: (issue: any) => void;
}

export function IssueForm({ setOpen, onCreated }: CreateIssueFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string>(backgroundOptions[1]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<IssueFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
      location: null, // Default to null consistently
      mediaUrl: null, // Default to null for new issues as well
    },
  });

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
        form.setValue("mediaUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
      setSelectedBackground(''); // Clear background if media is selected
    } else {
      setSelectedMedia(null);
      setMediaPreview(null);
      form.setValue("mediaUrl", null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
    form.setValue("mediaUrl", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function onSubmit(values: IssueFormData) {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create an issue.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    console.log("Form submitted with values:", values);

    let mediaUrl = values.mediaUrl;
    if (!mediaUrl) {
      // No image, use background color
      mediaUrl = selectedBackground;
    }

    // Convert tags to array if present, else empty array
    const tagsArray = values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

    try {
      const result = await createIssue({
        ...values,
        tags: tagsArray,
        mediaUrl: mediaUrl,
      });

      if (result.success && result.issue) {
        toast({
          title: "Issue Created!",
          description: `"${result.issue.title}" is now live.`,
          variant: "default",
        });
        setOpen(false);
        form.reset();
        setSelectedMedia(null);
        setMediaPreview(null);
        setSelectedBackground(backgroundOptions[1]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (onCreated) onCreated(result.issue);
      } else {
        toast({
          title: "Error Creating Issue",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        });
        console.error("Failed to create issue:", result.error);
      }
    } catch (error) {
      console.error("Error submitting issue form:", error);
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
        <p className="text-sm text-muted-foreground">Please log in to create an issue.</p>
        <Button onClick={() => router.push('/login')} className="mt-4">Login</Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
              <FormLabel>Issue Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Lack of Recycling Bins in Downtown" {...field} />
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
                  placeholder="Describe the problem in detail, its impact, and why it needs addressing..."
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (comma-separated)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Environment, Waste Management, Community" {...field} />
              </FormControl>
              <FormDescription>Separate tags with commas (e.g., Education, Technology).</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Downtown Cityville, New York" 
                  {...field} 
                  value={field.value || ''} // Convert null to empty string
                />
              </FormControl>
              <FormDescription>Specify a location if this issue is geographically specific.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Media Upload and Background Selection */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleMediaChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <Button type="button" variant="outline" onClick={triggerFileInput}>
            <Paperclip className="mr-2 h-4 w-4" />
            {mediaPreview ? "Change Image" : "Upload Image"}
          </Button>

          {!selectedMedia && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" type="button">
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
                      className={`w-8 h-8 rounded border ${selectedBackground === bg ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      style={{ background: bg }}
                      onClick={() => setSelectedBackground(bg)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating Issue..." : "Create Issue"}
        </Button>
        {mediaPreview && (
          <Button type="button" onClick={handleRemoveMedia} variant="outline" className="w-full text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600">
            Remove Media
          </Button>
        )}
      </form>
    </Form>
  );
} 
