"use client";

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AzureAvatar } from '@/components/ui/azure-image';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, TrendingUp, Play, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper function to detect video files
const isVideoFile = (url: string) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

// Helper function to detect audio files
const isAudioFile = (url: string) => {
  if (!url) return false;
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
  const lowerUrl = url.toLowerCase();
  return audioExtensions.some(ext => lowerUrl.includes(ext));
};

interface DebateTopicCardProps {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  creator: {
    id: string;
    name: string;
    image?: string;
    username?: string;
  };
  createdAt: Date | string;
  stats: {
    proVotes: number;
    conVotes: number;
    totalVotes: number;
    proPercentage: number;
    conPercentage: number;
    argumentCount: number;
  };
  className?: string;
}

export function DebateTopicCard({
  id,
  title,
  content,
  imageUrl,
  creator,
  createdAt,
  stats,
  className,
}: DebateTopicCardProps) {
  const timeAgo = formatDistanceToNow(
    typeof createdAt === 'string' ? new Date(createdAt) : createdAt,
    { addSuffix: true }
  );

  // Truncate content for preview
  const truncatedContent = content.length > 120 
    ? content.substring(0, 120) + '...' 
    : content;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Determine media type
  const hasMedia = imageUrl;
  const isVideo = hasMedia && isVideoFile(imageUrl);
  const isAudio = hasMedia && isAudioFile(imageUrl);
  const isImage = hasMedia && !isVideo && !isAudio;

  return (
    <Link href={`/debates/${id}`}>
      <div className={cn(
        "bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer",
        "hover:border-primary/20 hover:-translate-y-0.5 relative",
        className
      )}>
        {/* Background Image */}
        {isImage && (
          <div className="absolute inset-0 z-0">
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
            <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay for text readability */}
          </div>
        )}

        {/* Video Preview */}
        {isVideo && (
          <div className="absolute inset-0 z-0">
            <video
              src={imageUrl}
              className="w-full h-full object-cover"
              style={{ 
                maxHeight: '100%',
                pointerEvents: 'none' // Video won't capture any events
              }}
              muted={true}
              preload="metadata"
            />
            <div className="absolute inset-0 bg-black/60" /> {/* Dark overlay for text readability */}
            {/* Play Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-black/60 rounded-full p-3 backdrop-blur-sm">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
          </div>
        )}

        {/* Audio Background */}
        {isAudio && (
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600" />
            <div className="absolute inset-0 bg-black/40" /> {/* Dark overlay for text readability */}
            {/* Audio Icon Overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-black/60 rounded-full p-3 backdrop-blur-sm">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )}
        
        <div className={cn(
          "relative z-10 p-4",
          hasMedia && "text-white"
        )}>
        {/* Header with creator info */}
        <div className="flex items-center gap-3 mb-3">
          {creator.image ? (
            <AzureAvatar 
              src={creator.image}
              alt={creator.name} 
              size={32}
              className="w-8 h-8"
            />
          ) : (
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">
                {getInitials(creator.name)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{creator.name}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Debate
          </Badge>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base mb-2 line-clamp-2 leading-tight">
          {title}
        </h3>

        {/* Content preview */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
          {truncatedContent}
        </p>

        {/* Progress bar for PRO vs CON */}
        {stats.totalVotes > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span className="text-green-600 font-medium">
                PRO {stats.proPercentage}%
              </span>
              <span className="text-red-600 font-medium">
                CON {stats.conPercentage}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div className="h-full flex">
                <div 
                  className="bg-green-500 transition-all duration-300"
                  style={{ width: `${stats.proPercentage}%` }}
                />
                <div 
                  className="bg-red-500 transition-all duration-300"
                  style={{ width: `${stats.conPercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {stats.totalVotes === 0 && (
          <div className="mb-3">
            <div className="w-full bg-muted rounded-full h-2">
              <div className="h-full bg-gray-300" />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              No votes yet - be the first to weigh in!
            </p>
          </div>
        )}

        {/* Stats footer */}
        <div className={cn(
          "flex items-center justify-between text-xs",
          hasMedia ? "text-white/80" : "text-muted-foreground"
        )}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{stats.totalVotes} votes</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>{stats.argumentCount} arguments</span>
            </div>
          </div>
          {(stats.totalVotes > 50 || stats.argumentCount > 20) && (
            <div className={cn(
              "flex items-center gap-1",
              hasMedia ? "text-orange-300" : "text-orange-600"
            )}>
              <TrendingUp className="w-3 h-3" />
              <span>Hot</span>
            </div>
          )}
        </div>
        </div>
      </div>
    </Link>
  );
}