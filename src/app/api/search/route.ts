import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/search?q=query
 *
 * Search for debates and users
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        debates: [],
        users: [],
      });
    }

    const searchTerm = query.trim();

    // Search debates and users in parallel
    const [debates, users] = await Promise.all([
      // Search debates by title or content
      prisma.debateTopic.findMany({
        where: {
          AND: [
            {
              OR: [
                { moderationStatus: 'approved' },
                { moderationStatus: null } // Include approved and legacy null status
              ],
            },
            {
              OR: [
                {
                  title: {
                    contains: searchTerm,
                    mode: 'insensitive',
                  },
                },
                {
                  content: {
                    contains: searchTerm,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          title: true,
          content: true,
          votes: {
            select: {
              side: true,
            },
          },
          _count: {
            select: {
              arguments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),

      // Search users by name or username
      prisma.user.findMany({
        where: {
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              username: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
        take: 10,
      }),
    ]);

    // Format debate results with stats
    const formattedDebates = debates.map((debate) => {
      const proVotes = debate.votes.filter((v) => v.side === 'PRO').length;
      const conVotes = debate.votes.filter((v) => v.side === 'CON').length;

      return {
        id: debate.id,
        title: debate.title,
        content: debate.content,
        stats: {
          totalVotes: proVotes + conVotes,
          argumentCount: debate._count.arguments,
        },
      };
    });

    return NextResponse.json({
      debates: formattedDebates,
      users,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
