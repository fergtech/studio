import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const onboardingSchema = z.object({
  userId: z.string(),
  profession: z.string().min(1, 'Profession is required'),
  interests: z.array(z.string()).min(1, 'At least one interest is required'),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log('Onboarding API: Received body:', body);

    // Validate input
    const validationResult = onboardingSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Onboarding API: Validation failed:', validationResult.error.flatten());
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userId, profession, interests } = validationResult.data;

    // Verify the user is updating their own profile
    if ((session.user as any).id !== userId) {
      return NextResponse.json(
        { message: 'Forbidden: Cannot update another user\'s profile' },
        { status: 403 }
      );
    }

    // Update user profile with onboarding data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        profession,
        interests,
        // Optionally update skills array as well with the profession
        skills: [profession],
      },
      select: {
        id: true,
        name: true,
        profession: true,
        interests: true,
        skills: true,
      },
    });

    console.log('Onboarding API: User profile updated:', updatedUser.id);

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    }, { status: 200 });

  } catch (error) {
    console.error('Onboarding API: Internal server error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve current onboarding status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        profession: true,
        interests: true,
        skills: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if onboarding is complete (has profession and at least one interest)
    const isOnboardingComplete = !!user.profession && user.interests.length > 0;

    return NextResponse.json({
      profession: user.profession,
      interests: user.interests,
      skills: user.skills,
      isOnboardingComplete,
    }, { status: 200 });

  } catch (error) {
    console.error('Onboarding GET API: Error:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
