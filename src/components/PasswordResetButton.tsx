'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface PasswordResetButtonProps {
  email: string;
}

export default function PasswordResetButton({ email }: PasswordResetButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'No email address found',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Email Sent',
          description: 'Password reset link has been sent to your email address',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send password reset email',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleResetPassword}
      disabled={loading}
    >
      {loading ? 'Sending...' : 'Send Password Reset Email'}
    </Button>
  );
}
