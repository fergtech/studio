import { getServerSession } from "next-auth/next"; // Import getServerSession
import { authOptions } from "@/lib/auth"; // Import authOptions
import Image from 'next/image';
import { runStartupTasks } from '@/lib/startup'; // Import startup tasks

export const dynamic = 'force-dynamic';

// Create a new client component for the feed
import { HomeClient } from '@/components/HomeClient'; // Assuming FeedItem type is exported from HomeClient or a shared types file

function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center space-y-8">
            {/* Logo and branding */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <Image 
                src="/apple-touch-icon.png" 
                alt="Society+ logo" 
                width={48}
                height={48}
                className="h-12 w-12 rounded-full ring-2 ring-primary/20" 
              />
              <h1 className="text-5xl md:text-7xl font-bold flex items-center gap-2">
                society
                <span className="inline-block">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 36 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-primary animate-pulse"
                  >
                    <g>
                      <rect x="16" y="4" width="4" height="8" rx="2" fill="currentColor"/>
                      <rect x="16" y="24" width="4" height="8" rx="2" fill="currentColor"/>
                      <rect x="4" y="16" width="8" height="4" rx="2" fill="currentColor"/>
                      <rect x="24" y="16" width="8" height="4" rx="2" fill="currentColor"/>
                      <rect x="15" y="15" width="6" height="6" rx="3" fill="currentColor"/>
                    </g>
                  </svg>
                </span>
              </h1>
            </div>

            {/* Value proposition */}
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl md:text-4xl font-semibold text-foreground/90">
                Where ideas become <span className="text-primary font-bold">impact</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Join thousands of changemakers collaborating on real-world solutions. Share ideas, tackle issues, and drive initiatives that matter.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="/register" 
                className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:bg-primary/90 transform hover:scale-105 transition-all duration-200 text-lg min-w-[200px]"
              >
                Join Society+ →
              </a>
              <a 
                href="/login" 
                className="px-8 py-4 bg-background/80 backdrop-blur border border-primary/20 text-foreground rounded-xl font-semibold shadow-lg hover:bg-muted/50 transition-all duration-200 text-lg min-w-[200px]"
              >
                Log In
              </a>
            </div>
          </div>
        </div>

        {/* Feature Preview Section */}
        <div className="relative mt-16 py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">What makes Society+ special?</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                More than just another social platform - we're building a community focused on positive change
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center space-y-4 p-6 rounded-xl bg-background/50 backdrop-blur border border-border/20">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="font-semibold">Share Ideas</h4>
                <p className="text-sm text-muted-foreground">
                  Crowdsource solutions and get feedback from a community that cares
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6 rounded-xl bg-background/50 backdrop-blur border border-border/20">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="font-semibold">Join Initiatives</h4>
                <p className="text-sm text-muted-foreground">
                  Collaborate on real projects that create meaningful change in your community
                </p>
              </div>
              
              <div className="text-center space-y-4 p-6 rounded-xl bg-background/50 backdrop-blur border border-border/20">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold">Make Impact</h4>
                <p className="text-sm text-muted-foreground">
                  Track your contributions and see the real-world results of your efforts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="py-16 text-center">
          <div className="container mx-auto px-4">
            <h3 className="text-xl md:text-2xl font-semibold mb-4">Ready to make a difference?</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join a community of innovators, activists, and dreamers working together for a better world.
            </p>
            <a 
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:bg-primary/90 transform hover:scale-105 transition-all duration-200"
            >
              Start your journey
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

// The main Home component is no longer async as data fetching is client-side
export default async function Home() {
  // Fetch session data if needed for HomeClient (e.g., for personalized content or actions)
  const session = await getServerSession(authOptions); // Get the current session
  const currentUserId = session?.user?.id; // Extract currentUserId
  const username = (session?.user as any)?.username; // Extract username if available

  // Run startup tasks when a user loads the app (ensures topic backfill happens)
  if (currentUserId) {
    // Run startup tasks in the background (don't block page load)
    runStartupTasks().catch(error => {
      console.error('Startup tasks failed but continuing app load:', error);
    });

    // HomeClient will now be responsible for fetching its own data
    // Pass any necessary initial props like currentUserId and username
    return <HomeClient currentUserId={currentUserId} username={username} />;
  } else {
    return <LandingPage />;
  }
}
