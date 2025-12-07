import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { initiativeId, title, description, status, priority, dueDate, ownerId, tags } = body;

    if (!initiativeId || !title) {
      return NextResponse.json({ error: 'initiativeId and title are required' }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        initiativeId,
        title,
        description,
        status,
        priority,
        dueDate,
        ownerId,
        tags,
      },
    });

    // Send notifications to all initiative members
    try {
      const initiative = await prisma.initiative.findUnique({
        where: { id: initiativeId },
        select: { title: true },
      });

      const members = await prisma.initiativeMembership.findMany({
        where: {
          initiativeId,
          userId: { not: session.user.id }, // Don't notify the creator
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              emailNotifications: true,
              username: true,
            },
          },
        },
      });

      const baseUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
      const goalUrl = `${baseUrl}/initiatives/${initiativeId}`;

      for (const member of members) {
        try {
          // Create in-app notification
          await prisma.notification.create({
            data: {
              userId: member.userId,
              type: 'INITIATIVE_INVITE', // Using existing type
              title: 'New Goal Created',
              message: `${session.user.name} created a new goal "${title}" in ${initiative?.title || 'an initiative'}`,
              data: {
                initiativeId,
                goalId: goal.id,
                creatorId: session.user.id,
              },
            },
          });

          // Send email notification if enabled
          if (member.user.emailNotifications) {
            const { sendNotificationEmail } = await import('@/lib/email');
            await sendNotificationEmail(
              member.user.email,
              'INITIATIVE_INVITE',
              'New Goal Created',
              `${session.user.name} created a new goal "${title}" in ${initiative?.title || 'an initiative'}`,
              goalUrl,
              'View Goal',
              member.user.username || member.userId
            );
          }
        } catch (notifError) {
          console.error('Error sending notification to member:', notifError);
          // Continue with other members
        }
      }
    } catch (error) {
      console.error('Error sending goal notifications:', error);
      // Don't fail the goal creation if notifications fail
    }

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
