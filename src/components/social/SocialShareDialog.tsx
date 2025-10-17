'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SocialPreview } from './SocialPreview';
import { PlatformSelector } from './PlatformSelector';
import { Loader2, Download } from 'lucide-react';
import type { ContentType, SocialPlatform } from '@/types/social';

interface SocialShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: ContentType;
  contentId: string;
  contentTitle: string;
}

export function SocialShareDialog({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentTitle,
}: SocialShareDialogProps) {
  const { toast } = useToast();
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [customCaption, setCustomCaption] = useState('');
  const [imageSize, setImageSize] = useState<'story' | 'feed' | 'facebook'>('feed');
  const [isPosting, setIsPosting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = async () => {
    try {
      const imageUrl = `/api/social/generate-image?contentType=${contentType}&contentId=${contentId}&size=${imageSize}`;

      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to generate image');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${contentType}-${contentId}-${imageSize}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Image downloaded!',
        description: 'You can now upload it to your social media.',
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: 'Download failed',
        description: 'Could not download the image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: 'No platforms selected',
        description: 'Please select at least one platform to share to.',
        variant: 'destructive',
      });
      return;
    }

    setIsPosting(true);

    try {
      const response = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId,
          platforms: selectedPlatforms,
          customCaption: customCaption.trim() || undefined,
          imageSize,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to share content');
      }

      const data = await response.json();

      // Show results
      const successCount = data.results.filter((r: any) => r.success).length;
      const failCount = data.results.length - successCount;

      if (successCount > 0) {
        toast({
          title: `Shared to ${successCount} platform${successCount > 1 ? 's' : ''}!`,
          description: failCount > 0
            ? `${failCount} platform${failCount > 1 ? 's' : ''} failed. Check your connected accounts.`
            : 'Your content has been successfully shared.',
        });
      } else {
        toast({
          title: 'Sharing failed',
          description: 'Could not share to any platforms. Please check your connected accounts.',
          variant: 'destructive',
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error sharing content:', error);
      toast({
        title: 'Error sharing content',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Share to Social Media</DialogTitle>
          <DialogDescription>
            Share "{contentTitle}" to your connected social media accounts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto pr-2">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Select Platforms</Label>
            <PlatformSelector
              selected={selectedPlatforms}
              onChange={setSelectedPlatforms}
            />
          </div>

          {/* Image Size */}
          <div className="space-y-2">
            <Label>Image Format</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={imageSize === 'story' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImageSize('story')}
              >
                Story (9:16)
              </Button>
              <Button
                type="button"
                variant={imageSize === 'feed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImageSize('feed')}
              >
                Feed (1:1)
              </Button>
              <Button
                type="button"
                variant={imageSize === 'facebook' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImageSize('facebook')}
              >
                Facebook (1.91:1)
              </Button>
            </div>
          </div>

          {/* Custom Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Custom Caption (Optional)</Label>
            <Textarea
              id="caption"
              placeholder="Add a custom message for your post..."
              value={customCaption}
              onChange={(e) => setCustomCaption(e.target.value)}
              rows={3}
              maxLength={2200}
            />
            <p className="text-xs text-muted-foreground">
              {customCaption.length}/2200 characters
            </p>
          </div>

          {/* Preview Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="w-full"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>

          {/* Preview */}
          {showPreview && (
            <SocialPreview
              contentType={contentType}
              contentId={contentId}
              size={imageSize}
            />
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              disabled={isPosting}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Image
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPosting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleShare}
                disabled={isPosting || selectedPlatforms.length === 0}
              >
                {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPosting ? 'Sharing...' : 'Share Now'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
