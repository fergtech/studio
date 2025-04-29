import type { Initiative } from "@/lib/types";
import { Card } from "@/components/ui/card"; // Keep Card for structure if needed, though styling is mostly custom now
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components
import Link from "next/link";
import Image from "next/image";
import { Users, ArrowRight } from "lucide-react";

interface InitiativeCardProps {
  initiative: Initiative;
  creatorName: string; // Add creator name prop
  creatorAvatarUrl?: string; // Add optional creator avatar prop
}

export function InitiativeCard({ initiative, creatorName, creatorAvatarUrl }: InitiativeCardProps) {
  const placeholderImage = "https://picsum.photos/seed/" + initiative.id + "/600/800"; // Taller aspect ratio

  return (
    <Card className="relative flex flex-col overflow-hidden transition-all hover:shadow-lg w-full aspect-[9/16] text-white group rounded-lg"> {/* Added rounded-lg */}
      {/* Image Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={initiative.imageUrl || placeholderImage}
          alt={initiative.title}
          layout="fill"
          objectFit="cover"
          priority={initiative.id === '1'} // Prioritize first image potentially
          className="transition-transform duration-300 group-hover:scale-105" // Subtle zoom on hover
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-20 flex flex-col justify-end h-full p-4 space-y-3">
        {/* Creator Info */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-7 w-7 border-2 border-white/50"> {/* Smaller avatar with border */}
            <AvatarImage src={creatorAvatarUrl} alt={creatorName} />
            <AvatarFallback className="text-xs bg-black/50 text-white">{creatorName?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate">{creatorName}</span>
        </div>

        {/* Card Title */}
        <h2 className="text-xl font-semibold line-clamp-2">{initiative.title}</h2>

        {/* Status and Member Count */}
         <div className="flex items-center justify-between text-xs opacity-90">
           <Badge variant="secondary" className="capitalize bg-white/20 text-white border-none backdrop-blur-sm">{initiative.status}</Badge>
           <span className="flex items-center gap-1">
             <Users className="h-3 w-3" />
             {initiative.memberIds.length} Member{initiative.memberIds.length !== 1 ? 's' : ''}
           </span>
         </div>

        {/* Roles */}
        <div className="flex flex-wrap gap-1">
          {initiative.roles.slice(0, 3).map((role) => (
             <Badge key={role} variant="outline" className="bg-white/10 text-white border-white/30 backdrop-blur-sm text-xs">{role}</Badge>
          ))}
          {initiative.roles.length > 3 && <Badge variant="outline" className="bg-white/10 text-white border-white/30 backdrop-blur-sm text-xs">+{initiative.roles.length - 3} more</Badge>}
        </div>

        {/* Description (optional, maybe shorter) */}
        {/* <p className="text-sm opacity-80 line-clamp-2">{initiative.description}</p> */}

        {/* View Details Button - positioned at the bottom */}
        <Button variant="outline" size="sm" asChild className="mt-auto w-full bg-white/10 text-white border-white/40 hover:bg-white/20 backdrop-blur-sm">
          <Link href={`/initiatives/${initiative.id}`} className="flex items-center justify-center gap-1">
            <span>View Details</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
