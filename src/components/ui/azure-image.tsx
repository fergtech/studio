"use client";

import { RobustImage } from './robust-image';
import { cn } from '@/lib/utils';
import { imageMonitoring } from '@/lib/image-monitoring';

interface AzureImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: "blur" | "empty";
  sizes?: string;
  style?: React.CSSProperties;
  onLoadingComplete?: (result: { naturalWidth: number; naturalHeight: number }) => void;
  onError?: () => void;
  showRetryButton?: boolean;
}

// Azure Blob Storage specific configuration
const AZURE_CONFIG = {
  maxRetries: 3,
  retryDelay: 1500, // Slightly longer delay for Azure
  fallbackSrc: '/images/placeholder-image.png', // You'll need to add this to public/images/
  timeout: 15000, // 15 seconds timeout
};

// Default blur data URL for better loading experience
const DEFAULT_BLUR_DATA_URL = 
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

// Check if URL is from Azure Blob Storage
function isAzureBlobUrl(url: string): boolean {
  return url.includes('blob.core.windows.net') || url.includes('societyplus.blob.core.windows.net');
}

// Add cache-busting and optimize Azure URLs
function optimizeAzureUrl(url: string): string {
  if (!url || !isAzureBlobUrl(url)) return url;
  
  try {
    const urlObj = new URL(url);
    
    // Add Azure-specific query parameters for better performance
    // These help with CDN caching and performance
    if (!urlObj.searchParams.has('cache')) {
      urlObj.searchParams.set('cache', 'true');
    }
    
    return urlObj.toString();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to optimize Azure URL:', error);
    }
    return url;
  }
}

// Generate a fallback avatar for user images
function generateAvatarFallback(alt: string): string {
  const initials = alt
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // Use a service like UI Avatars as fallback for user images
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=fff&size=200`;
}

export function AzureImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  quality = 85, // Higher quality for Azure images
  placeholder = "blur",
  sizes,
  style,
  onLoadingComplete,
  onError,
  showRetryButton = true,
  ...props
}: AzureImageProps) {
  const optimizedSrc = optimizeAzureUrl(src);
  
  // Determine fallback strategy based on image type
  let fallbackSrc = AZURE_CONFIG.fallbackSrc;
  
  // If it's likely a user avatar (contains user-related keywords), use avatar fallback
  const isUserImage = /profile|user|avatar|member/i.test(alt) || /profile|user|avatar|member/i.test(src);
  if (isUserImage) {
    fallbackSrc = generateAvatarFallback(alt);
  }

  // Custom error handling for Azure-specific issues
  const handleAzureError = () => {
    const errorDetails = {
      originalSrc: src,
      optimizedSrc,
      alt,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      isAzureUrl: isAzureBlobUrl(src),
      fallbackStrategy: isUserImage ? 'Avatar' : 'Placeholder'
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.error('Azure Blob Storage image failed to load:', errorDetails);
    }
    
    // Enhanced logging for Azure-specific debugging (dev only)
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && window.console) {
      console.group('🔍 Azure Image Load Failure Details');
      console.log('URL:', optimizedSrc);
      console.log('Alt text:', alt);
      console.log('Is Azure URL:', isAzureBlobUrl(src));
      console.log('Fallback strategy:', isUserImage ? 'Avatar' : 'Placeholder');
      console.groupEnd();
    }
    
    onError?.();
  };

  return (
    <RobustImage
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      className={cn("transition-opacity duration-300", className)}
      priority={priority}
      quality={quality}
      placeholder={placeholder}
      blurDataURL={placeholder === "blur" ? DEFAULT_BLUR_DATA_URL : undefined}
      sizes={sizes}
      style={style}
      onLoadingComplete={onLoadingComplete}
      onError={handleAzureError}
      maxRetries={AZURE_CONFIG.maxRetries}
      retryDelay={AZURE_CONFIG.retryDelay}
      showRetryButton={showRetryButton}
      fallbackSrc={fallbackSrc}
      // Custom loading component for Azure images
      loadingComponent={
        <div className="flex items-center justify-center text-muted-foreground">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-6 w-6 bg-current opacity-20 rounded" />
            <div className="text-xs">Loading from Azure...</div>
          </div>
        </div>
      }
      // Custom error component
      errorComponent={
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground p-4">
          <div className="h-8 w-8 bg-destructive/20 rounded-full flex items-center justify-center">
            <span className="text-destructive text-xs">!</span>
          </div>
          <div className="text-xs text-center">
            <div>Image unavailable</div>
            <div className="text-xs opacity-75 mt-1">Azure storage temporarily unreachable</div>
          </div>
          {showRetryButton && (
            <button 
              className="mt-2 px-3 py-1 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/90 transition-colors"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </button>
          )}
        </div>
      }
      {...props}
    />
  );
}

// Export convenience components for common use cases
export function AzureAvatar({ src, alt, size = 40, className, ...props }: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  priority?: boolean;
  onError?: () => void;
}) {
  return (
    <AzureImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-full object-cover", className)}
      quality={90}
      {...props}
    />
  );
}

export function AzureBanner({ src, alt, className, ...props }: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  onError?: () => void;
}) {
  return (
    <AzureImage
      src={src}
      alt={alt}
      fill
      className={cn("object-cover", className)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority
      {...props}
    />
  );
}

export function AzurePostImage({ src, alt, className, ...props }: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onError?: () => void;
}) {
  return (
    <AzureImage
      src={src}
      alt={alt}
      width={800}
      height={400}
      className={cn("rounded border w-full object-cover", className)}
      sizes="(max-width: 768px) 100vw, 800px"
      {...props}
    />
  );
}