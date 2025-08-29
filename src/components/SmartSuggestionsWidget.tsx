import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';

interface SuggestedUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  online?: boolean;
}

interface SuggestedInitiative {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:9003';

export default function SmartSuggestionsWidget() {
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
        // Limit to 3 users and 2 initiatives for smart suggestions
        setUsers((userData.users || []).slice(0, 3));
        setInitiatives((initiativeData.initiatives || []).slice(0, 2));
      } catch (err: any) {
        setError(err.message || 'Error fetching suggestions');
      } finally {
        setLoading(false);
      }
    }
    fetchSuggestions();
  }, []);

  // Socket logic for online status
  useEffect(() => {
    const socket: Socket = io(SOCKET_URL, {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
    });
    socket.on('connect', () => {
      // Connected
    });
    socket.on('onlineUsers', (ids: string[]) => {
      setOnlineUserIds(ids);
    });
    return () => {
      socket.disconnect();
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
    <Card>
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="h-4 w-4" />
          Smart Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-3">
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading suggestions...</div>
        ) : error ? (
          <div className="text-xs text-red-500">{error}</div>
        ) : (
          <>
            {/* User-based suggestions */}
            {usersWithOnline.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-2 text-muted-foreground">People nearby</div>
                <div className="space-y-2">
                  {usersWithOnline.map(user => (
                    <div key={user.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/20">
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
                        className="text-xs px-2 py-1 h-6"
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
                <div className="text-xs font-semibold mb-2 text-muted-foreground">Trending initiatives</div>
                <div className="space-y-2">
                  {initiatives.map(initiative => (
                    <div key={initiative.id} className="p-2 rounded-lg bg-muted/20">
                      <Link href={`/initiatives/${initiative.id}`} className="font-medium text-sm hover:underline block mb-1">
                        {initiative.title}
                      </Link>
                      {initiative.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {initiative.description}
                        </p>
                      )}
                      <Button size="sm" variant="ghost" className="text-xs h-6 p-1" asChild>
                        <Link href={`/initiatives/${initiative.id}`}>View →</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {usersWithOnline.length === 0 && initiatives.length === 0 && (
              <div className="text-xs text-muted-foreground">No smart suggestions available right now.</div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}