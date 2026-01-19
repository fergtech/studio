import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PostStatsProvider } from '@/context/PostStatsContext';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
// Removed auto-startup tasks - use /api/admin/backfill-topics endpoint instead

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Import the HomeClient component
import { HomeClient } from '@/components/HomeClient';

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// Always show the feed, even for unauthenticated users
export default async function Home() {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id || null;
    const username = (session?.user as any)?.username || null;

    // Wrap HomeClient with PostStatsProvider for optimized batch fetching
    return (
      <Suspense fallback={<LoadingFallback />}>
        <PostStatsProvider currentUserId={currentUserId || undefined}>
          <HomeClient currentUserId={currentUserId} username={username} />
        </PostStatsProvider>
      </Suspense>
    );
  } catch (error) {
    console.error('Error loading home page:', error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-xl font-semibold mb-2">Unable to load page</h2>
        <p className="text-muted-foreground mb-4">Please try refreshing</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Refresh
        </button>
      </div>
    );
  }
}
