import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RSVPStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: initiativeId, eventId } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['GOING', 'MAYBE', 'NOT_GOING'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid RSVP status is required (GOING, MAYBE, NOT_GOING)' },
        { status: 400 }
      );
    }

    // Verify the event exists and belongs to this initiative
    const event = await prisma.update.findFirst({
      where: {
        id: eventId,
        initiativeId,
        type: {
          in: ['event_creation', 'event_update'],
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
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
        { error: 'You must be a member to RSVP to events' },
        { status: 403 }
      );
    }

    // Upsert RSVP (create or update)
    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        updateId_userId: {
          updateId: eventId,
          userId: session.user.id,
        },
      },
      create: {
        updateId: eventId,
        userId: session.user.id,
        status: status as RSVPStatus,
      },
      update: {
        status: status as RSVPStatus,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(rsvp, { status: 200 });
  } catch (error) {
    console.error('Error creating/updating RSVP:', error);
    return NextResponse.json({ error: 'Failed to RSVP' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Fetch all RSVPs for this event
    const rsvps = await prisma.eventRSVP.findMany({
      where: {
        updateId: eventId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Group by status
    const grouped = {
      going: rsvps.filter((r) => r.status === 'GOING'),
      maybe: rsvps.filter((r) => r.status === 'MAYBE'),
      not_going: rsvps.filter((r) => r.status === 'NOT_GOING'),
    };

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error fetching RSVPs:', error);
    return NextResponse.json({ error: 'Failed to fetch RSVPs' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await params;

    // Delete the user's RSVP
    await prisma.eventRSVP.delete({
      where: {
        updateId_userId: {
          updateId: eventId,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting RSVP:', error);
    return NextResponse.json({ error: 'Failed to delete RSVP' }, { status: 500 });
  }
}
