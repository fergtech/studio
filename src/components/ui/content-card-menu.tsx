'use client';

import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Share2, Bookmark, Flag, Trash2, Instagram } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SocialShareDialog } from '@/components/social/SocialShareDialog';
import type { ContentType } from '@/types/social';

interface ContentCardMenuProps {
  itemId: string;
  itemType: 'society' | 'post' | 'idea' | 'issue' | 'initiative' | 'battle';
  itemName?: string;
  isCreator?: boolean;
  onDelete?: () => void | Promise<void>;
  shareUrl?: string;
}

export function ContentCardMenu({
  itemId,
  itemType,
  itemName,
  isCreator = false,
  onDelete,
  shareUrl,
}: ContentCardMenuProps) {
  const { toast } = useToast();
  const [showSocialShare, setShowSocialShare] = useState(false);

  const handleShare = async () => {
    const url = shareUrl || `${window.location.origin}/${itemType}s/${itemId}`;
    const shareData = {
      title: itemName || `Check out this ${itemType}`,
      text: itemName ? `${itemName} on Society Plus` : `Interesting ${itemType} on Society Plus`,
      url: url,
    };

    // Try native Web Share API first (works on mobile and some desktop browsers)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log('Shared successfully via Web Share API');
        toast({
          title: "✅ Shared!",
          description: `Thanks for sharing this ${itemType}`,
          duration: 3000,
          className: "bg-green-600 text-white border-green-700",
        });
        return;
      } catch (error: any) {
        // User cancelled or error occurred
        if (error.name === 'AbortError') {
          console.log('Share cancelled by user');
          return;
        }
        console.log('Web Share API failed, falling back to clipboard', error);
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url);
      console.log('Link copied to clipboard:', url);
      toast({
        title: "✅ Link Copied!",
        description: `Share this ${itemType} with others`,
        duration: 4000,
        className: "bg-green-600 text-white border-green-700",
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Last resort fallback: show the URL
      toast({
        title: "📋 Copy This Link",
        description: url,
        duration: 8000,
        className: "bg-blue-600 text-white border-blue-700",
      });
    }
  };

  const handleSocialShare = () => {
    setShowSocialShare(true);
  };

  const handleSave = () => {
    toast({ title: "Save feature coming soon!" });
  };

  const handleReport = () => {
    toast({ title: "Report feature coming soon!" });
  };

  // Map itemType to ContentType for social sharing
  // Only allow social sharing for content types that support it
  const contentType: ContentType | null =
    itemType === 'post' ? 'post' :
    itemType === 'idea' ? 'idea' :
    itemType === 'issue' ? 'issue' :
    itemType === 'initiative' ? 'initiative' :
    null;

  const canShareToSocial = contentType !== null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Link
          </DropdownMenuItem>
          {canShareToSocial && (
            <DropdownMenuItem onClick={handleSocialShare}>
              <Instagram className="h-4 w-4 mr-2" />
              Share to Social Media
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
          {isCreator && onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Social Share Dialog */}
      {canShareToSocial && contentType && (
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
