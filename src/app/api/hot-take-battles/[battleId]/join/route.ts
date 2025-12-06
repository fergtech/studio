import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { joinHotTakeBattle } from '@/services/hotTakeBattles';
import { HotTakeStance } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ battleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { battleId } = await params;
    const body = await request.json();
    const { stance, takePostId } = body;

    // Validate stance
    if (!Object.values(HotTakeStance).includes(stance)) {
      return NextResponse.json({ error: 'Invalid stance' }, { status: 400 });
    }

    const success = await joinHotTakeBattle({
      battleId,
      userId: session.user.id,
      stance,
      takePostId
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to join battle' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error joining hot take battle:', error);
    return NextResponse.json(
      { error: 'Failed to join battle' },
      { status: 500 }
    );
  }
}