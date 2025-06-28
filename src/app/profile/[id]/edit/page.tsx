'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { notFound, redirect } from 'next/navigation';
import EditProfileForm from './EditProfileForm'; // We'll create this next
import { User } from '@prisma/client';

interface EditProfilePageProps {
  params: {
    id: string; // User ID from the URL
  };
}

export default async function EditProfilePage({ params: incomingParams }: EditProfilePageProps) {
  // Speculative fix: Await the params object itself based on the error message.
  const params = await incomingParams;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    // If not logged in, redirect to login page
    redirect('/login?callbackUrl=/profile/' + params.id + '/edit');
  }

  if (session.user.id !== params.id) {
    // If logged-in user is not the profile owner, forbid access
    // or redirect to their own profile or home page
    // For now, let's show a notFound, but a redirect might be more user-friendly
    notFound(); // Or redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
  });

  if (!user) {
    notFound();
  }

  // We pass the user object to the client form component
  // Ensure sensitive data is not passed if not needed by the form
  const { passwordHash, ...editableUserFields } = user;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Edit Your Profile</h1>
        <EditProfileForm user={editableUserFields as User} />
      </div>
    </div>
  );
}
