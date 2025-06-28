import { getServerSession } from "next-auth/next"; // Import getServerSession
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Import authOptions

// Create a new client component for the feed
import { HomeClient } from '@/components/HomeClient'; // Assuming FeedItem type is exported from HomeClient or a shared types file

// The main Home component is no longer async as data fetching is client-side
export default async function Home() {
  // Fetch session data if needed for HomeClient (e.g., for personalized content or actions)
  const session = await getServerSession(authOptions); // Get the current session
  const currentUserId = session?.user?.id; // Extract currentUserId

  // HomeClient will now be responsible for fetching its own data
  // Pass any necessary initial props like currentUserId
  return <HomeClient currentUserId={currentUserId} />;
}
