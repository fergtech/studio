'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash } from 'lucide-react';
import Link from 'next/link';
import { getTopicIcons, TopicIconResult } from '@/services/topicIcons';
import { DynamicIcon } from './DynamicIcon';
import { TopicCard } from './TopicCard';

interface TopicStats {
  topic: string;
  count: number;
  category?: string;
  latestPost?: {
    id: string;
    content: string;
    timestamp: Date | string;
    thumbnail?: {
      url: string;
      type: string;
    } | null;
    author: {
      name: string;
      username: string;
      image?: string | null;
    };
  } | null;
}

interface TrendingTopicsWidgetProps {
  limit?: number;
  showHeader?: boolean;
}

export function TrendingTopicsWidget({ limit = 8, showHeader = true }: TrendingTopicsWidgetProps) {
  const [topics, setTopics] = useState<TopicStats[]>([]);
  const [topicIcons, setTopicIcons] = useState<Map<string, TopicIconResult>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingTopics();
  }, [limit]);

  const fetchTrendingTopics = async () => {
    try {
      const response = await fetch(`/api/trending-topics?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        const topicsData = data.topics || [];
        setTopics(topicsData);

        // Get AI-powered icons for all topics
        if (topicsData.length > 0) {
          const topicNames = topicsData.map((t: TopicStats) => t.topic);
          const icons = await getTopicIcons(topicNames);
          setTopicIcons(icons);
        }
      }
    } catch (error) {
      console.error('Error fetching trending topics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate colors for topics
  const getTopicColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-300',
      'bg-green-100 text-green-700 border-green-300',
      'bg-purple-100 text-purple-700 border-purple-300',
      'bg-orange-100 text-orange-700 border-orange-300',
      'bg-pink-100 text-pink-700 border-pink-300',
      'bg-indigo-100 text-indigo-700 border-indigo-300',
      'bg-yellow-100 text-yellow-700 border-yellow-300',
      'bg-red-100 text-red-700 border-red-300',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div>
        {showHeader && (
          <div className="pb-3 px-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Trending Topics
            </h2>
          </div>
        )}
        <div className="px-2">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
                <div className="w-16 h-3 bg-gray-200 rounded mt-2 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div>
        {showHeader && (
          <div className="pb-3 px-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Trending Topics
            </h2>
          </div>
        )}
        <div className="px-2">
          <div className="text-center py-8 text-muted-foreground">
            <Hash className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No trending topics yet</p>
            <p className="text-xs">Start conversations to see topics here!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {showHeader && (
        <div className="pb-3 px-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Trending Topics
          </h2>
        </div>
      )}
      <div className="px-2 relative group">
        {/* Horizontal scrolling layout for topic cards with thumbnails */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {topics.map((topicStat, index) => (
            <div key={topicStat.topic} className="flex-shrink-0 w-48">
              <TopicCard
                topic={topicStat.topic}
                count={topicStat.count}
                category={topicStat.category}
                latestPost={topicStat.latestPost}
              />
            </div>
          ))}

          {/* Browse All Topics Link - Always show at end */}
          <Link href="/topics/browse" className="flex-shrink-0 w-48">
            <Card className="h-full hover:shadow-lg hover:ring-2 hover:ring-primary transition-all duration-200 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                <Hash className="h-12 w-12 mb-3 text-primary" />
                <h3 className="font-semibold text-base mb-1">Browse All Topics</h3>
                <p className="text-xs text-muted-foreground">Explore all 28 topics</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}