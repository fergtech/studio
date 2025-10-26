import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PostStatsProvider } from '@/context/PostStatsContext';
// Removed auto-startup tasks - use /api/admin/backfill-topics endpoint instead

export const dynamic = 'force-dynamic';

// Import the HomeClient component
import { HomeClient } from '@/components/HomeClient';

// Always show the feed, even for unauthenticated users
export default async function Home() {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id || null;
  const username = (session?.user as any)?.username || null;

  // Wrap HomeClient with PostStatsProvider for optimized batch fetching
  return (
    <PostStatsProvider currentUserId={currentUserId || undefined}>
      <HomeClient currentUserId={currentUserId} username={username} />
    </PostStatsProvider>
  );
}
