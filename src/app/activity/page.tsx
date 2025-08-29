import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ActivityClient from './ActivityClient';

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  return <ActivityClient userId={session.user.id} />;
} 
