import { InitiativeCard } from "@/components/InitiativeCard";
import type { Initiative } from "@/lib/types";
import { Timestamp } from 'firebase/firestore'; // Import Timestamp if needed for mock data

// Mock data for demonstration purposes
const mockInitiatives: Initiative[] = [
  {
    id: "1",
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
    id: "2",
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
    id: "3",
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
    id: "4",
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


export default function Home() {
  // In a real app, fetch initiatives and user data from a backend/database
  const initiatives = mockInitiatives;
  const users = mockUsers; // Access the mock user data

  return (
      // Single column centered layout for feed
      <div className="flex flex-col items-center space-y-8"> {/* Increased spacing */}
        {initiatives.map((initiative) => {
          // Find the creator's details
          const creator = users[initiative.creatorId];
          const creatorName = creator?.name || 'Unknown Creator';
          const creatorAvatarUrl = creator?.avatar;

          return (
            // Constrain card width for a vertical, feed-like appearance
            <div key={initiative.id} className="w-full max-w-md"> {/* Adjusted max-width */}
               <InitiativeCard
                  initiative={initiative}
                  creatorName={creatorName}
                  creatorAvatarUrl={creatorAvatarUrl}
               />
            </div>
          );
        })}
      </div>
  );
}
