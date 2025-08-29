import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DebateDetailClient from './DebateDetailClient';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default async function DebatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id || null;

  // Fetch debate topic with all related data
  const debateTopic = await prisma.debateTopic.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
        },
      },
      votes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      arguments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              username: true,
            },
          },
          votes: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!debateTopic) {
    notFound();
  }

  // Calculate vote statistics
  const proVotes = debateTopic.votes.filter(vote => vote.side === 'PRO').length;
  const conVotes = debateTopic.votes.filter(vote => vote.side === 'CON').length;
  const totalVotes = proVotes + conVotes;

  const stats = {
    proVotes,
    conVotes,
    totalVotes,
    proPercentage: totalVotes > 0 ? Math.round((proVotes / totalVotes) * 100) : 0,
    conPercentage: totalVotes > 0 ? Math.round((conVotes / totalVotes) * 100) : 0,
  };

  // Get user's current vote if logged in
  const userVote = currentUserId 
    ? debateTopic.votes.find(vote => vote.user.id === currentUserId)
    : null;

  // Separate arguments by side (now all arguments, not just top-level)
  const proArguments = debateTopic.arguments.filter(arg => arg.side === 'PRO');
  const conArguments = debateTopic.arguments.filter(arg => arg.side === 'CON');

  return (
    <DebateDetailClient
      debateTopic={{
        ...debateTopic,
        imageUrl: debateTopic.imageUrl || undefined,
        createdAt: debateTopic.createdAt.toISOString(),
        updatedAt: debateTopic.updatedAt.toISOString(),
        creator: {
          ...debateTopic.creator,
          name: debateTopic.creator.name || '',
          image: debateTopic.creator.image || undefined,
          username: debateTopic.creator.username || undefined,
        }
      }}
      stats={stats}
      userVote={userVote ? { side: userVote.side } : null}
      proArguments={proArguments.map(arg => ({
        ...arg,
        createdAt: arg.createdAt.toISOString(),
        updatedAt: arg.updatedAt.toISOString(),
        parentId: arg.parentId,
        replies: [], // Remove nested replies structure, we'll handle this on client side
        user: {
          ...arg.user,
          name: arg.user.name || '',
          image: arg.user.image || undefined,
          username: arg.user.username || undefined,
        }
      }))}
      conArguments={conArguments.map(arg => ({
        ...arg,
        createdAt: arg.createdAt.toISOString(),
        updatedAt: arg.updatedAt.toISOString(),
        parentId: arg.parentId,
        replies: [], // Remove nested replies structure, we'll handle this on client side
        user: {
          ...arg.user,
          name: arg.user.name || '',
          image: arg.user.image || undefined,
          username: arg.user.username || undefined,
        }
      }))}
      currentUserId={currentUserId}
    />
  );
}