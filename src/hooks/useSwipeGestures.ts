import { useEffect, useRef, useState, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}

interface UseSwipeGesturesOptions extends SwipeHandlers {
  minSwipeDistance?: number;
  maxDoubleTapDelay?: number;
  longPressDelay?: number;
}

export function useSwipeGestures(options: UseSwipeGesturesOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onDoubleTap,
    onLongPress,
    minSwipeDistance = 50,
    maxDoubleTapDelay = 300,
    longPressDelay = 500,
  } = options;

  const elementRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [lastTap, setLastTap] = useState<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const triggerHapticFeedback = useCallback((pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const handleTouchStart = useCallback((x: number, y: number) => {
    setTouchStart({ x, y, time: Date.now() });

    // Long press detection
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        triggerHapticFeedback([10, 50, 10]); // Pattern vibration for long press
        onLongPress();
        setTouchStart(null); // Cancel swipe detection after long press
      }, longPressDelay);
    }
  }, [onLongPress, longPressDelay, triggerHapticFeedback]);

  const handleTouchMove = useCallback(() => {
    // Cancel long press if user moves finger
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchEnd = useCallback((x: number, y: number) => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!touchStart) return;

    const deltaX = x - touchStart.x;
    const deltaY = y - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;

    // Check for double tap
    if (onDoubleTap) {
      const timeSinceLastTap = Date.now() - lastTap;
      if (timeSinceLastTap < maxDoubleTapDelay && timeSinceLastTap > 0) {
        // Double tap detected
        triggerHapticFeedback(50);
        onDoubleTap();
        setLastTap(0); // Reset to prevent triple tap
        setTouchStart(null);
        return;
      }
      setLastTap(Date.now());
    }

    // Check for swipe (only if it was quick and long enough)
    if (deltaTime < 500) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY && absX > minSwipeDistance) {
        // Horizontal swipe
        triggerHapticFeedback(30);
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else if (absY > absX && absY > minSwipeDistance) {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    setTouchStart(null);
  }, [touchStart, lastTap, minSwipeDistance, maxDoubleTapDelay, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onDoubleTap, triggerHapticFeedback]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Touch event handlers
    const handleTouchStartEvent = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleTouchStart(touch.clientX, touch.clientY);
    };

    const handleTouchMoveEvent = () => {
      handleTouchMove();
    };

    const handleTouchEndEvent = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      handleTouchEnd(touch.clientX, touch.clientY);
    };

    // Mouse event handlers (for desktop testing)
    const handleMouseDown = (e: MouseEvent) => {
      handleTouchStart(e.clientX, e.clientY);
    };

    const handleMouseMove = () => {
      handleTouchMove();
    };

    const handleMouseUp = (e: MouseEvent) => {
      handleTouchEnd(e.clientX, e.clientY);
    };

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStartEvent, { passive: true });
    element.addEventListener('touchmove', handleTouchMoveEvent, { passive: true });
    element.addEventListener('touchend', handleTouchEndEvent, { passive: true });

    // Add mouse event listeners for desktop
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('touchstart', handleTouchStartEvent);
      element.removeEventListener('touchmove', handleTouchMoveEvent);
      element.removeEventListener('touchend', handleTouchEndEvent);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { ref: elementRef, triggerHapticFeedback };
}
