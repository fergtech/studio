"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { ArrowLeft, Tag, User, Flag, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { Goal, Action, Initiative, GoalStatus, Priority, StepStatus } from '@/lib/types'; // Added GoalStatus, Priority, StepStatus
import { getGoalDetails, getInitiativeDetailsForGoalPage, getRelatedActions } from '@/app/actions/goalActions';
import { getInitiativeById } from '@/app/actions/initiativeActions';
import { InitiativeMembershipClient } from '@/lib/types';

function ActionList({ actions, onActionStatusChange }: { actions: Action[], onActionStatusChange: (actionId: string, status: string) => void }) {
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
          <CardContent className="p-4 pt-0 flex flex-wrap gap-4"> {/* Added flex-wrap to prevent overlapping */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {action.assignee && (
                <div className="flex items-center gap-2">
                  <span>{action.assignee.name}</span>
                </div>
              )}
              {action.dueDate && (
                <div className="flex items-center gap-2">
                  <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>
                </div>
              )}
              {action.priority && (
                <div className="flex items-center gap-2">
                  <span>Priority: {action.priority}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="p-4">
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  const url = `/api/actions/update`;
                  console.log('Sending PATCH request to:', url);
                  const response = await fetch(url, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ actionId: action.id, status: 'Done' }),
                  });

                  if (response.ok) {
                    const updatedAction = await response.json();
                    onActionStatusChange(action.id, updatedAction.status);
                  } else {
                    console.error('Failed to update action status');
                  }
                } catch (error) {
                  console.error('Error updating action status:', error);
                }
              }}
            >
              Mark as Done
            </Button>
          </CardFooter>
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
  const [isAddActionModalOpen, setIsAddActionModalOpen] = useState(false);
  const [newAction, setNewAction] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: '',
    assigneeId: '' // Added assigneeId property
  });
  const [dueDatePickerOpen, setDueDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [initiativeMembers, setInitiativeMembers] = useState<{ id: string; name: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
            imageUrl: initiativeData.imageUrl, // Ensure imageUrl is included
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

  useEffect(() => {
    const fetchInitiativeMembers = async () => {
      try {
        const initiativeId = params.id as string;
        if (!initiativeId) {
          console.error('Missing initiative ID');
          setErrorMessage('Initiative ID is missing.');
          setInitiativeMembers([]);
          return;
        }

        const response = await getInitiativeById(initiativeId);
        if (!response || response.error || !response.initiative) {
          const errorMessage = response?.error || 'Failed to fetch initiative data.';
          console.error(`Failed to fetch initiative members: ${errorMessage}`);
          setErrorMessage(errorMessage);
          setInitiativeMembers([]);
          return;
        }

        const members = response.initiative.memberships?.map((membership) => ({
          id: membership.user.id,
          name: membership.user.name || 'Unknown',
        })) || [];

        console.log('Formatted members:', members); // Log the formatted members
        setInitiativeMembers(members);
        setErrorMessage(null); // Clear any previous error messages
      } catch (error) {
        console.error('Error fetching initiative members:', error);
        setErrorMessage('An unexpected error occurred. Please try again later.');
      }
    };

    fetchInitiativeMembers();
  }, [params.id]);

  const handleAddAction = async () => {
    if (!newAction.title || !newAction.dueDate || !newAction.priority) {
      alert('Please fill in all required fields: Title, Due Date, and Priority.');
      return;
    }

    try {
      const response = await fetch(`/api/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAction,
          goalId: params.goalId,
          initiativeId: params.id,
          assigneeId: newAction.assigneeId, // Include assigneeId in the payload
        }),
      });

      if (response.ok) {
        const createdAction = await response.json();
        setActions((prevActions) => [...prevActions, createdAction]);
        setIsAddActionModalOpen(false);
        setNewAction({ title: '', description: '', dueDate: '', priority: '', assigneeId: '' });
      } else {
        console.error('Failed to add action');
      }
    } catch (error) {
      console.error('Error adding action:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // Added null checks for `goal` and its properties
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

  const handleDateSelect = (date: Date | undefined) => {
    if (date instanceof Date) {
      setSelectedDate(date);
      setNewAction({ ...newAction, dueDate: date.toISOString() });
    }
  };

  return (
    <div>
      {/* Initiative Header Image */}
      <div className="relative h-64 w-full mb-[-2rem]"> {/* Adjust height for better visibility */}
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
            className="inline-flex items-center text-white bg-black/50 backdrop-blur-sm px-3 py-1 rounded hover:bg-black/70 transition-colors text-sm shadow-md"
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
              {/* Updated component rendering with optional chaining */}
              <CardTitle className="text-2xl mb-2">{goal?.title}</CardTitle>
              <CardDescription className="text-lg">{goal?.description}</CardDescription>
            </div>
            <Badge variant="outline" className={`${getStatusColor(goal?.status)} text-white`}>
              {goal?.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Updated Owner Display */}
            {goal.owner && (
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
            {goal?.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  {/* No .toDate() needed as it's already a Date object */}
                  <p className="font-medium">{goal.dueDate.toLocaleDateString()}</p>
                </div>
              </div>
            )}
            {goal?.priority && (
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <p className="font-medium">{goal.priority}</p>
                </div>
              </div>
            )}
            {goal?.progress !== undefined && (
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
        </TabsList>

        <TabsContent value="actions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Related Actions</h2>
            <Button onClick={() => setIsAddActionModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Action
            </Button>
          </div>
          <ActionList actions={actions} onActionStatusChange={(actionId, status) => {
            setActions((prevActions) =>
              prevActions.map((a) => (a.id === actionId ? { ...a, status: status as StepStatus } : a))
            );
          }} />
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

        {/* Add Action Modal */}
        <Dialog open={isAddActionModalOpen} onOpenChange={setIsAddActionModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Action</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Title"
                value={newAction.title}
                onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                value={newAction.description}
                onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
              />
              {/* Updated Due Date Field */}
              <Popover open={dueDatePickerOpen} onOpenChange={setDueDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {selectedDate ? selectedDate.toLocaleString() : "Pick a due date and time"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="p-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date instanceof Date) {
                          setSelectedDate(date);
                        }
                      }}
                    />
                    <div className="mt-4">
                      <label htmlFor="time" className="block text-sm font-medium text-muted-foreground">Select Time</label>
                      <input
                        id="time"
                        type="time"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        onChange={(e) => {
                          if (selectedDate) {
                            const [hours, minutes] = e.target.value.split(":");
                            const updatedDate = new Date(selectedDate);
                            updatedDate.setHours(parseInt(hours, 10));
                            updatedDate.setMinutes(parseInt(minutes, 10));
                            setSelectedDate(updatedDate);
                            setNewAction({ ...newAction, dueDate: updatedDate.toISOString() });
                          }
                        }}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {/* Updated priority dropdown to send enum values */}
              <Select
                value={newAction.priority}
                onValueChange={(value) => setNewAction({ ...newAction, priority: value })} // Send case-sensitive values directly
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              {/* Assignee Select - New field for assigning actions */}
              <Select
                value={newAction.assigneeId}
                onValueChange={(value) => setNewAction({ ...newAction, assigneeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Assignee" />
                </SelectTrigger>
                <SelectContent>
                  {initiativeMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsAddActionModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAction}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tabs>

      {/* Error Message Display - Shown when errorMessage is set */}
      {errorMessage && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-lg font-semibold mt-4">{errorMessage}</p>
            <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}