import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function IssuePage({ params }: { params: { id: string } }) {
  const issue = await prisma.issue.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      // Add more fields as needed
    },
  });

  if (!issue) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-4">Issue</h1>
      <div className="bg-card rounded-lg shadow p-6">
        <div className="text-lg font-semibold mb-2">{issue.title}</div>
        <div className="text-base text-muted-foreground">{issue.description}</div>
        {/* Add more issue details here if needed */}
      </div>
    </div>
  );
} 