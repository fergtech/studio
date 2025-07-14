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

  // General posts: content
  const generalPosts = await prisma.generalPost.findMany({
    where: {
      content: { contains: q, mode: 'insensitive' },
    },
    select: {
      id: true,
      content: true,
      // createdAt: true, // Removed because it does not exist in your schema
    },
    take: 20,
  });
  const generalPostsWithType = generalPosts.map(post => ({ ...post, type: 'general' }));

  return NextResponse.json({
    users,
    initiatives,
    posts: generalPostsWithType,
    societies,
  });
} 