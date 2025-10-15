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
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  name: z.preprocess((val) => val === "" ? undefined : val, z.string().min(2, { message: "Name must be at least 2 characters." }).optional()),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setShowError(false);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          name: values.name,
        }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          setErrorMessage("An account with this email already exists. Try logging in instead.");
        } else {
          setErrorMessage(data.message || 'Registration failed. Please try again.');
        }
        setShowError(true);
        return;
      }

      // Success - show loading state and auto sign-in
      setIsRedirecting(true);
      setIsLoading(false);
      
      // Auto sign-in after registration (with small delay for database consistency)
      await new Promise(resolve => setTimeout(resolve, 100));
      const signInResult = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      });
      
      if (signInResult?.error) {
        setErrorMessage("Account created but sign-in failed. Please try logging in manually.");
        setShowError(true);
        setIsRedirecting(false);
        return;
      }

      // Show success feedback
      toast({
        title: "Welcome to Society+! 🎉",
        description: "Taking you to your feed...",
      });
      
      // Brief delay to show success state
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (error: any) {
      console.error('Registration Error:', error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setShowError(true);
    } finally {
      if (!isRedirecting) {
        setIsLoading(false);
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full max-w-sm">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} type="email" disabled={isLoading || isRedirecting} suppressHydrationWarning />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name <span className="text-xs text-gray-400">(optional)</span></FormLabel>
              <FormControl>
                <Input placeholder="Your full name" {...field} type="text" disabled={isLoading || isRedirecting} suppressHydrationWarning />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input placeholder="******" {...field} type="password" disabled={isLoading || isRedirecting} suppressHydrationWarning />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input placeholder="******" {...field} type="password" disabled={isLoading || isRedirecting} suppressHydrationWarning />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Modern error handling */}
        {showError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage}
              {errorMessage.includes("already exists") && (
                <div className="mt-2">
                  <Link href="/login" className="font-medium underline hover:no-underline">
                    Go to login page →
                  </Link>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Success state with loading indicator */}
        {isRedirecting && (
          <Alert className="mt-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 flex items-center gap-2">
              <span>Account created successfully!</span>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Taking you to Society+...</span>
            </AlertDescription>
          </Alert>
        )}
        
        <Button type="submit" className="w-full" disabled={isLoading || isRedirecting} suppressHydrationWarning>
          {isLoading ? 'Creating account...' : isRedirecting ? 'Redirecting...' : 'Join Society+'}
        </Button>
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Log In
          </Link>
        </p>
      </form>
    </Form>
  );
}
