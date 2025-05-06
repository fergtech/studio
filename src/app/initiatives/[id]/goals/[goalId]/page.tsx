"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, User, Flag, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { Goal, Action, Initiative } from '@/lib/types';

// Mock data functions (replace with actual API calls)
const fetchGoalDetails = async (initiativeId: string, goalId: string): Promise<Goal> => {
  // Mock implementation
  return {
    id: goalId,
    initiativeId,
    title: "Implement User Authentication",
    description: "Set up secure user authentication system with email/password and social login options.",
    owner: { id: "user1", name: "Alice", avatar: "https://i.pravatar.cc/40?u=user1" },
    status: "In Progress",
    dueDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
    createdAt: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
    updatedAt: Timestamp.fromDate(new Date()),
    progress: 45,
    priority: "High",
    tags: ["Authentication", "Security", "Frontend"]
  };
};

const fetchInitiativeDetails = async (initiativeId: string): Promise<Initiative> => {
  // Mock implementation
  return {
    id: initiativeId,
    title: "Community Platform Development",
    description: "Building a community platform for local initiatives",
    status: "In Progress",
    roles: ["Developer", "Designer", "Project Manager"],
    createdAt: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    creatorId: "user1",
    memberIds: ["user1", "user2", "user3"],
    imageUrl: "https://picsum.photos/seed/garden/800/400",
  };
};

const fetchRelatedActions = async (goalId: string): Promise<Action[]> => {
  // Mock implementation
  return [
    {
      id: "action1",
      goalId,
      initiativeId: "init-1",
      title: "Set up Firebase Authentication",
      description: "Configure Firebase Auth with email/password and Google sign-in",
      status: "Done",
      assignee: { id: "user1", name: "Alice", avatar: "https://i.pravatar.cc/40?u=user1" },
      createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
      updatedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      completedAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      completedBy: { id: "user1", name: "Alice", avatar: "https://i.pravatar.cc/40?u=user1" }
    },
    {
      id: "action2",
      goalId,
      initiativeId: "init-1",
      title: "Implement Login UI",
      description: "Create login and registration forms with validation",
      status: "In Progress",
      assignee: { id: "user2", name: "Bob", avatar: "https://i.pravatar.cc/40?u=user2" },
      createdAt: Timestamp.fromDate(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)),
      updatedAt: Timestamp.fromDate(new Date()),
      priority: "High"
    },
    {
      id: "action3",
      goalId,
      initiativeId: "init-1",
      title: "Add Password Reset Flow",
      description: "Implement password reset functionality with email verification",
      status: "To Do",
      createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
      updatedAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
      priority: "Medium"
    }
  ];
};

function ActionList({ actions }: { actions: Action[] }) {
  return (
    <div className="space-y-4">
      {actions.map((action) => (
        <Card key={action.id} className="hover:bg-accent/50 transition-colors">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <Badge variant={action.status === 'Done' ? 'default' : 'secondary'}>
                {action.status}
              </Badge>
            </div>
            {action.description && (
              <CardDescription>{action.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {action.assignee && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{action.assignee.name}</span>
                </div>
              )}
              {action.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{action.dueDate.toDate().toLocaleDateString()}</span>
                </div>
              )}
              {action.priority && (
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  <span>{action.priority}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const initiativeId = params.id as string;
        const goalId = params.goalId as string;

        const [goalData, initiativeData, actionsData] = await Promise.all([
          fetchGoalDetails(initiativeId, goalId),
          fetchInitiativeDetails(initiativeId),
          fetchRelatedActions(goalId)
        ]);

        setGoal(goalData);
        setInitiative(initiativeData);
        setActions(actionsData);
      } catch (error) {
        console.error('Error fetching goal details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, params.goalId]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!goal || !initiative) {
    return <div className="flex items-center justify-center min-h-screen">Goal not found</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'In Progress':
        return 'bg-blue-500';
      case 'Blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div> {/* Remove container styles from root */}
      {/* Initiative Header Image */}
      <div className="relative h-48 w-full mb-[-2rem]"> {/* Adjust height as needed, negative margin pulls content up */}
        {initiative.imageUrl && (
          <>
            <img
              src={initiative.imageUrl}
              alt={`${initiative.title} featured image`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Fade overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background"></div>
          </>
        )}
        {/* Back Link - Positioned over the image */}
        <div className="absolute bottom-4 left-0 right-0 container mx-auto px-4 z-10">
          <Link
            href={`/initiatives/${initiative.id}`}
            className="inline-flex items-center text-white bg-black/50 backdrop-blur-sm px-3 py-1 rounded hover:bg-black/70 transition-colors text-sm shadow-md" // Style for visibility
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {initiative.title}
          </Link>
        </div>
      </div>

      {/* Goal Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{goal.title}</CardTitle>
              <CardDescription className="text-lg">{goal.description}</CardDescription>
            </div>
            <Badge variant="outline" className={`${getStatusColor(goal.status)} text-white`}>
              {goal.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Updated Owner Display */}
            <Link href={`/profile/${goal.owner.id}`} className="flex items-center gap-2 group">
              <Avatar className="h-8 w-8">
                <AvatarImage src={goal.owner.avatar} alt={goal.owner.name} />
                <AvatarFallback>{goal.owner.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-medium group-hover:underline">{goal.owner.name}</p>
              </div>
            </Link>
            {goal.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{goal.dueDate.toDate().toLocaleDateString()}</p>
                </div>
              </div>
            )}
            {goal.priority && (
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <p className="font-medium">{goal.priority}</p>
                </div>
              </div>
            )}
            {goal.progress !== undefined && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <Progress value={goal.progress} className="h-2" />
                  <p className="text-sm font-medium mt-1">{goal.progress}%</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="actions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger> 
        </TabsList> {/* Ensure TabsList closes after all Triggers */}

        <TabsContent value="actions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Related Actions</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Action
            </Button>
          </div>
          <ActionList actions={actions} />
        </TabsContent>

        <TabsContent value="updates">
          <Card>
            <CardHeader>
              <CardTitle>Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No updates yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No comments yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}