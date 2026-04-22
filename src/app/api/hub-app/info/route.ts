import { NextRequest, NextResponse } from 'next/server';

function checkKey(req: NextRequest) {
  return req.headers.get('x-hub-api-key') === process.env.HUB_APP_KEY;
}

// Returns metadata about this hub app so Citinet can display attribution.
export async function GET(req: NextRequest) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  return NextResponse.json({
    name: 'Society+',
    description: 'Community platform for initiatives, discussions, and local action.',
    faviconUrl: `${baseUrl}/favicon.ico`,
    logoUrl: `${baseUrl}/favicon.ico`,
    version: '1.0',
    capabilities: ['initiatives', 'societies'],
  });
}
