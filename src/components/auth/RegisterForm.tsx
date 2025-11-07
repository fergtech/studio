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
import { AlertCircle, CheckCircle, Loader2, Check, X, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Strong password validation matching backend
const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Must contain at least one number" })
  .regex(/[^A-Za-z0-9]/, { message: "Must contain at least one special character" });

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: passwordSchema,
  confirmPassword: z.string(),
  name: z.preprocess((val) => val === "" ? undefined : val, z.string().min(2, { message: "Name must be at least 2 characters." }).optional()),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Password strength checker
function getPasswordStrength(password: string) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;
  return { checks, passed, total: 5 };
}

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  });

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    try {
      await signIn(provider, {
        callbackUrl: '/',
      });
    } catch (error) {
      console.error('OAuth sign-in error:', error);
      setErrorMessage("Failed to sign in. Please try again.");
      setShowError(true);
      setIsLoading(false);
    }
  };

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
        {/* OAuth Sign-In Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-medium"
            onClick={() => handleOAuthSignIn('google')}
            disabled={isLoading || isRedirecting}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 font-medium"
            onClick={() => handleOAuthSignIn('apple')}
            disabled={isLoading || isRedirecting}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or register with email</span>
          </div>
        </div>

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
          render={({ field }) => {
            const strength = getPasswordStrength(field.value || '');
            const showIndicator = field.value && field.value.length > 0;

            return (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Create a strong password"
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

                {/* Password Strength Indicator */}
                {showIndicator && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            level <= strength.passed
                              ? strength.passed <= 2
                                ? 'bg-red-500'
                                : strength.passed <= 4
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs space-y-1">
                      <div className={`flex items-center gap-1.5 ${strength.checks.length ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {strength.checks.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${strength.checks.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {strength.checks.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>One uppercase letter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${strength.checks.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {strength.checks.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>One lowercase letter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${strength.checks.number ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {strength.checks.number ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>One number</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${strength.checks.special ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {strength.checks.special ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>One special character (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>
                )}

                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="Confirm your password"
                    {...field}
                    type={showConfirmPassword ? "text" : "password"}
                    disabled={isLoading || isRedirecting}
                    suppressHydrationWarning
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
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
