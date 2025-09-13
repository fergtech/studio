import { prisma } from '@/lib/prisma';
import IdeaClient from './IdeaClient';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default async function IdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = await prisma.idea.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      media: true,
      society: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  if (!idea) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id || null;

  // Check if current user has championed this idea
  let isChampioned = false;
  if (currentUserId) {
    const userChampion = await prisma.ideaLike.findUnique({
      where: {
        ideaId_userId: {
          ideaId: id,
          userId: currentUserId,
        },
      },
    });
    isChampioned = !!userChampion;
  }

  return (
    <IdeaClient 
      idea={idea}
      currentUserId={currentUserId}
      initiallyChampioned={isChampioned}
    />
  );
} 