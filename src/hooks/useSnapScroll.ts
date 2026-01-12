import { useRef, useCallback, RefObject, useEffect } from 'react';

/**
 * Custom hook for JavaScript-based snap-to-scroll functionality
 * Snaps feed items to center when user stops scrolling
 */
export function useSnapScroll(containerRef: RefObject<HTMLDivElement>) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSnappingRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  const onScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Don't interfere if currently snapping
    if (isSnappingRef.current) return;

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer with longer debounce to ensure user has stopped scrolling
    timerRef.current = setTimeout(() => {
      if (!container || isSnappingRef.current) return;

      const rect = container.getBoundingClientRect();
      const containerTop = rect.top;
      const containerHeight = rect.height;
      const viewportCenterY = containerTop + containerHeight / 2;

      // Get direct children of the container
      const children = Array.from(container.children) as HTMLElement[];

      if (children.length === 0) return;

      let nearestEl: HTMLElement | null = null;
      let minDist = Infinity;

      // Find the child element closest to viewport center
      for (const el of children) {
        // Skip if element is not visible or has no height
        if (el.offsetHeight === 0) continue;

        const r = el.getBoundingClientRect();
        const itemCenterY = r.top + r.height / 2;
        const dist = Math.abs(itemCenterY - viewportCenterY);

        if (dist < minDist) {
          minDist = dist;
          nearestEl = el;
        }
      }

      // Only snap if we're far from center (increased threshold to 100px)
      // This prevents excessive snapping and allows more natural scrolling
      if (nearestEl && minDist > 100) {
        isSnappingRef.current = true;

        const currentTop = container.scrollTop;
        const nearestRect = nearestEl.getBoundingClientRect();
        const delta = (nearestRect.top + nearestRect.height / 2) - viewportCenterY;

        container.scrollTo({
          top: currentTop + delta,
          behavior: 'smooth'
        });

        // Reset snapping flag after animation completes
        setTimeout(() => {
          isSnappingRef.current = false;
        }, 100);
      } else {
        isSnappingRef.current = false;
      }
    }, 100); // Faster snap response time
  }, [containerRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { onScroll };
}
