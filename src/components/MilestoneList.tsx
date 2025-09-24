import React from 'react';
import dynamic from 'next/dynamic';
import { Milestone } from '@/lib/types';
import { MilestoneCard } from './MilestoneCard';

const FirebaseTimestamp = dynamic(() => import('firebase/firestore').then(mod => ({ default: mod.Timestamp })), {
  ssr: false,
  loading: () => null
});

interface MilestoneListProps {
  // Ensure createdAt is expected as Timestamp or string based on conversion
  milestones: (Omit<Milestone, 'createdAt' | 'dueDate'> & { createdAt: string | any, dueDate?: string | any })[]; 
}

export function MilestoneList({ milestones }: MilestoneListProps) {
  if (!milestones || milestones.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No milestones defined yet.</p>;
  }

  // Sort milestones by order if available, otherwise by creation date
  const sortedMilestones = [...milestones].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    // Fallback sort by date if order is missing
    // Use .toDate() if createdAt is a Firebase Timestamp, otherwise parse string
    const dateA = (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate() : new Date(a.createdAt as string);
    const dateB = (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate() : new Date(b.createdAt as string);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    // Display as a vertical list for now
    <div className="space-y-4"> 
      {sortedMilestones.map(milestone => (
        // Pass the potentially modified milestone object
        <MilestoneCard key={milestone.id} milestone={milestone as Milestone} /> 
      ))}
    </div>
  );
}
