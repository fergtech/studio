"use client";

import { useState, useCallback } from 'react';
import { useLazyLoad } from '@/hooks/useLazyLoad';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VideoPlayer } from '@/components/ui/video-player';
import { AudioPlayer } from '@/components/ui/audio-player';
import { LinkPreview } from '@/components/ui/link-preview';
import { DocumentPreview } from '@/components/ui/document-preview';

interface PostsResponse {
  posts: any[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    limit: number;
  };
}

interface LazyPostsFeedProps {
  societyId: string;
  initialPosts?: any[];
  feedFilter?: string;
  onPostUpdate?: () => void;
}

export function LazyPostsFeed({ 
  societyId, 
  initialPosts = [], 
  feedFilter = 'ALL',
  onPostUpdate 
}: LazyPostsFeedProps) {
  const [allPosts, setAllPosts] = useState<any[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Initial posts load function
  const fetchInitialPosts = useCallback(async (): Promise<PostsResponse> => {
    const typeParam = feedFilter !== 'ALL' ? `&type=${feedFilter}` : '';
    const response = await fetch(`/api/societies/${societyId}/posts?limit=10${typeParam}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    
    const data = await response.json();
    
    // Update state with fetched data
    setAllPosts(data.posts);
    setNextCursor(data.pagination.nextCursor);
    setHasMore(data.pagination.hasMore);
    
    return data;
  }, [societyId, feedFilter]);

  // Load more posts function
  const loadMorePosts = async () => {
    if (!hasMore || loadingMore || !nextCursor) return;
    
    setLoadingMore(true);
    try {
      const typeParam = feedFilter !== 'ALL' ? `&type=${feedFilter}` : '';
      const response = await fetch(
        `/api/societies/${societyId}/posts?limit=10&cursor=${nextCursor}${typeParam}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAllPosts(prev => [...prev, ...data.posts]);
        setNextCursor(data.pagination.nextCursor);
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const { ref, data, loading, error } = useLazyLoad<PostsResponse>(fetchInitialPosts);

  // Render media based on type
  const renderMedia = (media: any[]) => {
    if (!media || media.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {media.map((item, index) => (
          <div key={index}>
            {item.type === 'video' && (
              <VideoPlayer src={item.url} className="w-full rounded-lg" />
            )}
            {item.type === 'audio' && (
              <AudioPlayer src={item.url} className="w-full" />
            )}
            {item.type === 'image' && (
              <img 
                src={item.url} 
                alt="Post media" 
                className="w-full rounded-lg object-cover max-h-96"
                loading="lazy"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPost = (post: any) => (
    <Card key={post.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={post.user?.image || ''} />
            <AvatarFallback>{post.user?.name?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{post.user?.name}</span>
              <span className="text-sm text-muted-foreground">
                @{post.user?.username}
              </span>
              <span className="text-sm text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-sm">{post.content}</p>
              {renderMedia(post.media)}
              
              {/* Render links */}
              {post.links && post.links.length > 0 && (
                <div className="mt-3 space-y-2">
                  {post.links.map((link: any) => (
                    <LinkPreview key={link.id} linkPreview={link.linkPreview} />
                  ))}
                </div>
              )}
              
              {/* Render documents */}
              {post.documents && post.documents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {post.documents.map((doc: any) => (
                    <DocumentPreview key={doc.id} document={doc.document} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div ref={ref} className="space-y-4">
      {loading && renderLoadingSkeleton()}
      
      {error && (
        <Card className="p-4">
          <p className="text-red-500">Error loading posts: {error}</p>
        </Card>
      )}
      
      {data && allPosts.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No posts found</p>
        </Card>
      )}
      
      {allPosts.map(renderPost)}
      
      {hasMore && allPosts.length > 0 && (
        <div className="flex justify-center py-4">
          <Button 
            onClick={loadMorePosts}
            disabled={loadingMore}
            variant="outline"
          >
            {loadingMore ? 'Loading...' : 'Load More Posts'}
          </Button>
        </div>
      )}
    </div>
  );
}