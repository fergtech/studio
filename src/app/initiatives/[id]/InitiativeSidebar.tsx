'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';
import type { Initiative, Member } from "@/lib/types";

interface InitiativeSidebarProps {
  initiative: Initiative;
  members: Member[];
}

export function InitiativeSidebar({ initiative, members }: InitiativeSidebarProps) {
  return (
    <div className="space-y-6">
      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {initiative.description}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 