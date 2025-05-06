"use client";

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InitiativeCard } from '@/components/InitiativeCard';
import { GeneralPostCard } from '@/components/GeneralPostCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, X, GitCommit, MessageSquare, MessageCircle, UserPlus, PlusCircle, FileText, GitPullRequest, Target, ListChecks } from 'lucide-react'; // Added Target, ListChecks
import { cn } from '@/lib/utils';
// Added Milestone, Step types
import { UserProfile, Initiative, GeneralPost, ChatMessage, ContributionItem, ContributionType, Milestone, Step } from '@/lib/types'; 
// Import Timestamp
import { Timestamp } from 'firebase/firestore'; 
import { MilestoneList } from '@/components/MilestoneList'; // Import MilestoneList

// --- MOCK DATA (Keep only necessary mocks like users and chat) ---

// Mock User Profile Data (Simplified) - Needed for chat sender info and potentially creator info if not passed
const mockUsers: Record<string, { name: string; avatar?: string }> = {
  "user1": { name: "Alice" , avatar: "https://i.pravatar.cc/40?u=user1"},
  "user2": { name: "Bob" },
  "user3": { name: "Charlie", avatar: "https://i.pravatar.cc/40?u=user3" },
  "user4": { name: "Diana" },
  "user5": { name: "Eve", avatar: "https://i.pravatar.cc/40?u=user5" },
  "user6": { name: "Faythe" },
  "user7": { name: "Grace", avatar: "https://i.pravatar.cc/40?u=user7" },
  "user8": { name: "Frank" },
  "currentUser": { name: "You", avatar: "https://i.pravatar.cc/40?u=currentUser" },
  // Ensure the profile user is included if needed elsewhere
  // "user123": { name: "Alice Wonderland", avatar: `https://i.pravatar.cc/40?u=user123` }, 
};

// Mock Chat Messages (Example) - Use Timestamp objects
const mockChatMessages: ChatMessage[] = [
  { id: 'dm1', initiativeId: undefined, senderId: 'user123', senderName: 'Alice Wonderland', text: `Hey! Saw your profile.`, timestamp: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)) }, 
  { id: 'dm2', initiativeId: undefined, senderId: 'currentUser', senderName: 'You', text: `Hi Alice! Thanks for reaching out.`, timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000)) }, 
];
// --- END MOCK DATA ---

// Helper function to get an icon based on contribution type
const getContributionIcon = (type: ContributionType) => {
  switch (type) {
    case 'commit':
    case 'code_commit':
      return <GitCommit className="h-4 w-4 text-muted-foreground" />;
    case 'pull_request':
      return <GitPullRequest className="h-4 w-4 text-muted-foreground" />;
    case 'post':
    case 'post_creation':
      return <FileText className="h-4 w-4 text-muted-foreground" />;
    case 'comment':
    case 'issue_comment':
      return <MessageCircle className="h-4 w-4 text-muted-foreground" />;
    case 'initiative_join':
      return <UserPlus className="h-4 w-4 text-muted-foreground" />;
    case 'initiative_creation':
      return <PlusCircle className="h-4 w-4 text-muted-foreground" />;
    // Add cases for new contribution types if specific icons are desired
    case 'step_completion':
      return <ListChecks className="h-4 w-4 text-muted-foreground" />; // Example icon
    case 'resource_share':
      return <FileText className="h-4 w-4 text-muted-foreground" />; // Example icon (same as post)
    default:
      return <MessageSquare className="h-4 w-4 text-muted-foreground" />; // Default icon
  }
};

// Client component that handles UI rendering
export function ProfileClient({ 
  userId, 
  user, 
  initiatives, 
  posts, 
  contributions,
  milestones, // Added milestones prop
  steps,        // Added steps prop (not used in UI yet)
  isCurrentUser = false, // New prop
  background = [] // New prop
}: { 
  userId: string;
  user: UserProfile;  
  initiatives: Initiative[];
  posts: GeneralPost[];
  contributions: ContributionItem[];
  milestones: Milestone[]; // Added type
  steps: Step[];          // Added type
  isCurrentUser?: boolean;
  background?: any[];
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState(''); 
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Initialize empty, fetch in useEffect

  // Add profile user to mockUsers if not already present from props/context
  useEffect(() => {
    if (user && !mockUsers[user.id]) {
      mockUsers[user.id] = { name: user.name, avatar: `https://i.pravatar.cc/40?u=${user.id}` };
    }
  }, [user]);


  useEffect(() => {
    if (isChatOpen) {
      console.log(`Fetching chat history between currentUser and ${userId}`);
      // Simulate fetching messages (replace with actual API call)
      // Sort messages by Timestamp
      const sortedMessages = [...mockChatMessages].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
      setMessages(sortedMessages);
    }
  }, [isChatOpen, userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    const tempMessage: ChatMessage = {
       id: `temp-${Date.now()}`,
       initiativeId: undefined, // Direct message
       senderId: 'currentUser', // Replace with actual logged-in user ID
       senderName: 'You', // Replace with actual logged-in user name
       text: newMessage,
       timestamp: Timestamp.now(), // Use Firestore Timestamp
    };

    // Optimistically update UI
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    // Simulate sending to backend (replace with actual API call)
    console.log(`Sending DM to ${userId}:`, tempMessage);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    setIsSending(false);

     // Scroll to bottom after sending
     const scrollArea = document.getElementById('profile-chat-scroll-area')?.children[0];
     if (scrollArea) {
       setTimeout(() => scrollArea.scrollTop = scrollArea.scrollHeight, 100);
     }
 };

  // Filter milestones relevant to the initiatives displayed on this profile
  const initiativeIdsOnProfile = initiatives.map(init => init.id);
  // Ensure milestones prop is correctly typed or cast if necessary after conversion
  const relevantMilestones = (milestones || []).filter(m => initiativeIdsOnProfile.includes(m.initiativeId));

  // Helper to safely convert Timestamp | string to Date for formatting
  const safeToDate = (dateInput: Timestamp | string | undefined): Date | null => {
    if (!dateInput) return null;
    if (dateInput instanceof Timestamp) return dateInput.toDate();
    try {
      // Attempt to parse string as ISO 8601 date
      const date = new Date(dateInput);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string encountered:", dateInput);
        return null;
      }
      return date;
    } catch (e) {
      console.error("Error parsing date string:", dateInput, e);
      return null; // Handle invalid date strings
    }
  };


  return (
    <div className="container mx-auto px-4 py-8 relative pb-24"> 
      {/* Highlights/Summary Card - MOVED HERE */}
      <div className="mb-8 max-w-3xl mx-auto">
        <div className="relative bg-card/80 rounded-xl shadow p-6 flex flex-col md:flex-row gap-6 items-center md:items-start overflow-hidden">
          {/* Blurred background image */}
          <div
            className="absolute inset-0 blur-2xl opacity-30 brightness-75"
            style={{
              backgroundImage: `url(https://i.pravatar.cc/100?u=${userId})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-hidden="true"
          />
          {/* Card content */}
          <div className="relative z-10 w-full flex flex-col items-center text-center">
            <img src={`https://i.pravatar.cc/100?u=${userId}`} alt={user.name} className="rounded-full h-24 w-24 border-4 border-background mb-3" />
            <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
            <div className="text-sm text-muted-foreground mb-2">Member since March 2024</div>
            {user.bio && (
              <p className="text-sm text-foreground mb-3">{user.bio}</p>
            )}
            <div className="mb-2">
              <span className="font-medium">Top Skills:</span> {user.skills.slice(0,3).map(skill => <span key={skill} className="inline-block bg-muted rounded px-2 py-0.5 text-xs ml-1">{skill}</span>)}
            </div>
            <div className="mb-2">
              <span className="font-medium">Top Interests:</span> {user.interests.slice(0,3).map(interest => <span key={interest} className="inline-block bg-muted rounded px-2 py-0.5 text-xs ml-1">{interest}</span>)}
            </div>
            <div className="mb-2">
              <span className="font-medium">Recent Initiatives:</span> {initiatives.slice(0,2).map(init => <span key={init.id} className="inline-block bg-muted rounded px-2 py-0.5 text-xs ml-1">{init.title}</span>)}
            </div>
            <div className="flex gap-2 mt-4 justify-center">
              <Button className="bg-primary text-primary-foreground rounded px-4 py-2 text-sm font-medium shadow hover:bg-primary/90 transition-colors">Connect</Button>
              {/* Add onClick handler to Message button */}
              <Button 
                onClick={() => setIsChatOpen(true)} 
                className="bg-muted text-foreground rounded px-4 py-2 text-sm font-medium shadow hover:bg-muted/80 transition-colors"
              >
                Message
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */} 
      <Tabs defaultValue={isCurrentUser ? "progress" : "initiatives"} className="w-full"> 
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted/40 scrollbar-track-transparent">
          <TabsList className="flex w-full min-w-[500px] whitespace-nowrap">
            {isCurrentUser && <TabsTrigger value="progress" className="min-w-max">Progress</TabsTrigger>}
            <TabsTrigger value="initiatives" className="min-w-max">Initiatives</TabsTrigger>
            <TabsTrigger value="posts" className="min-w-max">Posts</TabsTrigger>
            <TabsTrigger value="contributions" className="min-w-max">Contributions</TabsTrigger>
            {background && background.length > 0 && <TabsTrigger value="background" className="min-w-max">Background</TabsTrigger>}
          </TabsList>
        </div>
        
        {/* Progress Tab */} 
        {isCurrentUser && (
          <TabsContent value="progress" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Initiative Milestones</CardTitle>
                <CardDescription>
                  Overview of milestones across initiatives you're involved in. 
                  <span className="text-xs block italic mt-1">(Note: This view will be refined on individual initiative pages)</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Progress Summary Section */}
                {(() => {
                  // Gather stats
                  const totalMilestones = relevantMilestones.length;
                  const completedMilestones = relevantMilestones.filter(m => m.status === 'Completed').length;
                  // Steps: get all steps for these milestones
                  const milestoneIds = relevantMilestones.map(m => m.id);
                  const relevantSteps = (steps || []).filter(s => milestoneIds.includes(s.milestoneId));
                  const totalSteps = relevantSteps.length;
                  const completedSteps = relevantSteps.filter(s => s.status === 'Done').length;
                  const milestoneProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
                  return (
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-6 items-center mb-2">
                        <div className="text-sm"><strong>{completedMilestones}</strong> / {totalMilestones} milestones completed</div>
                        <div className="text-sm"><strong>{completedSteps}</strong> / {totalSteps} steps completed</div>
                      </div>
                      <div className="w-full bg-muted/30 rounded-full h-2 mb-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${milestoneProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">Milestone progress: {milestoneProgress}%</div>
                    </div>
                  );
                })()}
                <MilestoneList milestones={relevantMilestones} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Initiatives Tab */}
        <TabsContent value="initiatives" className="mt-6">
          {initiatives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {initiatives.map(initiative => (
                <InitiativeCard 
                  key={initiative.id} 
                  initiative={initiative} 
                  // Use mockUsers for creator info if creator isn't the profile user
                  creatorName={initiative.creatorId === userId ? user.name : mockUsers[initiative.creatorId]?.name || "Creator"}
                  creatorAvatarUrl={initiative.creatorId === userId ? `https://i.pravatar.cc/150?u=${userId}` : mockUsers[initiative.creatorId]?.avatar}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No initiatives yet</p>
            </div>
          )}
        </TabsContent>
        
        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-6">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <GeneralPostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          )}
        </TabsContent>

        {/* Contributions Tab */} 
        <TabsContent value="contributions" className="mt-6">
           {contributions && contributions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Contributions</CardTitle>
                <CardDescription>Activity across initiatives and platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-6"> 
                  {contributions.map((item) => {
                    const contributionDate = safeToDate(item.date); // Use helper
                    return (
                      <li key={item.id} className="flex items-start space-x-4"> 
                        <div className="mt-1"> 
                          {getContributionIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-snug"> 
                            {item.link ? (
                              <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">
                                {item.title}
                              </a>
                            ) : (
                              item.title
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2"> 
                            <span className="capitalize">{item.type.replace(/_/g, ' ')}</span>
                            <span>&middot;</span> 
                            {/* Format date safely */}
                            <span>
                              {contributionDate 
                                ? contributionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                : 'Invalid Date'}
                            </span> 
                          </p>
                          {item.details && (
                            <p className="mt-2 text-sm text-foreground/80"> 
                              {item.details}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No contributions recorded yet.</p>
            </div>
          )}
        </TabsContent>

        {/* Background Tab */}
        {background && background.length > 0 && (
          <TabsContent value="background" className="mt-6">
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">Background</h3>
              {/* Work Experience */}
              {background.filter(item => item.type === 'work').length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-2">Work Experience</h4>
                  <ul className="space-y-4">
                    {background.filter(item => item.type === 'work').map((item, idx) => (
                      <li key={idx} className="bg-muted/50 rounded-lg p-4">
                        <div className="font-medium text-base">{item.title} <span className="text-muted-foreground">@ {item.organization}</span></div>
                        <div className="text-xs text-muted-foreground mb-1">{item.startDate} - {item.endDate}</div>
                        <div className="text-sm">{item.description}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Degrees */}
              {background.filter(item => item.type === 'degree').length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-2">Education</h4>
                  <ul className="space-y-4">
                    {background.filter(item => item.type === 'degree').map((item, idx) => (
                      <li key={idx} className="bg-muted/50 rounded-lg p-4">
                        <div className="font-medium text-base">{item.title} <span className="text-muted-foreground">@ {item.institution}</span></div>
                        <div className="text-xs text-muted-foreground mb-1">{item.startDate} - {item.endDate}</div>
                        <div className="text-sm">{item.description}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Accolades */}
              {background.filter(item => item.type === 'accolade').length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold mb-2">Accolades</h4>
                  <ul className="space-y-4">
                    {background.filter(item => item.type === 'accolade').map((item, idx) => (
                      <li key={idx} className="bg-muted/50 rounded-lg p-4">
                        <div className="font-medium text-base">{item.title}</div>
                        <div className="text-xs text-muted-foreground mb-1">{item.date}</div>
                        <div className="text-sm">{item.description}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Chat Pop-up */} 
      <div
        className={cn(
          "fixed bottom-0 right-0 z-50 m-0 sm:m-4 transition-transform duration-300 ease-out",
          "w-full sm:w-96", 
          isChatOpen ? "translate-y-0" : "translate-y-full" 
        )}
      >
        {isChatOpen && ( 
          <Card className="flex flex-col h-[60vh] max-h-[500px] shadow-xl border"> 
            <CardHeader className="border-b flex flex-row items-center justify-between p-4">
              <div>
                <CardTitle className="text-lg">Chat with {user.name}</CardTitle>
                <CardDescription className="text-sm">Direct Message</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatOpen(false)}
                aria-label="Close Chat"
                className="text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex-grow p-0 overflow-hidden">
              <ScrollArea id="profile-chat-scroll-area" className="h-full p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const messageDate = safeToDate(msg.timestamp); // Use helper
                    return (
                      <div key={msg.id} className={`flex gap-2 ${msg.senderId === 'currentUser' ? 'justify-end' : 'justify-start'}`}>
                        {msg.senderId !== 'currentUser' && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={mockUsers[msg.senderId]?.avatar || `https://i.pravatar.cc/40?u=${msg.senderId}`} alt={msg.senderName} />
                              <AvatarFallback>{msg.senderName?.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                        )}
                        <div className={`max-w-[75%] rounded-lg px-3 py-2 ${msg.senderId === 'currentUser' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p className="text-sm">{msg.text}</p>
                          <p className={`text-xs mt-1 ${msg.senderId === 'currentUser' ? 'text-primary-foreground/80' : 'text-muted-foreground'} ${msg.senderId === 'currentUser' ? 'text-right' : 'text-left'}`}>
                            {/* Format date safely */}
                            {messageDate 
                              ? messageDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                              : 'Invalid Time'}
                          </p>
                        </div>
                        {msg.senderId === 'currentUser' && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={mockUsers[msg.senderId]?.avatar} alt={msg.senderName} />
                              <AvatarFallback>{msg.senderName?.charAt(0) || 'Y'}</AvatarFallback>
                            </Avatar>
                        )}
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">No messages yet. Start the conversation!</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow"
                  disabled={isSending}
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send Message</span>
                </Button>
              </form>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}