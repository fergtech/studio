import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
            <Image 
              src="/apple-touch-icon.png" 
              alt="Society+ logo" 
              width={40}
              height={40}
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
          <h1 className="text-2xl font-semibold text-foreground mb-2">Join Society+</h1>
          <p className="text-muted-foreground">Start making an impact with a community that cares</p>
        </div>

        {/* Registration Form Card */}
        <div className="bg-background/80 backdrop-blur border border-border/20 rounded-2xl p-8 shadow-xl">
          <RegisterForm />
        </div>

        {/* Value Proposition Footer */}
        <div className="mt-8 p-6 bg-primary/5 border border-primary/10 rounded-xl">
          <div className="text-center space-y-3">
            <h3 className="font-semibold text-sm text-foreground">What you'll get access to:</h3>
            <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span>Share Ideas</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span>Join Projects</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span>Make Impact</span>
              </div>
            </div>
          </div>
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
