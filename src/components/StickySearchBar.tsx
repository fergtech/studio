'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface StickySearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: (e?: React.FormEvent) => void;
  placeholder?: string;
}

export function StickySearchBar({
  searchQuery,
  onSearchChange,
  onSearch,
  placeholder = "Search debates, projects, communities..."
}: StickySearchBarProps) {
  const [isSticky, setIsSticky] = useState(false);
  const searchBarRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the search bar scrolls out of view, show sticky version
        setIsSticky(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-80px 0px 0px 0px' // Trigger slightly before it leaves viewport
      }
    );

    if (searchBarRef.current) {
      observer.observe(searchBarRef.current);
    }

    return () => {
      if (searchBarRef.current) {
        observer.unobserve(searchBarRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Original search bar */}
      <form
        ref={searchBarRef}
        onSubmit={onSearch}
        className="flex justify-center mb-10"
      >
        <Input
          className="max-w-lg w-full rounded-l-md"
          placeholder={placeholder}
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          suppressHydrationWarning
        />
        <Button type="submit" className="rounded-l-none">Search</Button>
      </form>

      {/* Sticky search bar that slides in */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-md transition-transform duration-300 ease-out ${
          isSticky ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <form
          onSubmit={onSearch}
          className="flex justify-center py-3 px-4 max-w-5xl mx-auto"
        >
          <Input
            className="max-w-lg w-full rounded-l-md"
            placeholder={placeholder}
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            suppressHydrationWarning
          />
          <Button type="submit" className="rounded-l-none">Search</Button>
        </form>
      </div>
    </>
  );
}
