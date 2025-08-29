import { prisma } from '@/lib/prisma';
import IssueClient from './IssueClient';
import { notFound } from 'next/navigation';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const issue = await prisma.issue.findUnique({
    where: { id },
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
    <IssueClient issue={issue} />
  );
} 