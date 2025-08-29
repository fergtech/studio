"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { imageMonitoring } from '@/lib/image-monitoring';

interface RobustImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  sizes?: string;
  style?: React.CSSProperties;
  onLoadingComplete?: (result: { naturalWidth: number; naturalHeight: number }) => void;
  onError?: () => void;
  maxRetries?: number;
  retryDelay?: number;
  showRetryButton?: boolean;
  fallbackSrc?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

type LoadingState = 'loading' | 'loaded' | 'error' | 'retrying';

export function RobustImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  quality = 75,
  placeholder = "empty",
  blurDataURL,
  sizes,
  style,
  onLoadingComplete,
  onError,
  maxRetries = 3,
  retryDelay = 1000,
  showRetryButton = true,
  fallbackSrc,
  loadingComponent,
  errorComponent,
  ...props
}: RobustImageProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate exponential backoff delay
  const getRetryDelay = (attempt: number): number => {
    return retryDelay * Math.pow(2, attempt - 1); // 1s, 2s, 4s, 8s...
  };

  // Clear any pending retry timeout
  const clearRetryTimeout = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  // Handle image load success
  const handleLoadSuccess = (result: { naturalWidth: number; naturalHeight: number }) => {
    setLoadingState('loaded');
    imageMonitoring.logSuccess(src);
    setRetryCount(0);
    clearRetryTimeout();
    onLoadingComplete?.(result);
  };

  // Handle image load error
  const handleLoadError = (error?: any) => {
    console.error(`Failed to load image: ${currentSrc}`);
    
    // If we have retries left, attempt retry with exponential backoff
    if (retryCount < maxRetries) {
      setLoadingState('retrying');
      const delay = getRetryDelay(retryCount + 1);
      
      console.log(`Retrying image load in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setCurrentSrc(`${src}?retry=${retryCount + 1}&t=${Date.now()}`); // Cache busting
        setLoadingState('loading');
      }, delay);
    } else {
      // All retries exhausted - log the failure
      imageMonitoring.logFailure(src, alt, retryCount, error);
      
      // Try fallback or show error
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        console.log('Using fallback image');
        setCurrentSrc(fallbackSrc);
        setLoadingState('loading');
        setRetryCount(0);
      } else {
        setLoadingState('error');
        onError?.();
      }
    }
  };

  // Manual retry function
  const handleManualRetry = () => {
    setRetryCount(0);
    setCurrentSrc(`${src}?manual_retry=${Date.now()}`);
    setLoadingState('loading');
  };

  // Reset state when src changes
  useEffect(() => {
    setCurrentSrc(src);
    setLoadingState('loading');
    setRetryCount(0);
    clearRetryTimeout();
  }, [src]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRetryTimeout();
    };
  }, []);

  // Loading state component
  if (loadingState === 'loading' || loadingState === 'retrying') {
    if (loadingComponent) {
      return <div className={className}>{loadingComponent}</div>;
    }

    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted animate-pulse",
          fill ? "absolute inset-0" : "",
          className
        )}
        style={{
          width: fill ? undefined : width,
          height: fill ? undefined : height,
          ...style,
        }}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          {loadingState === 'retrying' ? (
            <>
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="text-xs">Retrying... ({retryCount}/{maxRetries})</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-6 w-6" />
              <span className="text-xs">Loading...</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // Error state component
  if (loadingState === 'error') {
    if (errorComponent) {
      return <div className={className}>{errorComponent}</div>;
    }

    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/20",
          fill ? "absolute inset-0" : "",
          className
        )}
        style={{
          width: fill ? undefined : width,
          height: fill ? undefined : height,
          ...style,
        }}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
          <AlertCircle className="h-6 w-6" />
          <span className="text-xs">Failed to load image</span>
          {showRetryButton && (
            <button
              onClick={handleManualRetry}
              className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Successfully loaded state
  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      className={className}
      priority={priority}
      quality={quality}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      sizes={sizes}
      style={style}
      onLoadingComplete={handleLoadSuccess}
      onError={() => handleLoadError()}
      {...props}
    />
  );
}