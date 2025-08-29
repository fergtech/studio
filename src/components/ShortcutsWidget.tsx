import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Rocket, User } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function ShortcutsWidget() {
  const { data: session } = useSession();

  return (
    <Card>
      <CardHeader className="py-2 px-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <PlusCircle className="h-4 w-4" />
          Shortcuts
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 py-2 px-3">
        <Button asChild variant="outline" size="sm" className="text-xs h-7">
          <Link href="/">Create Post</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="text-xs h-7">
          <Link href="/initiatives/create">Join Initiative</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="text-xs h-7">
          {session?.user?.username ? (
            <Link href={`/profile/${session.user.username}`}>View Profile</Link>
          ) : (
            <Link href="/profile/me">View Profile</Link>
          )}
        </Button>
      </CardContent>
    </Card>
  );
} 
