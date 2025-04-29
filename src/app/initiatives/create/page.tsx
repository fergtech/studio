"use client";

import { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { InitiativeStatus } from '@/lib/types';
import { Upload, X, Plus, Tag } from 'lucide-react';

const initiativeStatusOptions: InitiativeStatus[] = ["Idea", "Planning", "Seeking Members"];

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000),
  imageUrl: z.string().url("Please enter a valid image URL (optional)").optional().or(z.literal('')),
  roles: z.array(z.string().min(2, "Role must be at least 2 characters").max(30)).min(1, "At least one role is required"),
  status: z.enum(["Idea", "Planning", "Seeking Members"]),
});

type InitiativeFormData = z.infer<typeof formSchema>;

export default function CreateInitiativePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

   const { fields: roleFields, append: appendRole, remove: removeRole } = useFieldArray({
    control: form.control,
    name: "roles",
  });


  async function onSubmit(values: InitiativeFormData) {
    setIsSubmitting(true);
    console.log("Form submitted:", values);

    // --- Mock Submission ---
    // In a real app, you would send this data to your backend API
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    // --- End Mock Submission ---

    toast({
      title: "Initiative Created!",
      description: `"${values.title}" is now live.`,
      variant: "default", // Use default (green accent based on theme)
    });

    setIsSubmitting(false);
    router.push('/'); // Redirect to the home feed after successful creation
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Initiative</CardTitle>
          <CardDescription>Start a new project and invite collaborators from your community.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        rows={5}
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
                         {/* Basic URL input for MVP, replace with upload later */}
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
                    {roleFields.map((field, index) => (
                     <FormField
                        key={field.id}
                        control={form.control}
                        name={`roles.${index}`}
                        render={({ field: roleField }) => (
                          <FormItem className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <FormControl>
                              <Input placeholder="e.g., Designer, Developer, Marketer" {...roleField} />
                            </FormControl>
                            {roleFields.length > 1 && (
                               <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeRole(index)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove Role</span>
                              </Button>
                            )}
                            <FormMessage className="ml-6" />
                          </FormItem>
                        )}
                      />
                    ))}
                 </div>
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendRole("")}
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
             <CardFooter className="p-0 pt-6">
                <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Initiative"}
                </Button>
             </CardFooter>
            </form>
          </Form>
        </CardContent>

      </Card>
    </div>
  );
}
