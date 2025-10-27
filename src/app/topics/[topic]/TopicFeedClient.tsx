"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MobileDebateCard } from '@/components/MobileDebateCard';
import { MobileFeedCard } from '@/components/MobileFeedCard';
import { PostStatsProvider } from '@/context/PostStatsContext';
import { Hash, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useModal } from '@/context/ModalContext';

interface TopicFeedClientProps {
  topic: string;
}

interface DebateStats {
  proVotes: number;
  conVotes: number;
  totalVotes: number;
  proPercentage: number;
  conPercentage: number;
  argumentCount: number;
}

interface TopicDebate {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  creatorId: string;
  topics: string[];
  createdAt: string;
  creator: {
    id: string;
    name: string;
    image?: string;
    username?: string;
  };
  stats: DebateStats;
}

interface TopicPost {
  id: string;
  content: string;
  background?: string;
  creatorId: string;
  topics: string[];
  timestamp: string;
  creator: {
    id: string;
    name: string;
    image?: string;
    username?: string;
  };
  media: Array<{
    id: string;
    url: string;
    type: string;
  }>;
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  type: 'post';
}

interface TopicStats {
  totalDebates: number;
  totalPosts: number;
  totalContent: number;
  activeBattles: number;
  topContributors: string[];
  relatedTopics: string[];
}

export function TopicFeedClient({ topic }: TopicFeedClientProps) {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [debates, setDebates] = useState<TopicDebate[]>([]);
  const [posts, setPosts] = useState<TopicPost[]>([]);
  const [stats, setStats] = useState<TopicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopicData();
  }, [topic]);

  // Add feed refresh listener
  useEffect(() => {
    const handleFeedItemCreated = (event: CustomEvent) => {
      // Refresh topic data when a new item is created
      fetchTopicData();
    };

    window.addEventListener('feed:itemCreated', handleFeedItemCreated as EventListener);
    return () => {
      window.removeEventListener('feed:itemCreated', handleFeedItemCreated as EventListener);
    };
  }, []);

  const fetchTopicData = async () => {
    try {
      setLoading(true);

      // Fetch debates and posts with this topic
      const response = await fetch(`/api/topics/${encodeURIComponent(topic)}/posts`);
      if (response.ok) {
        const data = await response.json();
        setDebates(data.debates || []);
        setPosts(data.posts || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching topic data:', error);
      toast({
        title: "Failed to load topic feed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PostStatsProvider>
      <div className="w-full min-w-0 overflow-hidden">
        <div className="px-4 lg:px-6 pt-20 lg:pt-6 pb-32">
        <div className="flex items-center mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Hash className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">{topic}</h1>
          </div>
        </div>

        {/* Topic Stats */}
        {stats && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalContent}</div>
                  <div className="text-sm text-muted-foreground">Total Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{stats.totalDebates}</div>
                  <div className="text-sm text-muted-foreground">Debates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.totalPosts}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{stats.topContributors.length}</div>
                  <div className="text-sm text-muted-foreground">Contributors</div>
                </div>
              </div>

              {/* Related Topics */}
              {stats.relatedTopics.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Related Topics:</p>
                  <div className="flex flex-wrap gap-1">
                    {stats.relatedTopics.slice(0, 5).map(relatedTopic => (
                      <Link key={relatedTopic} href={`/topics/${encodeURIComponent(relatedTopic)}`}>
                        <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground cursor-pointer">
                          #{relatedTopic}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Content Feed - Debates and Posts */}
        <div className="space-y-6 max-w-2xl mx-auto">
          {debates.length === 0 && posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No content yet for #{topic}</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to create a post or start a debate about this topic!
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Combine and sort all content chronologically */}
              {[
                ...debates.map(d => ({ ...d, type: 'debate' as const, sortDate: new Date(d.createdAt) })),
                ...posts.map(p => ({ ...p, type: 'post' as const, sortDate: new Date(p.timestamp) }))
              ]
                .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
                .map((item) => {
                  if (item.type === 'debate') {
                    return (
                      <MobileDebateCard
                        key={`debate-${item.id}`}
                        id={item.id}
                        title={item.title}
                        content={item.content}
                        imageUrl={item.imageUrl}
                        createdAt={item.createdAt}
                        creator={item.creator}
                        stats={item.stats}
                        currentUserId={session?.user?.id}
                      />
                    );
                  } else {
                    // General post
                    return (
                      <MobileFeedCard
                        key={`post-${item.id}`}
                        post={{
                          id: item.id,
                          creatorId: item.creatorId,
                          creatorName: item.creator.name,
                          creatorAvatar: item.creator.image,
                          content: item.content,
                          background: item.background,
                          timestamp: new Date(item.timestamp),
                          topics: item.topics,
                          media: item.media,
                          likesCount: item.stats.likes,
                          commentsCount: item.stats.comments,
                          sharesCount: item.stats.shares
                        }}
                        currentUserId={session?.user?.id}
                      />
                    );
                  }
                })}
            </>
          )}
        </div>
        </div>
      </div>
    </PostStatsProvider>
  );
}