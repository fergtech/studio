import { InitiativeCard } from "@/components/InitiativeCard";
import type { Initiative } from "@/lib/types";
import { Timestamp } from 'firebase/firestore'; // Import Timestamp if needed for mock data

// Mock data for demonstration purposes
const mockInitiatives: Initiative[] = [
  {
    id: "1",
    title: "Community Garden Project",
    description: "Let's build a community garden together! We need volunteers for planting, watering, and maintenance.",
    imageUrl: "https://picsum.photos/seed/garden/600/300", // Adjusted image size for single column
    roles: ["Gardener", "Volunteer", "Organizer", "Watering Crew"],
    status: "Seeking Members",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // More realistic timestamps
    creatorId: "user1",
    memberIds: ["user1", "user2"],
  },
  {
    id: "2",
    title: "Youth Tech Workshop",
    description: "Organizing a weekend workshop to teach local kids basic coding skills. Looking for instructors and helpers.",
    imageUrl: "https://picsum.photos/seed/tech/600/300",
    roles: ["Developer", "Instructor", "Mentor", "Volunteer"],
    status: "Planning",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    creatorId: "user3",
    memberIds: ["user3"],
  },
  {
    id: "3",
    title: "Neighborhood Park Cleanup",
    description: "Join us this Saturday to clean up and beautify Miller Park. Bring gloves and enthusiasm!",
    imageUrl: "https://picsum.photos/seed/park/600/300",
    roles: ["Volunteer", "Community Member"],
    status: "In Progress",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
    creatorId: "user4",
    memberIds: ["user4", "user5", "user6", "user7"],
  },
    {
    id: "4",
    title: "Local History Documentation",
    description: "Collecting stories and photos about the history of APG. Need researchers, writers, and interviewers.",
    imageUrl: "https://picsum.photos/seed/history/600/300",
    roles: ["Researcher", "Writer", "Interviewer", "Historian"],
    status: "Idea",
    createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)),
    creatorId: "user8",
    memberIds: ["user8"],
  },
];


export default function Home() {
  // In a real app, fetch initiatives from a backend/database
  const initiatives = mockInitiatives;

  return (
      // Single column centered layout
      <div className="flex flex-col items-center space-y-6">
        {initiatives.map((initiative) => (
          // Constrain card width for better single-column readability
          <div key={initiative.id} className="w-full max-w-xl">
             <InitiativeCard initiative={initiative} />
          </div>
        ))}
      </div>
  );
}
