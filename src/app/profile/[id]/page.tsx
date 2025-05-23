'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Assuming you have a Button component from shadcn/ui
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Import Tabs components

// We will create this client component later to handle the edit form display
// import EditProfileModal from './EditProfileModal'; 
// import { User } from '@prisma/client'; // If you pass the full user object to client component

interface ProfilePageProps {
  params: {
    id: string; // This will be the user ID from the URL
  };
}

export default async function ProfilePage({ params: incomingParams }: ProfilePageProps) {
  // Speculative fix: Await the params object itself based on the error message.
  const params = await incomingParams;

  const session = await getServerSession(authOptions);
  const loggedInUserId = session?.user?.id;
  
  // If the route is /profile/me, use the logged-in user's ID
  const profileUserId = params.id === 'me' && loggedInUserId ? loggedInUserId : params.id;

  if (!profileUserId) {
    // This case might happen if /profile/me is accessed without being logged in.
    // Or if params.id is somehow undefined, though Next.js routing usually prevents that.
    notFound(); 
  }

  const user = await prisma.user.findUnique({
    where: { id: profileUserId },
    // Optionally include related data if needed directly on this page
    // include: {
    //   posts: true,
    //   initiativesMember: { include: { initiative: true } },
    // }
  });

  if (!user) {
    notFound();
  }

  const isOwnProfile = loggedInUserId === user.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
        <div className="relative h-56 w-full bg-gradient-to-r from-purple-600 to-blue-500">
          {user.bannerImageUrl ? (
            <Image
              src={user.bannerImageUrl}
              alt={`${user.name ?? 'User'}'s banner image`}
              layout="fill"
              objectFit="cover"
              priority
            />
          ) : (
            // Placeholder or default banner styling if no image
            <div className="h-full w-full bg-gradient-to-r from-purple-500 to-blue-400 dark:from-purple-700 dark:to-blue-600"></div>
          )}
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end sm:-mt-24">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-gray-700 shadow-[0_0_15px_5px_rgba(59,130,246,0.4)] dark:shadow-[0_0_15px_5px_rgba(59,130,246,0.3)] overflow-hidden mb-4 sm:mb-0">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? 'User profile image'}
                  layout="fill"
                  objectFit="cover"
                  priority // Prioritize loading profile image
                />
              ) : (
                <div className="bg-gray-300 dark:bg-gray-600 h-full w-full flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400 text-4xl">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
            </div>
            <div className="sm:ml-6 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white">
                {user.name ?? 'Anonymous User'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Joined: {new Date(user.dateCreated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            {isOwnProfile && (
              <div className="mt-4 sm:mt-0 sm:ml-auto">
                {/* 
                  This button will eventually link to an edit page or trigger a modal.
                  For now, linking to /profile/[id]/edit which we can create next.
                */}
                <Button asChild variant="outline" size="sm">
                  <Link href={`/profile/${user.id}/edit`}>Edit Profile</Link>
                </Button>
                {/* 
                  Alternatively, to open a modal (requires client component setup):
                  <EditProfileModal user={user} /> 
                */}
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">Bio</h2>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
              {user.bio ? user.bio : (isOwnProfile ? 'You haven\'t added a bio yet. Click "Edit Profile" to tell us about yourself!' : 'This user hasn\'t shared a bio yet.')}
            </p>
          </div>

          {/* Tabbed sections for Activity Feed and Initiatives */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity">Activity Feed</TabsTrigger>
                <TabsTrigger value="initiatives">Initiatives</TabsTrigger>
              </TabsList>
              <TabsContent value="activity">
                <div className="mt-4">
                  <p className="text-gray-500 dark:text-gray-400">
                    {isOwnProfile ? 'Your recent activities will appear here.' : 'Recent activities from this user will appear here.'}
                    {/* TODO: Implement activity feed component */}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="initiatives">
                <div className="mt-4">
                  <p className="text-gray-500 dark:text-gray-400">
                    {isOwnProfile ? 'Initiatives you are part of will be listed here.' : 'Initiatives this user is part of will be listed here.'}
                    {/* TODO: Implement initiatives list component */}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}