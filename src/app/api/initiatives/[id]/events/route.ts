import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UpdateType } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: initiativeId } = await params;
    const body = await request.json();
    const { title, description, eventDetails } = body;

    if (!title || !eventDetails) {
      return NextResponse.json(
        { error: 'Title and event details are required' },
        { status: 400 }
      );
    }

    // Validate event details
    if (!eventDetails.eventDate || !eventDetails.eventType) {
      return NextResponse.json(
        { error: 'Event date and type are required' },
        { status: 400 }
      );
    }

    // Check if user is a member of the initiative
    const membership = await prisma.initiativeMembership.findUnique({
      where: {
        userId_initiativeId: {
          userId: session.user.id,
          initiativeId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to create events' },
        { status: 403 }
      );
    }

    // Create event as an Update with type event_creation
    const event = await prisma.update.create({
      data: {
        initiativeId,
        userId: session.user.id,
        type: UpdateType.event_creation,
        content: description || title,
        details: eventDetails,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        media: true,
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
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
      const eventUrl = `${baseUrl}/initiatives/${initiativeId}`;

      for (const member of members) {
        try {
          // Create in-app notification
          await prisma.notification.create({
            data: {
              userId: member.userId,
              type: 'INITIATIVE_INVITE', // Using existing type, could add NEW_EVENT type
              title: 'New Event Created',
              message: `${session.user.name} created a new event "${eventDetails.title || title}" in ${initiative?.title || 'an initiative'}`,
              data: {
                initiativeId,
                eventId: event.id,
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
              'New Event Created',
              `${session.user.name} created a new event "${eventDetails.title || title}" in ${initiative?.title || 'an initiative'}`,
              eventUrl,
              'View Event',
              member.user.username || member.userId
            );
          }
        } catch (notifError) {
          console.error('Error sending notification to member:', notifError);
          // Continue with other members
        }
      }
    } catch (error) {
      console.error('Error sending event notifications:', error);
      // Don't fail the event creation if notifications fail
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: initiativeId } = await params;

    // Fetch all events for this initiative
    const events = await prisma.update.findMany({
      where: {
        initiativeId,
        type: {
          in: [UpdateType.event_creation, UpdateType.event_update],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        media: true,
        rsvps: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
