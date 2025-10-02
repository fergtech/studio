// API endpoint to manually trigger topic backfill
// This allows testing the backfill process without waiting for app restart

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { runCompleteTopicBackfill } from '@/services/topicBackfill';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated (basic protection)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Manual topic backfill triggered by user:', session.user.id);

    // Run the complete backfill process
    const result = await runCompleteTopicBackfill();

    return NextResponse.json({
      success: true,
      message: 'Topic backfill completed successfully',
      results: result
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Manual topic backfill failed:', error);
    return NextResponse.json({
      error: 'Topic backfill failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to trigger topic backfill',
    endpoint: '/api/admin/backfill-topics'
  });
}