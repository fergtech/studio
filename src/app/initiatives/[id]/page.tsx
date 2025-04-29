"use client";

import { useParams } from 'next/navigation';
import type { Initiative, ChatMessage } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Timestamp } from 'firebase/firestore'; // For mock data
import Image from 'next/image';
import { Users, Clock, Send, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

// Mock data (replace with actual data fetching)
const mockInitiatives: Record<string, Initiative> = {
  "1": {
    id: "1",
    title: "Community Garden Project",
    description: "Let's build a community garden together! We need volunteers for planting, watering, and maintenance. Our goal is to create a vibrant green space for everyone to enjoy and learn about sustainable gardening practices. We meet every Saturday morning.",
    imageUrl: "https://picsum.photos/seed/garden/800/400",
    roles: ["Gardener", "Volunteer", "Organizer", "Watering Crew", "Composter"],
    status: "Seeking Members",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
    creatorId: "user1",
    memberIds: ["user1", "user2"],
  },
  "2": {
    id: "2",
    title: "Youth Tech Workshop",
    description: "Organizing a weekend workshop to teach local kids basic coding skills using Scratch and Python. Looking for instructors and helpers to mentor the students. No experience needed for helpers, just enthusiasm!",
    imageUrl: "https://picsum.photos/seed/tech/800/400",
    roles: ["Developer", "Instructor", "Mentor", "Volunteer", "Logistics"],
    status: "Planning",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
    creatorId: "user3",
    memberIds: ["user3"],
  },
  "3": {
    id: "3",
    title: "Neighborhood Park Cleanup",
    description: "Join us this Saturday at 9 AM to clean up and beautify Miller Park. Bring gloves and enthusiasm! We'll provide trash bags and refreshments. Let's make our park shine!",
    imageUrl: "https://picsum.photos/seed/park/800/400",
    roles: ["Volunteer", "Community Member", "Team Lead"],
    status: "In Progress",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)), // 1 day ago
    creatorId: "user4",
    memberIds: ["user4", "user5", "user6", "user7"],
  },
   "4": {
    id: "4",
    title: "Local History Documentation",
    description: "Collecting stories and photos about the history of APG. Need researchers, writers, and interviewers to help preserve our local heritage. We aim to create a digital archive accessible to the public.",
    // No image provided for this one to test fallback
    roles: ["Researcher", "Writer", "Interviewer", "Historian", "Archivist"],
    status: "Idea",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
    creatorId: "user8",
    memberIds: ["user8"],
  },
};

const mockChatMessages: Record<string, ChatMessage[]> = {
  "1": [
    { id: 'm1', initiativeId: '1', senderId: 'user1', senderName: 'Alice', text: 'Welcome everyone! Excited to get this garden started.', timestamp: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000)) },
    { id: 'm2', initiativeId: '1', senderId: 'user2', senderName: 'Bob', text: 'Me too! I can bring some tools on Saturday.', timestamp: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)) },
  ],
  "2": [
     { id: 'm3', initiativeId: '2', senderId: 'user3', senderName: 'Charlie', text: 'Drafting the curriculum now. Anyone have suggestions for fun beginner projects?', timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)) },
  ],
   "3": [
    { id: 'm4', initiativeId: '3', senderId: 'user4', senderName: 'Diana', text: 'Reminder: Cleanup starts at 9 AM sharp tomorrow!', timestamp: Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 1000)) },
    { id: 'm5', initiativeId: '3', senderId: 'user5', senderName: 'Eve', text: 'Got my gloves ready!', timestamp: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)) },
    { id: 'm6', initiativeId: '3', senderId: 'user4', senderName: 'Diana', text: 'Great! See you all there.', timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000)) },
   ],
    "4": [
     { id: 'm7', initiativeId: '4', senderId: 'user8', senderName: 'Frank', text: 'Anyone know good resources for finding old APG photos?', timestamp: Timestamp.fromDate(new Date(Date.now() - 3 * 60 * 60 * 1000)) },
  ]
};

// Mock User Profile Data (Simplified)
const mockUsers: Record<string, { name: string; avatar?: string }> = {
  "user1": { name: "Alice" , avatar: "https://i.pravatar.cc/40?u=user1"},
  "user2": { name: "Bob" },
  "user3": { name: "Charlie", avatar: "https://i.pravatar.cc/40?u=user3" },
  "user4": { name: "Diana" },
  "user5": { name: "Eve", avatar: "https://i.pravatar.cc/40?u=user5" },
  "user6": { name: "Faythe" },
  "user7": { name: "Grace", avatar: "https://i.pravatar.cc/40?u=user7" },
  "user8": { name: "Frank" },
};


export default function InitiativeDetailPage() {
  const params = useParams();
  const initiativeId = params.id as string;

  // State for initiative data and chat messages
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch data on component mount (replace with actual fetching logic)
  useEffect(() => {
    if (initiativeId) {
      // Simulate fetching data
      const fetchedInitiative = mockInitiatives[initiativeId];
      const fetchedMessages = mockChatMessages[initiativeId] || [];
      setInitiative(fetchedInitiative);
      setMessages(fetchedMessages.sort((a, b) => a.timestamp.seconds - b.timestamp.seconds)); // Sort messages by timestamp
    }
     // In a real app, subscribe to real-time chat updates here
  }, [initiativeId]);


  const handleSendMessage = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!newMessage.trim() || !initiative) return;

     setIsSending(true);
     const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        initiativeId: initiative.id,
        senderId: 'currentUser', // Replace with actual logged-in user ID
        senderName: 'You', // Replace with actual logged-in user name
        text: newMessage,
        timestamp: Timestamp.now(),
     };

     // Optimistically update UI
     setMessages(prev => [...prev, tempMessage]);
     setNewMessage('');


     // Simulate sending to backend
     console.log("Sending message:", tempMessage);
     await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

     // Replace temp message with actual response if needed, or confirm success
     // In a real-time scenario, the backend would push the new message
     setIsSending(false);

      // Scroll to bottom after sending (optional)
      // Consider using a ref for the scroll area
      const scrollArea = document.getElementById('chat-scroll-area')?.children[0];
      if (scrollArea) {
        setTimeout(() => scrollArea.scrollTop = scrollArea.scrollHeight, 100);
      }
  };


  if (!initiative) {
    // TODO: Add a proper loading state skeleton
    return <div>Loading initiative...</div>;
  }

  const placeholderImage = "https://picsum.photos/seed/" + initiative.id + "/800/400";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Initiative Details Column */}
      <div className="lg:col-span-2 space-y-6">
         <Card className="overflow-hidden">
           <CardHeader className="p-0">
             <div className="relative h-64 w-full bg-muted">
               <Image
                 src={initiative.imageUrl || placeholderImage}
                 alt={initiative.title}
                 layout="fill"
                 objectFit="cover"
                 priority // Prioritize loading the main image
               />
             </div>
              <div className="p-6 pb-2">
                <CardTitle className="text-2xl font-bold mb-2">{initiative.title}</CardTitle>
                <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground mb-4">
                    <Badge variant="secondary" className="capitalize">{initiative.status}</Badge>
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {initiative.memberIds.length} Member{initiative.memberIds.length !== 1 ? 's' : ''}</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Created {initiative.createdAt.toDate().toLocaleDateString()}</span>
                </div>
              </div>
           </CardHeader>
            <CardContent className="p-6 pt-0">
                <h3 className="font-semibold mb-2 text-lg">About this Initiative</h3>
                <p className="text-foreground leading-relaxed mb-6">{initiative.description}</p>

                <h3 className="font-semibold mb-2 text-lg">Roles Needed</h3>
                 <div className="flex flex-wrap gap-2 mb-6">
                    {initiative.roles.map((role) => (
                        <Badge key={role} variant="outline">{role}</Badge>
                    ))}
                </div>

                 <h3 className="font-semibold mb-2 text-lg">Members</h3>
                <div className="flex flex-wrap gap-3">
                    {initiative.memberIds.map(userId => {
                        const user = mockUsers[userId];
                        return (
                            <div key={userId} className="flex items-center gap-2 text-sm" title={user?.name || 'Unknown User'}>
                                <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.avatar} alt={user?.name || 'User'} />
                                <AvatarFallback>{user?.name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <span className="hidden sm:inline">{user?.name || 'Unknown User'}</span>
                            </div>
                        );
                    })}
                </div>
           </CardContent>
           <CardFooter className="p-6 pt-2 border-t">
              {/* Placeholder for Join/Leave/Manage Button */}
              <Button className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="mr-2 h-4 w-4" /> Join Initiative
              </Button>
           </CardFooter>
         </Card>

         {/* Placeholder for Initiative Updates Feed */}
         <Card>
           <CardHeader>
             <CardTitle>Updates & Activity</CardTitle>
             <CardDescription>Latest progress and discussions within the initiative.</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="text-center text-muted-foreground py-8">
               <Info className="mx-auto h-8 w-8 mb-2" />
               <p>Initiative updates will appear here.</p>
               {/* Add update creation form/button here later */}
             </div>
           </CardContent>
         </Card>
      </div>

      {/* Chat Column */}
      <div className="lg:col-span-1 lg:sticky lg:top-24 self-start"> {/* Sticky chat */}
        <Card className="flex flex-col h-[calc(100vh-8rem)] max-h-[700px]"> {/* Fixed height for chat */}
          <CardHeader className="border-b">
            <CardTitle>Initiative Chat</CardTitle>
             <CardDescription>Real-time discussion for members.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0 overflow-hidden">
             <ScrollArea id="chat-scroll-area" className="h-full p-4">
               <div className="space-y-4">
                 {messages.map((msg) => (
                   <div key={msg.id} className={`flex gap-2 ${msg.senderId === 'currentUser' ? 'justify-end' : 'justify-start'}`}>
                      {msg.senderId !== 'currentUser' && (
                         <Avatar className="h-8 w-8">
                           <AvatarImage src={mockUsers[msg.senderId]?.avatar} alt={msg.senderName} />
                           <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                         </Avatar>
                      )}
                     <div className={`max-w-[75%] rounded-lg px-3 py-2 ${msg.senderId === 'currentUser' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                       <p className="text-sm">{msg.text}</p>
                       <p className={`text-xs mt-1 ${msg.senderId === 'currentUser' ? 'text-primary-foreground/80' : 'text-muted-foreground'} ${msg.senderId === 'currentUser' ? 'text-right' : 'text-left'}`}>
                         {msg.senderId !== 'currentUser' && <span className="font-medium mr-1">{msg.senderName}</span>}
                         {msg.timestamp.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                       </p>
                     </div>
                     {msg.senderId === 'currentUser' && (
                         <Avatar className="h-8 w-8">
                             {/* Current user avatar placeholder */}
                           <AvatarFallback>Y</AvatarFallback>
                         </Avatar>
                      )}
                   </div>
                 ))}
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
      </div>
    </div>
  );
}

// Helper function to format timestamp (optional, can use built-in Date methods)
function formatTimestamp(timestamp: Timestamp): string {
  return timestamp.toDate().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
