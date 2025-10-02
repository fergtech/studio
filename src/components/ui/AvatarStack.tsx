import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface User {
  id: string;
  name?: string | null;
  username?: string | null;
  image?: string | null;
}

interface AvatarStackProps {
  users: User[];
  maxAvatars?: number;
}

export function AvatarStack({ users, maxAvatars = 3 }: AvatarStackProps) {
  if (!users || users.length === 0) {
    return null;
  }

  const displayedUsers = users.slice(0, maxAvatars);
  const remainingCount = users.length - displayedUsers.length;

  return (
    <TooltipProvider>
      <div className="flex -space-x-2 overflow-hidden py-2">
        {displayedUsers.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                <AvatarImage src={user.image || undefined} alt={user.name || user.username || 'User'} />
                <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p>{user.name || user.username}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 ring-2 ring-background dark:bg-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">+{remainingCount}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
