import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { commentId } = await params;

  try {
    const existingVote = await prisma.debateArgumentVote.findUnique({
      where: {
        argumentId_userId: {
          argumentId: commentId,
          userId,
        },
      },
    });

    if (existingVote) {
      // If the user is unliking
      if (existingVote.isUpvote) {
        await prisma.debateArgumentVote.delete({
          where: { id: existingVote.id },
        });
        return NextResponse.json({ message: 'Comment unliked' });
      } else {
        // If the user is changing from downvote to upvote
        const updatedVote = await prisma.debateArgumentVote.update({
          where: { id: existingVote.id },
          data: { isUpvote: true },
        });
        return NextResponse.json(updatedVote);
      }
    } else {
      // If the user is liking for the first time
      const newVote = await prisma.debateArgumentVote.create({
        data: {
          argumentId: commentId,
          userId,
          isUpvote: true,
        },
      });
      return NextResponse.json(newVote, { status: 201 });
    }
  } catch (error) {
    console.error(`Error liking comment ${commentId}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
