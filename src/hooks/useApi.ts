"use client";

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useToast } from './use-toast';

// Core API hook with caching optimized for social media performance
export function useApi() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Activity Feed with infinite scroll - most critical for social media
  const useActivityFeed = (preview = false) => {
    return useInfiniteQuery({
      queryKey: ['activity-feed', { preview }],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await fetch(
          `/api/activity-feed?page=${pageParam}&limit=${preview ? 3 : 10}&preview=${preview ? '1' : '0'}`
        );
        if (!response.ok) throw new Error('Failed to fetch activity feed');
        return response.json();
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.hasMore ? allPages.length + 1 : undefined;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes for social feed
      gcTime: 5 * 60 * 1000, // 5 minutes cache
      refetchOnWindowFocus: true,
    });
  };

  // Main Feed - critical for performance
  const useFeed = () => {
    return useInfiniteQuery({
      queryKey: ['feed'],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await fetch(`/api/feed?page=${pageParam}&limit=10`);
        if (!response.ok) throw new Error('Failed to fetch feed');
        return response.json();
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.hasMore ? allPages.length + 1 : undefined;
      },
      staleTime: 1 * 60 * 1000, // 1 minute for main feed - fresher data
      gcTime: 3 * 60 * 1000,
      refetchOnWindowFocus: true,
    });
  };

  // User Profile - heavily cached since it changes less
  const useUser = (userId: string) => {
    return useQuery({
      queryKey: ['user', userId],
      queryFn: async () => {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user');
        return response.json();
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      enabled: !!userId,
    });
  };

  // Current User - critical and frequently accessed
  const useCurrentUser = () => {
    return useQuery({
      queryKey: ['auth', 'me'],
      queryFn: async () => {
        const response = await fetch('/api/auth/me');
        if (!response.ok) throw new Error('Failed to fetch current user');
        return response.json();
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: false, // Don't refetch on focus for auth
    });
  };

  // Society Posts - social media content
  const useSocietyPosts = (societyId: string) => {
    return useInfiniteQuery({
      queryKey: ['society-posts', societyId],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await fetch(`/api/societies/${societyId}/posts?page=${pageParam}&limit=10`);
        if (!response.ok) throw new Error('Failed to fetch society posts');
        return response.json();
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.hasMore ? allPages.length + 1 : undefined;
      },
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      enabled: !!societyId,
    });
  };

  // Societies List - moderate caching
  const useSocieties = () => {
    return useQuery({
      queryKey: ['societies'],
      queryFn: async () => {
        const response = await fetch('/api/societies');
        if (!response.ok) throw new Error('Failed to fetch societies');
        return response.json();
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
    });
  };

  // Notifications - real-time but cached briefly
  const useNotifications = () => {
    return useQuery({
      queryKey: ['notifications'],
      queryFn: async () => {
        const response = await fetch('/api/notifications');
        if (!response.ok) throw new Error('Failed to fetch notifications');
        return response.json();
      },
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 2 * 60 * 1000,
      refetchInterval: 60 * 1000, // Poll every minute
    });
  };

  // Featured Content - longer cache since it's curated
  const useFeaturedContent = () => {
    return useQuery({
      queryKey: ['explore', 'featured'],
      queryFn: async () => {
        const response = await fetch('/api/explore/featured');
        if (!response.ok) throw new Error('Failed to fetch featured content');
        return response.json();
      },
      staleTime: 15 * 60 * 1000, // 15 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
    });
  };

  // Search with debouncing built-in
  const useSearch = (query: string, enabled = true) => {
    return useQuery({
      queryKey: ['search', query],
      queryFn: async () => {
        const response = await fetch(`/api/explore/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search');
        return response.json();
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      enabled: enabled && query.length > 2,
    });
  };

  // Optimistic mutations for social interactions
  const useLikeMutation = () => {
    return useMutation({
      mutationFn: async ({ postId, postType }: { postId: string; postType: string }) => {
        const response = await fetch(`/api/${postType}/likes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId }),
        });
        if (!response.ok) throw new Error('Failed to like post');
        return response.json();
      },
      onSuccess: () => {
        // Invalidate feed queries to show updated like counts
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        queryClient.invalidateQueries({ queryKey: ['activity-feed'] });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to like post. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const useFollowMutation = () => {
    return useMutation({
      mutationFn: async ({ userId, action }: { userId: string; action: 'follow' | 'unfollow' }) => {
        const response = await fetch(`/api/users/${userId}/follow`, {
          method: action === 'follow' ? 'POST' : 'DELETE',
        });
        if (!response.ok) throw new Error(`Failed to ${action} user`);
        return response.json();
      },
      onSuccess: (_, { userId }) => {
        // Invalidate user queries to show updated follow status
        queryClient.invalidateQueries({ queryKey: ['user', userId] });
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update follow status. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  return {
    // Queries
    useActivityFeed,
    useFeed,
    useUser,
    useCurrentUser,
    useSocietyPosts,
    useSocieties,
    useNotifications,
    useFeaturedContent,
    useSearch,
    // Mutations
    useLikeMutation,
    useFollowMutation,
    // Utilities
    queryClient,
  };
}