"use client";
import React from 'react';
import { Initiative } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { PostActions } from '@/components/PostActions';
import { useToast } from "@/hooks/use-toast";
import { deleteInitiative } from '@/app/actions/initiativeActions';

interface InitiativeCardProps {
  initiative: Initiative & { creatorId?: string };
  creatorName?: string;
  creatorAvatarUrl?: string;
  currentUserId?: string;
}

export function InitiativeCard({ initiative, creatorName = "Creator", creatorAvatarUrl, currentUserId }: InitiativeCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fallback = creatorName.substring(0, 2).toUpperCase();
  
  // Handle date formatting
  const timeAgo = initiative.createdAt ? 
    formatDistanceToNow(
      typeof initiative.createdAt === 'string' 
        ? parseISO(initiative.createdAt) 
        : initiative.createdAt instanceof Date
          ? initiative.createdAt
          : new Date(initiative.createdAt as any),
      { addSuffix: true }
    ) : '';

  const handleInitiativeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/initiatives/${initiative.id}`);
  };

  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const handleDelete = async () => {
    if (!currentUserId || initiative.creatorId !== currentUserId) {
      setDeleteError("You are not authorized to delete this initiative.");
      return;
    }
    if (!confirm("Are you sure you want to delete this initiative? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteInitiative(initiative.id);
      if (result.success) {
        // Removed onDelete call as per edit hint
      } else {
        setDeleteError(result.error || "Failed to delete initiative.");
      }
    } catch (error) {
      console.error("Error in handleDelete:", error);
      setDeleteError("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log("Edit initiative:", initiative.id);
  };

  return (
    <div 
      className="relative block mb-4 rounded-lg overflow-hidden shadow-lg aspect-[9/12] text-card-foreground group cursor-pointer" 
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
        {/* Header (Creator Info + Status) */}
        <div className="flex items-center justify-between mb-auto">
          <div className="flex items-center space-x-2">
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
              <Link 
                href={`/profile/${initiative.creatorId}`}
                onClick={(e) => e.stopPropagation()} 
                className="z-40 relative hover:underline"
              >
                <p className="text-xs font-medium">{creatorName}</p>
              </Link>
              <p className="text-xs opacity-80">{timeAgo}</p>
              <p className="text-xs opacity-80 mt-0.5">
                {initiative.location ? initiative.location : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs bg-accent/20 text-accent border-none backdrop-blur-sm">{initiative.status}</Badge>
            {/* Edit/Delete actions removed from main feed */}
          </div>
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
              {initiative.roles.slice(0, 3).map((role, index) => (
                <Badge key={`role-${index}`} variant="secondary" className="text-xs backdrop-blur-sm">
                  {role}
                </Badge>
              ))}
              {initiative.roles.length > 3 && (
                 <Badge key="more-roles-badge" variant="secondary" className="text-xs backdrop-blur-sm">
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
