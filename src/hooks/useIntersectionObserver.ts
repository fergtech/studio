import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: React.RefObject<HTMLDivElement>;
  isIntersecting: boolean;
  hasBeenVisible: boolean;
}

export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn {
  console.log('useIntersectionObserver initialized with:', { threshold, rootMargin, triggerOnce });
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        console.log('IntersectionObserver callback:', { 
          isVisible, 
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          triggerOnce,
          hasBeenVisible: hasBeenVisible
        });
        
        // Always update intersection state
        setIsIntersecting(isVisible);
        
        // Handle triggerOnce logic
        if (isVisible && !hasBeenVisible) {
          console.log('Element became visible for first time');
          setHasBeenVisible(true);
          
          if (triggerOnce) {
            console.log('Stopping observation due to triggerOnce=true');
            observer.unobserve(element);
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      if (observer && element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce, hasBeenVisible]);

  return {
    ref,
    isIntersecting,
    hasBeenVisible,
  };
}