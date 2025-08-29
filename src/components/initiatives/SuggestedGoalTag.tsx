import React from 'react';
import { Button } from '@/components/ui/button'; // Assuming you use shadcn/ui button

interface SuggestedGoalTagProps {
  title: string;
  description: string;
  onClick: (goal: { title: string; description: string }) => void;
}

export const SuggestedGoalTag: React.FC<SuggestedGoalTagProps> = ({
  title,
  description,
  onClick,
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full cursor-pointer"
      onClick={() => onClick({ title, description })}
    >
      {title}
    </Button>
  );
}; 
