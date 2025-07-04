"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, AlertCircle, Paperclip } from 'lucide-react';
import { createIssue, updateIssue, getIssueById } from '@/app/actions/issueActions';
import { Issue, Prisma } from '@prisma/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

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
  tags: z.string().optional().transform(val => val ? val.split(',').map(tag => tag.trim()) : []),
  location: z.string().optional().nullable(), // Allow null for location
  mediaUrl: z.string().optional().nullable(), // Allow null for mediaUrl to support removal
});

type IssueFormData = z.infer<typeof formSchema>;

interface IssueFormProps {
  setOpen: (open: boolean) => void;
  issueId?: string;
}

export function IssueForm({ setOpen, issueId }: IssueFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<IssueFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      location: null, // Default to null consistently
      mediaUrl: null, // Default to null for new issues as well
    },
  });

  useEffect(() => {
    async function loadIssue() {
      if (issueId) {
        const result = await getIssueById(issueId);
        if (result.success && result.issue) {
          const issue = result.issue as IssueType; // Cast to IssueType
          form.reset({
            title: issue.title,
            description: issue.description,
            tags: issue.tags,
            location: issue.location,
            mediaUrl: (issue.media && issue.media.length > 0) ? issue.media[0].url : null,
          });
          if (issue.media && issue.media.length > 0) {
            setMediaPreview(issue.media[0].url);
          }
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to load issue for editing.",
            variant: "destructive",
          });
          setOpen(false);
        }
      }
    }
    loadIssue();
  }, [issueId, form, setOpen, toast]);

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
        description: "You must be logged in to create/update an issue.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    console.log("Form submitted with values:", values);

    let result: { success: boolean; issue?: Issue; error?: string };

    try {
      if (issueId) {
        result = await updateIssue(issueId, {
          title: values.title,
          description: values.description,
          tags: values.tags,
          location: values.location,
          mediaUrl: values.mediaUrl,
        });
      } else {
        result = await createIssue({
          ...values,
          tags: values.tags || [],
          mediaUrl: values.mediaUrl,
        });
      }

      if (result.success && result.issue) {
        toast({
          title: issueId ? "Issue Updated!" : "Issue Created!",
          description: `"${result.issue.title}" has been successfully ${issueId ? 'updated' : 'submitted'}.`,
          variant: "default",
        });
        setOpen(false);
        form.reset();
        setSelectedMedia(null);
        setMediaPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        router.refresh();
      } else {
        toast({
          title: issueId ? "Error Updating Issue" : "Error Creating Issue",
          description: result.error || "An unknown error occurred.",
          variant: "destructive",
        });
        console.error(issueId ? "Failed to update issue:" : "Failed to create issue:", result.error);
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
        {mediaPreview && (
          <div className="w-full h-48 relative rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaPreview} alt="Media Preview" className="object-cover w-full h-full" />
            <div className="absolute inset-0 bg-black/20"></div>
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (issueId ? "Updating Issue..." : "Creating Issue...") : (issueId ? "Update Issue" : "Create Issue")}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleMediaChange}
          accept="image/*,video/*"
          style={{ display: 'none' }}
        />
        <Button type="button" onClick={triggerFileInput} variant="outline" className="w-full">
          <Paperclip className="mr-2 h-4 w-4" /> {mediaPreview ? "Change Media" : "Attach Media"}
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
