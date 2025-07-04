"use client";

import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PostActions } from "@/components/PostActions";
import { Issue } from "@/lib/types";

interface IssueCardProps {
  issue: Issue;
  currentUserId?: string;
}

export function IssueCard({ issue, currentUserId }: IssueCardProps) {
  const handleDelete = async () => {
    // TODO: Implement delete functionality
    console.log("Delete issue:", issue.id);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={issue.creator.image || undefined} />
              <AvatarFallback>{issue.creator.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{issue.title}</CardTitle>
              <CardDescription>
                Posted by {issue.creator.name} • {formatDistanceToNow(new Date(issue.createdAt))} ago
              </CardDescription>
            </div>
          </div>
          {currentUserId === issue.creatorId && (
            <PostActions
              postId={issue.id}
              postType="issue"
              onDelete={handleDelete}
              post={issue}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{issue.description}</p>
        {issue.media?.[0]?.url && (
          <div className="mt-4">
            <img
              src={issue.media[0].url}
              alt={issue.title}
              className="rounded-lg w-full h-48 object-cover"
            />
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {issue.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        {issue.location && (
          <div className="mt-4">
            <Badge variant="outline">
              {issue.location}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
