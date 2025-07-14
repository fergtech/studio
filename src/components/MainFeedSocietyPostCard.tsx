import React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MainFeedSocietyPostCardProps {
  post: {
    id: string;
    type: string;
    content: string;
    createdAt: string | Date;
    imageUrl?: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
    society: {
      id: string;
      name: string;
      image?: string;
    };
  };
}

export function MainFeedSocietyPostCard({ post }: MainFeedSocietyPostCardProps) {
  const postTime = typeof post.createdAt === 'string'
    ? new Date(post.createdAt).toLocaleString()
    : post.createdAt.toLocaleString();

  // Handler for card click (except on interactive elements)
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('a, button, [role="button"], input, textarea');
    if (!isInteractive) {
      window.location.href = `/posts/${post.id}`;
    }
  };

  // Handler for user click
  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/profile/${post.user.id}`;
  };

  return (
    <div
      className="relative mb-4 rounded-lg overflow-hidden shadow-lg flex flex-col text-card-foreground bg-background cursor-pointer aspect-[9/12] hover:ring-2 hover:ring-primary/60 transition group w-full max-w-[500px]"
      onClick={handleCardClick}
    >
      {/* Background image if present */}
      {post.imageUrl && (
        <div className="absolute inset-0 z-0">
          <img src={post.imageUrl} alt="Post image" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 z-10" />
        </div>
      )}
      {/* Content Layer */}
      <div className="relative z-20 flex flex-col flex-grow p-4 h-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div onClick={handleUserClick} className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.user?.image || undefined} alt={post.user?.name || 'User'} />
              <AvatarFallback>{post.user?.name?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold hover:underline">{post.user?.name || 'Unknown'}</span>
          </div>
          <span className="text-xs text-muted-foreground ml-auto">{postTime}</span>
        </div>
        {/* Post type badge */}
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted mb-2 w-fit">{post.type}</span>
        {/* Spacer to push bottom overlay down */}
        <div className="flex-grow" />
        {/* Bottom left overlay: caption and society badge */}
        <div className="absolute left-0 bottom-0 z-30 p-4 flex flex-col items-start w-full pointer-events-none">
          {/* Post caption */}
          <div className="mb-2 pointer-events-auto">
            <p className="text-base font-medium whitespace-pre-wrap text-left px-2 bg-black/70 rounded-md py-1 w-fit max-w-[80%] text-white" style={{marginLeft: 0}}>{post.content}</p>
          </div>
          {/* Society badge */}
          {post.society && (
            <Link
              href={`/societies/${post.society.id}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition w-fit pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {post.society.image && <Avatar className="h-5 w-5"><AvatarImage src={post.society.image} alt={post.society.name} /><AvatarFallback>{post.society.name?.[0]?.toUpperCase() || '?'}</AvatarFallback></Avatar>}
              {post.society.name}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 