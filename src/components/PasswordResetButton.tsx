'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, ExternalLink } from 'lucide-react';

interface PasswordResetButtonProps {
  email: string;
}

export default function PasswordResetButton({ email }: PasswordResetButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
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
      const response = await fetch('/api/auth/request-password-reset-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: email }),
      });

      const data = await response.json();

      if (response.ok && data.hasLink) {
        setResetUrl(data.resetUrl);
        setShowDialog(true);
      } else {
        toast({
          title: 'Error',
          description: data.message || data.error || 'Failed to generate reset link',
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resetUrl);
    toast({
      title: 'Copied!',
      description: 'Reset link copied to clipboard',
    });
  };

  const openInNewTab = () => {
    window.open(resetUrl, '_blank');
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleResetPassword}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Get Password Reset Link'}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset Link</DialogTitle>
            <DialogDescription>
              Click the link below to reset your password. The link expires in 1 hour.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-100 rounded-lg border border-gray-200 break-all text-sm">
              {resetUrl}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button
                onClick={openInNewTab}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
