'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';
import type { Initiative, Member } from "@/lib/types";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteInitiative } from '@/app/actions/initiativeActions';
import { useState } from 'react';

interface InitiativeSidebarProps {
  initiative: Initiative;
  members: Member[];
}

export function InitiativeSidebar({ initiative, members }: InitiativeSidebarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const userId = session?.user?.id;
  const isCreator = initiative.creator?.id === userId;
  const isAdmin = members.find(m => m.id === userId)?.role === 'ADMIN';

  // Add state for description toggle
  const [showFullDescription, setShowFullDescription] = useState(false);
  const maxDescriptionLength = 160;
  const isLongDescription = initiative.description && initiative.description.length > maxDescriptionLength;
  const displayedDescription = showFullDescription || !isLongDescription
    ? initiative.description
    : initiative.description.slice(0, maxDescriptionLength) + '...';

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this initiative? This action cannot be undone.")) return;
    const result = await deleteInitiative(initiative.id);
    if (result.success) {
      router.push("/");
    } else {
      alert(result.error || "Failed to delete initiative.");
    }
  };

  return (
    <div className="space-y-6">
      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {displayedDescription}
            {isLongDescription && (
              <button
                className="ml-2 text-primary underline text-xs focus:outline-none"
                onClick={() => setShowFullDescription(v => !v)}
              >
                {showFullDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Members Section */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.image || undefined} />
                    <AvatarFallback>
                      {member.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {member.role}
                      </Badge>
                      {member.lastActive && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(member.lastActive), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <a href="#goals" className="block text-sm text-primary hover:underline">
              View Goals
            </a>
            <a href="#updates" className="block text-sm text-primary hover:underline">
              Latest Updates
            </a>
            <a href="#chat" className="block text-sm text-primary hover:underline">
              Join Chat
            </a>
            {(isCreator || isAdmin) && (
              <Button
                variant="destructive"
                className="w-full mt-4 flex items-center justify-center"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Initiative
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 