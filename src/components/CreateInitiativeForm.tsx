"use client";

import { useState, useEffect } from 'react'; // Import useEffect
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
import { Upload, X, Plus, Tag, AlertCircle } from 'lucide-react';
import { createInitiative } from '@/app/actions/initiativeActions'; // Import the server action

// Update Zod type for status options to align with Prisma
const initiativeStatusOptions: PrismaInitiativeStatus[] = Object.values(PrismaInitiativeStatus);

// Format status for display
const formatStatus = (status: PrismaInitiativeStatus): string => {
  return status.replace(/([A-Z])/g, ' $1').trim();
};

// Define the form schema
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000),
  imageUrl: z.string().url("Please enter a valid image URL (optional)").optional().or(z.literal('')),
  roles: z.array(z.string().min(2, "Role must be at least 2 characters").max(30)).min(1, "At least one role is required"),
  status: z.nativeEnum(PrismaInitiativeStatus, { 
    errorMap: (issue, ctx) => ({ message: "Please select a valid status." })
  }),
  location: z.string().max(100, 'Location must be 100 characters or less').optional().or(z.literal('')),
});

type InitiativeFormData = z.infer<typeof formSchema>;

interface CreateInitiativeFormProps {
  setOpen: (open: boolean) => void; // Prop to control dialog visibility
}

export function CreateInitiativeForm({ setOpen }: CreateInitiativeFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams(); // Get search params
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get postContent from URL query params for initial description
  const initialDescription = searchParams.get('postContent') || "";

  const form = useForm<InitiativeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: decodeURIComponent(initialDescription), // Set initial description
      imageUrl: "",
      roles: [""],
      status: PrismaInitiativeStatus.Idea, // Default to Prisma enum value
      location: "",
    },
  });

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

  const roleArray = useFieldArray({
    control: form.control,
    name: "roles" as FieldArrayPath<InitiativeFormData> // Corrected type assertion
  });

  async function onSubmit(values: InitiativeFormData) {
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
    console.log("Form submitted with values:", values);

    try {
      const result = await createInitiative({
        ...values,
        imageUrl: values.imageUrl || undefined, // Pass undefined if empty string
        location: values.location || undefined, // Pass undefined if empty string
      });

      if (result.success && result.initiative) {
        toast({
          title: "Initiative Created!",
          description: `"${result.initiative.title}" is now live.`,
          variant: "default",
        });
        setOpen(false); // Close the dialog
        form.reset();   // Reset form fields
        // router.push(`/initiatives/${result.initiative.id}`); // Optionally redirect
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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
                  placeholder="Describe the goals, scope, and what you hope to achieve..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Featured Image/Video URL (Optional)</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    {...field}
                  />
                  <Button type="button" variant="outline" size="icon" disabled>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </FormControl>
              <FormDescription>Paste a URL to an image or video.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Roles/Skills Needed</FormLabel>
          <div className="space-y-2">
            {roleArray.fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`roles.${index}`}
                render={({ field: roleField }) => (
                  <FormItem className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <FormControl>
                      <Input placeholder="e.g., Designer, Developer" {...roleField} />
                    </FormControl>
                    {roleArray.fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => roleArray.remove(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
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
            className="mt-2"
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

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Brooklyn, NY or London" {...field} />
              </FormControl>
              <FormDescription>Leave blank if not location-specific.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Initiative"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
