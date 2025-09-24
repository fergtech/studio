import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function DynamicIcon({ name, size = 24, className = '' }: DynamicIconProps) {
  // Get the icon component from Lucide
  const IconComponent = (LucideIcons as any)[name];

  // Fallback to Hash icon if the requested icon doesn't exist
  if (!IconComponent) {
    const FallbackIcon = LucideIcons.Hash;
    return <FallbackIcon size={size} className={className} />;
  }

  return <IconComponent size={size} className={className} />;
}