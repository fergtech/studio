'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DynamicIcon } from './DynamicIcon';

// Map topic names to icon names (reverse of iconNameToTopic)
function getIconForTopic(topicName: string): { name: string } {
  const topicToIcon: Record<string, string> = {
    'housing': 'Home',
    'transportation': 'Car',
    'transit': 'Bus',
    'aviation': 'Plane',
    'cycling': 'Bike',
    'rail': 'Train',
    'environment': 'Leaf',
    'parks': 'TreePine',
    'waste': 'Recycle',
    'energy': 'Sun',
    'utilities': 'Droplets',
    'business': 'Store',
    'employment': 'Briefcase',
    'economy': 'DollarSign',
    'education': 'GraduationCap',
    'healthcare': 'Hospital',
    'safety': 'Shield',
    'justice': 'Scale',
    'community': 'Users',
    'development': 'Building',
    'infrastructure': 'Hammer',
    'technology': 'Wifi',
    'media': 'Camera',
    'arts': 'Music',
    'recreation': 'Gamepad2',
    'general': 'Hash'
  };

  return { name: topicToIcon[topicName.toLowerCase()] || 'Hash' };
}

interface TopicCardProps {
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

export function TopicCard({ topic, count, category, latestPost }: TopicCardProps) {
  const hasMedia = latestPost?.thumbnail?.url;
  const isVideo = latestPost?.thumbnail?.type?.toLowerCase() === 'video';
  const iconName = getIconForTopic(topic).name;

  return (
    <Link
      href={`/topics/${encodeURIComponent(topic)}`}
      className="group relative block rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all hover:shadow-lg"
    >
      {/* Thumbnail or Icon Background */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-muted to-muted/50">
        {hasMedia ? (
          // Show post thumbnail (video or image)
          <>
            {isVideo ? (
              // For videos, show video element with poster
              <video
                src={latestPost.thumbnail!.url}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                muted
                playsInline
              />
            ) : (
              // For images, use Next Image
              <Image
                src={latestPost.thumbnail!.url}
                alt={topic}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            )}
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </>
        ) : (
          // Fallback to icon with gradient
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <DynamicIcon
              name={iconName}
              size={64}
              className="text-primary/40 group-hover:text-primary/60 transition-colors"
              strokeWidth={1.5}
            />
          </div>
        )}

        {/* Content overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 z-10">
          {/* Topic name and count */}
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-semibold text-sm capitalize ${
              hasMedia ? 'text-white' : 'text-foreground'
            }`}>
              {topic}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              hasMedia
                ? 'bg-white/20 text-white backdrop-blur-sm'
                : 'bg-primary/10 text-primary'
            }`}>
              {count}
            </span>
          </div>

          {/* Preview text (only if has media) */}
          {hasMedia && latestPost && (
            <p className="text-xs text-white/80 line-clamp-2">
              {latestPost.content}
            </p>
          )}
        </div>

        {/* Author badge (only if has media) */}
        {hasMedia && latestPost && (
          <div className="absolute top-2 right-2 z-10">
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
              {latestPost.author.image && (
                <Image
                  src={latestPost.author.image}
                  alt={latestPost.author.name}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
              )}
              <span className="text-xs text-white/90">
                @{latestPost.author.username}
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
