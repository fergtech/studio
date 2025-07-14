'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

function ExplorePageInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({ users: [], initiatives: [], posts: [], societies: [] });
  const [hasSearched, setHasSearched] = useState(false);

  // Handle search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setResults({ users: [], initiatives: [], posts: [], societies: [] });
      setHasSearched(false);
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
      setResults({ users: [], initiatives: [], posts: [], societies: [] });
    }
    setIsLoading(false);
  };

  // Optionally, auto-search if query param is present
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
      setTimeout(() => handleSearch(), 0);
    }
    // eslint-disable-next-line
  }, []);

  // User card
  const UserCard = (user: any) => {
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
  const InitiativeCard = (initiative: any) => (
    <Link key={initiative.id} href={`/initiatives/${initiative.id}`} passHref className="block min-w-[300px] h-[260px] cursor-pointer">
      <div className="relative flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group h-full rounded-lg">
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
  const PostCard = (post: any) => {
    let href = '#';
    if (post.type === 'general') href = `/posts/${post.id}`;
    if (post.type === 'issue') href = `/issues/${post.id}`;
    if (post.type === 'idea') href = `/ideas/${post.id}`;
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
  const SocietyCard = (society: any) => (
    <Link key={society.id} href={`/societies/${society.id}`} passHref className="block min-w-[300px] h-[180px] cursor-pointer">
      <div className="relative flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group h-full rounded-lg">
        {society.image ? (
          <div className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105" style={{ backgroundImage: `url(${society.image})` }}>
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
    <div className="max-w-5xl mx-auto px-4 py-10">
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
          placeholder="Search users, initiatives, posts..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <Button type="submit" className="rounded-l-none">Search</Button>
      </form>
      {isLoading && <div className="text-center text-muted-foreground">Searching...</div>}
      {hasSearched && !isLoading && (
        <>
          {/* Users group */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Users</h2>
            {results.users.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.users.map((user: any) => <UserCard key={user.id} {...user} />)}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">No users found</div>
            )}
          </div>
          {/* Societies group */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Societies</h2>
            {results.societies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.societies.map((society: any) => <SocietyCard key={society.id} {...society} />)}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">No societies found</div>
            )}
          </div>
          {/* Initiatives group */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Initiatives</h2>
            {results.initiatives.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.initiatives.map((initiative: any) => <InitiativeCard key={initiative.id} {...initiative} />)}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">No initiatives found</div>
            )}
          </div>
          {/* Posts group (mixed) */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Posts</h2>
            {results.posts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.posts.map((post: any) => <PostCard key={post.id} {...post} />)}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">No posts found</div>
            )}
          </div>
          {/* If all empty */}
          {results.users.length === 0 && results.societies.length === 0 && results.initiatives.length === 0 && results.posts.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-12">
              <span className="text-5xl mb-4">🔍</span>
              <div className="text-xl font-semibold mb-2">No results found</div>
              <div className="text-muted-foreground">Try searching with a different term</div>
            </div>
          )}
        </>
      )}
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