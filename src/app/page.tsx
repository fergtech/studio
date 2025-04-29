import { InitiativeCard } from "@/components/InitiativeCard";
import type { Initiative } from "@/lib/types";
import { Timestamp } from 'firebase/firestore'; // Import Timestamp if needed for mock data

// Mock data for demonstration purposes
const mockInitiatives: Initiative[] = [
  {
    id: "1",
    title: "Community Garden Project",
    description: "Let's build a community garden together! We need volunteers for planting, watering, and maintenance.",
    imageUrl: "https://picsum.photos/seed/garden/400/200",
    roles: ["Gardener", "Volunteer", "Organizer", "Watering Crew"],
    status: "Seeking Members",
    createdAt: Timestamp.now(), // Use Firestore Timestamp or Date
    creatorId: "user1",
    memberIds: ["user1", "user2"],
  },
  {
    id: "2",
    title: "Youth Tech Workshop",
    description: "Organizing a weekend workshop to teach local kids basic coding skills. Looking for instructors and helpers.",
    imageUrl: "https://picsum.photos/seed/tech/400/200",
    roles: ["Developer", "Instructor", "Mentor", "Volunteer"],
    status: "Planning",
    createdAt: Timestamp.now(),
    creatorId: "user3",
    memberIds: ["user3"],
  },
  {
    id: "3",
    title: "Neighborhood Park Cleanup",
    description: "Join us this Saturday to clean up and beautify Miller Park. Bring gloves and enthusiasm!",
    imageUrl: "https://picsum.photos/seed/park/400/200",
    roles: ["Volunteer", "Community Member"],
    status: "In Progress",
    createdAt: Timestamp.now(),
    creatorId: "user4",
    memberIds: ["user4", "user5", "user6", "user7"],
  },
    {
    id: "4",
    title: "Local History Documentation",
    description: "Collecting stories and photos about the history of APG. Need researchers, writers, and interviewers.",
    imageUrl: "https://picsum.photos/seed/history/400/200",
    roles: ["Researcher", "Writer", "Interviewer", "Historian"],
    status: "Idea",
    createdAt: Timestamp.now(),
    creatorId: "user8",
    memberIds: ["user8"],
  },
];


export default function Home() {
  // In a real app, fetch initiatives from a backend/database
  const initiatives = mockInitiatives;

  return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {initiatives.map((initiative) => (
          <InitiativeCard key={initiative.id} initiative={initiative} />
        ))}
      </div>
  );
}
