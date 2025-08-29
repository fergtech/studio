import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { SocietyClientPage } from './SocietyClientPage';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

async function fetchSociety(id: string) {
  try {
    const society = await prisma.society.findUnique({
      where: { id },
      include: {
        creator: true,
      },
    });
    return society;
  } catch (error) {
    console.error('Error fetching society:', error);
    return null;
  }
}

async function fetchSocietyMembers(societyId: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/societies/${societyId}/members`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch members');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching society members:', error);
    return [];
  }
}

export default async function SocietyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const society = await fetchSociety(id);
  if (!society) return notFound();
  
  const members = await fetchSocietyMembers(id);
  const posts: any[] = [];
  
  return <SocietyClientPage society={society} members={members} posts={posts} />;
} 