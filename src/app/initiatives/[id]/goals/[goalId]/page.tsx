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

import type { Goal, Action, Initiative, GoalStatus, Priority, StepStatus } from '@/lib/types'; // Added GoalStatus, Priority, StepStatus
import { getGoalDetails, getInitiativeDetailsForGoalPage, getRelatedActions } from '@/app/actions/goalActions';

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
                  {/* No .toDate() needed as it's already a Date object */}
                  <span>{action.dueDate.toLocaleDateString()}</span>
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
  const [goal, setGoal] = useState<Goal | null>(null); // Type remains Goal from @/lib/types
  const [initiative, setInitiative] = useState<Partial<Initiative> | null>(null); // Initiative can be partial
  const [actions, setActions] = useState<Action[]>([]); // Type remains Action from @/lib/types
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const initiativeId = params.id as string;
        const goalId = params.goalId as string;

        if (!initiativeId || !goalId) {
          console.error("Missing initiativeId or goalId in params");
          setLoading(false);
          return;
        }

        // Fetch data using server actions
        const goalData = await getGoalDetails(goalId);
        const initiativeData = await getInitiativeDetailsForGoalPage(initiativeId);
        const actionsData = await getRelatedActions(goalId);

        // Transform Prisma types to client-side types if necessary, or adjust client types
        // For now, assuming direct compatibility or that Prisma types are close enough
        // to what @/lib/types expects for Goal, Initiative (partial), and Action.
        // This might require careful mapping if structures diverge significantly.

        if (goalData) {
          // Map Prisma Goal to lib/types.Goal
          setGoal({
            ...goalData,
            owner: goalData.owner ? { 
              id: goalData.owner.id, 
              name: goalData.owner.name || 'N/A', 
              image: goalData.owner.image || undefined 
            } : undefined,
            dueDate: goalData.dueDate ? new Date(goalData.dueDate) : undefined,
            createdAt: new Date(goalData.createdAt),
            updatedAt: new Date(goalData.updatedAt),
            tags: goalData.tags || [],
            status: goalData.status as GoalStatus, // Correctly cast to GoalStatus
            priority: goalData.priority as Priority | null | undefined, // Correctly cast to Priority | null | undefined
          });
        }
        if (initiativeData) {
          setInitiative({
            id: initiativeData.id,
            title: initiativeData.title,
            // Map other fields from initiativeData as needed for the context display
          });
        }
        // Map Prisma Action[] to lib/types.Action[]
        setActions(actionsData.map(action => ({
          ...action,
          goalId: action.goalId === null ? undefined : action.goalId, 
          description: action.description === null ? undefined : action.description, // Handle null for description
          assignee: action.assignee ? { 
            id: action.assignee.id, 
            name: action.assignee.name || 'N/A', 
            avatar: action.assignee.image || undefined 
          } : undefined,
          completedBy: action.completedBy ? { 
            id: action.completedBy.id, 
            name: action.completedBy.name || 'N/A', 
            avatar: action.completedBy.image || undefined 
          } : undefined,
          createdAt: new Date(action.createdAt),
          updatedAt: new Date(action.updatedAt),
          completedAt: action.completedAt ? new Date(action.completedAt) : undefined,
          dueDate: action.dueDate ? new Date(action.dueDate) : undefined,
          status: action.status as StepStatus, // Cast to StepStatus (assuming Action status maps to StepStatus)
          priority: action.priority as Priority | undefined, // Cast to Priority | undefined
        })));

      } catch (error) {
        console.error('Error fetching goal page data:', error);
        // Optionally set an error state to display to the user
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
            {goal.owner && ( // Add null check for goal.owner
              <Link href={`/profile/${goal.owner.id}`} className="flex items-center gap-2 group">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={goal.owner.image ?? undefined} alt={goal.owner.name ?? undefined} />
                  <AvatarFallback>{goal.owner.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Owner</p>
                  <p className="font-medium group-hover:underline">{goal.owner.name}</p>
                </div>
              </Link>
            )}
            {goal.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  {/* No .toDate() needed as it's already a Date object */}
                  <p className="font-medium">{goal.dueDate.toLocaleDateString()}</p>
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