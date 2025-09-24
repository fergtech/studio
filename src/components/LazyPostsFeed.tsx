"use client";

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useLazyLoad } from '@/hooks/useLazyLoad';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VideoPlayer } from '@/components/ui/video-player';
import { AudioPlayer } from '@/components/ui/audio-player';
import { LinkPreview } from '@/components/ui/link-preview';
import { DocumentPreview } from '@/components/ui/document-preview';
import { Textarea } from '@/components/ui/textarea';
import SocietyPostReactions from '@/components/SocietyPostReactions';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2 } from 'lucide-react';
import { updateSocietyPostContent } from '@/app/actions/postActions';
import { saveScrollPositionForKey } from '@/hooks/useScrollPosition';

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
  const { data: session } = useSession();
  const router = useRouter();
  const [allPosts, setAllPosts] = useState<any[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Edit state for posts
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');

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

  const { ref, data, loading, error, refetch } = useLazyLoad<PostsResponse>(fetchInitialPosts);

  // Dynamic text sizing based on content length
  const getTextSizeClass = (content: string) => {
    if (!content) return 'text-sm';
    
    const length = content.trim().length;
    
    // Very short content (like emojis or short phrases) - largest
    if (length <= 10) return 'text-2xl';
    
    // Short content - large
    if (length <= 30) return 'text-xl';
    
    // Medium content - medium-large  
    if (length <= 80) return 'text-lg';
    
    // Long content - normal size
    if (length <= 200) return 'text-base';
    
    // Very long content - smaller but not too small
    return 'text-sm';
  };

  // Edit handlers
  const handleEditPost = (post: any) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editContent.trim()) return;
    
    try {
      const result = await updateSocietyPostContent(postId, editContent);
      if (result.success) {
        // Update the post content locally
        setAllPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, content: editContent }
              : post
          )
        );
        handleCancelEdit();
      } else {
        alert(result.error || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    }
  };

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
              <Image 
                src={item.url} 
                alt="Post media" 
                width={600}
                height={400}
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
    <Card key={post.id} className="mb-4 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarImage src={post.user?.image || ''} />
            <AvatarFallback>{post.user?.name?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{post.user?.name}</span>
              <span className="text-sm text-muted-foreground">
                @{post.user?.username}
              </span>
              <span className="text-sm text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
              
              {/* Edit and Delete buttons - Show only for post author */}
              {session?.user?.id && post.user?.id === session.user.id && (
                <div className="ml-auto flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditPost(post)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {/* TODO: Add delete functionality if needed */}
                </div>
              )}
            </div>
            <div className="mt-2 min-w-0">
              {editingPostId === post.id ? (
                <div className="space-y-2 mb-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[80px] resize-none"
                    placeholder="Edit your post..."
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={() => handleSaveEdit(post.id)}
                      disabled={!editContent.trim() || editContent === post.content}
                    >
                      Save
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className={`whitespace-pre-wrap ${getTextSizeClass(post.content)}`}>{post.content}</p>
              )}
              {renderMedia(post.media)}
              
              {/* Render links */}
              {post.links && post.links.length > 0 && (
                <div className="mt-3">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide min-w-0">
                    {post.links.map((link: any) => 
                      link.linkPreview ? (
                        <div 
                          key={link.id} 
                          className="flex-shrink-0 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-3 py-2 rounded-full border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer group"
                          onClick={() => window.open(link.linkPreview.url, '_blank', 'noopener,noreferrer')}
                        >
                          {link.linkPreview.favicon ? (
                            <Image 
                              src={link.linkPreview.favicon} 
                              alt="Site favicon" 
                              width={16}
                              height={16}
                              className="w-4 h-4 rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          )}
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate max-w-[120px] sm:max-w-[200px]">
                            {link.linkPreview.title || new URL(link.linkPreview.url).hostname}
                          </span>
                          <svg className="w-3 h-3 text-blue-500 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
              
              {/* Render documents */}
              {post.documents && post.documents.length > 0 && (
                <div className="mt-3">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide min-w-0">
                    {post.documents.map((doc: any) => 
                      doc.document ? (
                        <div 
                          key={doc.id} 
                          className="flex-shrink-0 flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 px-3 py-2 rounded-full border border-orange-200 dark:border-orange-800 transition-colors cursor-pointer group"
                          onClick={() => window.open(doc.document.url, '_blank', 'noopener,noreferrer')}
                        >
                          {doc.document.extension === '.pdf' ? (
                            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                          <span className="text-sm font-medium text-orange-700 dark:text-orange-300 truncate max-w-[120px] sm:max-w-[200px]">
                            {doc.document.title || doc.document.filename}
                          </span>
                          <svg className="w-3 h-3 text-orange-500 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
              
              {/* Reaction buttons */}
              <SocietyPostReactions 
                postId={post.id} 
                currentUserId={session?.user?.id || null} 
                societyId={societyId}
                postType={post.type}
                onCommentClick={() => {
                  // Save scroll position before navigating
                  saveScrollPositionForKey(`societyFeed_${societyId}`);
                  // Navigate to post detail page with comment intent
                  router.push(`/posts/${post.id}?comments=true`);
                }}
              />
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