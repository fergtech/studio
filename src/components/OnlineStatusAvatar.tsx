import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface OnlineStatusAvatarProps {
  src?: string;
  alt: string;
  fallback: string;
  isOnline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function OnlineStatusAvatar({ 
  src, 
  alt, 
  fallback, 
  isOnline = false, 
  size = 'md',
  className 
}: OnlineStatusAvatarProps) {
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14', 
    lg: 'h-20 w-20'
  };

  const indicatorSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const indicatorPositionClasses = {
    sm: '-bottom-0.5 -right-0.5',
    md: '-bottom-1 -right-1',
    lg: '-bottom-1.5 -right-1.5'
  };

  return (
    <div className="relative">
      <Avatar 
        className={cn(
          sizeClasses[size],
          isOnline 
            ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-background' 
            : 'ring-2 ring-border',
          className
        )}
      >
        <AvatarImage src={src || ''} alt={alt} />
        <AvatarFallback className="text-lg font-semibold">
          {fallback}
        </AvatarFallback>
      </Avatar>
      
      {/* Online status indicator */}
      {isOnline && (
        <div 
          className={cn(
            'absolute rounded-full bg-green-500 ring-2 ring-background',
            indicatorSizeClasses[size],
            indicatorPositionClasses[size]
          )}
          title="Online"
        />
      )}
    </div>
  );
}