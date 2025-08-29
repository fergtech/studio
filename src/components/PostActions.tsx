"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";
import { EditInitiativeForm } from "@/components/EditInitiativeForm";
import { EditIssueForm } from "@/components/EditIssueForm";
import { EditIdeaForm } from "@/components/EditIdeaForm";
import { Initiative, Issue, Idea } from "@/lib/types";

interface PostActionsProps {
  postId: string;
  postType: "initiative" | "issue" | "idea";
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
  className?: string;
  post: Initiative | Issue | Idea;
}

export function PostActions({ postId, postType, onEdit, onDelete, className = "", post }: PostActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete();
      toast({
        title: "Success",
        description: `${postType.charAt(0).toUpperCase() + postType.slice(1)} deleted successfully.`,
      });
    } catch (error) {
      console.error(`Error deleting ${postType}:`, error);
      toast({
        title: "Error",
        description: `Failed to delete ${postType}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditDialogOpen(true)}
          className="h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={e => { e.stopPropagation(); handleDelete(); }}
          disabled={isDeleting}
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit {postType.charAt(0).toUpperCase() + postType.slice(1)}</DialogTitle>
          </DialogHeader>
          {postType === "initiative" && (
            <EditInitiativeForm
              setOpen={setIsEditDialogOpen}
              initiative={post as Initiative}
            />
          )}
          {postType === "issue" && (
            <EditIssueForm
              setOpen={setIsEditDialogOpen}
              issue={post as Issue}
            />
          )}
          {postType === "idea" && (
            <EditIdeaForm
              setOpen={setIsEditDialogOpen}
              idea={post as Idea}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 
