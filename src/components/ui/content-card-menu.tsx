'use client';

import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Share2, Bookmark, Flag, Trash2, Edit, ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ShareSheet } from '@/components/ShareSheet';
import { SocialShareDialog } from '@/components/social/SocialShareDialog';
import type { ContentType } from '@/types/social';

interface ContentCardMenuProps {
  itemId: string;
  itemType: 'society' | 'post' | 'idea' | 'issue' | 'initiative' | 'battle' | 'debate';
  itemName?: string;
  isCreator?: boolean;
  onEdit?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  shareUrl?: string;
}

export function ContentCardMenu({
  itemId,
  itemType,
  itemName,
  isCreator = false,
  onEdit,
  onDelete,
  shareUrl,
}: ContentCardMenuProps) {
  const { toast } = useToast();
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showSocialShare, setShowSocialShare] = useState(false);

  const handleShare = () => {
    setShowShareSheet(true);
  };

  const handleCreateImage = () => {
    setShowSocialShare(true);
  };

  const handleSave = () => {
    toast({ title: "Save feature coming soon!" });
  };

  const handleReport = () => {
    toast({ title: "Report feature coming soon!" });
  };

  const url = shareUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/${itemType}s/${itemId}`;

  // Map itemType to ContentType for social sharing
  // Only allow branded image sharing for content types that support it
  const contentType: ContentType | null =
    itemType === 'post' ? 'post' :
    itemType === 'idea' ? 'idea' :
    itemType === 'issue' ? 'issue' :
    itemType === 'initiative' ? 'initiative' :
    itemType === 'debate' ? 'debate' :
    null;

  const canCreateImage = contentType !== null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
          {canCreateImage && (
            <DropdownMenuItem onClick={handleCreateImage}>
              <ImagePlus className="h-4 w-4 mr-2" />
              Create Shareable Image
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSave}>
            <Bookmark className="h-4 w-4 mr-2" />
            Save
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleReport}>
            <Flag className="h-4 w-4 mr-2" />
            Report
          </DropdownMenuItem>
          {isCreator && (onEdit || onDelete) && (
            <>
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Share Sheet */}
      <ShareSheet
        isOpen={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        url={url}
        title={itemName || `Check out this ${itemType}`}
        description={`Interesting ${itemType} on Society Plus`}
        contentType={itemType}
      />

      {/* Branded Image Creator Dialog */}
      {canCreateImage && contentType && (
        <SocialShareDialog
          open={showSocialShare}
          onOpenChange={setShowSocialShare}
          contentType={contentType}
          contentId={itemId}
          contentTitle={itemName || `${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}
        />
      )}
    </>
  );
}
