import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure user can only update their own skills/interests
    if (session.user.id !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { skills, interests } = body;

    // Validate input
    if (!Array.isArray(skills) || !Array.isArray(interests)) {
      return NextResponse.json(
        { error: 'Skills and interests must be arrays' },
        { status: 400 }
      );
    }

    // Validate that all items are strings and limit length
    const validSkills = skills.filter(skill => 
      typeof skill === 'string' && skill.trim().length > 0 && skill.trim().length <= 50
    ).slice(0, 20); // Max 20 skills

    const validInterests = interests.filter(interest => 
      typeof interest === 'string' && interest.trim().length > 0 && interest.trim().length <= 50
    ).slice(0, 20); // Max 20 interests

    // Update user skills and interests
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        skills: validSkills,
        interests: validInterests,
      },
      select: {
        id: true,
        skills: true,
        interests: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating skills and interests:', error);
    return NextResponse.json(
      { error: 'Failed to update skills and interests' },
      { status: 500 }
    );
  }
}