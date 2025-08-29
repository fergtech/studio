'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GoalStatus, Priority } from '@prisma/client'; // Assuming these enums are in prisma client

// Define fallback enum values in case Prisma client is not available during build
const FALLBACK_GOAL_STATUS = {
  NotStarted: 'NotStarted',
  InProgress: 'InProgress',
  Completed: 'Completed',
  OnHold: 'OnHold'
} as const;

const FALLBACK_PRIORITY = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  Critical: 'Critical'
} as const;

// Use Prisma enums if available, otherwise use fallback
const GoalStatusEnum = GoalStatus || FALLBACK_GOAL_STATUS;
const PriorityEnum = Priority || FALLBACK_PRIORITY;

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { createGoal } from '@/app/actions/goalActions';
import { useSession } from 'next-auth/react';
import type { Goal } from '@/lib/types'; // Import Goal type

const goalSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long').max(100),
  description: z.string().max(500).optional(),
  status: z.nativeEnum(GoalStatus).optional().default(GoalStatus.NotStarted),
  priority: z.nativeEnum(Priority).optional().default(Priority.Medium),
  // dueDate: z.date().optional().nullable(), // For a calendar picker
});

type GoalFormData = z.infer<typeof goalSchema>;

interface CreateGoalDialogProps {
  initiativeId: string;
  isOpen: boolean;
  onClose: () => void;
  onGoalCreated: (goal: Goal) => void; // To refresh the goals list, now passing the new goal
  initialTitle?: string;
  initialDescription?: string;
}

export function CreateGoalDialog({
  initiativeId,
  isOpen,
  onClose,
  onGoalCreated,
  initialTitle,
  initialDescription,
}: CreateGoalDialogProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: initialTitle || '',
      description: initialDescription || '',
      status: GoalStatus.NotStarted,
      priority: Priority.Medium,
      // dueDate: null,
    },
  });

  const onSubmit = async (data: GoalFormData) => {
    if (!session?.user?.id) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to create a goal.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await createGoal({
          initiativeId,
          creatorId: session.user.id, // Pass creatorId
          ownerId: session.user.id, // Default owner to creator for MVP
          title: data.title,
          description: data.description || '', // Ensure description is always a string
          status: data.status,
          priority: data.priority,
        });

        if (result.success && result.goal) {
          toast({
            title: 'Goal Created!',
            description: `Successfully created goal: ${result.goal.title}`,
          });
          onGoalCreated(result.goal); // Pass the created goal
          form.reset();
          onClose();
        } else {
          toast({
            title: 'Error Creating Goal',
            description: (result as { error: string }).error || 'An unknown error occurred.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Create goal error:', error);
        toast({
          title: 'Error',
          description: 'Failed to create goal. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
          <DialogDescription>
            Define a new goal for your initiative. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="E.g., Secure funding"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Briefly describe the goal"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                defaultValue={GoalStatusEnum.NotStarted}
                onValueChange={(value) =>
                  form.setValue('status', value as GoalStatus)
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(GoalStatusEnum).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                defaultValue={PriorityEnum.Medium}
                onValueChange={(value) =>
                  form.setValue('priority', value as Priority)
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PriorityEnum).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Add DueDate field with Calendar if desired */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
