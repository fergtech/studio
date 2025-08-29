'use client';

import React, { useState } from 'react';
import { ExternalLink, Globe, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface LinkMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  type?: string;
}

interface LinkPreviewProps {
  metadata: LinkMetadata;
  compact?: boolean;
  className?: string;
  showRemove?: boolean;
  onRemove?: () => void;
  editable?: boolean;
}

export function LinkPreview({
  metadata,
  compact = false,
  className = '',
  showRemove = false,
  onRemove,
  editable = false
}: LinkPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  
  const handleClick = () => {
    if (!editable) {
      window.open(metadata.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleFaviconError = () => {
    setFaviconError(true);
  };

  // Truncate text for display
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get domain from URL for display
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  };

  if (compact) {
    return (
      <div 
        className={`relative border rounded-lg p-3 bg-card hover:bg-muted/50 transition-colors cursor-pointer ${className}`}
        onClick={handleClick}
      >
        {showRemove && onRemove && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1 right-1 h-6 w-6 p-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        
        <div className="flex items-center gap-3">
          {/* Favicon */}
          <div className="flex-shrink-0">
            {metadata.favicon && !faviconError ? (
              <Image
                src={metadata.favicon}
                alt="Site favicon"
                width={16}
                height={16}
                className="rounded"
                onError={handleFaviconError}
              />
            ) : (
              <Globe className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {metadata.title || getDomain(metadata.url)}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {getDomain(metadata.url)}
            </div>
          </div>
          
          {/* External link icon */}
          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative border rounded-lg overflow-hidden bg-card hover:bg-muted/50 transition-colors ${!editable ? 'cursor-pointer' : ''} ${className}`}
      onClick={handleClick}
    >
      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 z-10 bg-background/80 hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      
      <div className="flex">
        {/* Image section */}
        {metadata.image && !imageError && (
          <div className="w-32 h-24 flex-shrink-0 relative">
            <Image
              src={metadata.image}
              alt={metadata.title || 'Link preview'}
              fill
              className="object-cover"
              onError={handleImageError}
            />
          </div>
        )}
        
        {/* Content section */}
        <div className="flex-1 p-4 min-w-0">
          {/* Site info */}
          <div className="flex items-center gap-2 mb-2">
            {metadata.favicon && !faviconError ? (
              <Image
                src={metadata.favicon}
                alt="Site favicon"
                width={16}
                height={16}
                className="rounded"
                onError={handleFaviconError}
              />
            ) : (
              <Globe className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground truncate">
              {metadata.siteName || getDomain(metadata.url)}
            </span>
            {!editable && (
              <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto flex-shrink-0" />
            )}
          </div>
          
          {/* Title */}
          {metadata.title && (
            <h3 className="font-semibold text-sm mb-1 line-clamp-2">
              {truncateText(metadata.title, 100)}
            </h3>
          )}
          
          {/* Description */}
          {metadata.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {truncateText(metadata.description, 150)}
            </p>
          )}
          
          {/* URL */}
          <div className="mt-2 text-xs text-muted-foreground truncate">
            {truncateText(metadata.url, 60)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading state component
export function LinkPreviewLoading({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="border rounded-lg p-3 bg-card animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-muted rounded"></div>
          <div className="flex-1">
            <div className="h-4 bg-muted rounded mb-1"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card animate-pulse">
      <div className="flex">
        <div className="w-32 h-24 bg-muted flex-shrink-0"></div>
        <div className="flex-1 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-24"></div>
          </div>
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="h-3 bg-muted rounded mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

// Error state component
export function LinkPreviewError({ 
  url, 
  error, 
  onRetry, 
  onRemove 
}: { 
  url: string; 
  error: string; 
  onRetry?: () => void; 
  onRemove?: () => void; 
}) {
  return (
    <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">
            Failed to load preview
          </span>
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground mb-2">{error}</p>
      <p className="text-xs text-muted-foreground truncate mb-3">{url}</p>
      
      <div className="flex gap-2">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open(url, '_blank')}
        >
          Open Link
        </Button>
      </div>
    </div>
  );
}