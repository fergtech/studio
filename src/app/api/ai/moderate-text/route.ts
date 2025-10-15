import { NextRequest, NextResponse } from 'next/server';
import { contentModerationService } from '@/services/contentModeration';

export async function POST(request: NextRequest) {
  try {
    const { content, userId, contentType } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({
        approved: true,
        confidence: 1.0,
        flags: [],
        requiresHumanReview: false
      });
    }

    // Moderate text content
    const result = await contentModerationService.moderateText(content);

    return NextResponse.json({
      approved: result.approved ?? true,
      confidence: result.confidence ?? 1.0,
      flags: result.flags ?? [],
      reasoning: result.reasoning,
      provider: result.provider
    });

  } catch (error) {
    console.error('Text moderation API error:', error);

    // Fail open - return approval with error flag
    return NextResponse.json({
      approved: true,
      confidence: 0.5,
      flags: ['api-error'],
      reasoning: 'Moderation service temporarily unavailable'
    }, { status: 200 }); // Return 200 to avoid breaking post creation
  }
}
