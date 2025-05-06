"use client"; // Mark this page as a Client Component

import { InitiativeCard } from "@/components/InitiativeCard";
import { GeneralPostCard } from "@/components/GeneralPostCard"; // Import the new card
import { CreatePostForm } from "@/components/CreatePostForm"; // Import the form
import type { Initiative, GeneralPost, FeedItem } from "@/lib/types"; // Import necessary types
import { Timestamp } from 'firebase/firestore'; // Import Timestamp if needed for mock data

// Mock data for demonstration purposes
// ... existing mockInitiatives ...

// Mock User Profile Data (Simplified) - Moved here to be accessible
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


// ... existing mockInitiatives definition, ensure IDs are unique (e.g., prefix with 'init-') ...
const mockInitiatives: Initiative[] = [
  {
    id: "init-1", // Prefix IDs to avoid clashes
    title: "Community Garden Project: Sowing Seeds for a Greener Tomorrow", // Longer title example
    description: "Let's build a community garden together! We need volunteers for planting, watering, and maintenance. Join us in cultivating fresh produce and friendships.",
    imageUrl: "https://picsum.photos/seed/garden/600/800", // Adjusted image size for taller card
    roles: ["Gardener", "Volunteer", "Organizer", "Watering Crew", "Composter", "Educator"],
    status: "Seeking Members",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // More realistic timestamps
    creatorId: "user1",
    memberIds: ["user1", "user2"],
  },
  {
    id: "init-2",
    title: "Youth Tech Workshop: Inspiring Future Innovators",
    description: "Organizing a weekend workshop to teach local kids basic coding skills. Looking for instructors and helpers to ignite passion for technology.",
    imageUrl: "https://picsum.photos/seed/tech/600/800",
    roles: ["Developer", "Instructor", "Mentor", "Volunteer"],
    status: "Planning",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    creatorId: "user3",
    memberIds: ["user3"],
  },
  {
    id: "init-3",
    title: "Neighborhood Park Cleanup: Making Our Community Shine",
    description: "Join us this Saturday to clean up and beautify Miller Park. Bring gloves and enthusiasm! Let's create a cleaner, greener space for all.",
    imageUrl: "https://picsum.photos/seed/park/600/800",
    roles: ["Volunteer", "Community Member", "Team Lead"],
    status: "In Progress",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
    creatorId: "user4",
    memberIds: ["user4", "user5", "user6", "user7"],
  },
    {
    id: "init-4",
    title: "Local History Documentation: Preserving APG's Heritage",
    description: "Collecting stories and photos about the history of APG. Need researchers, writers, and interviewers to help safeguard our past for future generations.",
    imageUrl: "https://picsum.photos/seed/history/600/800",
    roles: ["Researcher", "Writer", "Interviewer", "Historian", "Archivist"],
    status: "Idea",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
    creatorId: "user8",
    memberIds: ["user8"],
  },
];

// New Mock General Posts
const mockGeneralPosts: GeneralPost[] = [
  {
    id: "post-1",
    creatorId: "user5",
    creatorName: mockUsers["user5"].name,
    creatorAvatar: mockUsers["user5"].avatar,
    content: "I've noticed so many elderly neighbors struggling with technology during the pandemic. What if we organized weekend tech help sessions at the community center? I could volunteer a few hours - who's with me?",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000)), // 6 hours ago
  },
  {
    id: "post-2",
    creatorId: "user7",
    creatorName: mockUsers["user7"].name,
    creatorAvatar: mockUsers["user7"].avatar,
    content: "Thinking about starting a book club focused on local authors. Anyone interested?",
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000)), // 1.5 days ago
  },
  {
    id: "post-3",
    creatorId: "user1",
    creatorName: mockUsers["user1"].name,
    creatorAvatar: mockUsers["user1"].avatar,
    content: "Just walked past that empty lot on Maple Street again. It could be such a beautiful community space if we put our minds to it. Anyone else think we should transform it into something useful?",
    media: [{ url: "https://picsum.photos/seed/sunset/800/600", type: 'image' }],
    timestamp: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
  },
];


// Helper function to check if an item is a GeneralPost
function isGeneralPost(item: FeedItem): item is GeneralPost {
  // Check for properties unique to GeneralPost and not present in Initiative
  return 'content' in item && !('title' in item);
}

export default function Home() {
  // Combine and sort feed items
  const feedItems: FeedItem[] = [...mockInitiatives, ...mockGeneralPosts]
    .sort((a, b) => {
      // Use 'createdAt' for Initiatives and 'timestamp' for GeneralPosts
      const timeA = 'createdAt' in a ? a.createdAt.toMillis() : a.timestamp.toMillis();
      const timeB = 'createdAt' in b ? b.createdAt.toMillis() : b.timestamp.toMillis();
      return timeB - timeA; // Sort descending (newest first)
    });

  const users = mockUsers; // Access the mock user data

  // Placeholder function for when a post is created
  const handlePostCreated = () => {
    console.log("New post created! (In a real app, refresh feed here)");
    // Here you would typically refetch the feed data
  };

  return (
      // Single column centered layout for feed
      <div className="flex flex-col items-center space-y-6 w-full max-w-xl mx-auto"> {/* Centered column, adjusted max-width */}
        {/* Add the Create Post Form */}
        <div className="w-full">
           <CreatePostForm onPostCreated={handlePostCreated} />
        </div>

        {/* Render combined feed */}
        {feedItems.map((item) => {
          if (isGeneralPost(item)) {
            // Render General Post Card
            return (
              <div key={item.id} className="w-full">
                <GeneralPostCard post={item} />
              </div>
            );
          } else {
            // Render Initiative Card (item is Initiative)
            const creator = users[item.creatorId];
            const creatorName = creator?.name || 'Unknown Creator';
            const creatorAvatarUrl = creator?.avatar;
            return (
              <div key={item.id} className="w-full">
                 <InitiativeCard
                    initiative={item}
                    creatorName={creatorName}
                    creatorAvatarUrl={creatorAvatarUrl}
                 />
              </div>
            );
          }
        })}
      </div>
  );
}
