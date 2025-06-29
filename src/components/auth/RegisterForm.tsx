'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Lightbulb, Users, Target, Heart } from 'lucide-react';
import { signIn } from 'next-auth/react';

// Step 1: Basic account info
const accountSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Step 2: User intent and interests
const intentSchema = z.object({
  primaryIntent: z.enum(['spot_issues', 'share_ideas', 'join_initiatives', 'learn_skills', 'organize_communities']),
  interests: z.array(z.string()).min(1, { message: "Please select at least one interest." }),
  skills: z.array(z.string()).optional(),
  bio: z.string().max(500, { message: "Bio must be less than 500 characters." }).optional(),
});

// Combined schema for final submission
const completeSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  primaryIntent: z.enum(['spot_issues', 'share_ideas', 'join_initiatives', 'learn_skills', 'organize_communities']),
  interests: z.array(z.string()).min(1, { message: "Please select at least one interest." }),
  skills: z.array(z.string()).optional(),
  bio: z.string().max(500, { message: "Bio must be less than 500 characters." }).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const INTERESTS = [
  'Environment', 'Education', 'Technology', 'Community Health', 
  'Arts & Culture', 'Social Justice', 'Economic Development', 
  'Mental Health', 'Youth Development', 'Senior Care', 'Food Security',
  'Housing', 'Transportation', 'Public Safety', 'Digital Literacy'
];

const SKILLS = [
  'Project Management', 'Design', 'Development', 'Marketing', 'Research',
  'Writing', 'Public Speaking', 'Event Planning', 'Fundraising', 'Teaching',
  'Mentoring', 'Data Analysis', 'Community Organizing', 'Grant Writing',
  'Social Media', 'Photography', 'Videography', 'Translation', 'Legal',
  'Healthcare', 'Engineering', 'Architecture', 'Finance', 'Education'
];

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});

  const accountForm = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      username: "",
    },
  });

  const intentForm = useForm<z.infer<typeof intentSchema>>({
    resolver: zodResolver(intentSchema),
    defaultValues: {
      primaryIntent: 'spot_issues',
      interests: [],
      skills: [],
      bio: "",
    },
  });

  const handleAccountSubmit = async (values: z.infer<typeof accountSchema>) => {
    setFormData({ ...formData, ...values });
    setCurrentStep(2);
  };

  const handleIntentSubmit = async (values: z.infer<typeof intentSchema>) => {
    const completeData = { ...formData, ...values };
    await handleFinalSubmit(completeData);
  };

  const handleFinalSubmit = async (values: z.infer<typeof completeSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          name: values.name,
          username: values.username,
          bio: values.bio,
          skills: values.skills || [],
          interests: values.interests,
          primaryIntent: values.primaryIntent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Auto sign-in after registration
      const signInResult = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      // Set flag to show welcome toast on next page
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('showWelcomeToast', 'true');
      }

      toast({
        title: "Welcome to society+! 🎉",
        description: "Your account has been created and you are now signed in.",
      });
      router.push('/feed');
    } catch (error: any) {
      console.error('Registration Error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    const current = intentForm.getValues('interests');
    const updated = current.includes(interest)
      ? current.filter(i => i !== interest)
      : [...current, interest];
    intentForm.setValue('interests', updated);
  };

  const toggleSkill = (skill: string) => {
    const current = intentForm.getValues('skills') || [];
    const updated = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill];
    intentForm.setValue('skills', updated);
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'spot_issues': return <Target className="w-5 h-5" />;
      case 'share_ideas': return <Lightbulb className="w-5 h-5" />;
      case 'join_initiatives': return <Users className="w-5 h-5" />;
      case 'learn_skills': return <Heart className="w-5 h-5" />;
      case 'organize_communities': return <Users className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getIntentDescription = (intent: string) => {
    switch (intent) {
      case 'spot_issues': return 'I want to identify and highlight problems in my community';
      case 'share_ideas': return 'I have solutions and innovative ideas to share';
      case 'join_initiatives': return 'I want to contribute to existing community projects';
      case 'learn_skills': return 'I want to develop new skills through community involvement';
      case 'organize_communities': return 'I want to lead and organize community initiatives';
      default: return '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Step {currentStep} of 2</span>
          <span className="text-sm text-gray-600">{currentStep === 1 ? 'Account Setup' : 'Your Interests'}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / 2) * 100}%` }}
          ></div>
        </div>
      </div>

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to society+</CardTitle>
            <CardDescription>
              Join a community of changemakers working together to solve problems and create positive impact.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...accountForm}>
              <form onSubmit={accountForm.handleSubmit(handleAccountSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={accountForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={accountForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Choose a username" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={accountForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} type="email" disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={accountForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input placeholder="******" {...field} type="password" disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={accountForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input placeholder="******" {...field} type="password" disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Continue'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Tell us about yourself</CardTitle>
            <CardDescription>
              Help us personalize your experience and connect you with relevant initiatives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...intentForm}>
              <form onSubmit={intentForm.handleSubmit(handleIntentSubmit)} className="space-y-8">
                {/* Primary Intent */}
                <div className="space-y-4">
                  <FormLabel className="text-base font-medium">What brings you to society+?</FormLabel>
                  <p className="text-xs text-gray-500 mb-2">Select your <span className="font-semibold">main</span> reason for joining. (You can update this later in your profile.)</p>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'spot_issues', label: 'Spot Issues', icon: 'spot_issues' },
                      { value: 'share_ideas', label: 'Share Ideas', icon: 'share_ideas' },
                      { value: 'join_initiatives', label: 'Join Initiatives', icon: 'join_initiatives' },
                      { value: 'learn_skills', label: 'Learn Skills', icon: 'learn_skills' },
                      { value: 'organize_communities', label: 'Organize Communities', icon: 'organize_communities' },
                    ].map((intent) => {
                      const selected = intentForm.watch('primaryIntent') === intent.value;
                      return (
                        <div
                          key={intent.value}
                          className={`p-4 border rounded-lg cursor-pointer transition-all flex flex-col ${
                            selected
                              ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                              : 'border-gray-200 bg-transparent hover:border-gray-300 text-gray-900'
                          }`}
                          onClick={() => intentForm.setValue('primaryIntent', intent.value as any)}
                          style={{ minHeight: 64 }}
                        >
                          <div className="flex items-center space-x-3">
                            {getIntentIcon(intent.icon)}
                            <div>
                              <div className={`font-medium text-lg ${selected ? 'text-white' : 'text-gray-200'}`}>{intent.label}</div>
                              <div className={`text-sm ${selected ? 'text-blue-100' : 'text-gray-400'}`}>{getIntentDescription(intent.value)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interests */}
                <div className="space-y-4">
                  <FormLabel className="text-base font-medium">What interests you? (Select all that apply)</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((interest) => (
                      <Badge
                        key={interest}
                        variant={intentForm.watch('interests').includes(interest) ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => toggleInterest(interest)}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  <FormMessage>{intentForm.formState.errors.interests?.message}</FormMessage>
                </div>

                {/* Skills */}
                <div className="space-y-4">
                  <FormLabel className="text-base font-medium">What skills can you contribute? (Optional)</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map((skill) => (
                      <Badge
                        key={skill}
                        variant={intentForm.watch('skills')?.includes(skill) ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-4">
                  <FormField
                    control={intentForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tell us a bit about yourself (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share what drives you to make a difference in your community..."
                            className="resize-none"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Complete Registration'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-sm text-gray-600 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Log in
        </Link>
      </p>
    </div>
  );
}
