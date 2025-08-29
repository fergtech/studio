import React from 'react';
import { Button } from '@/components/ui/button'; // Assuming you use shadcn/ui button

interface SuggestedActionTagProps {
  title: string;
  description: string;
  onClick: (action: { title: string; description: string }) => void;
}

export const SuggestedActionTag: React.FC<SuggestedActionTagProps> = ({
  title,
  description,
  onClick,
}) => {
  return (
    <Button
      variant="outline"
      className="rounded-full cursor-pointer py-1 px-3 text-sm text-left whitespace-normal hover:bg-accent hover:text-accent-foreground"
      style={{ height: 'auto' }}
      onClick={() => onClick({ title, description })}
    >
      {title}
    </Button>
  );
}; 
