"use client";

import { useState } from 'react';
import { useForm, useFieldArray, FieldValues, FieldArrayPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { InitiativeStatus } from '@/lib/types';
import { Upload, X, Plus, Tag } from 'lucide-react';

const initiativeStatusOptions: InitiativeStatus[] = ["Idea", "Planning", "Seeking Members"];

// Define the form schema
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000),
  imageUrl: z.string().url("Please enter a valid image URL (optional)").optional().or(z.literal('')),
  roles: z.array(z.string().min(2, "Role must be at least 2 characters").max(30)).min(1, "At least one role is required"),
  status: z.enum(["Idea", "Planning", "Seeking Members"]),
});

type InitiativeFormData = z.infer<typeof formSchema>;

interface CreateInitiativeFormProps {
  setOpen: (open: boolean) => void; // Prop to control dialog visibility
}

export function CreateInitiativeForm({ setOpen }: CreateInitiativeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with react-hook-form
  const form = useForm<InitiativeFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      roles: [""], // Start with one empty role input
      status: "Idea",
    },
  });

  // Setup field array for dynamic role inputs
  const roleArray = useFieldArray({
    control: form.control,
    name: "roles" as unknown as FieldArrayPath<InitiativeFormData>
  });

  async function onSubmit(values: InitiativeFormData) {
    setIsSubmitting(true);
    console.log("Form submitted:", values);

    // --- Mock Submission ---
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    // --- End Mock Submission ---

    toast({
      title: "Initiative Created!",
      description: `"${values.title}" is now live.`,
      variant: "default",
    });

    setIsSubmitting(false);
    setOpen(false); // Close the dialog on successful submission
    form.reset(); // Reset form fields after submission
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
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
