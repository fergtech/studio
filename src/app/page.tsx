import { getServerSession } from "next-auth/next"; // Import getServerSession
import { authOptions } from "@/lib/auth"; // Import authOptions

// Create a new client component for the feed
import { HomeClient } from '@/components/HomeClient'; // Assuming FeedItem type is exported from HomeClient or a shared types file

function LandingPage() {
  return (
    <main
      className="flex flex-1 flex-col items-center justify-center w-full overflow-y-auto bg-background text-foreground"
    >
      {/* Replace the image with a bare img tag for debugging */}
      <img
        src="/diverse-crowd-people-different-ages-races.png"
        alt="Diverse crowd of people of different ages and races"
        style={{ maxWidth: '400px', width: '100%', margin: '2rem auto 1.5rem auto', display: 'block' }}
      />
      <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center flex items-center justify-center gap-2">
        society
        <span className="inline-block align-middle">
          <svg
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
            style={{ verticalAlign: 'middle' }}
          >
            <g>
              {/* Sparkle rays */}
              <rect x="16" y="4" width="4" height="8" rx="2" fill="currentColor"/>
              <rect x="16" y="24" width="4" height="8" rx="2" fill="currentColor"/>
              <rect x="4" y="16" width="8" height="4" rx="2" fill="currentColor"/>
              <rect x="24" y="16" width="8" height="4" rx="2" fill="currentColor"/>
              {/* Center sparkle */}
              <rect x="15" y="15" width="6" height="6" rx="3" fill="currentColor"/>
            </g>
          </svg>
        </span>
      </h1>
      <p className="text-lg md:text-2xl mb-8 text-center max-w-xl">
        Connect, collaborate, and create impact. Join a community of changemakers, share ideas, and drive real-world initiatives.
      </p>
      <div className="flex gap-4">
        <a href="/register" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold shadow hover:bg-primary/90 transition">Get Started</a>
        <a href="/login" className="px-6 py-3 bg-background border border-primary text-primary rounded-lg font-semibold shadow hover:bg-muted transition">Log In</a>
      </div>
      <div className="mt-12 text-muted-foreground text-sm text-center max-w-lg">
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
