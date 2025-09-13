"use client";

export const dynamic = 'force-dynamic';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, User, Flag, CheckCircle2, Calendar, AlertCircle, Plus, Clock, Users } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';

import type { Goal, Action, Initiative, GoalStatus, Priority, StepStatus } from '@/lib/types';
import { getGoalDetails, getInitiativeDetailsForGoalPage, getRelatedActions } from '@/app/actions/goalActions';
import { getInitiativeById } from '@/app/actions/initiativeActions';
import { SuggestedActionTag } from '@/components/initiatives/SuggestedActionTag';

const STEP_STATUSES: StepStatus[] = ["ToDo", "InProgress", "Blocked", "InReview", "Done"];

function ActionList({ actions, onActionStatusChange }: { actions: Action[], onActionStatusChange: (result: { action: Action, goal: Goal, initiativeProgress: number }) => void }) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  
  return (
    <div className="space-y-4">
      {actions.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No actions yet</h3>
            <p className="text-muted-foreground mb-4">Create your first action to start making progress on this goal.</p>
          </CardContent>
        </Card>
      ) : (
        actions.map((action) => {
          const canEditStatus = userId && (action.assignee?.id === userId);
          const getStatusIcon = (status: string) => {
            switch (status) {
              case 'Done': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
              case 'InProgress': return <Clock className="h-4 w-4 text-blue-500" />;
              case 'Blocked': return <AlertCircle className="h-4 w-4 text-red-500" />;
              default: return <Target className="h-4 w-4 text-muted-foreground" />;
            }
          };

          return (
            <Card key={action.id} className="hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(action.status)}
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                    </div>
                    {action.description && (
                      <CardDescription className="mt-2">{action.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={action.status === 'Done' ? 'default' : 'secondary'} className="shrink-0">
                      {action.status}
                    </Badge>
                    {canEditStatus && (
                      <Select
                        value={action.status}
                        onValueChange={async (newStatus) => {
                          if (newStatus === action.status) return;
                          try {
                            const response = await fetch('/api/actions/update', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ actionId: action.id, status: newStatus, completedById: userId }),
                            });
                            if (response.ok) {
                              const result = await response.json();
                              onActionStatusChange(result);
                            } else {
                              console.error('Failed to update action status');
                            }
                          } catch (error) {
                            console.error('Error updating action status:', error);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STEP_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                  {action.assignee && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={action.assignee.avatar} alt={action.assignee.name} />
                        <AvatarFallback className="text-xs">{action.assignee.name[0]}</AvatarFallback>
                      </Avatar>
                      <span>{action.assignee.name}</span>
                    </div>
                  )}
                  {action.dueDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {action.priority && (
                    <div className="flex items-center gap-1">
                      <Flag className={cn("h-4 w-4", 
                        action.priority === 'High' ? 'text-red-500' : 
                        action.priority === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                      )} />
                      <span>{action.priority} priority</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {action.status !== 'Done' ? (
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/actions/update', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ actionId: action.id, status: 'Done', completedById: userId }),
                          });
                          if (response.ok) {
                            const result = await response.json();
                            onActionStatusChange(result);
                          }
                        } catch (error) {
                          console.error('Error updating action status:', error);
                        }
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Mark Done
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/actions/update', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ actionId: action.id, status: 'InProgress', completedById: userId }),
                          });
                          if (response.ok) {
                            const result = await response.json();
                            onActionStatusChange(result);
                          }
                        } catch (error) {
                          console.error('Error reopening action:', error);
                        }
                      }}
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [initiative, setInitiative] = useState<Partial<Initiative> | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAddActionModalOpen, setIsAddActionModalOpen] = useState(false);
  const [newAction, setNewAction] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: '',
    assigneeId: ''
  });
  const [dueDatePickerOpen, setDueDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [initiativeMembers, setInitiativeMembers] = useState<{ id: string; name: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<Array<{ title: string; description: string }>>([]);
  const [selectedSuggestedAction, setSelectedSuggestedAction] = useState<{ title: string; description: string } | null>(null);

  const { data: session } = useSession();

  // Fetch goal data
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

        const goalData = await getGoalDetails(goalId);
        const initiativeData = await getInitiativeDetailsForGoalPage(initiativeId);
        const actionsData = await getRelatedActions(goalId);

        if (goalData) {
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
            status: goalData.status as GoalStatus,
            priority: goalData.priority as Priority | null | undefined,
          });
        }
        if (initiativeData) {
          setInitiative({
            id: initiativeData.id,
            title: initiativeData.title,
            imageUrl: initiativeData.imageUrl,
          });
        }
        setActions(actionsData.map(action => ({
          ...action,
          goalId: action.goalId === null ? undefined : action.goalId, 
          description: action.description === null ? undefined : action.description,
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
          status: action.status as StepStatus,
          priority: action.priority as Priority | undefined,
        })));

      } catch (error) {
        console.error('Error fetching goal page data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, params.goalId]);

  // Fetch initiative members
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

        setInitiativeMembers(members);
        setErrorMessage(null);
      } catch (error) {
        console.error('Error fetching initiative members:', error);
        setErrorMessage('An unexpected error occurred. Please try again later.');
      }
    };

    fetchInitiativeMembers();
  }, [params.id]);

  // Fetch suggested actions
  useEffect(() => {
    const fetchSuggestedActions = async () => {
      const goalId = params.goalId as string;
      if (!goalId) return;
      
      try {
        const response = await fetch(`/api/goals/${goalId}/suggest-actions`);
        if (response.ok) {
          const data = await response.json();
          setSuggestedActions(data);
        } else {
          setSuggestedActions([]);
        }
      } catch (error) {
        console.error('Error fetching suggested actions:', error);
        setSuggestedActions([]);
      }
    };

    fetchSuggestedActions();
  }, [params.goalId]);

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
          assigneeId: newAction.assigneeId,
        }),
      });

      if (response.ok) {
        const createdAction = await response.json();
        setActions((prevActions) => [...prevActions, createdAction]);
        setIsAddActionModalOpen(false);
        setNewAction({ title: '', description: '', dueDate: '', priority: '', assigneeId: '' });
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
    setNewAction(prevNewAction => ({
      ...prevNewAction,
      title: action.title,
      description: action.description,
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date instanceof Date) {
      setSelectedDate(date);
      setNewAction({ ...newAction, dueDate: date.toISOString() });
    }
  };

  if (loading) {
    return (
      <div className="w-full min-w-0 overflow-hidden">
        <AppSidebar 
          widgets={['userControls', 'navigation', 'suggestions', 'location', 'resources', 'footer']}
          context={{ type: 'goal', goalId: params.goalId as string }}
          onCollapseChange={setSidebarCollapsed}
        />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'}`}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-lg font-semibold">Loading goal details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!goal || !initiative) {
    return (
      <div className="w-full min-w-0 overflow-hidden">
        <AppSidebar 
          widgets={['userControls', 'navigation', 'suggestions', 'location', 'resources', 'footer']}
          context={{ type: 'error' }}
          onCollapseChange={setSidebarCollapsed}
        />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'}`}>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-semibold">Goal not found</p>
              <Button variant="secondary" className="mt-4" onClick={() => router.back()}>
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500 text-white';
      case 'InProgress':
        return 'bg-blue-500 text-white';
      case 'Blocked':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const isMember = initiativeMembers.some(member => member.id === session?.user?.id);
  const completedActions = actions.filter(a => a.status === 'Done').length;
  const progressPercentage = actions.length > 0 ? Math.round((completedActions / actions.length) * 100) : 0;

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <AppSidebar 
        widgets={['userControls', 'navigation', 'suggestions', 'location', 'resources', 'footer']}
        context={{ type: 'goal', goalId: goal.id, initiativeId: initiative.id }}
        onCollapseChange={setSidebarCollapsed}
      />
      
      <div className={`transition-all duration-300 px-4 lg:px-6 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'}`}>
        <div className="max-w-4xl mx-auto py-6">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <Link
              href={`/initiatives/${initiative.id}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {initiative.title}
            </Link>
          </div>

          {/* Goal Header Card */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="h-6 w-6 text-primary" />
                    <CardTitle className="text-2xl">{goal.title}</CardTitle>
                  </div>
                  {goal.description && (
                    <CardDescription className="text-base mt-2">{goal.description}</CardDescription>
                  )}
                </div>
                <Badge className={cn("ml-4 shrink-0", getStatusColor(goal.status))}>
                  {goal.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {goal.owner && (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={goal.owner.image ?? undefined} alt={goal.owner.name ?? undefined} />
                      <AvatarFallback>{goal.owner.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">Goal Owner</p>
                      <Link href={`/profile/${goal.owner.id}`} className="font-medium hover:underline">
                        {goal.owner.name}
                      </Link>
                    </div>
                  </div>
                )}
                
                {goal.dueDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium">{goal.dueDate.toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                
                {goal.priority && (
                  <div className="flex items-center gap-3">
                    <Flag className={cn("h-5 w-5", 
                      goal.priority === 'High' ? 'text-red-500' : 
                      goal.priority === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                    )} />
                    <div>
                      <p className="text-sm text-muted-foreground">Priority</p>
                      <p className="font-medium">{goal.priority}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <div className="flex items-center gap-2">
                      <Progress value={progressPercentage} className="h-2 flex-1" />
                      <span className="text-sm font-medium">{progressPercentage}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {completedActions} of {actions.length} actions complete
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Tabs defaultValue="actions" className="space-y-6">
            <TabsList>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="actions" className="space-y-6">
              {/* Actions Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">Goal Actions</h2>
                  <p className="text-sm text-muted-foreground">
                    Break down your goal into actionable steps
                  </p>
                </div>
                {isMember ? (
                  <Button onClick={() => setIsAddActionModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Action
                  </Button>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Join the initiative to add actions</p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link href={`/initiatives/${initiative.id}`}>
                        <Users className="h-4 w-4 mr-1" />
                        Join Initiative
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Suggested Actions */}
              {suggestedActions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Suggestions</CardTitle>
                    <CardDescription>
                      Here are some recommended actions to help achieve this goal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 flex-wrap">
                      {suggestedActions.map((action, index) => (
                        <SuggestedActionTag
                          key={index}
                          title={action.title}
                          description={action.description}
                          onClick={handleSuggestedActionClick}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions List */}
              <ActionList
                actions={actions}
                onActionStatusChange={(result) => {
                  setActions(prev =>
                    prev.map(a => a.id === result.action.id ? { ...a, ...result.action } : a)
                  );
                  setGoal(result.goal);
                  setInitiative(prev => prev ? { ...prev, progress: result.initiativeProgress } : prev);
                }}
              />
            </TabsContent>

            <TabsContent value="updates">
              <Card>
                <CardHeader>
                  <CardTitle>Updates</CardTitle>
                  <CardDescription>Progress updates and milestones for this goal</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">No updates yet.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                  <CardDescription>Discussion and feedback about this goal</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">No comments yet.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Add Action Modal */}
          <Dialog open={isAddActionModalOpen} onOpenChange={setIsAddActionModalOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Action</DialogTitle>
                <DialogDescription>
                  Define a specific action to help achieve this goal.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={selectedSuggestedAction?.title || newAction.title}
                    onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
                    placeholder="E.g., Research potential venues"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={selectedSuggestedAction?.description || newAction.description}
                    onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                    placeholder="Provide more details about the action"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date *</Label>
                    <Popover open={dueDatePickerOpen} onOpenChange={setDueDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Priority *</Label>
                    <Select
                      value={newAction.priority}
                      onValueChange={(value) => setNewAction({ ...newAction, priority: value })}
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
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Assignee</Label>
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
              </div>
              
              <DialogFooter>
                <Button variant="secondary" onClick={() => setIsAddActionModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAction}>Add Action</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Error Display */}
          {errorMessage && (
            <Card className="border-red-200 bg-red-50 mt-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-900">{errorMessage}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}