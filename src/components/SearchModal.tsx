'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, MessageSquare, TrendingUp, Lightbulb, Flag, FileText, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  debates: Array<{
    id: string;
    title: string;
    content: string;
    stats: {
      totalVotes: number;
      argumentCount: number;
    };
  }>;
  users: Array<{
    id: string;
    name: string;
    username?: string;
    image?: string;
  }>;
  initiatives: Array<{
    id: string;
    title: string;
    description: string;
    createdAt: string;
  }>;
  posts: Array<{
    id: string;
    content: string;
    type: 'general';
    userId: string;
    user: {
      name: string;
      username: string;
      image?: string;
    };
    mediaUrl?: string;
    mediaType?: string;
    createdAt: string;
  }>;
  societies: Array<{
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    memberCount: number;
  }>;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/explore/search?q=${encodeURIComponent(query.trim())}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleDebateClick = (debateId: string) => {
    router.push(`/debates/${debateId}`);
    onClose();
  };

  const handleUserClick = (userId: string, username?: string) => {
    router.push(`/u/${username || userId}`);
    onClose();
  };

  const handleInitiativeClick = (initiativeId: string) => {
    router.push(`/initiatives/${initiativeId}`);
    onClose();
  };

  const handlePostClick = (postId: string) => {
    router.push(`/posts/${postId}`);
    onClose();
  };

  const handleSocietyClick = (societyId: string) => {
    router.push(`/societies/${societyId}`);
    onClose();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="flex items-start justify-center min-h-screen p-4 pt-20">
        <div className="w-full max-w-2xl bg-background rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300">

          {/* Search Input */}
          <div className="relative p-6 pb-4">
            <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-4 border-2 border-transparent focus-within:border-primary transition-colors">
              <Search className="h-6 w-6 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search debates, initiatives, societies, posts, and users..."
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Results */}
          <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
            {isSearching && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                Searching...
              </div>
            )}

            {!isSearching && query && results && (
              <div className="space-y-6">
                {/* Debates */}
                {results.debates.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">Debates</h3>
                      <Badge variant="secondary" className="ml-auto">
                        {results.debates.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {results.debates.map((debate) => (
                        <button
                          key={debate.id}
                          onClick={() => handleDebateClick(debate.id)}
                          className="w-full text-left p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <h4 className="font-medium mb-1 group-hover:text-primary transition-colors">
                            {debate.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {debate.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {debate.stats.totalVotes} votes
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {debate.stats.argumentCount} arguments
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Initiatives */}
                {results.initiatives.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">Initiatives</h3>
                      <Badge variant="secondary" className="ml-auto">
                        {results.initiatives.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {results.initiatives.map((initiative) => (
                        <button
                          key={initiative.id}
                          onClick={() => handleInitiativeClick(initiative.id)}
                          className="w-full text-left p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <h4 className="font-medium mb-1 group-hover:text-primary transition-colors">
                            {initiative.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {initiative.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Societies */}
                {results.societies.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">Societies</h3>
                      <Badge variant="secondary" className="ml-auto">
                        {results.societies.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {results.societies.map((society) => (
                        <button
                          key={society.id}
                          onClick={() => handleSocietyClick(society.id)}
                          className="w-full text-left p-4 rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3 group"
                        >
                          {society.imageUrl && (
                            <Avatar className="h-12 w-12 rounded-lg">
                              <AvatarImage src={society.imageUrl} alt={society.name} />
                              <AvatarFallback className="rounded-lg">{society.name[0]}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium mb-1 group-hover:text-primary transition-colors">
                              {society.name}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-1 mb-1">
                              {society.description}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {society.memberCount} members
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posts */}
                {results.posts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">Posts</h3>
                      <Badge variant="secondary" className="ml-auto">
                        {results.posts.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {results.posts.map((post) => (
                        <button
                          key={post.id}
                          onClick={() => handlePostClick(post.id)}
                          className="w-full text-left p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={post.user.image || undefined} alt={post.user.name} />
                              <AvatarFallback className="text-xs">{getInitials(post.user.name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{post.user.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3 group-hover:text-foreground transition-colors">
                            {post.content}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users */}
                {results.users.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">Users</h3>
                      <Badge variant="secondary" className="ml-auto">
                        {results.users.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {results.users.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleUserClick(user.id, user.username)}
                          className="w-full text-left p-4 rounded-lg hover:bg-muted/50 transition-colors flex items-center gap-3 group"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.image || undefined} alt={user.name} />
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium group-hover:text-primary transition-colors">
                              {user.name}
                            </div>
                            {user.username && (
                              <div className="text-sm text-muted-foreground">
                                @{user.username}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {results.debates.length === 0 &&
                 results.users.length === 0 &&
                 results.initiatives.length === 0 &&
                 results.posts.length === 0 &&
                 results.societies.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-1">No results found</p>
                    <p className="text-sm">
                      Try searching with different keywords
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!query && !results && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">Start typing to search</p>
                <p className="text-sm">
                  Search for debates, initiatives, societies, posts, and users
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
