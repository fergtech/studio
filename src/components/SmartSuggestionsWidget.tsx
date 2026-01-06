import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
// import { io, Socket } from 'socket.io-client'; // Temporarily disabled for Vercel deployment

interface SuggestedUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  online?: boolean;
  totalActivity?: number;
}

interface SuggestedInitiative {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
}

// const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:9003'; // Temporarily disabled for Vercel deployment

export default function SmartSuggestionsWidget({ flatStyle = false }: { flatStyle?: boolean }) {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [initiatives, setInitiatives] = useState<SuggestedInitiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState<string[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchSuggestions() {
      setLoading(true);
      setError(null);
      try {
        const [userRes, initiativeRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/initiatives/suggestions'),
        ]);
        if (!userRes.ok) throw new Error('Failed to fetch user suggestions');
        if (!initiativeRes.ok) throw new Error('Failed to fetch initiative suggestions');
        const userData = await userRes.json();
        const initiativeData = await initiativeRes.json();
        // Limit to 3 users and 4 initiatives for smart suggestions
        setUsers((userData.users || []).slice(0, 3));
        setInitiatives((initiativeData.initiatives || []).slice(0, 4));
      } catch (err: any) {
        setError(err.message || 'Error fetching suggestions');
      } finally {
        setLoading(false);
      }
    }
    fetchSuggestions();
  }, []);

  // Use polling for online status instead of Socket.io
  useEffect(() => {
    // Set up polling for online status
    const pollOnlineUsers = async () => {
      try {
        const response = await fetch('/api/users/online');
        if (response.ok) {
          const data = await response.json();
          setOnlineUserIds(data.onlineUserIds || []);
        } else {
          // Silently fallback to empty array for non-critical errors
          setOnlineUserIds([]);
        }
      } catch (error) {
        // Silently handle network errors - this is not critical functionality
        setOnlineUserIds([]);
      }
    };

    // Initial poll
    pollOnlineUsers();

    // Poll every 30 seconds for online status
    const pollInterval = setInterval(pollOnlineUsers, 30000);

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  // Merge online status into users
  const usersWithOnline = users.map(u => ({ ...u, online: onlineUserIds.includes(u.id) }));

  async function handleFollow(userId: string) {
    setFollowing(prev => [...prev, userId]);
    try {
      await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch {
      setFollowing(prev => prev.filter(id => id !== userId));
    }
  }

  return (
    <div className={flatStyle ? '' : 'rounded-2xl bg-background/80 backdrop-blur-xl shadow-sm p-0'}>
      <div className="py-2 px-0 border-b border-border/30 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-base font-semibold tracking-tight">Smart Suggestions</span>
      </div>
      <div className="py-2 px-0">
        {loading ? (
          <div className="text-xs text-muted-foreground px-3">Loading suggestions...</div>
        ) : error ? (
          <div className="text-xs text-red-500 px-3">{error}</div>
        ) : (
          <>
            {/* User-based suggestions - only show if users exist */}
            {usersWithOnline.length > 0 && (
              <div className={initiatives.length > 0 ? "mb-3" : ""}>
                <div className="text-xs font-semibold mb-2 text-muted-foreground px-3">
                  {usersWithOnline.some(u => u.totalActivity && u.totalActivity > 0) ? 'Top Active Users' : 'Suggested Users'}
                </div>
                <div className="space-y-2">
                  {usersWithOnline.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg transition-colors group hover:bg-accent/40"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative">
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background ${user.online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {user.image ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-muted">
                              <Image src={user.image} alt={user.name || user.username || 'User'} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                              {user.name?.[0] || user.username?.[0] || '?'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          {user.username ? (
                            <Link href={`/profile/${user.username}`} className="font-medium text-sm truncate hover:underline block">
                              {user.name || user.username || 'User'}
                            </Link>
                          ) : (
                            <span className="font-medium text-sm truncate block">{user.name || 'User'}</span>
                          )}
                          {user.username && (
                            <span className="text-xs text-muted-foreground truncate block">@{user.username}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="text-xs px-2 py-1 h-6 group-hover:bg-primary/10 group-hover:text-primary"
                        disabled={following.includes(user.id)}
                        onClick={() => handleFollow(user.id)}
                        variant="secondary"
                      >
                        {following.includes(user.id) ? '...' : '+'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Initiative suggestions */}
            {initiatives.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 px-3">
                  <div className="text-xs font-semibold text-muted-foreground">Trending projects</div>
                  <Button size="sm" variant="ghost" className="text-xs h-6 px-2" asChild>
                    <Link href="/initiatives">Browse All Projects</Link>
                  </Button>
                </div>
                <div className="space-y-2">
                  {initiatives.map(initiative => (
                    <div
                      key={initiative.id}
                      className="p-2 rounded-lg transition-colors group hover:bg-accent/40"
                    >
                      <Link href={`/initiatives/${initiative.id}`} className="font-medium text-sm hover:underline block mb-1">
                        {initiative.title}
                      </Link>
                      {initiative.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {initiative.description}
                        </p>
                      )}
                      <Button size="sm" variant="ghost" className="text-xs h-6 p-1 group-hover:bg-primary/10 group-hover:text-primary" asChild>
                        <Link href={`/initiatives/${initiative.id}`}>View →</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state - only show if BOTH are empty */}
            {usersWithOnline.length === 0 && initiatives.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4 px-3">
                No suggestions available right now.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}