import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Allow lookup by id or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id },
          { username: id },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        bio: true,
        skills: true,
        interests: true,
        primaryIntent: true,
        image: true,
        bannerImageUrl: true,
        dateCreated: true,
        // Followers: users who follow this user
        userFollowers: {
          select: {
            follower: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
        // Following: users this user follows
        userFollowing: {
          select: {
            following: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Flatten followers/following arrays, filter out the user themselves, and deduplicate by id
    const followersRaw = user.userFollowers.map((f: any) => f.follower).filter((f: any) => f.id !== user.id);
    const followingRaw = user.userFollowing.map((f: any) => f.following).filter((f: any) => f.id !== user.id);
    // Deduplicate by id
    const followers = Array.from(new Map(followersRaw.map((u: any) => [u.id, u])).values());
    const following = Array.from(new Map(followingRaw.map((u: any) => [u.id, u])).values());

    return NextResponse.json({
      ...user,
      followers,
      following,
      followersCount: followers.length,
      followingCount: following.length,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
} 