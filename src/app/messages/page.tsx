'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { MessageCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  userId: string;
  name: string;
  username: string;
  image?: string;
  lastMessage: {
    text: string;
    timestamp: string;
    senderId: string;
    isFromMe: boolean;
  };
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchConversations();
    }
  }, [status, router]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = conversations.filter(conv =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        setFilteredConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (userId: string) => {
    router.push(`/chat/${userId}`);
  };

  const truncateMessage = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <>
      {/* Main Content Area */}
      <div className="px-4 lg:px-6 pt-20 lg:pt-6 pb-24" aria-live="polite" aria-busy={`${loading
      }`}>
        {loading ? (
          <div className="container max-w-3xl mx-auto p-4">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Messages</h1>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="container max-w-3xl mx-auto p-4">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Messages</h1>
              <p className="text-muted-foreground">Your direct conversations</p>
            </div>

            {/* Search */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Conversations List */}
            {filteredConversations.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No conversations found' : 'No messages yet'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Start a conversation by visiting someone\'s profile'}
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <Card
                    key={conversation.userId}
                    className="p-4 hover:bg-accent/50 cursor-pointer transition-all hover:shadow-md active:scale-[0.99]"
                    onClick={() => handleConversationClick(conversation.userId)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <Avatar className="h-14 w-14 ring-2 ring-border">
                        <AvatarImage src={conversation.image || ''} alt={conversation.name} />
                        <AvatarFallback className="text-lg font-semibold">
                          {conversation.name?.substring(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-base truncate">
                            {conversation.name}
                          </h3>
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {conversation.lastMessage.isFromMe && (
                            <span className="text-xs text-muted-foreground">You:</span>
                          )}
                          <p className="text-sm text-muted-foreground truncate">
                            {truncateMessage(conversation.lastMessage.text)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
