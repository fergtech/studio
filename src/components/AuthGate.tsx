"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';

interface AuthGateProps {
  currentUserId?: string | null;
  action: string; // "like this post", "join this initiative", etc.
  children: React.ReactNode;
  onUnauthenticatedClick?: () => void;
}

export function AuthGate({ currentUserId, action, children, onUnauthenticatedClick }: AuthGateProps) {
  const [showPrompt, setShowPrompt] = useState(false);

  // If user is authenticated, render children normally
  if (currentUserId) {
    return <>{children}</>;
  }

  // If not authenticated, wrap children to intercept clicks
  return (
    <>
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowPrompt(true);
          onUnauthenticatedClick?.();
        }}
      >
        {children}
      </div>

      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              You need to sign in to {action}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            <Button asChild size="lg" className="w-full">
              <Link href="/register">
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/login">
                <LogIn className="h-4 w-4 mr-2" />
                Log In
              </Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-2">
            Join Society+ to interact with posts, create initiatives, and make an impact.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
