import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveBattlesInArea } from '@/services/hotTakeBattles';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const topic = searchParams.get('topic');

    let battles;

    if (topic) {
      // Filter battles by topic
      battles = await prisma.hotTakeBattle.findMany({
        where: {
          status: 'ACTIVE',
          topic: topic,
          ...(location && {
            OR: [
              { location: location },
              { location: null }
            ]
          })
        },
        include: {
          post1: {
            select: {
              id: true,
              content: true,
              creatorName: true,
              creatorAvatar: true,
              timestamp: true
            }
          },
          post2: {
            select: {
              id: true,
              content: true,
              creatorName: true,
              creatorAvatar: true,
              timestamp: true
            }
          }
        },
        orderBy: [
          { totalParticipants: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 10
      });
    } else {
      battles = await getActiveBattlesInArea(location || undefined);
    }

    return NextResponse.json({ battles }, { status: 200 });
  } catch (error) {
    console.error('Error fetching hot take battles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch battles' },
      { status: 500 }
    );
  }
}