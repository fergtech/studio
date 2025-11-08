'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { DiscoveryGrid } from '@/components/DiscoveryGrid';
import { useIsMobile } from '@/hooks/useIsMobile';
import AppSidebar from '@/components/AppSidebar';

interface SearchUser {
  id: string;
  name: string;
  username: string;
  image?: string;
  bio?: string;
  dateCreated: string;
}

interface SearchInitiative {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

interface SearchPost {
  id: string;
  title?: string;
  content: string;
  description?: string;
  type: 'general' | 'issue' | 'idea' | 'debate';
  mediaUrl?: string;
  mediaType?: string;
  userId: string;
  user: {
    name: string;
    username: string;
    image?: string;
  };
}

interface SearchSociety {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  memberCount: number;
}

interface SearchResults {
  users: SearchUser[];
  initiatives: SearchInitiative[];
  posts: SearchPost[];
  debates?: SearchPost[];
  societies: SearchSociety[];
}

function ExplorePageInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({ users: [], initiatives: [], posts: [], debates: [], societies: [] });
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('sidebarCollapsed:explore');
      if (stored !== null) return stored === 'true';
    }
    return false;
  });

  // Load featured content on initial page load
  const loadFeaturedContent = async () => {
    setIsLoadingFeatured(true);
    try {
      const response = await fetch('/api/explore/featured');
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        console.error('Failed to load featured content');
      }
    } catch (error) {
      console.error('Error loading featured content:', error);
    } finally {
      setIsLoadingFeatured(false);
    }
  };

  // Handle search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      // If search is cleared, load featured content again
      setHasSearched(false);
      loadFeaturedContent();
      return;
    }
    setIsLoading(true);
    setHasSearched(true);
    // Replace this with your real API call
    const response = await fetch(`/api/explore/search?q=${encodeURIComponent(searchQuery)}`);
    if (response.ok) {
      const data = await response.json();
      setResults(data);
    } else {
      setResults({ users: [], initiatives: [], posts: [], debates: [], societies: [] });
    }
    setIsLoading(false);
  };

  // Load featured content on mount, and handle search params
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
      setHasSearched(true);
      setTimeout(() => handleSearch(), 0);
    } else {
      // Load featured content on initial load
      loadFeaturedContent();
    }
    // eslint-disable-next-line
  }, []);

  // User card
  const UserCard = (user: SearchUser) => {
    const isCurrentUser = session?.user?.id === user.id;
    return (
      <div className="bg-card rounded-lg shadow p-4 flex flex-col items-center text-center">
        {user.username ? (
          <Link href={`/profile/${user.username}`} className="flex flex-col items-center group">
            <Avatar className="h-16 w-16 mb-2 group-hover:ring-2 group-hover:ring-primary transition">
              <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
              <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="font-semibold text-lg">{user.name || user.username || 'User'}</div>
            {user.username && <div className="text-xs text-muted-foreground">@{user.username}</div>}
          </Link>
        ) : null}
        {user.bio && <div className="text-xs mt-1 text-muted-foreground line-clamp-2">{user.bio}</div>}
        <div className="text-xs text-gray-500 mt-1">Joined {new Date(user.dateCreated).toLocaleDateString()}</div>
      </div>
    );
  };

  // Initiative card (profile style)
  const InitiativeCard = (initiative: SearchInitiative) => (
    <Link key={initiative.id} href={`/initiatives/${initiative.id}`} passHref className="block h-[260px] cursor-pointer">
      <div className="relative cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group h-full rounded-lg">
        {/* Background Image and Overlay */}
        {initiative.imageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url(${initiative.imageUrl})` }}
          >
            <div className="absolute inset-0 bg-black/60" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
        )}
        {/* Content Layer */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="p-4">
            <div className="text-base line-clamp-2 text-white font-semibold">{initiative.title}</div>
            <div className="line-clamp-3 text-gray-200 text-xs mt-1">{initiative.description}</div>
          </div>
        </div>
      </div>
    </Link>
  );

  // Post card (general, issue, idea)
  const PostCard = (post: SearchPost) => {
    let href = '#';
    if (post.type === 'general') href = `/posts/${post.id}`;
    if (post.type === 'issue') href = `/issues/${post.id}`;
    if (post.type === 'idea') href = `/ideas/${post.id}`;
    
    // Check if post has visual media
    const hasVisualMedia = post.mediaUrl && (
      post.mediaType === 'image' || 
      post.mediaType?.startsWith('image/') ||
      !post.mediaType // Assume image if no type specified but URL exists
    );
    
    if (hasVisualMedia) {
      // Visual post card with image
      return (
        <Link href={href} passHref className="block h-[180px] cursor-pointer">
          <div className="relative cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group h-full rounded-lg">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundImage: `url(${post.mediaUrl})` }}
            >
              <div className="absolute inset-0 bg-black/50" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                    {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                  </Badge>
                </div>
                <div className="text-white font-semibold text-sm line-clamp-2 mb-1">
                  {post.title || post.content?.slice(0, 50) + '...' || 'Untitled'}
                </div>
                {(post.description || post.content) && (
                  <div className="text-gray-200 text-xs line-clamp-2">
                    {post.description || post.content}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      );
    }
    
    // Text-only post card
    return (
      <Link href={href} passHref className="block">
        <div className="bg-card rounded-lg shadow p-4 flex flex-col hover:ring-2 hover:ring-primary transition cursor-pointer">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">{post.type.charAt(0).toUpperCase() + post.type.slice(1)}</Badge>
            <span className="font-semibold text-base">{post.title || post.content?.slice(0, 30) || 'Untitled'}</span>
          </div>
          {post.description && <div className="text-xs text-muted-foreground line-clamp-2 mb-1">{post.description}</div>}
          {post.content && <div className="text-xs text-muted-foreground line-clamp-2 mb-1">{post.content}</div>}
        </div>
      </Link>
    );
  };

  // Society card
  const SocietyCard = (society: SearchSociety) => (
    <Link key={society.id} href={`/societies/${society.id}`} passHref className="block h-[180px] cursor-pointer">
      <div className="relative cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group h-full rounded-lg">
        {society.imageUrl ? (
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105" style={{ backgroundImage: `url(${society.imageUrl})` }}>
            <div className="absolute inset-0 bg-black/60" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
        )}
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="p-4">
            <div className="text-base line-clamp-2 text-white font-semibold">{society.name}</div>
            <div className="line-clamp-3 text-gray-200 text-xs mt-1">{society.description}</div>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {/* AppSidebar for desktop (hidden on mobile) */}
      <AppSidebar
        className="hidden lg:flex"
        widgets={['userControls', 'navigation', 'resources', 'footer']}
        context={{ type: 'explore' }}
        onCollapseChange={(collapsed: boolean) => {
          setSidebarCollapsed(collapsed);
          if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarCollapsed:explore', String(collapsed));
          }
        }}
      />
      <div className={`px-4 lg:px-6 pt-20 lg:pt-6 pb-32 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        <div className="max-w-5xl mx-auto py-10">
          <div className="flex flex-col sm:flex-row items-center justify-center mb-2 gap-4">
            {/* Networking image above or right of Explore header */}
            <div className="flex-shrink-0">
              <Image src="/networking.png" alt="Networking" width={64} height={64} className="sm:mb-0 mb-2" />
            </div>
            <div className="flex flex-col items-center sm:items-start">
              <h1 className="text-3xl font-bold text-center sm:text-left">Explore</h1>
              <p className="text-lg text-muted-foreground text-center sm:text-left">Discover and connect with your society</p>
            </div>
          </div>
      <form onSubmit={handleSearch} className="flex justify-center mb-10">
        <Input
          className="max-w-lg w-full rounded-l-md"
          placeholder="Search debates, projects, communities..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          suppressHydrationWarning
        />
        <Button type="submit" className="rounded-l-none">Search</Button>
      </form>
      
      {/* Loading states */}
      {isLoading && <div className="text-center text-muted-foreground">Searching...</div>}
      {isLoadingFeatured && !hasSearched && <div className="text-center text-muted-foreground">Loading featured content...</div>}
      
      {/* Show content when not loading */}
      {!isLoading && !isLoadingFeatured && (
        <>
          {/* Instagram-style Discovery Grid for all devices */}
          <DiscoveryGrid 
            searchResults={results}
            isSearching={isLoading || isLoadingFeatured}
            hasSearched={hasSearched}
          />
        </>
      )}
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExplorePageInner />
    </Suspense>
  );
} 