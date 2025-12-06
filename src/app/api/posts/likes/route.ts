// Placeholder file - functionality moved elsewhere
export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(JSON.stringify({ message: 'Not implemented' }), {
    status: 501,
    headers: { 'Content-Type': 'application/json' },
  });
}
