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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import type { Goal, Action, Initiative, GoalStatus, Priority, StepStatus, UserForDisplay } from '@/lib/types'; // Added UserForDisplay
import { getGoalDetails, getInitiativeDetailsForGoalPage, getRelatedActions } from '@/app/actions/goalActions';
import { getInitiativeById } from '@/app/actions/initiativeActions';
import { InitiativeMembershipClient } from '@/lib/types';
import { SuggestedActionTag } from '@/components/initiatives/SuggestedActionTag'; // Import SuggestedActionTag

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

  // State for suggested actions
  const [suggestedActions, setSuggestedActions] = useState<Array<{ title: string; description: string }>>([]);
  const [selectedSuggestedAction, setSelectedSuggestedAction] = useState<{ title: string; description: string } | null>(null);

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
        // Reset new action form state
        setNewAction({ title: '', description: '', dueDate: '', priority: '', assigneeId: '' });
        // Clear selected suggested action after creation
        setSelectedSuggestedAction(null);
      } else {
        console.error('Failed to add action');
      }
    } catch (error) {
      console.error('Error adding action:', error);
    }
  };

  const handleSuggestedActionClick = (action: { title: string; description: string }) => {
    setSelectedSuggestedAction(action);
    setIsAddActionModalOpen(true);
    // Also update the newAction state with the suggested action details
    setNewAction(prevNewAction => ({
      ...prevNewAction,
      title: action.title,
      description: action.description,
      // dueDate and priority are not part of the suggested action data, so they remain as is or require user input
    }));
  };

  // Effect to fetch suggested actions when the goalId changes
  useEffect(() => {
    const fetchSuggestedActions = async () => {
      const goalId = params.goalId as string;
      if (!goalId) return;
      console.log('Fetching suggested actions for goal:', goalId);
      try {
        const response = await fetch(`/api/goals/${goalId}/suggest-actions`);
        if (!response.ok) {
          console.error('Failed to fetch suggested actions:', response.statusText);
          setSuggestedActions([]); // Clear suggestions on error
          return;
        }
        const data = await response.json();
        setSuggestedActions(data);
      } catch (error) {
        console.error('Error fetching suggested actions:', error);
        setSuggestedActions([]); // Clear suggestions on error
      }
    };

    fetchSuggestedActions();
  }, [params.goalId, setSuggestedActions]); // Depend on params.goalId and setSuggestedActions

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
            <h2 className="text-xl font-semibold">Goal Actions</h2>
            <Button onClick={() => setIsAddActionModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Action
            </Button>
          </div>
          {/* Suggested Actions Section */}
          <div className="mt-6 p-4 rounded-md bg-muted/50">
            <h3 className="text-lg font-semibold mb-3">Recommended</h3>
            {/* Placeholder for suggested actions */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:flex-wrap">
              {suggestedActions.map((action, index) => (
                <SuggestedActionTag
                  key={index} // Using index as key here, consider a unique ID if available
                  title={action.title}
                  description={action.description}
                  onClick={handleSuggestedActionClick}
                />
              ))}
            </div>
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
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Action</DialogTitle>
              <DialogDescription>
                Define a new action for this goal. Click Add when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={selectedSuggestedAction?.title || newAction.title}
                  onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
                  placeholder="E.g., Research potential venues"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={selectedSuggestedAction?.description || newAction.description}
                  onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                  placeholder="Provide more details about the action"
                  className="col-span-3"
                />
              </div>
              {/* Due Date Picker */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">Due Date</Label>
                <Popover open={dueDatePickerOpen} onOpenChange={setDueDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {/* Priority Select */}
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="priority" className="text-right">Priority</Label>
                 <Select
                   value={newAction.priority}
                   onValueChange={(value) => setNewAction({ ...newAction, priority: value })} // Send case-sensitive values directly
                 >
                   <SelectTrigger className="col-span-3">
                     <SelectValue placeholder="Select Priority" />
                   </SelectTrigger>
                   <SelectContent>
                     {/* Assuming Priority enum has values like High, Medium, Low */}
                     <SelectItem value="High">High</SelectItem>
                     <SelectItem value="Medium">Medium</SelectItem>
                     <SelectItem value="Low">Low</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               {/* Assignee Select - New field for assigning actions */}
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="assignee" className="text-right">Assignee</Label>
                 <Select
                   value={newAction.assigneeId}
                   onValueChange={(value) => setNewAction({ ...newAction, assigneeId: value })}
                 >
                   <SelectTrigger className="col-span-3">
                     <SelectValue placeholder="Select Assignee" />
                   </SelectTrigger>
                   <SelectContent>
                     {initiativeMembers.map((member) => (
                       <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
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