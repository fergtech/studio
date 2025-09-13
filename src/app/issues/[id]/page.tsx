import { prisma } from '@/lib/prisma';
import IssueClient from './IssueClient';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = await prisma.issue.findUnique({
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

  if (!issue) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id || null;

  // Check if current user has championed this issue
  let isChampioned = false;
  if (currentUserId) {
    const userChampion = await prisma.issueLike.findUnique({
      where: {
        issueId_userId: {
          issueId: id,
          userId: currentUserId,
        },
      },
    });
    isChampioned = !!userChampion;
  }

  return (
    <IssueClient 
      issue={issue}
      currentUserId={currentUserId}
      initiallyChampioned={isChampioned}
    />
  );
} 