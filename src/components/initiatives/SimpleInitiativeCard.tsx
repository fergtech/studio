'use client';

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface LocalInitiative {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  creator: {
    id: string;
    name: string;
    image?: string;
  };
  _count: {
    members: number;
  };
}

interface SimpleInitiativeCardProps {
  initiative: LocalInitiative;
  className?: string;
}

export function SimpleInitiativeCard({ initiative, className }: SimpleInitiativeCardProps) {
  const router = useRouter();
  const fallback = initiative.creator.name.substring(0, 2).toUpperCase();
  
  // Handle date formatting
  const timeAgo = initiative.createdAt ? 
    formatDistanceToNow(
      typeof initiative.createdAt === 'string' 
        ? parseISO(initiative.createdAt) 
        : new Date(initiative.createdAt),
      { addSuffix: true }
    ) : '';

  const handleInitiativeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/initiatives/${initiative.id}`);
  };

  return (
    <div 
      className={cn(
        "relative block mb-4 rounded-lg overflow-hidden shadow-lg aspect-[9/12] text-white group cursor-pointer",
        className
      )}
      onClick={handleInitiativeClick}
    >
      <div className="absolute inset-0 z-30">
        <span className="sr-only">View initiative: {initiative.title}</span>
      </div>
      
      <div
        className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-300 group-hover:scale-105"
        style={{ 
          backgroundImage: `url(${initiative.imageUrl || 'https://picsum.photos/seed/default-fallback/600/800'})` 
        }}
      >
         <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10"></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-20 flex flex-col h-full p-4">
        {/* Header (Creator Info + Stats) */}
        <div className="flex items-center justify-between mb-auto">
          <div className="flex items-center space-x-2">
            <Link 
              href={`/profile/${initiative.creator.id}`}
              onClick={(e) => e.stopPropagation()} 
              className="z-40 relative hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-8 w-8 border-2 border-white/80">
                <AvatarImage src={initiative.creator.image || ''} alt={initiative.creator.name} />
                <AvatarFallback>{fallback}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link 
                href={`/profile/${initiative.creator.id}`}
                onClick={(e) => e.stopPropagation()} 
                className="z-40 relative hover:underline"
              >
                <p className="text-xs font-medium text-white">{initiative.creator.name}</p>
              </Link>
              <p className="text-xs opacity-80 text-white">{timeAgo}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {initiative.category && (
              <Badge variant="secondary" className="text-xs bg-accent/20 text-white border-none backdrop-blur-sm">
                {initiative.category}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/30 backdrop-blur-sm">
              👥 {initiative._count.members}
            </Badge>
          </div>
        </div>

        {/* Main Content Text (Title + Description) */}
        <div className="my-4 text-center">
          <h3 className="text-xl font-bold mb-1 line-clamp-2 text-white">{initiative.title}</h3>
          <p className="text-sm opacity-90 line-clamp-3 text-white">{initiative.description}</p>
        </div>

        {/* Footer (CTA) */}
        <div className="mt-auto text-center">
          <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-primary/20 text-white border-primary/30">
            Tap to Join Project
          </Badge>
        </div>
      </div>
    </div>
  );
}