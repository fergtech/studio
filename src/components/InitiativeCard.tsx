import type { Initiative } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Users, ArrowRight } from "lucide-react";

interface InitiativeCardProps {
  initiative: Initiative;
}

export function InitiativeCard({ initiative }: InitiativeCardProps) {
  // Adjusted placeholder to reflect the new aspect ratio potentially
  const placeholderImage = "https://picsum.photos/seed/" + initiative.id + "/600/300";

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg w-full">
      <CardHeader className="p-0">
        {/* Adjusted aspect ratio for a wider image in single column */}
        <div className="relative aspect-video w-full bg-muted">
          <Image
            src={initiative.imageUrl || placeholderImage}
            alt={initiative.title}
            layout="fill"
            objectFit="cover"
            priority={initiative.id === '1'} // Prioritize first image potentially
          />
        </div>
        <div className="p-4 pb-0">
           <CardTitle className="text-xl font-semibold mb-2">{initiative.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-2">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{initiative.description}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {initiative.roles.slice(0, 3).map((role) => (
            <Badge key={role} variant="secondary">{role}</Badge>
          ))}
          {initiative.roles.length > 3 && <Badge variant="outline">+{initiative.roles.length - 3} more</Badge>}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="outline" className="capitalize">{initiative.status}</Badge>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {initiative.memberIds.length} Member{initiative.memberIds.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 border-t mt-auto"> {/* Ensure footer is at bottom */}
        <Button variant="outline" size="sm" asChild className="w-full">
           <Link href={`/initiatives/${initiative.id}`} className="flex items-center justify-center gap-1"> {/* Centered content */}
             <span>View Details</span>
             <ArrowRight className="h-4 w-4" />
           </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
