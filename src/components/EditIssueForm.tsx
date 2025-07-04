"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Issue } from "@/lib/types";
import { updateIssue } from "@/app/actions/issueActions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Paperclip } from "lucide-react";
import { useState, useRef } from "react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  location: z.string().min(1, "Location is required"),
  mediaUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

interface EditIssueFormProps {
  setOpen: (open: boolean) => void;
  issue: Issue;
}

export function EditIssueForm({ setOpen, issue }: EditIssueFormProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(issue.media?.[0]?.url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: issue.title,
      description: issue.description,
      tags: issue.tags,
      location: issue.location || "",
      mediaUrl: issue.media?.[0]?.url || "",
    },
  });

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedMedia(null);
      setMediaPreview(issue.media?.[0]?.url || null); // Revert to existing image if no new file selected
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
    form.setValue("mediaUrl", ""); // Clear the mediaUrl in the form
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input
    }
  };

  async function onSubmit(values: FormValues) {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be logged in to edit an issue.",
        variant: "destructive",
      });
      return;
    }

    let finalMediaUrl = issue.media?.[0]?.url || null;

    if (selectedMedia) {
      const formData = new FormData();
      formData.append("file", selectedMedia);
      formData.append("filePath", "issues/media");

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (response.ok && result.imageUrl) {
          finalMediaUrl = result.imageUrl;
        } else {
          toast({
            title: "Media Upload Failed",
            description: result.message || result.error || "Could not upload the new media.",
            variant: "destructive",
          });
          return; // Stop form submission if image upload fails
        }
      } catch (error) {
        console.error("Error uploading media:", error);
        toast({
          title: "Media Upload Error",
          description: "An error occurred while uploading the media.",
          variant: "destructive",
        });
        return; // Stop form submission
      }
    } else if (mediaPreview === null && (issue.media?.[0]?.url || null) !== null) {
      // If mediaPreview is null and there was an existing image, it means the user removed it.
      finalMediaUrl = null;
    }

    try {
      const result = await updateIssue({
        issueId: issue.id,
        ...values,
        mediaUrl: finalMediaUrl, // Pass the potentially updated or cleared mediaUrl
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: "Issue updated successfully.",
      });
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating issue:", error);
      toast({
        title: "Error",
        description: "Failed to update issue. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (!session?.user) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Please log in to edit issues.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter issue title" {...field} />
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
                  placeholder="Enter issue description"
                  className="min-h-[100px]"
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
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter tags (comma-separated)"
                  value={field.value.join(", ")}
                  onChange={(e) => {
                    const tags = e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean);
                    field.onChange(tags);
                  }}
                />
              </FormControl>
              <FormDescription>
                Enter tags related to this issue, separated by commas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Enter issue location" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {mediaPreview && (
          <div className="w-full h-48 relative rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaPreview} alt="Media Preview" className="object-cover w-full h-full" />
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleMediaChange}
          accept="image/*,video/*"
          style={{ display: "none" }}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={triggerFileInput}>
            <Paperclip className="mr-2 h-4 w-4" /> {mediaPreview ? "Change Media" : "Attach Media"}
          </Button>
          {(mediaPreview || issue.media?.[0]?.url) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveMedia}
              className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600"
            >
              Remove Media
            </Button>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
} 
