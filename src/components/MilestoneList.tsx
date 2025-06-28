import React from 'react';
import { Milestone } from '@/lib/types';
import { MilestoneCard } from './MilestoneCard';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

interface MilestoneListProps {
  // Ensure createdAt is expected as Timestamp or string based on conversion
  milestones: (Omit<Milestone, 'createdAt' | 'dueDate'> & { createdAt: string | Timestamp, dueDate?: string | Timestamp })[]; 
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
    // Use .toDate() if createdAt is a Timestamp, otherwise parse string
    const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
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
