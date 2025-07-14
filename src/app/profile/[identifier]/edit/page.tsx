'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import EditProfileForm from '../edit/EditProfileForm';
import { User } from '@prisma/client';

interface EditProfilePageProps {
  params: {
    identifier: string; // Can be username or ID
  };
}

export default async function EditProfilePage({ params: incomingParams }: EditProfilePageProps) {
  // Speculative fix: Await the params object itself based on the error message.
  const params = await incomingParams;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    // If not logged in, redirect to login page
    redirect('/login?callbackUrl=/profile/' + params.identifier + '/edit');
  }

  // Try to find user by username first, then by ID
  let user = null;
  
  // First, try to find by username
  if (params.identifier !== 'me') {
    user = await prisma.user.findUnique({
      where: { username: params.identifier },
    });
  }

  // If not found by username, try by ID
  if (!user) {
    user = await prisma.user.findUnique({
      where: { id: params.identifier },
    });
  }

  if (!user) {
    notFound();
  }

  if (session.user.id !== user.id) {
    // If logged-in user is not the profile owner, forbid access
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