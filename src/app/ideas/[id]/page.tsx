import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

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
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Idea</h1>
      <div className="bg-card rounded-lg shadow p-6">
        <div className="text-lg font-semibold mb-2">{idea.title}</div>
        <div className="text-base text-muted-foreground">{idea.description}</div>
        {/* Add more idea details here if needed */}
      </div>
    </div>
  );
} 