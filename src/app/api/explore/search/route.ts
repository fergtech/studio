import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  if (!q) {
    return NextResponse.json({ users: [], initiatives: [], posts: [], societies: [] });
  }

  // Users: name, skills, interests
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { skills: { has: q } },
        { interests: { has: q } },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      dateCreated: true,
      skills: true,
      interests: true,
    },
    take: 20,
  });

  // Initiatives: title, description
  const initiatives = await prisma.initiative.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
    },
    take: 20,
  });

  // Societies: name, description
  const societies = await prisma.society.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      createdAt: true,
    },
    take: 20,
  });

  // Transform societies to match expected format
  const transformedSocieties = societies.map((society: any) => ({
    id: society.id,
    name: society.name,
    description: society.description,
    imageUrl: society.image, // Map image to imageUrl
    memberCount: 0, // TODO: Add member count if needed
  }));

  // General posts: content
  const generalPosts = await prisma.generalPost.findMany({
    where: {
      content: { contains: q, mode: 'insensitive' },
      moderationStatus: 'approved',
    },
    select: {
      id: true,
      content: true,
      creatorName: true,
      creatorAvatar: true,
      creatorId: true,
      media: true,
      timestamp: true,
    },
    take: 20,
  });
  
  // Transform posts to match expected format
  const transformedPosts = generalPosts.map((post: any) => {
    // Extract first media item for display
    const firstMedia = post.media && post.media.length > 0 ? post.media[0] : null;

    return {
      id: post.id,
      content: post.content,
      type: 'general' as const,
      userId: post.creatorId,
      user: {
        name: post.creatorName || 'Anonymous',
        username: '', // Not available in this schema
        image: post.creatorAvatar,
      },
      mediaUrl: firstMedia?.url,
      mediaType: firstMedia?.type,
      createdAt: post.timestamp,
    };
  });

  // Debates: title, content
  const debates = await prisma.debateTopic.findMany({
    where: {
      AND: [
        {
          OR: [
            { moderationStatus: 'approved' },
            { moderationStatus: null }
          ],
        },
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
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
    take: 20,
  });

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
    users,
    initiatives,
    posts: transformedPosts,
    societies: transformedSocieties,
    debates: formattedDebates,
  });
} 