import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import EditProfileClient from './EditProfileClient';
import EditProfileSidebarClient from './EditProfileSidebarClient';
import { User } from '@prisma/client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

interface EditProfilePageProps {
  params: Promise<{
    identifier: string; // Can be username or ID
  }>;
}

export default async function EditProfilePage({ params: incomingParams }: EditProfilePageProps) {
  const params = await incomingParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/profile/' + params.identifier + '/edit');
  }

  let user = null;
  if (params.identifier !== 'me') {
    user = await prisma.user.findUnique({ where: { username: params.identifier } });
  }
  if (!user) {
    user = await prisma.user.findUnique({ where: { id: params.identifier } });
  }
  if (!user) {
    notFound();
  }
  if (session.user.id !== user.id) {
    notFound();
  }
  const { passwordHash, ...editableUserFields } = user;

  // Render a client component for sidebar and profile editing UI
  return <EditProfileSidebarClient user={editableUserFields as User} />;
}