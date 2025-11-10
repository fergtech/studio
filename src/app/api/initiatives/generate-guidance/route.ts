import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getOrCreateAiGuidance } from '@/app/actions/aiActions';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { initiativeId, forceRegenerate } = await req.json();

    if (!initiativeId) {
      return NextResponse.json({ error: 'Initiative ID is required' }, { status: 400 });
    }

    const result = await getOrCreateAiGuidance(initiativeId, forceRegenerate || false);

    if (result.success) {
      return NextResponse.json({ success: true, guidance: result.guidance });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to generate guidance'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in generate-guidance API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}