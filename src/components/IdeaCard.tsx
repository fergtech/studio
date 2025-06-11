"use client";

import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PostActions } from "@/components/PostActions";
import { Idea } from "@/lib/types";

interface IdeaCardProps {
  idea: Idea;
  currentUserId?: string;
}

export function IdeaCard({ idea, currentUserId }: IdeaCardProps) {
  const handleDelete = async () => {
    // TODO: Implement delete functionality
    console.log("Delete idea:", idea.id);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={idea.creator.image || undefined} />
              <AvatarFallback>{idea.creator.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{idea.title}</CardTitle>
              <CardDescription>
                Posted by {idea.creator.name} • {formatDistanceToNow(new Date(idea.createdAt))} ago
              </CardDescription>
            </div>
          </div>
          {currentUserId === idea.creatorId && (
            <PostActions
              postId={idea.id}
              postType="idea"
              onDelete={handleDelete}
              post={idea}
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{idea.description}</p>
        {idea.media?.[0]?.url && (
          <div className="mt-4">
            <img
              src={idea.media[0].url}
              alt={idea.title}
              className="rounded-lg w-full h-48 object-cover"
            />
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {idea.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        {idea.location && (
          <div className="mt-4">
            <Badge variant="outline">
              {idea.location}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 