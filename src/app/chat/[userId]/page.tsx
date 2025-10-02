import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import DirectMessageClient from './DirectMessageClient';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

interface DirectMessagePageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function DirectMessagePage({ params }: DirectMessagePageProps) {
  const session = await getServerSession(authOptions);
  const { userId: otherUserId } = await params;

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/chat/' + otherUserId);
  }

  const currentUserId = session.user.id;

  // Prevent users from messaging themselves
  if (currentUserId === otherUserId) {
    redirect('/');
  }

  // Get the other user's information
  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
    },
  });

  if (!otherUser) {
    notFound();
  }

  // Get existing direct messages between these users
  const messages = await prisma.chatMessage.findMany({
    where: {
      initiativeId: null, // Direct messages only
      OR: [
        {
          senderId: currentUserId,
          receiverId: otherUserId,
        },
        {
          senderId: otherUserId,
          receiverId: currentUserId,
        }
      ]
    },
    orderBy: { timestamp: 'asc' },
    select: {
      id: true,
      text: true,
      timestamp: true,
      senderId: true,
      senderName: true,
      receiverId: true,
      initiativeId: true,
      sender: {
        select: { id: true, name: true, image: true }
      }
    }
  });

  return (
    <DirectMessageClient 
      otherUser={otherUser}
      initialMessages={messages}
      currentUserId={currentUserId}
    />
  );
} 