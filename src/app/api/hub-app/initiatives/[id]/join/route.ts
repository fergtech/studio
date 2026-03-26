import { NextRequest, NextResponse } from 'next/server';
import { ensureMember } from '../../../_lib/ensureMember';

function checkKey(req: NextRequest) {
  return req.headers.get('x-hub-api-key') === process.env.HUB_APP_KEY;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await ensureMember(req, id);

  return NextResponse.json({ joined: true });
}
