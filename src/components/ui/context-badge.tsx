'use client';

import { Badge } from './badge';
import { Building2, Users, Target } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ContextBadgeProps {
  type: 'society' | 'initiative';
  id: string;
  name: string;
  image?: string | null;
  className?: string;
  variant?: 'default' | 'minimal' | 'prominent';
}

/**
 * ContextBadge - Shows society or initiative attribution for posts/ideas/issues
 * Provides clear visual indication of what community context the content belongs to
 */
export function ContextBadge({
  type,
  id,
  name,
  image,
  className,
  variant = 'default',
}: ContextBadgeProps) {
  const Icon = type === 'society' ? Building2 : Target;
  const label = type === 'society' ? 'Society' : 'Initiative';
  const href = type === 'society' ? `/societies/${id}` : `/initiatives/${id}`;

  // Minimal variant - just icon and name
  if (variant === 'minimal') {
    return (
      <Link
        href={href}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors',
          className
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="font-medium">{name}</span>
      </Link>
    );
  }

  // Prominent variant - for modal headers
  if (variant === 'prominent') {
    return (
      <Link
        href={href}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors border border-border',
          className
        )}
      >
        <Icon className="w-4 h-4 text-primary" />
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground leading-tight">
            {label}
          </span>
          <span className="text-sm font-medium leading-tight">{name}</span>
        </div>
      </Link>
    );
  }

  // Default variant - badge style
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className={cn('inline-block', className)}
    >
      <Badge
        variant="secondary"
        className="gap-1.5 hover:bg-secondary/80 transition-colors cursor-pointer"
      >
        <Icon className="w-3 h-3" />
        <span className="text-xs">
          {label}: {name}
        </span>
      </Badge>
    </Link>
  );
}
