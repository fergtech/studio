'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetUrl('');

    if (!identifier) {
      setError('Please enter your email or username');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/request-password-reset-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (response.ok && data.hasLink) {
        setResetUrl(data.resetUrl);
        setExpiresAt(data.expiresAt);
      } else {
        setError(data.message || data.error || 'Account not found or uses social login');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
          <CardTitle className="text-2xl">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email or username to get a password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetUrl ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Reset link generated!</strong>
                  <p className="mt-1 text-sm">
                    Click the link below or copy it. The link expires in 1 hour.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
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

                <Button
                  onClick={() => {
                    setResetUrl('');
                    setIdentifier('');
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Generate Another Link
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="identifier" className="text-sm font-medium">
                  Email or Username
                </label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="you@example.com or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  Enter either your email address or username
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Generating...' : 'Get Reset Link'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
