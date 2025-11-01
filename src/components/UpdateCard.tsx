"use client";

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { MoreHorizontal, MessageSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AudioPlayer } from '@/components/ui/audio-player';
import { LinkPreview } from '@/components/ui/link-preview';
import { DocumentPreview } from '@/components/ui/document-preview';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Helper functions
const isVideoFile = (url: string) => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

const isAudioFile = (url: string) => {
  if (!url) return false;
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
  const lowerUrl = url.toLowerCase();
  return audioExtensions.some(ext => lowerUrl.includes(ext));
};

interface UpdateCardProps {
  update: any;
  currentUserId?: string;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (id: string, content: string) => Promise<void>;
  onResponse?: (parentUpdateId: string, parentContent: string) => void;
}

export function UpdateCard({ update, currentUserId, onDelete, onEdit, onResponse }: UpdateCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showResponses, setShowResponses] = useState(false);

  const isOwner = currentUserId === update.userId;

  // Parse links, documents, and response data from details JSON
  const details = update.details as any;
  const links = details?.links || [];
  const documents = details?.documents || [];
  const parentUpdateId = details?.parentUpdateId;
  const parentContent = details?.parentContent;
  const isResponse = !!parentUpdateId;

  // Get media URL from media array
  const mediaUrl = update.media?.[0]?.url;
  const mediaType = update.media?.[0]?.type;

  const handleDelete = async () => {
    if (!onDelete || !confirm('Are you sure you want to delete this update?')) return;
    setIsDeleting(true);
    try {
      await onDelete(update.id);
    } catch (error) {
      console.error('Error deleting update:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-card mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar
            className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
            onClick={() => router.push(`/profile/${update.user?.id}`)}
          >
            <AvatarImage src={update.user?.image || ''} alt={update.user?.name || 'User'} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {update.user?.name?.substring(0, 2).toUpperCase() || '??'}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className="font-semibold text-sm hover:underline cursor-pointer"
                onClick={() => router.push(`/profile/${update.user?.id}`)}
              >
                {update.user?.name || 'Unknown'}
              </span>
              <Badge variant="secondary" className="text-xs h-5 px-2">Update</Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Actions Menu */}
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Update'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Response Indicator */}
      {isResponse && parentContent && (
        <div className="mb-3 px-3 py-2 bg-muted/50 rounded-md border-l-2 border-primary/40">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground font-medium">Response to:</span>
              <p className="text-xs text-muted-foreground italic line-clamp-2 mt-0.5">
                "{parentContent}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="whitespace-pre-line text-sm mb-2">{update.content}</div>

      {/* Media Display */}
      {mediaUrl && (
        <div className="my-2">
          {mediaType === 'video' || isVideoFile(mediaUrl) ? (
            <video
              src={mediaUrl}
              controls
              className="w-full max-h-96 rounded border bg-black"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : mediaType === 'audio' || isAudioFile(mediaUrl) ? (
            <AudioPlayer
              src={mediaUrl}
              className="w-full"
            />
          ) : (
            <Image
              src={mediaUrl}
              alt="Update media"
              width={800}
              height={400}
              className="rounded border w-full object-cover"
            />
          )}
        </div>
      )}

      {/* Links Display */}
      {links.length > 0 && (
        <div className="my-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Links ({links.length})
            </span>
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-2"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
            }}
          >
            {links.map((link: any, index: number) => (
              <div key={index} className="flex-shrink-0 w-80">
                <LinkPreview
                  metadata={{
                    url: link.url,
                    title: link.title,
                    description: link.description,
                    image: link.imageUrl,
                    siteName: link.siteName
                  }}
                  compact={true}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Display */}
      {documents.length > 0 && (
        <div className="my-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Documents ({documents.length})
            </span>
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-2"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
            }}
          >
            {documents.map((doc: any, index: number) => (
              <div key={index} className="flex-shrink-0 w-80">
                <DocumentPreview
                  metadata={doc}
                  compact={true}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simple Interactions */}
      <div className="flex items-center gap-4 py-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (onResponse) {
              onResponse(update.id, update.content);
            }
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-2 h-8"
        >
          <MessageSquare size={16} />
          <span>Respond</span>
        </Button>
      </div>
    </div>
  );
}
