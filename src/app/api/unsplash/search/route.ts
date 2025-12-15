import { NextRequest, NextResponse } from 'next/server';
import { createApi } from 'unsplash-js';

// Initialize Unsplash API (server-side only)
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '20', 10);

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    if (!process.env.UNSPLASH_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'Unsplash API key not configured' },
        { status: 500 }
      );
    }

    // Search photos using Unsplash API
    const result = await unsplash.search.getPhotos({
      query,
      page,
      perPage,
      orientation: 'landscape', // Good for debate topic headers
    });

    if (result.errors) {
      console.error('Unsplash API errors:', result.errors);
      return NextResponse.json(
        { error: 'Failed to search images', details: result.errors },
        { status: 500 }
      );
    }

    // Return formatted results
    return NextResponse.json({
      results: result.response?.results || [],
      total: result.response?.total || 0,
      totalPages: result.response?.total_pages || 0,
    });
  } catch (error) {
    console.error('Error searching Unsplash:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
