import React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AzureImage, AzureAvatar } from '@/components/ui/azure-image';
import { AudioPlayer } from '@/components/ui/audio-player';
import { LinkPreview } from '@/components/ui/link-preview';
import { DocumentPreview } from '@/components/ui/document-preview';
import { Music, FileText } from 'lucide-react';

interface MainFeedSocietyPostCardProps {
  post: {
    id: string;
    type: string;
    content: string;
    createdAt: string | Date;
    imageUrl?: string;
    media?: Array<{
      type: string;
      url: string;
    }>;
    linkPreview?: {
      url: string;
      title?: string;
      description?: string;
      image?: string;
      siteName?: string;
      favicon?: string;
      type?: string;
    };
    links?: Array<{
      id: string;
      order: number;
      linkPreview: {
        url: string;
        title?: string;
        description?: string;
        image?: string;
        siteName?: string;
        favicon?: string;
        type?: string;
      };
    }>;
    documents?: Array<{
      id: string;
      order: number;
      document: {
        url: string;
        filename: string;
        fileType: string;
        fileSize: number;
        extension: string;
        title?: string;
        description?: string;
      };
    }>;
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

  // Helper function to parse issue/idea content
  const parseContent = () => {
    if (post.type === 'ISSUE' || post.type === 'IDEA') {
      // Try to parse the "Title\n\nDescription" format
      const parts = post.content.split('\n\n');
      if (parts.length >= 2) {
        return {
          title: parts[0],
          description: parts.slice(1).join('\n\n')
        };
      }
    }
    // For general posts or unparseable content, return as is
    return {
      title: null,
      description: post.content
    };
  };

  const { title, description } = parseContent();

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

  // Helper functions to detect file types
  const isVideoFile = (url: string) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.m4v'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const isAudioFile = (url: string) => {
    if (!url) return false;
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
    return audioExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  // Determine media type and URL - SocietyPost only uses imageUrl
  const hasMedia = post.imageUrl && post.imageUrl.trim();
  const mediaUrl = post.imageUrl;
  const isImage = hasMedia && mediaUrl && !isVideoFile(mediaUrl) && !isAudioFile(mediaUrl);
  const isVideo = hasMedia && mediaUrl && isVideoFile(mediaUrl);
  const isAudio = hasMedia && mediaUrl && isAudioFile(mediaUrl);
  const hasLinks = post.links && post.links.length > 0;
  const hasDocuments = post.documents && post.documents.length > 0;
  const hasSingleLink = post.linkPreview && !hasLinks;
  const hasLinkPreview = post.linkPreview && !hasMedia;
  const hasMultipleLinks = post.links && post.links.length > 0 && !hasMedia;
  
  // Use same backgroundStyle logic as GeneralPostCard
  const backgroundStyle = isImage
    ? { backgroundImage: `url(${mediaUrl})` }
    : isVideo
    ? { backgroundColor: '#000000' } // Black background for video thumbnails
    : isAudio
    ? { background: 'linear-gradient(to right, #667eea, #764ba2)' } // Purple gradient for audio
    : hasLinkPreview || hasMultipleLinks
    ? { background: 'linear-gradient(to right, #11998e, #38ef7d)' } // Green gradient for links
    : hasDocuments
    ? { background: 'linear-gradient(to right, #ff6b6b, #ffa726)' } // Orange gradient for documents
    : { background: 'linear-gradient(to right, #6a11cb, #2575fc)' }; // Default gradient

  return (
    <div
      className="relative mb-4 rounded-lg overflow-hidden shadow-lg flex flex-col text-card-foreground bg-background cursor-pointer aspect-[9/12] hover:ring-2 hover:ring-primary/60 transition group w-full max-w-[500px]"
      onClick={handleCardClick}
    >
      {/* Unified background using same logic as GeneralPostCard */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" 
        style={backgroundStyle}
      >
        {/* Special handling for videos - show actual video element for images that are videos */}
        {isVideo && mediaUrl && (
          <video 
            src={mediaUrl} 
            className="w-full h-full object-cover" 
            muted
            playsInline
            preload="metadata"
            style={{ pointerEvents: 'none' }}
            poster={`${mediaUrl}#t=0.1`}
            onLoadedData={(e) => {
              // Force mobile browsers to show first frame
              const video = e.target as HTMLVideoElement;
              if (video.videoWidth > 0) {
                video.currentTime = 0.1;
              }
            }}
          />
        )}
        {/* Special handling for audio - show music icon */}
        {isAudio && (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-16 h-16 text-white/60" />
          </div>
        )}
        {/* Special handling for documents - show document icon */}
        {hasDocuments && !hasMedia && (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-16 h-16 text-white/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 z-10" />
      </div>
      {/* Content Layer */}
      <div className="relative z-20 flex flex-col flex-grow p-4 h-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <div onClick={handleUserClick} className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {post.user?.image && post.user.image.trim() ? (
                <AvatarImage src={post.user.image} alt={post.user?.name || 'User'} />
              ) : null}
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
            {title ? (
              <div className="text-left px-2 bg-black/70 rounded-md py-1 w-fit max-w-[80%] text-white" style={{marginLeft: 0}}>
                <p className="text-lg font-bold mb-1">{title}</p>
                <p className="text-sm font-medium whitespace-pre-wrap line-clamp-3">{description}</p>
              </div>
            ) : (
              <p className="text-base font-medium whitespace-pre-wrap text-left px-2 bg-black/70 rounded-md py-1 w-fit max-w-[80%] text-white line-clamp-6" style={{marginLeft: 0}}>{description}</p>
            )}
          </div>
          
          {/* Links preview */}
          {!hasMedia && hasLinks && !hasDocuments && (
            <div className="mb-2 pointer-events-auto max-w-[90%]">
              <div className="bg-black/80 rounded-lg p-2">
                <div className="text-xs text-white/80 mb-1">Links ({post.links!.length})</div>
                <div className="text-sm text-white font-medium">
                  {post.links![0]?.linkPreview?.title || post.links![0]?.linkPreview?.url}
                </div>
                {post.links!.length > 1 && (
                  <div className="text-xs text-white/60">+{post.links!.length - 1} more</div>
                )}
              </div>
            </div>
          )}
          
          {/* Single link preview */}
          {!hasMedia && hasSingleLink && !hasDocuments && (
            <div className="mb-2 pointer-events-auto max-w-[90%]">
              <div className="bg-black/80 rounded-lg p-2">
                <div className="text-sm text-white font-medium">
                  {post.linkPreview!.title || post.linkPreview!.url}
                </div>
                {post.linkPreview!.description && (
                  <div className="text-xs text-white/60 mt-1 line-clamp-2">
                    {post.linkPreview!.description}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Documents preview */}
          {!hasMedia && hasDocuments && (
            <div className="mb-2 pointer-events-auto max-w-[90%]">
              <div className="bg-black/80 rounded-lg p-2">
                <div className="text-xs text-white/80 mb-1">Documents ({post.documents!.length})</div>
                <div className="text-sm text-white font-medium">
                  {post.documents![0]?.document?.title || post.documents![0]?.document?.filename}
                </div>
                {post.documents!.length > 1 && (
                  <div className="text-xs text-white/60">+{post.documents!.length - 1} more</div>
                )}
              </div>
            </div>
          )}
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