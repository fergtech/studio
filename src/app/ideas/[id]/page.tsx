import { prisma } from '@/lib/prisma';
import IdeaClient from './IdeaClient';
import { notFound } from 'next/navigation';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default async function IdeaPage({ params }: { params: { id: string } }) {
  const idea = await prisma.idea.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      // Add more fields as needed
    },
  });

  if (!idea) {
    notFound();
  }

  return (
    <IdeaClient idea={idea} />
  );
} 