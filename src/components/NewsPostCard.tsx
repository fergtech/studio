"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Newspaper,
  ExternalLink,
  Clock,
  MapPin,
  AlertTriangle,
  Users,
  MessageSquare,
  Lightbulb,
  Target,
  Bug,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useModal } from '@/context/ModalContext';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';

interface NewsPost {
  id: string;
  title: string;
  summary: string;
  excerpt?: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: Date;
  location?: string;
  city?: string;
  urgencyLevel: number;
  tags: string[];
  createdAt: Date;
}

interface NewsPostCardProps {
  news: NewsPost;
  variant?: 'feed' | 'widget' | 'full';
  onActionTaken?: (newsId: string, actionType: string) => void;
}

export function NewsPostCard({
  news,
  variant = 'feed',
  onActionTaken
}: NewsPostCardProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const {
    openCreateInitiativeModal,
    openCreateIdeaModal,
    openCreateIssueModal,
    openCreateGeneralPostModal
  } = useModal();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreatingAction, setIsCreatingAction] = useState(false);

  const isCompact = variant === 'widget';
  const isFullDisplay = variant === 'full';

  // Determine urgency styling
  const getUrgencyStyles = (level: number) => {
    switch (level) {
      case 3: // Breaking/High
        return {
          borderColor: 'border-red-500/30',
          bgColor: 'bg-red-50/50',
          badgeVariant: 'destructive' as const,
          icon: <AlertTriangle className="h-4 w-4" />,
          text: 'Breaking News'
        };
      case 2: // Important/Medium
        return {
          borderColor: 'border-orange-500/30',
          bgColor: 'bg-orange-50/50',
          badgeVariant: 'default' as const,
          icon: <Clock className="h-4 w-4" />,
          text: 'Important'
        };
      default: // Normal/Low (1)
        return {
          borderColor: 'border-gray-200',
          bgColor: 'bg-gray-50/20',
          badgeVariant: 'secondary' as const,
          icon: <Newspaper className="h-4 w-4" />,
          text: 'News'
        };
    }
  };

  const urgencyStyle = getUrgencyStyles(news.urgencyLevel);

  // Handle creating action based on news
  const handleCreateAction = async (actionType: 'idea' | 'issue' | 'initiative' | 'general_post') => {
    if (!session?.user?.id) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create content based on this news",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingAction(true);

    try {
      // Track the news action
      await fetch('/api/news/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newsPostId: news.id,
          actionType,
        }),
      });

      // Pre-populate the creation modal with news context
      const newsContext = {
        inspiration: `Based on: ${news.title}`,
        sourceUrl: news.sourceUrl,
        newsId: news.id,
        location: news.location,
        city: news.city,
      };

      // Open the appropriate modal
      switch (actionType) {
        case 'idea':
          openCreateIdeaModal(newsContext);
          break;
        case 'issue':
          openCreateIssueModal(newsContext);
          break;
        case 'initiative':
          openCreateInitiativeModal(newsContext);
          break;
        case 'general_post':
          openCreateGeneralPostModal(newsContext);
          break;
      }

      onActionTaken?.(news.id, actionType);

      toast({
        title: "Action started! 🚀",
        description: `Creating ${actionType} based on this news story`,
      });
    } catch (error) {
      console.error('Error tracking news action:', error);
      toast({
        title: "Error",
        description: "Failed to track action, but you can still create content",
        variant: "destructive"
      });
    } finally {
      setIsCreatingAction(false);
    }
  };

  // Compact widget version
  if (isCompact) {
    return (
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md",
        urgencyStyle.borderColor,
        urgencyStyle.bgColor
      )}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* News image thumbnail */}
            {news.imageUrl && (
              <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                <Image
                  src={news.imageUrl}
                  alt={news.title}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    // Hide image container if failed to load
                    const target = e.target as HTMLImageElement;
                    const container = target.parentElement;
                    if (container) {
                      container.style.display = 'none';
                    }
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <div className="flex-shrink-0">
                  {urgencyStyle.icon}
                </div>
                <h3 className="text-sm font-medium line-clamp-2 flex-1">
                  {news.title}
                </h3>
                {/* External link button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 w-6 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(news.sourceUrl, '_blank', 'noopener,noreferrer');
                  }}
                  title="Read full article"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground overflow-hidden mb-2">
                <span className="truncate">{news.source}</span>
                {news.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{news.city}</span>
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="flex-shrink-0">{formatDistanceToNow(news.publishedAt)} ago</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateAction('idea');
                  }}
                  disabled={isCreatingAction}
                  title="Create idea based on this news"
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Idea
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateAction('issue');
                  }}
                  disabled={isCreatingAction}
                  title="Report issue based on this news"
                >
                  <Bug className="h-3 w-3 mr-1" />
                  Issue
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateAction('initiative');
                  }}
                  disabled={isCreatingAction}
                  title="Create initiative based on this news"
                >
                  <Target className="h-3 w-3 mr-1" />
                  Initiative
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg",
      urgencyStyle.borderColor,
      urgencyStyle.bgColor
    )}>
      {/* Header with source and urgency */}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-600">BREAKING NEWS</span>
          </div>
          <Badge variant={urgencyStyle.badgeVariant} className="flex items-center gap-1">
            {urgencyStyle.icon}
            {urgencyStyle.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* News image */}
        {news.imageUrl && (
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={news.imageUrl}
              alt={news.title}
              fill
              className="object-cover"
              onError={(e) => {
                // Fallback to a news-themed image from Unsplash
                const target = e.target as HTMLImageElement;
                if (target.src !== news.imageUrl) return; // Prevent infinite loops

                const fallbackUrl = `https://source.unsplash.com/800x400/?news,${encodeURIComponent(news.title.slice(0, 20))}`;
                target.src = fallbackUrl;
              }}
            />
          </div>
        )}

        {/* News title */}
        <div>
          <h2 className="text-lg font-bold leading-tight mb-2">
            {news.title}
          </h2>

          {/* News summary */}
          <p className={cn(
            "text-muted-foreground",
            isExpanded ? "" : "line-clamp-3"
          )}>
            {news.summary || 'No summary available'}
          </p>

          {/* Excerpt if available and expanded */}
          {isExpanded && news.excerpt && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              {news.excerpt}
            </p>
          )}

          {/* Expand/collapse button */}
          {news.summary && news.summary.length > 150 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-800"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Read more
                </>
              )}
            </Button>
          )}
        </div>

        {/* Tags */}
        {news.tags && news.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {news.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Source and location info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="font-medium">{news.source}</span>
            {news.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {news.location}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(news.publishedAt)} ago
          </div>
        </div>

        {/* Action buttons - Create content based on news */}
        {session?.user?.id && (
          <div className="border-t pt-4">
            <div className="mb-2">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Turn this news into action:
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateAction('idea')}
                disabled={isCreatingAction}
                className="flex items-center gap-2 justify-start"
              >
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                <span>Create Idea</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateAction('issue')}
                disabled={isCreatingAction}
                className="flex items-center gap-2 justify-start"
              >
                <Bug className="h-4 w-4 text-red-600" />
                <span>Report Issue</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateAction('initiative')}
                disabled={isCreatingAction}
                className="flex items-center gap-2 justify-start"
              >
                <Target className="h-4 w-4 text-green-600" />
                <span>Start Initiative</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreateAction('general_post')}
                disabled={isCreatingAction}
                className="flex items-center gap-2 justify-start"
              >
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span>Discuss</span>
              </Button>
            </div>
          </div>
        )}

        {/* Read full article link */}
        <div className="flex items-center justify-between border-t pt-4">
          <Link
            href={news.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Read full article
          </Link>

          {!session?.user?.id && (
            <Button variant="link" size="sm" className="text-muted-foreground">
              Sign in to take action
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}