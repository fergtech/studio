
'use client';

import AppSidebar from '@/components/AppSidebar';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { MessageCircle, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { useUserStatus } from '@/hooks/useUserStatus';
import { OnlineStatusAvatar } from '@/components/OnlineStatusAvatar';
import { useHeartbeat } from '@/hooks/useHeartbeat';

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
  
  // Get user IDs for status checking
  const userIds = conversations.map(conv => conv.userId);
  
  // Use heartbeat to maintain our own online status
  useHeartbeat();
  
  // Use user status hook - just fetch once, no continuous polling
  const { userStatuses, isUserOnline, isLoading: statusLoading, refreshStatuses } = useUserStatus({
    userIds,
    enabled: status === 'authenticated' && conversations.length > 0,
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('sidebarCollapsed:messages');
      if (stored !== null) return stored === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchConversations();
    }
  }, [status, router]);

  useEffect(() => {
    let filtered = conversations;
    
    if (searchQuery.trim()) {
      const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/); // Split by whitespace to support multiple words
      
      filtered = conversations.filter(conv => {
        // Searchable fields
        const name = (conv.name || '').toLowerCase();
        const username = (conv.username || '').toLowerCase();
        const messageText = (conv.lastMessage?.text || '').toLowerCase();
        
        // Combined searchable text
        const searchableContent = `${name} ${username} ${messageText}`;
        
        // Check if ALL search terms are found in any combination of the fields
        return searchTerms.every(term => {
          return name.includes(term) || 
                 username.includes(term) || 
                 messageText.includes(term) ||
                 searchableContent.includes(term);
        });
      });
    }

    // Sort conversations: online users first, then by most recent message
    const sorted = filtered.sort((a, b) => {
      // Check online status directly from userStatuses to avoid function dependency
      const aOnline = userStatuses[a.userId]?.isOnline || false;
      const bOnline = userStatuses[b.userId]?.isOnline || false;
      
      // Online users first
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      
      // Then by most recent message
      return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
    });

    setFilteredConversations(sorted);
  }, [searchQuery, conversations, userStatuses]); // Removed isUserOnline from dependencies

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

  // Function to highlight search terms in text
  const highlightSearchTerms = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;
    
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
    let highlightedText = text;
    
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">$1</mark>');
    });
    
    return highlightedText;
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
    <div className="w-full min-w-0 overflow-hidden">
      <AppSidebar
        className="hidden lg:flex"
        widgets={['userControls', 'navigation', 'resources', 'footer']}
        context={{ type: 'messages' }}
        onCollapseChange={(collapsed: boolean) => {
          setSidebarCollapsed(collapsed);
          if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarCollapsed:messages', String(collapsed));
          }
        }}
      />
      {/* Main Content Area */}
      <div className={`px-4 lg:px-6 pt-20 lg:pt-6 pb-24 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`} aria-live="polite" aria-busy={`${loading }`}>
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Messages</h1>
                  <p className="text-muted-foreground">
                    Your direct conversations
                    {filteredConversations.length > 0 && (
                      <span className="ml-2">
                        • {Object.values(userStatuses).filter((status: any) => status?.isOnline).length} online
                      </span>
                    )}
                  </p>
                </div>
                <button 
                  onClick={refreshStatuses}
                  disabled={statusLoading}
                  className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {statusLoading ? 'Checking...' : 'Refresh status'}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search people, usernames, or message content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {searchQuery.trim() && (
                <div className="text-xs text-muted-foreground">
                  {filteredConversations.length === 0 
                    ? 'No results' 
                    : `${filteredConversations.length} ${filteredConversations.length === 1 ? 'result' : 'results'} found`
                  }
                </div>
              )}
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
                    ? `No matches found for "${searchQuery}". Try searching for names, usernames, or message content.`
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
                      {/* Avatar with Online Status */}
                      <OnlineStatusAvatar
                        src={conversation.image}
                        alt={conversation.name}
                        fallback={conversation.name?.substring(0, 2).toUpperCase() || '??'}
                        isOnline={isUserOnline(conversation.userId)}
                        size="md"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 
                            className="font-semibold text-base truncate"
                            dangerouslySetInnerHTML={{
                              __html: highlightSearchTerms(conversation.name, searchQuery)
                            }}
                          />
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {conversation.lastMessage.isFromMe && (
                            <span className="text-xs text-muted-foreground">You:</span>
                          )}
                          <p 
                            className="text-sm text-muted-foreground truncate"
                            dangerouslySetInnerHTML={{
                              __html: highlightSearchTerms(truncateMessage(conversation.lastMessage.text), searchQuery)
                            }}
                          />
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
    </div>
  );
}
