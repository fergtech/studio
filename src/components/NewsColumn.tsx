'use client';

import React, { useState, useEffect } from 'react';
import { NewsPostCard } from './NewsPostCard';
import { Loader2, Newspaper } from 'lucide-react';

interface LiveNewsPost {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: string;
  location?: string;
  city?: string;
  tier?: 'hyper-local' | 'regional' | 'national' | 'global';
  relevanceScore?: number;
  urgencyLevel: number;
  tags: string[];
  createdAt?: string;
  type: 'live-news';
}

interface NewsColumnProps {
  limit?: number;
  showMore?: boolean;
  onShowMore?: () => void;
}

export function NewsColumn({ limit = 5, showMore = false, onShowMore }: NewsColumnProps) {
  const [news, setNews] = useState<LiveNewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const url = `/api/news/live?limit=${showMore ? limit * 2 : limit}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch news: ${response.status}`);
        }

        const data = await response.json();
        setNews(data.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();

    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [limit, showMore]);

  const handleShowMore = () => {
    if (onShowMore) {
      onShowMore();
    }
  };

  if (loading) {
    return (
      <div className="w-80 bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Local News</h2>
        </div>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-80 bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Local News</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>Unable to load news</p>
        </div>
      </div>
    );
  }

  // Group news by tier for better organization
  const hyperLocalNews = news.filter(n => n.tier === 'hyper-local');
  const otherNews = news.filter(n => n.tier !== 'hyper-local');

  return (
    <div className="w-80 bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          <h2 className="font-semibold text-lg">News Feed</h2>
        </div>
        {hyperLocalNews.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {hyperLocalNews.length} local
          </span>
        )}
      </div>

      {news.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No news available</p>
          <p className="text-xs mt-2">Set your location to see personalized news</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Show hyper-local news first */}
          {hyperLocalNews.length > 0 && (
            <div className="space-y-4">
              {hyperLocalNews.map((article) => (
                <div key={article.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                  <NewsPostCard
                    news={article}
                    variant="widget"
                    onActionTaken={(newsId: string, actionType: string) => {
                      console.log(`Action ${actionType} taken on news ${newsId}`);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Show other tiers */}
          {otherNews.length > 0 && hyperLocalNews.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-3">Regional & Beyond</p>
              <div className="space-y-4">
                {otherNews.map((article) => (
                  <div key={article.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                    <NewsPostCard
                      news={article}
                      variant="widget"
                      onActionTaken={(newsId: string, actionType: string) => {
                        console.log(`Action ${actionType} taken on news ${newsId}`);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show all if no hyper-local */}
          {otherNews.length > 0 && hyperLocalNews.length === 0 && (
            <div className="space-y-4">
              {otherNews.map((article) => (
                <div key={article.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                  <NewsPostCard
                    news={article}
                    variant="widget"
                    onActionTaken={(newsId: string, actionType: string) => {
                      console.log(`Action ${actionType} taken on news ${newsId}`);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {onShowMore && (
            <div className="text-center pt-4 border-t">
              <button
                onClick={onShowMore}
                className="text-sm font-semibold text-primary hover:underline"
              >
                {showMore ? 'Show Less' : 'Show More'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}