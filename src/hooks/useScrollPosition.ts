import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Simplified storage - just scroll position with smart retry logic
const scrollPositions = new Map<string, { 
  scrollTop: number; 
  scrollLeft: number; 
  timestamp: number;
}>();

interface UseScrollPositionOptions {
  key: string;
  dependencies?: any[];
  enabled?: boolean;
  loadMoreFn?: () => Promise<void> | void; // Function to load more content
  hasMore?: boolean; // Whether more content is available
}

/**
 * Hook to save and restore scroll position for specific scrollable containers
 * @param options - Configuration options
 * @returns elementRef to attach to scrollable container and utility functions
 */
export function useScrollPosition({ key, dependencies = [], enabled = true }: UseScrollPositionOptions) {
  const router = useRouter();
  const elementRef = useRef<HTMLDivElement>(null);

  // Save scroll position before navigation
  useEffect(() => {
    if (!enabled) return;

    const handleRouteChange = () => {
      if (elementRef.current) {
        const position = {
          scrollTop: elementRef.current.scrollTop,
          scrollLeft: elementRef.current.scrollLeft,
          timestamp: Date.now()
        };
        // Position saved
        scrollPositions.set(key, position);
      }
    };

    // Save on page unload as backup
    const handleBeforeUnload = () => {
      handleRouteChange();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [router, key, enabled]);

  // Save scroll position when user clicks navigation elements
  const saveScrollPosition = () => {
    if (!enabled || !elementRef.current) return;
    
    const position = {
      scrollTop: elementRef.current.scrollTop,
      scrollLeft: elementRef.current.scrollLeft,
      timestamp: Date.now()
    };
    // Position saved
    scrollPositions.set(key, position);
  };

  // Restore scroll position when component mounts or dependencies change
  useEffect(() => {
    if (!enabled) return;

    const restorePosition = () => {
      const savedPosition = scrollPositions.get(key);
      if (savedPosition && elementRef.current) {
        // Restoring position
        
        // Add delay to ensure content is rendered
        setTimeout(() => {
          if (elementRef.current) {
            elementRef.current.scrollTop = savedPosition.scrollTop;
            elementRef.current.scrollLeft = savedPosition.scrollLeft;
            
            // Verify restoration worked
            setTimeout(() => {
              if (elementRef.current) {
                const currentScroll = elementRef.current.scrollTop;
                // Position restored
                
                // Retry if significantly off and target position is greater (content might still be loading)
                if (Math.abs(currentScroll - savedPosition.scrollTop) > 50 && savedPosition.scrollTop > currentScroll) {
                  // Retrying scroll
                  elementRef.current.scrollTop = savedPosition.scrollTop;
                }
              }
            }, 100);
          }
        }, 50);
      } else {
        // No saved position
      }
    };

    restorePosition();
  }, [key, enabled, ...dependencies]);

  // Clear all scroll positions (useful for logout)
  const clearScrollPositions = () => {
    scrollPositions.clear();
    // Scroll positions cleared
  };

  return { 
    elementRef, 
    saveScrollPosition, 
    clearScrollPositions 
  };
}

/**
 * Advanced window-based scroll position hook that handles dynamic content loading
 * This is the main hook that should be used for window/body scrolling
 */
export function useWindowScrollPosition({ key, dependencies = [], enabled = true, loadMoreFn, hasMore = true }: UseScrollPositionOptions) {
  const router = useRouter();

  // Save scroll position before navigation
  useEffect(() => {
    if (!enabled) return;

    const handleRouteChange = () => {
      const position = {
        scrollTop: window.scrollY,
        scrollLeft: window.scrollX,
        timestamp: Date.now()
      };
      // Position auto-saved
      scrollPositions.set(key, position);
    };

    // Save on page unload as backup
    const handleBeforeUnload = () => {
      handleRouteChange();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [router, key, enabled]);

  // Save scroll position when user clicks navigation elements
  const saveScrollPosition = () => {
    if (!enabled) return;
    
    const position = {
      scrollTop: window.scrollY,
      scrollLeft: window.scrollX,
      timestamp: Date.now()
    };
    // Position saved
    scrollPositions.set(key, position);
  };

  // Advanced restore with multiple attempts and dynamic content handling
  useEffect(() => {
    if (!enabled) return;

    const savedPosition = scrollPositions.get(key);
    if (!savedPosition) {
      // No saved position
      return;
    }

    // Starting position restoration
    
    let attempts = 0;
    const maxAttempts = 5;
    const baseDelay = 100;
    
    const attemptRestore = async () => {
      attempts++;
      
      // Check if we need to load more content first
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      
      const targetPosition = savedPosition.scrollTop;
      const canReachPosition = documentHeight > targetPosition + window.innerHeight;
      
      // Restoration attempt
      
      // If we can't reach the position and we have more content to load
      if (!canReachPosition && loadMoreFn && hasMore && attempts <= 3) {
        // Loading more content for restoration
        
        // Store the document height before loading more
        const heightBeforeLoad = documentHeight;
        
        try {
          await loadMoreFn();
          // Load more completed
          
          // Check if the document height actually increased after loading more
          setTimeout(() => {
            const newHeight = Math.max(
              document.body.scrollHeight,
              document.body.offsetHeight,
              document.documentElement.clientHeight,
              document.documentElement.scrollHeight,
              document.documentElement.offsetHeight
            );
            
            // Height check completed
            
            // If height didn't increase significantly, we probably reached the end
            if (newHeight - heightBeforeLoad < 100) {
              // Reached end of content
              // Try one final scroll without loading more
              window.scrollTo({
                top: targetPosition,
                left: savedPosition.scrollLeft,
                behavior: 'instant'
              });
              return;
            }
            
            attemptRestore();
          }, 500);
          return;
        } catch (error) {
          console.error(`[WindowScroll] Load more failed:`, error);
        }
      }
      
      // Try to scroll to the saved position
      window.scrollTo({
        top: targetPosition,
        left: savedPosition.scrollLeft,
        behavior: 'instant'
      });
      
      // Check if it worked after a short delay
      setTimeout(() => {
        const currentScroll = window.scrollY;
        const tolerance = 50;
        const isCloseEnough = Math.abs(currentScroll - targetPosition) <= tolerance;
        const needsMoreContent = targetPosition > currentScroll + tolerance && canReachPosition;
        
        // Scroll attempt completed
        
        if (!isCloseEnough && needsMoreContent && attempts < maxAttempts) {
          // Content is still loading, try again with increasing delay
          const delay = baseDelay * attempts;
          // Retrying scroll
          setTimeout(attemptRestore, delay);
        } else if (isCloseEnough) {
          // Position restored successfully
        } else {
          // Restoration completed
        }
      }, 50);
    };
    
    // Start the first attempt after initial delay
    setTimeout(attemptRestore, baseDelay);

  }, [key, enabled, ...dependencies]);

  // Clear all scroll positions (useful for logout)
  const clearScrollPositions = () => {
    scrollPositions.clear();
    // Scroll positions cleared
  };

  return { 
    saveScrollPosition, 
    clearScrollPositions 
  };
}

/**
 * Utility function for saving scroll position from individual components
 * This should be called when user clicks navigation elements
 */
export function saveScrollPositionForKey(key: string) {
  const position = {
    scrollTop: window.scrollY,
    scrollLeft: window.scrollX,
    timestamp: Date.now()
  };
  // Position saved
  scrollPositions.set(key, position);
}