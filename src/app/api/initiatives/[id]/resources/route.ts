import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: initiativeId } = await context.params;
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const pinnedOnly = searchParams.get('pinnedOnly') === 'true';

  try {
    // Verify user is a member of the initiative
    const membership = await prisma.initiativeMembership.findUnique({
      where: {
        userId_initiativeId: {
          userId: session.user.id,
          initiativeId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this initiative' }, { status: 403 });
    }

    // Build where clause
    const where: any = { initiativeId };

    if (type && type !== 'ALL') where.resourceType = type;
    if (category) where.category = category;
    if (pinnedOnly) where.isPinned = true;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const resources = await prisma.resourceMetadata.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, image: true } },
        update: { select: { id: true, content: true, createdAt: true } },
      },
      orderBy: [
        { isPinned: 'desc' },
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}
