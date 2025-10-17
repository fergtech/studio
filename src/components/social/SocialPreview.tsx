'use client';

import { Loader2 } from 'lucide-react';
import type { ContentType } from '@/types/social';

interface SocialPreviewProps {
  contentType: ContentType;
  contentId: string;
  size: 'story' | 'feed' | 'facebook';
}

export function SocialPreview({ contentType, contentId, size }: SocialPreviewProps) {
  const imageUrl = `/api/social/generate-image?contentType=${contentType}&contentId=${contentId}&size=${size}`;

  return (
    <div className="border rounded-lg p-4 bg-muted/20">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">Preview</h4>
        <span className="text-xs text-muted-foreground">
          {size === 'story' && '1080x1920 (Stories)'}
          {size === 'feed' && '1080x1080 (Feed)'}
          {size === 'facebook' && '1200x630 (Facebook)'}
        </span>
      </div>

      <div className="relative w-full bg-muted rounded-lg overflow-hidden">
        <div className={`relative w-full ${
          size === 'story' ? 'aspect-[9/16]' :
          size === 'feed' ? 'aspect-square' :
          'aspect-[1.91/1]'
        }`}>
          {/* Loading state */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>

          {/* Image */}
          <img
            src={imageUrl}
            alt="Social media preview"
            className="absolute inset-0 w-full h-full object-cover"
            onLoad={(e) => {
              // Hide loader when image loads
              const loader = e.currentTarget.previousElementSibling;
              if (loader) loader.classList.add('hidden');
            }}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        This is how your post will appear on social media
      </p>
    </div>
  );
}
