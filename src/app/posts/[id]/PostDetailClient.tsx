"use client";
import { formatDistanceToNow, parseISO } from 'date-fns';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import PostSocialPanel from '@/components/PostSocialPanel';

interface MediaItem {
  type: string;
  url: string;
}

interface PostDetailClientProps {
  id: string;
  content: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string | null;
  media?: MediaItem[];
  timestamp: string | Date;
  currentUserId?: string | null;
}

export default function PostDetailClient({
  id,
  content,
  creatorId,
  creatorName,
  creatorAvatar,
  media,
  timestamp,
  currentUserId = null,
}: PostDetailClientProps) {
  // Time-ago formatting
  const postTime = timestamp
    ? formatDistanceToNow(typeof timestamp === 'string' ? parseISO(timestamp) : timestamp, { addSuffix: true })
    : 'Just now';

  // Media (only images for now)
  const hasImage = media && media.length > 0 && media[0].type === 'image';
  const imageUrl = hasImage ? media[0].url : null;

  return (
    <div className="flex flex-col md:flex-row max-w-4xl mx-auto py-10 px-2 md:space-x-8">
      {/* Main Post Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-card rounded-lg shadow p-6 mb-4">
          {/* Author Row */}
          <div className="flex items-center mb-4">
            <Link href={`/profile/${creatorId}`} className="flex items-center gap-2 hover:underline">
              <Avatar className="w-9 h-9">
                {creatorAvatar ? (
                  <AvatarImage src={creatorAvatar} alt={creatorName || 'User'} />
                ) : (
                  <AvatarFallback>{creatorName?.substring(0,2).toUpperCase() || '??'}</AvatarFallback>
                )}
              </Avatar>
              <span className="font-medium text-base">{creatorName}</span>
            </Link>
            <span className="mx-2 text-gray-400">·</span>
            <span className="text-xs text-gray-400">{postTime}</span>
          </div>
          {/* Image */}
          {imageUrl && (
            <div className="mb-4">
              <img src={imageUrl} alt="Post media" className="rounded-lg max-h-96 w-full object-cover" />
            </div>
          )}
          {/* Content */}
          <div className="text-lg whitespace-pre-line break-words">{content}</div>
        </div>
      </div>
      {/* Side Panel: Comments + Social Actions */}
      <div className="w-full md:w-[340px] flex-shrink-0">
        <PostSocialPanel postId={id} currentUserId={currentUserId} />
      </div>
    </div>
  );
} 