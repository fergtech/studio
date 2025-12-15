import { NextRequest, NextResponse } from 'next/server';
import { createApi } from 'unsplash-js';

// Initialize Unsplash API (server-side only)
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { downloadLocation } = body;

    if (!downloadLocation) {
      return NextResponse.json(
        { error: 'downloadLocation is required' },
        { status: 400 }
      );
    }

    if (!process.env.UNSPLASH_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'Unsplash API key not configured' },
        { status: 500 }
      );
    }

    // Trigger download tracking (required by Unsplash API guidelines)
    // This doesn't actually download the image, just tracks that it was "downloaded"/used
    const result = await unsplash.photos.trackDownload({
      downloadLocation,
    });

    if (result.errors) {
      console.error('Unsplash download tracking errors:', result.errors);
      return NextResponse.json(
        { error: 'Failed to track download', details: result.errors },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking Unsplash download:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
