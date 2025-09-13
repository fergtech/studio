import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useLazyLoad } from '@/hooks/useLazyLoad';
// import { io, Socket } from 'socket.io-client'; // Temporarily disabled for Vercel deployment

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

// const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:9003'; // Temporarily disabled for Vercel deployment

export default function SuggestionsWidget() {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [initiatives, setInitiatives] = useState<SuggestedInitiative[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  // Lazy load suggestions
  const fetchSuggestions = async () => {
    const [userRes, initiativeRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/initiatives/suggestions'),
    ]);
    if (!userRes.ok) throw new Error('Failed to fetch user suggestions');
    if (!initiativeRes.ok) throw new Error('Failed to fetch initiative suggestions');
    const userData = await userRes.json();
    const initiativeData = await initiativeRes.json();
    return {
      users: userData.users || [],
      initiatives: initiativeData.initiatives || []
    };
  };

  const { ref, data, loading, error } = useLazyLoad(fetchSuggestions);

  // Update state when lazy loaded data is available
  useEffect(() => {
    if (data) {
      setUsers(data.users);
      setInitiatives(data.initiatives);
    }
  }, [data]);

  // Socket logic temporarily disabled for Vercel deployment

  // Use polling for online status instead of Socket.io
  useEffect(() => {
    // Set up polling for online status
    const pollOnlineUsers = async () => {
      try {
        const response = await fetch('/api/users/online');
        if (response.ok) {
          const data = await response.json();
          setOnlineUserIds(data.onlineUserIds || []);
        }
      } catch (error) {
        console.error('Error fetching online users:', error);
        setOnlineUserIds([]); // Fallback to no online users
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
    <Card ref={ref}>
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-4 w-4" />
          Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-3">
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading...</div>
        ) : error ? (
          <div className="text-xs text-red-500">{error}</div>
        ) : (
          <>
            {/* User Suggestions */}
            {usersWithOnline.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1 text-muted-foreground">People you may know</div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted/40 scrollbar-track-transparent">
                  {usersWithOnline.map(user => (
                    <div key={user.id} className="flex flex-col items-center min-w-[120px] max-w-[140px] bg-muted/40 rounded-lg p-3 shadow-sm">
                      <div className="relative mb-2">
                        <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${user.online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {user.image ? (
                          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-muted">
                            <Image src={user.image} alt={user.name || user.username || 'User'} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                            {user.name?.[0] || user.username?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      {user.username ? (
                        <Link href={`/profile/${user.username}`} className="font-medium text-sm truncate hover:underline text-center w-full">
                          {user.name || user.username || 'User'}
                        </Link>
                      ) : null}
                      {user.username && (
                        <span className="block text-xs text-muted-foreground truncate text-center w-full">@{user.username}</span>
                      )}
                      <Button
                        size="sm"
                        className="text-xs px-3 py-1 mt-2 w-full"
                        disabled={following.includes(user.id)}
                        onClick={() => handleFollow(user.id)}
                        variant="secondary"
                      >
                        {following.includes(user.id) ? 'Following...' : 'Follow'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Initiative Suggestions */}
            {initiatives.length > 0 && (
              <div>
                <div className="text-xs font-semibold mb-1 text-muted-foreground">Initiatives you may like</div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted/40 scrollbar-track-transparent">
                  {initiatives.map(initiative => (
                    <div key={initiative.id} className="relative min-w-[100px] max-w-[153px] h-36 rounded-lg overflow-hidden shadow-sm flex flex-col justify-end">
                      {initiative.imageUrl && (
                        <Image
                          src={initiative.imageUrl}
                          alt={initiative.title}
                          fill
                          className="object-cover absolute inset-0 w-full h-full"
                          style={{ zIndex: 1 }}
                        />
                      )}
                      {/* Gradient overlay for readability */}
                      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="relative z-20 p-2 flex flex-col justify-end h-full">
                        <Link href={`/initiatives/${initiative.id}`} className="font-semibold text-white text-sm break-words whitespace-normal leading-tight hover:underline w-full mb-1">
                          {initiative.title}
                        </Link>
                        <span className="block text-xs text-white/90 truncate w-full mb-1 line-clamp-2">
                          {initiative.description || 'No description'}
                        </span>
                        <Button
                          size="sm"
                          className="text-xs px-3 py-1 mt-auto w-full"
                          asChild
                          variant="secondary"
                        >
                          <Link href={`/initiatives/${initiative.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {usersWithOnline.length === 0 && initiatives.length === 0 && (
              <div className="text-xs text-muted-foreground">No suggestions at the moment.</div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 
