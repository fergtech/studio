'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  expandButtonText?: string;
  collapseButtonText?: string;
  showButton?: boolean;
}

/**
 * ExpandableText - Reusable component for truncating long text with See More/Less
 * @param text - The text content to display
 * @param maxLines - Maximum lines to show when collapsed (default: 3)
 * @param className - Additional classes for the text container
 * @param expandButtonText - Custom text for expand button (default: "See More")
 * @param collapseButtonText - Custom text for collapse button (default: "See Less")
 * @param showButton - Always show button regardless of text length (default: false)
 */
export function ExpandableText({
  text,
  maxLines = 3,
  className,
  expandButtonText = 'See More',
  collapseButtonText = 'See Less',
  showButton = false,
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(showButton);

  // Check if text is long enough to require truncation (rough estimate: 150 chars per line)
  const estimatedCharsPerLine = 150;
  const isLongText = text.length > maxLines * estimatedCharsPerLine;

  // Map maxLines to specific Tailwind classes (must be explicit for JIT)
  const getLineClampClass = () => {
    if (isExpanded || !isLongText) return '';
    switch (maxLines) {
      case 1: return 'line-clamp-1';
      case 2: return 'line-clamp-2';
      case 3: return 'line-clamp-3';
      case 4: return 'line-clamp-4';
      case 5: return 'line-clamp-5';
      case 6: return 'line-clamp-6';
      case 10: return 'line-clamp-[10]';
      default: return 'line-clamp-3';
    }
  };

  return (
    <div className="space-y-2">
      <p
        className={cn(
          'whitespace-pre-wrap break-words leading-relaxed',
          getLineClampClass(),
          className
        )}
      >
        {text}
      </p>

      {(isLongText || showButton) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-xs h-auto py-1 px-2 font-semibold"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              {collapseButtonText}
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              {expandButtonText}
            </>
          )}
        </Button>
      )}
    </div>
  );
}

/**
 * ExpandableTextModal - Variant for use in modal detail views
 * Shows more lines initially (10) for better reading experience
 */
export function ExpandableTextModal({
  text,
  className,
}: Omit<ExpandableTextProps, 'maxLines' | 'expandButtonText' | 'collapseButtonText'>) {
  return (
    <ExpandableText
      text={text}
      maxLines={10}
      className={className}
      expandButtonText="Read More"
      collapseButtonText="Show Less"
    />
  );
}
