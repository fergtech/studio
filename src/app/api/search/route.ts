import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/search?q=query
 *
 * Search for debates, users, posts, initiatives, and societies
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        debates: [],
        users: [],
        posts: [],
        initiatives: [],
        societies: [],
      });
    }

    const searchTerm = query.trim();

    // Search all content types in parallel
    const [debates, users, posts, initiatives, societies] = await Promise.all([
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
          imageUrl: true,
          creatorId: true,
          createdAt: true,
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
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
        take: 20,
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
          bio: true,
          createdAt: true,
        },
        take: 10,
      }),

      // Search general posts by content
      prisma.generalPost.findMany({
        where: {
          AND: [
            {
              OR: [
                { moderationStatus: 'approved' },
                { moderationStatus: null }
              ],
            },
            {
              content: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          content: true,
          type: true,
          creatorId: true,
          timestamp: true,
          media: {
            select: {
              url: true,
              type: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 20,
      }),

      // Search initiatives by title or description
      prisma.initiative.findMany({
        where: {
          OR: [
            {
              title: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),

      // Search societies by name or description
      prisma.society.findMany({
        where: {
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
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
        type: 'debate' as const,
        mediaUrl: debate.imageUrl,
        userId: debate.creatorId,
        createdAt: debate.createdAt,
        user: debate.creator ? {
          id: debate.creator.id,
          name: debate.creator.name || 'Anonymous',
          username: debate.creator.username || 'anonymous',
          image: debate.creator.image,
        } : {
          id: debate.creatorId || 'unknown',
          name: 'Anonymous',
          username: 'anonymous',
        },
        stats: {
          totalVotes: proVotes + conVotes,
          argumentCount: debate._count.arguments,
        },
      };
    });

    // Format post results
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      type: post.type || 'general',
      mediaUrl: post.media?.[0]?.url,
      mediaType: post.media?.[0]?.type,
      userId: post.creatorId,
      createdAt: post.timestamp,
      user: post.creator ? {
        id: post.creator.id,
        name: post.creator.name || 'Anonymous',
        username: post.creator.username || 'anonymous',
        image: post.creator.image,
      } : {
        id: post.creatorId,
        name: 'Anonymous',
        username: 'anonymous',
      },
    }));

    // Format user results
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name || 'Anonymous',
      username: user.username || 'anonymous',
      image: user.image,
      bio: user.bio,
      dateCreated: user.createdAt,
    }));

    // Format society results
    const formattedSocieties = societies.map((society) => ({
      id: society.id,
      name: society.name,
      description: society.description,
      image: society.image,
      imageUrl: society.image,
      memberCount: society._count.members,
    }));

    return NextResponse.json({
      debates: formattedDebates,
      users: formattedUsers,
      posts: formattedPosts,
      initiatives,
      societies: formattedSocieties,
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
