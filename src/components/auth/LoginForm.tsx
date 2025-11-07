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
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, User, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }), // Basic check, NextAuth handles actual validation
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/'; // Redirect back or to home
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSignupSuggestion, setShowSignupSuggestion] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setShowError(false);
    setShowSignupSuggestion(false);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        // Handle authentication errors gracefully
        const isCredentialsError = result.error === 'CredentialsSignin';
        
        if (isCredentialsError) {
          setErrorMessage("The email or password you entered is incorrect.");
          setShowSignupSuggestion(true);
        } else {
          setErrorMessage("Something went wrong. Please try again.");
        }
        
        setShowError(true);
      } else if (result?.ok) {
        // Clear any previous errors and show success state
        setShowError(false);
        setShowSignupSuggestion(false);
        setIsRedirecting(true);
        
        // Show immediate feedback
        toast({
          title: "Welcome back!",
          description: "Taking you to your feed...",
        });
        
        // Small delay to show the success state, then redirect
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 1500);
      } else {
        setErrorMessage("Login failed. Please try again.");
        setShowError(true);
      }

    } catch (error: any) {
      console.error('Login Error:', error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setShowError(true);
    } finally {
      setIsLoading(false);
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="Enter your password"
                    {...field}
                    type={showPassword ? "text" : "password"}
                    disabled={isLoading || isRedirecting}
                    suppressHydrationWarning
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Modern error handling with user-friendly messaging */}
        {showError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Helpful suggestion for account creation - similar to Instagram/TikTok */}
        {showSignupSuggestion && (
          <Alert className="mt-4 border-blue-200 bg-blue-50">
            <User className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Don't have an account?{" "}
              <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 underline">
                Sign up for Society+
              </Link>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Success state with loading indicator */}
        {isRedirecting && (
          <Alert className="mt-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 flex items-center gap-2">
              <span>Login successful!</span>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Taking you to your feed...</span>
            </AlertDescription>
          </Alert>
        )}
        
        <Button type="submit" className="w-full" disabled={isLoading || isRedirecting} suppressHydrationWarning>
          {isLoading ? 'Logging in...' : isRedirecting ? 'Redirecting...' : 'Login'}
        </Button>
        <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Register
            </Link>
          </p>
      </form>
    </Form>
  );
}
