import { NextRequest, NextResponse } from 'next/server';
import { contentModerationService } from '@/services/contentModeration';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, userId, contentType } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({
        approved: true,
        confidence: 1.0,
        flags: [],
        requiresHumanReview: false
      });
    }

    // Moderate image content
    const result = await contentModerationService.moderateImage(imageUrl);

    return NextResponse.json({
      approved: result.approved ?? true,
      confidence: result.confidence ?? 1.0,
      flags: result.flags ?? [],
      reasoning: result.reasoning
    });

  } catch (error) {
    console.error('Image moderation API error:', error);

    // Fail open - return approval with error flag
    return NextResponse.json({
      approved: true,
      confidence: 0.5,
      flags: ['api-error'],
      reasoning: 'Image moderation service temporarily unavailable'
    }, { status: 200 }); // Return 200 to avoid breaking post creation
  }
}
