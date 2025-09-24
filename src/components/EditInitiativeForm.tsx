"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from 'next/image';
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
import { Initiative } from "@/lib/types";
import { updateInitiativeAction } from "@/app/actions/initiativeActions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Paperclip } from "lucide-react";
import { useState, useRef } from "react";
import imageCompression from 'browser-image-compression';

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  roles: z.array(z.string()).min(1, "At least one role is required"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

type FormValues = z.infer<typeof formSchema>;

interface EditInitiativeFormProps {
  setOpen: (open: boolean) => void;
  initiative: Initiative;
}

export function EditInitiativeForm({ setOpen, initiative }: EditInitiativeFormProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initiative.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initiative.title,
      description: initiative.description,
      imageUrl: initiative.imageUrl || "",
      roles: initiative.roles,
      status: initiative.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    },
  });

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // First, try with higher quality settings
        let options = {
          maxSizeMB: 4.5, // Target just under 5MB
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        let compressedFile = await imageCompression(file, options);
        console.log('Compressed file size (1st pass):', compressedFile.size);
        // If still too large, try a more aggressive compression
        if (compressedFile.size > 5 * 1024 * 1024) {
          options = {
            maxSizeMB: 2, // More aggressive
            maxWidthOrHeight: 1024,
            useWebWorker: true,
          };
          compressedFile = await imageCompression(file, options);
          console.log('Compressed file size (2nd pass):', compressedFile.size);
        }
        if (compressedFile.size > 5 * 1024 * 1024) {
          toast({
            title: "Image Too Large",
            description: "Image is still too large after compression. Please choose a smaller image.",
            variant: "destructive",
          });
          setSelectedImage(null);
          setImagePreview(null);
          return;
        }
        setSelectedImage(compressedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        console.error('Image compression error:', err);
        setSelectedImage(file); // fallback to original if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setSelectedImage(null);
      setImagePreview(initiative.imageUrl || null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    form.setValue("imageUrl", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function onSubmit(values: FormValues) {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be logged in to edit an initiative.",
        variant: "destructive",
      });
      return;
    }

    let finalImageUrl = initiative.imageUrl || null;

    if (selectedImage) {
      const formData = new FormData();
      formData.append("file", selectedImage);
      formData.append("filePath", "initiatives/images");
      formData.append("imageType", "initiative");

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (response.ok && result.imageUrl) {
          finalImageUrl = result.imageUrl;
        } else {
          toast({
            title: "Image Upload Failed",
            description: result.message || result.error || "Could not upload the new image.",
            variant: "destructive",
          });
          return; // Stop form submission if image upload fails
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: "Image Upload Error",
          description: "An error occurred while uploading the image.",
          variant: "destructive",
        });
        return; // Stop form submission
      }
    } else if (imagePreview === null && (initiative.imageUrl || null) !== null) {
      // If imagePreview is null and there was an existing image, it means the user removed it.
      finalImageUrl = null;
    }

    try {
      const result = await updateInitiativeAction({
        initiativeId: initiative.id,
        ...values,
        imageUrl: finalImageUrl === null ? undefined : finalImageUrl,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: "Initiative updated successfully.",
      });
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating initiative:", error);
      toast({
        title: "Error",
        description: "Failed to update initiative. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (!session?.user) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Please log in to edit initiatives.</p>
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
                <Input placeholder="Enter initiative title" {...field} />
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
                  placeholder="Enter initiative description"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {imagePreview && (
          <div className="w-full h-48 relative rounded-md overflow-hidden bg-muted flex items-center justify-center">
            <Image src={imagePreview} alt="Image Preview" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          style={{ display: "none" }}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={triggerFileInput}>
            <Paperclip className="mr-2 h-4 w-4" /> {imagePreview ? "Change Image" : "Upload Image"}
          </Button>
          {(imagePreview || initiative.imageUrl) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveImage}
              className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600"
            >
              Remove Image
            </Button>
          )}
        </div>

        <FormField
          control={form.control}
          name="roles"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Roles</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter roles (comma-separated)"
                  value={field.value.join(", ")}
                  onChange={(e) => {
                    const roles = e.target.value
                      .split(",")
                      .map((role) => role.trim())
                      .filter(Boolean);
                    field.onChange(roles);
                  }}
                />
              </FormControl>
              <FormDescription>
                Enter the roles needed for this initiative, separated by commas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  {...field}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
