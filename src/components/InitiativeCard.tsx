import React from 'react';
import { Initiative } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

interface InitiativeCardProps {
  initiative: Initiative;
  creatorName?: string;
  creatorAvatarUrl?: string;
}

export function InitiativeCard({ initiative, creatorName = "Creator", creatorAvatarUrl }: InitiativeCardProps) {
  const router = useRouter();
  const fallback = creatorName.substring(0, 2).toUpperCase();
  
  // Handle both Timestamp objects and ISO strings for compatibility
  const timeAgo = initiative.createdAt ? 
    formatDistanceToNow(
      typeof initiative.createdAt === 'string' 
        ? parseISO(initiative.createdAt) 
        : initiative.createdAt.toDate?.() || new Date(initiative.createdAt as any),
      { addSuffix: true }
    ) : '';

  const handleInitiativeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/initiatives/${initiative.id}`);
  };

  return (
    <div 
      className="relative block mb-4 rounded-lg overflow-hidden shadow-lg aspect-[9/12] text-card-foreground group cursor-pointer" // Changed text-white to text-card-foreground
      onClick={handleInitiativeClick}
    > {/* Aspect ratio */}
      {/* We replace the direct Link with a div and use the router for navigation */}
      <div className="absolute inset-0 z-30">
        <span className="sr-only">View initiative: {initiative.title}</span>
      </div>
      
      <div
        className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-300 group-hover:scale-105"
        style={{ backgroundImage: `url(${initiative.imageUrl || 'https://picsum.photos/seed/default/600/800'})` }} // Default image if none provided
      >
         {/* Overlay for text contrast */}
         <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10"></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-20 flex flex-col h-full p-4">
        {/* Header (Creator Info + Status) */}
        <div className="flex items-center justify-between mb-auto">
          <div className="flex items-center space-x-2">
            {/* Creator Avatar with Profile Link */}
            <Link 
              href={`/profile/${initiative.creatorId}`}
              onClick={(e) => e.stopPropagation()} 
              className="z-40 relative hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-8 w-8 border-2 border-white/80">
                <AvatarImage src={creatorAvatarUrl} alt={creatorName} />
                <AvatarFallback>{fallback}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              {/* Creator Name with Profile Link */}
              <Link 
                href={`/profile/${initiative.creatorId}`}
                onClick={(e) => e.stopPropagation()} 
                className="z-40 relative hover:underline"
              >
                <p className="text-xs font-medium">{creatorName}</p>
              </Link>
              <p className="text-xs opacity-80">{timeAgo}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs bg-accent/20 text-accent border-none backdrop-blur-sm">{initiative.status}</Badge>
        </div>

        {/* Main Content Text (Title + Description) */}
        <div className="my-4 text-center">
          <h3 className="text-xl font-bold mb-1 line-clamp-2">{initiative.title}</h3>
          <p className="text-sm opacity-90 line-clamp-3">{initiative.description}</p>
        </div>

        {/* Footer (Roles) */}
        <div className="mt-auto">
          {initiative.roles && initiative.roles.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1">
              {initiative.roles.slice(0, 3).map((role) => ( // Show limited roles
                <Badge key={role} variant="secondary" className="text-xs backdrop-blur-sm">
                  {role}
                </Badge>
              ))}
              {initiative.roles.length > 3 && (
                 <Badge variant="secondary" className="text-xs backdrop-blur-sm">
                  +{initiative.roles.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InitiativeCard;
