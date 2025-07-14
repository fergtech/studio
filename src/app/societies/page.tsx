import Link from 'next/link';
import Image from 'next/image';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function fetchSocieties() {
  const res = await fetch(`${BASE_URL}/api/societies`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function SocietiesPage() {
  const societies = await fetchSocieties();
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">All Societies</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {societies.length > 0 ? societies.map((society: any) => (
          <Link key={society.id} href={`/societies/${society.id}`} className="block bg-card rounded-lg shadow p-4 hover:ring-2 hover:ring-primary transition">
            {society.image && (
              <div className="mb-2 w-full h-32 relative">
                <Image src={society.image} alt={society.name} fill className="object-cover rounded" />
              </div>
            )}
            <div className="font-semibold text-lg mb-1">{society.name}</div>
            <div className="text-xs text-muted-foreground line-clamp-2">{society.description}</div>
          </Link>
        )) : (
          <div className="col-span-full text-center text-muted-foreground">No societies found.</div>
        )}
      </div>
    </div>
  );
} 