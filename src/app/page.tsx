import { getServerSession } from "next-auth/next"; // Import getServerSession
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Import authOptions

// Create a new client component for the feed
import { HomeClient } from '@/components/HomeClient'; // Assuming FeedItem type is exported from HomeClient or a shared types file

function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-8">
      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center text-blue-900">Welcome to Delightful Education</h1>
      <p className="text-lg md:text-2xl text-gray-700 mb-8 text-center max-w-xl">
        Connect, collaborate, and create impact. Join a community of changemakers, share ideas, and drive real-world initiatives.
      </p>
      <div className="flex gap-4">
        <a href="/register" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition">Get Started</a>
        <a href="/login" className="px-6 py-3 bg-white border border-blue-600 text-blue-600 rounded-lg font-semibold shadow hover:bg-blue-50 transition">Log In</a>
      </div>
      <div className="mt-12 text-gray-500 text-sm text-center max-w-lg">
        <p>Spot issues, share ideas, join initiatives, and learn new skills. <br/>Be part of a social platform built for positive change.</p>
      </div>
    </main>
  );
}

// The main Home component is no longer async as data fetching is client-side
export default async function Home() {
  // Fetch session data if needed for HomeClient (e.g., for personalized content or actions)
  const session = await getServerSession(authOptions); // Get the current session
  const currentUserId = session?.user?.id; // Extract currentUserId

  if (currentUserId) {
    // HomeClient will now be responsible for fetching its own data
    // Pass any necessary initial props like currentUserId
    return <HomeClient currentUserId={currentUserId} />;
  } else {
    return <LandingPage />;
  }
}
