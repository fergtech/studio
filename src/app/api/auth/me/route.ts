import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
        dateCreated: true,
        location: true,
        city: true,
        latitude: true,
        longitude: true,
        showLocation: true,
        enableLocalNews: true,
        newsRadius: true,
        newsTypes: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    logger.error('Error fetching user data', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }
    const body = await req.json();
    const { primaryIntent, interests, skills } = body;
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        primaryIntent,
        interests,
        skills,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        bio: true,
        skills: true,
        interests: true,
        image: true,
        dateCreated: true,
        primaryIntent: true,
        location: true,
        city: true,
        showLocation: true,
      }
    });
    return NextResponse.json(updated);
  } catch (error) {
    logger.error('Error updating user data', error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 
