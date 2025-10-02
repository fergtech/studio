"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GeneralPostCard } from '@/components/GeneralPostCard';
import { HotTakeBattleCard } from '@/components/HotTakeBattleCard';
import { TrendingBattlesWidget } from '@/components/TrendingBattlesWidget';
import { Hash, TrendingUp, Users, ArrowLeft, Filter } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import AppSidebar, { getDefaultCollapsedState } from '@/components/AppSidebar';
import { useModal } from '@/context/ModalContext';

interface TopicFeedClientProps {
  topic: string;
}

interface TopicPost {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  content: string;
  topics: string[];
  timestamp: Date;
  background?: string;
  media?: any[];
}

interface TopicStats {
  totalPosts: number;
  activeBattles: number;
  topContributors: string[];
  relatedTopics: string[];
}

export function TopicFeedClient({ topic }: TopicFeedClientProps) {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [posts, setPosts] = useState<TopicPost[]>([]);
  const [battles, setBattles] = useState([]);
  const [stats, setStats] = useState<TopicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'posts' | 'battles'>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getDefaultCollapsedState({ type: 'topic' }));
  const { openCreateBattleResponseModal, openCreateTopicPostModal } = useModal();

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

      // Fetch posts with this topic
      const postsResponse = await fetch(`/api/topics/${encodeURIComponent(topic)}/posts`);
      if (postsResponse.ok) {
        const postsData = await postsResponse.json();
        setPosts(postsData.posts || []);
        setStats(postsData.stats || null);
      }

      // Fetch Hot Take Battles related to this topic
      const battlesResponse = await fetch(`/api/hot-take-battles?topic=${encodeURIComponent(topic)}`);
      if (battlesResponse.ok) {
        const battlesData = await battlesResponse.json();
        setBattles(battlesData.battles || []);
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

  const handleJoinBattle = async (battleId: string, stance: any) => {
    try {
      const response = await fetch(`/api/hot-take-battles/${battleId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stance }),
      });

      if (!response.ok) throw new Error('Failed to join battle');

      toast({
        title: "Joined the battle! 🔥",
        description: "Your stance has been recorded",
      });

      // Refresh battles
      fetchTopicData();
    } catch (error) {
      toast({
        title: "Failed to join battle",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const filteredContent = () => {
    if (filter === 'posts') {
      return posts.map(p => ({ ...p, type: 'post', timestamp: new Date(p.timestamp) }));
    }
    if (filter === 'battles') {
      return battles.map(b => ({ ...b, type: 'battle', timestamp: new Date(b.createdAt) }));
    }

    // Mix posts and battles by timestamp for 'all'
    const mixed = [
      ...posts.map(p => ({ ...p, type: 'post', timestamp: new Date(p.timestamp) })),
      ...battles.map(b => ({ ...b, type: 'battle', timestamp: new Date(b.createdAt) }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return mixed;
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

  const content = filteredContent();

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {/* Sidebar */}
      <AppSidebar
        widgets={['userControls', 'navigation', 'suggestions', 'location', 'resources', 'footer']}
        context={{ type: 'topic', topic }}
        onCollapseChange={setSidebarCollapsed}
      />
      {/* Main Content - with dynamic left margin based on sidebar state */}
      <div className={`min-h-screen bg-background transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
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
                    <div className="text-2xl font-bold text-primary">{stats.totalPosts}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">{stats.activeBattles}</div>
                    <div className="text-sm text-muted-foreground">Active Battles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{stats.topContributors.length}</div>
                    <div className="text-sm text-muted-foreground">Contributors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{stats.relatedTopics.length}</div>
                    <div className="text-sm text-muted-foreground">Related Topics</div>
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

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({posts.length + battles.length})
            </Button>
            <Button
              variant={filter === 'posts' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('posts')}
            >
              Posts ({posts.length})
            </Button>
            <Button
              variant={filter === 'battles' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('battles')}
            >
              🔥 Battles ({battles.length})
            </Button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {content.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No content yet for #{topic}</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to start a discussion about this topic!
                  </p>
                  <Button onClick={() => openCreateTopicPostModal(topic)}>
                    Create a Post
                  </Button>
                </CardContent>
              </Card>
            ) : (
              content.map((item: any) => (
                <div key={`${item.type}-${item.id}`}>
                  {item.type === 'post' ? (
                    <div className="w-full max-w-[500px]">
                      <GeneralPostCard
                        post={item}
                        currentUserId={session?.user?.id}
                        onPostDeleted={handlePostDeleted}
                      />
                    </div>
                  ) : (
                    <div className="w-full max-w-[500px]">
                      <HotTakeBattleCard
                        battle={item}
                        onJoinBattle={handleJoinBattle}
                        onCreateTake={(battleId: string) => {
                          openCreateBattleResponseModal(battleId, item.title);
                        }}
                        variant="feed"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <TrendingBattlesWidget limit={3} showHeader={true} />

            {/* Topic Engagement CTA */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Join the Discussion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Share your thoughts on #{topic} and engage with the community.
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => openCreateTopicPostModal(topic)}
                >
                  Create Post
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}