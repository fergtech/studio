'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface PostStats {
  likes: {
    count: number;
    liked: boolean;
  };
  shares: {
    count: number;
  };
  comments: {
    count: number;
  };
}

interface PostStatsContextValue {
  getStats: (postId: string) => PostStats | null;
  registerPost: (postId: string) => void;
  updateLike: (postId: string, liked: boolean) => void;
  updateComment: (postId: string, increment: boolean) => void;
  updateShare: (postId: string, increment: boolean) => void;
  refreshStats: (postIds: string[]) => Promise<void>;
}

const PostStatsContext = createContext<PostStatsContextValue | null>(null);

interface PostStatsProviderProps {
  children: React.ReactNode;
  currentUserId?: string;
}

export function PostStatsProvider({ children, currentUserId }: PostStatsProviderProps) {
  const [statsCache, setStatsCache] = useState<Map<string, PostStats>>(new Map());
  const pendingPostIds = useRef<Set<string>>(new Set());
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  // Batch fetch stats for accumulated post IDs
  const fetchBatchStats = useCallback(async (postIds: string[]) => {
    if (postIds.length === 0 || isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      const response = await fetch('/api/general-posts/batch-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds, userId: currentUserId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch batch stats');
      }

      const data = await response.json();

      setStatsCache((prev) => {
        const newCache = new Map(prev);
        for (const [postId, stats] of Object.entries(data)) {
          newCache.set(postId, stats as PostStats);
        }
        return newCache;
      });
    } catch (error) {
      console.error('Error fetching batch stats:', error);
    } finally {
      isFetchingRef.current = false;
    }
  }, [currentUserId]);

  // Register a post and trigger batched fetch
  const registerPost = useCallback((postId: string) => {
    // Skip if already cached
    if (statsCache.has(postId)) return;

    // Add to pending batch
    pendingPostIds.current.add(postId);

    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Debounce batch fetch (50ms to collect multiple registrations)
    batchTimeoutRef.current = setTimeout(() => {
      const postIds = Array.from(pendingPostIds.current);
      pendingPostIds.current.clear();
      fetchBatchStats(postIds);
    }, 50);
  }, [statsCache, fetchBatchStats]);

  // Get stats for a specific post
  const getStats = useCallback((postId: string): PostStats | null => {
    return statsCache.get(postId) || null;
  }, [statsCache]);

  // Optimistically update like state
  const updateLike = useCallback((postId: string, liked: boolean) => {
    setStatsCache((prev) => {
      const stats = prev.get(postId);
      if (!stats) return prev;

      const newCache = new Map(prev);
      newCache.set(postId, {
        ...stats,
        likes: {
          count: stats.likes.count + (liked ? 1 : -1),
          liked,
        },
      });
      return newCache;
    });
  }, []);

  // Optimistically update comment count
  const updateComment = useCallback((postId: string, increment: boolean) => {
    setStatsCache((prev) => {
      const stats = prev.get(postId);
      if (!stats) return prev;

      const newCache = new Map(prev);
      newCache.set(postId, {
        ...stats,
        comments: {
          count: stats.comments.count + (increment ? 1 : -1),
        },
      });
      return newCache;
    });
  }, []);

  // Optimistically update share count
  const updateShare = useCallback((postId: string, increment: boolean) => {
    setStatsCache((prev) => {
      const stats = prev.get(postId);
      if (!stats) return prev;

      const newCache = new Map(prev);
      newCache.set(postId, {
        ...stats,
        shares: {
          count: stats.shares.count + (increment ? 1 : -1),
        },
      });
      return newCache;
    });
  }, []);

  // Refresh stats for specific posts (useful after mutations)
  const refreshStats = useCallback(async (postIds: string[]) => {
    await fetchBatchStats(postIds);
  }, [fetchBatchStats]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  const value: PostStatsContextValue = {
    getStats,
    registerPost,
    updateLike,
    updateComment,
    updateShare,
    refreshStats,
  };

  return (
    <PostStatsContext.Provider value={value}>
      {children}
    </PostStatsContext.Provider>
  );
}

export function usePostStats() {
  const context = useContext(PostStatsContext);
  if (!context) {
    throw new Error('usePostStats must be used within PostStatsProvider');
  }
  return context;
}
