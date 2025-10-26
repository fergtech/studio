'use client';

import React from 'react';
import { MobileFeedCard } from './MobileFeedCard';
import { GeneralPost } from '@/lib/types';

/**
 * Temporary wrapper to convert Ideas/Issues/Initiatives to GeneralPost format
 * for display in MobileFeedCard until we create dedicated mobile cards
 */

interface MobileFeedCardWrapperProps {
  item: any;
  type: 'idea' | 'issue' | 'initiative' | 'post';
  currentUserId?: string;
  onIssueClick?: (issue: any) => void;
  onIdeaClick?: (idea: any) => void;
}

export function MobileFeedCardWrapper({ item, type, currentUserId, onIssueClick, onIdeaClick }: MobileFeedCardWrapperProps) {
  // Handle specialized click handlers for issues and ideas
  const handleClick = () => {
    if (type === 'issue' && onIssueClick) {
      onIssueClick(item);
      return;
    }
    if (type === 'idea' && onIdeaClick) {
      onIdeaClick(item);
      return;
    }
    // For other types, fall through to normal MobileFeedCard handling
  };

  // Convert any content type to GeneralPost format for MobileFeedCard
  const convertedPost: GeneralPost = {
    id: item.id,
    creatorId: item.creatorId || item.creator?.id,
    creatorName: item.creatorName || item.creator?.name || 'Anonymous',
    creatorAvatar: item.creatorAvatar || item.creator?.image,
    content: type === 'post' ? item.content : `${item.title}\n\n${item.description || ''}`,
    topics: item.topics || item.tags || [],
    timestamp: item.timestamp || item.createdAt,
    background: item.background,
    linkedInitiativeId: item.linkedInitiativeId,
    media: item.media || [],
  };

  return (
    <MobileFeedCard 
      post={convertedPost} 
      currentUserId={currentUserId} 
      onPostClick={(type === 'issue' || type === 'idea') ? handleClick : undefined}
    />
  );
}
