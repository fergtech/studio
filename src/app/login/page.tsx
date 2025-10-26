import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <Image 
              src="/apple-touch-icon.png"
              width={40}
              height={40} 
              alt="Society+ logo" 
              className="h-10 w-10 ring-primary/20 group-hover:ring-primary/40 transition-all" 
            />
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">society</span>
              <svg
                width="28"
                height="28"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
              >
                <g>
                  <rect x="16" y="4" width="4" height="8" rx="2" fill="currentColor"/>
                  <rect x="16" y="24" width="4" height="8" rx="2" fill="currentColor"/>
                  <rect x="4" y="16" width="8" height="4" rx="2" fill="currentColor"/>
                  <rect x="24" y="16" width="8" height="4" rx="2" fill="currentColor"/>
                  <rect x="15" y="15" width="6" height="6" rx="3" fill="currentColor"/>
                </g>
              </svg>
            </div>
          </Link>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to continue making an impact</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-background/80 backdrop-blur border border-border/20 rounded-2xl p-8 shadow-xl">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
