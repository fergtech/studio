import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  if (!q) {
    return NextResponse.json({ users: [], initiatives: [], posts: [] });
  }

  // Users: name, skills, interests
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { skills: { has: q } }, // assuming skills is a string[]
        { interests: { has: q } }, // assuming interests is a string[]
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

  // Issues: title, description
  const issues = await prisma.issue.findMany({
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
  const issuesWithType = issues.map(issue => ({ ...issue, type: 'issue' }));

  // Ideas: title, description
  const ideas = await prisma.idea.findMany({
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
  const ideasWithType = ideas.map(idea => ({ ...idea, type: 'idea' }));

  // Merge all posts
  const posts = [
    ...generalPostsWithType,
    ...issuesWithType,
    ...ideasWithType,
  ];

  return NextResponse.json({ users, initiatives, posts });
} 