import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Milestone, MilestoneStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MilestoneCardProps {
  milestone: Milestone;
}

// Helper to get badge variant based on status
const getStatusVariant = (status: MilestoneStatus): "default" | "secondary" | "outline" | "destructive" => {
  switch (status) {
    case 'Completed':
      return 'default';
    case 'In Progress':
      return 'secondary';
    case 'Planned':
      return 'outline';
    case 'On Hold':
      return 'destructive';
    default:
      return 'outline';
  }
};

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-medium">{milestone.title}</CardTitle>
          <Badge variant={getStatusVariant(milestone.status)} className="whitespace-nowrap">
            {milestone.status}
          </Badge>
        </div>
        {milestone.description && (
          <CardDescription className="mt-1">{milestone.description}</CardDescription>
        )}
      </CardHeader>
    </Card>
  );
}
