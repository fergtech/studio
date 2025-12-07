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
