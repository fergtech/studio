'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InitiativesListModal } from "@/components/initiatives/InitiativesListModal";
import { Initiative, ContributionItem } from "@/lib/types";
import { CalendarDays, Globe, Mail, MapPin, User2, Globe2, Link as LinkIcon, Edit2 } from 'lucide-react';
import { followUserAction, unfollowUserAction } from '@/app/actions/userActions';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface ProfileClientProps {
  user: any; // We'll type this properly once we have the transformed data structure
  isOwnProfile: boolean;
  activityFeed: ContributionItem[];
}

export default function ProfileClient({ user, isOwnProfile, activityFeed }: ProfileClientProps) {
  const [showCreatedInitiativesModal, setShowCreatedInitiativesModal] = useState(false);
  const [showParticipatingInModal, setShowParticipatingInModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);
  const [followersCount, setFollowersCount] = useState(user.followersCount ?? 0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const { toast } = useToast();
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:9003';
    const socket: Socket = io(SOCKET_URL, {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
    });
    let interval: NodeJS.Timeout | null = null;
    function checkStatus() {
      if (user?.id) {
        socket.emit('checkUserStatus', user.id, (status: boolean) => {
          setIsOnline(status);
        });
      }
    }
    checkStatus();
    interval = setInterval(checkStatus, 30000);
    return () => {
      if (interval) clearInterval(interval);
      socket.disconnect();
    };
  }, [user?.id]);

  const handleFollow = async () => {
    if (isFollowing || isFollowLoading) return; // Prevent duplicate follow
    setIsFollowLoading(true);
    setIsFollowing(true);
    setFollowersCount((c: number) => c + 1);
    const res = await followUserAction(user.id);
    if (!res.success) {
      setIsFollowing(false);
      setFollowersCount((c: number) => Math.max(0, c - 1));
      toast({ title: 'Error', description: res.error || 'Failed to follow user', variant: 'destructive' });
    } else {
      toast({ title: 'Followed', description: `You are now following ${user.name || 'this user'}` });
    }
    setIsFollowLoading(false);
  };

  const handleUnfollow = async () => {
    setIsFollowing(false);
    setFollowersCount((c: number) => Math.max(0, c - 1));
    const res = await unfollowUserAction(user.id);
    if (!res.success) {
      setIsFollowing(true);
      setFollowersCount((c: number) => c + 1);
      toast({ title: 'Error', description: res.error || 'Failed to unfollow user', variant: 'destructive' });
    } else {
      toast({ title: 'Unfollowed', description: `You have unfollowed ${user.name || 'this user'}` });
    }
  };

  const handleMessage = () => {
    // Implementation of handleMessage function
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Profile Header Section */}
      <div className="relative w-full mb-8">
        {/* Banner */}
        <div className="relative h-40 sm:h-56 md:h-64 w-full rounded-t-xl overflow-hidden bg-muted">
          {user.bannerImageUrl ? (
            <Image src={user.bannerImageUrl} alt="Profile banner" fill className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/80 to-secondary/80" />
          )}
          {isOwnProfile && (
            <Button
              size="sm"
              variant="outline"
              className="absolute right-4 top-4 z-10 bg-white/80 hover:bg-white"
              onClick={() => router.push(`/profile/${user.id}/edit?banner=1`)}
            >
              Edit Cover Photo
            </Button>
          )}
        </div>
        {/* Meta Card with Avatar Overlap */}
        <div className="relative max-w-3xl mx-auto -mt-16 z-10">
          {/* Avatar - centered and overlapping banner/meta card */}
          <div className="absolute left-1/2 -top-16 transform -translate-x-1/2 z-20">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
              <AvatarFallback>{user.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
          </div>
          {/* Meta Card */}
          <div className="relative rounded-xl shadow px-6 py-8 flex flex-col items-center pt-20 bg-white dark:bg-background min-h-[180px]">
            <div className="flex flex-col items-center w-full">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full justify-center">
                <h1 className="text-2xl font-bold text-primary text-center">{user.name}</h1>
                {user.profession && <span className="text-base text-muted-foreground">{user.profession}</span>}
                {isOwnProfile ? (
                  <Button size="sm" variant="outline" className="ml-2" onClick={() => router.push(`/profile/${user.id}/edit`)}>Edit Profile</Button>
                ) : (
                  <>
                    {!isFollowing && (
                      <Button size="sm" onClick={handleFollow} disabled={isFollowLoading}>Follow</Button>
                    )}
                    {isFollowing && (
                      <Button size="sm" variant="outline" onClick={handleUnfollow} disabled={isFollowLoading}>Unfollow</Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => router.push(`/chat/${user.id}`)}>Message</Button>
                  </>
                )}
              </div>
              {/* Stats */}
              <div className="flex space-x-4 sm:space-x-6 text-sm mt-2">
                <div><span className="font-semibold">{user.followersCount ?? 0}</span> followers</div>
                <div><span className="font-semibold">{user.followingCount ?? 0}</span> following</div>
              </div>
              {/* Bio */}
              {user.bio && <div className="mt-3 text-center text-base text-muted-foreground max-w-xl">{user.bio}</div>}
              {/* Websites */}
              {user.websites && user.websites.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3 justify-center">
                  {user.websites.map((site: string, idx: number) => (
                    <Link key={site+idx} href={site.startsWith('http') ? site : `https://${site}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition underline">
                      <span className="truncate max-w-[160px]">{site.replace(/^https?:\/\//, '')}</span>
                    </Link>
                  ))}
                </div>
              )}
              {/* Joined Date */}
              {user.dateCreated && (
                <div className="text-xs text-muted-foreground mt-2">Joined {new Date(user.dateCreated).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="border-t border-gray-200 dark:border-gray-700">
        <Tabs defaultValue="intro" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
            <TabsTrigger value="intro" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Intro
            </TabsTrigger>
            <TabsTrigger value="initiatives" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Initiatives
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="intro" className="p-6">
            <div className="flex flex-col gap-8">
              {/* Location section */}
              {user.location && (
                <div>
                  <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    <MapPin className="inline-block w-4 h-4 text-primary" /> Location
                  </div>
                  <div className="text-base font-medium text-white">{user.location}</div>
                </div>
              )}
              {/* Skills section */}
              <div>
                <div className="text-xs text-gray-400 mb-1">Skills</div>
                <div className="flex flex-wrap gap-1">
                  {user.skills && user.skills.length > 0
                    ? user.skills.map((skill: string, idx: number) => (
                        <Link key={skill+idx} href={`/explore?skill=${encodeURIComponent(skill)}`} passHref legacyBehavior>
                          <span className="bg-green-700 text-white px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:bg-green-800 transition">{skill}</span>
                        </Link>
                      ))
                    : <span className="text-gray-500">None</span>
                  }
                </div>
              </div>
              {/* Interests section */}
              <div>
                <div className="text-xs text-gray-400 mb-1">Interests</div>
                <div className="flex flex-wrap gap-1">
                  {user.interests && user.interests.length > 0
                    ? user.interests.map((interest: string, idx: number) => (
                        <Link key={interest+idx} href={`/explore?interest=${encodeURIComponent(interest)}`} passHref legacyBehavior>
                          <span className="bg-blue-700 text-white px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:bg-blue-800 transition">{interest}</span>
                        </Link>
                      ))
                    : <span className="text-gray-500">None</span>
                  }
                </div>
              </div>
              {/* Social Links section */}
              {user.websites && user.websites.length > 0 && (
                <div>
                  <div className="text-xs text-gray-400 mb-1">Social Links</div>
                  <div className="flex flex-wrap gap-3">
                    {user.websites.map((site: string, idx: number) => (
                      <Link key={site+idx} href={site.startsWith('http') ? site : `https://${site}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-200 hover:text-blue-100 transition">
                        <Globe2 className="w-4 h-4" />
                        <span className="underline text-sm">{site.replace(/^https?:\/\//, '')}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="initiatives" className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Created Initiatives</h3>
              {user.createdInitiatives.length > 5 && (
                <Button variant="link" onClick={() => setShowCreatedInitiativesModal(true)}>
                  View All ({user.createdInitiatives.length})
                </Button>
              )}
            </div>
            <div className="flex flex-row space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted/40 scrollbar-track-transparent">
              {user.createdInitiatives.length > 0 ? (
                user.createdInitiatives.slice(0, 5).map((initiative: Initiative) => (
                  <Link key={initiative.id} href={`/initiatives/${initiative.id}`} passHref>
                    <Card className="min-w-[300px] flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden group h-[260px]">
                      {/* Background Image and Overlay */}
                      {initiative.imageUrl ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                          style={{ backgroundImage: `url(${initiative.imageUrl})` }}
                        >
                          <div className="absolute inset-0 bg-black/60" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
                      )}

                      {/* Content Layer */}
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <CardHeader className="p-4">
                          <CardTitle className="text-base line-clamp-2 text-white">{initiative.title}</CardTitle>
                          <CardDescription className="line-clamp-3 text-gray-200">{initiative.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <Badge variant="outline" className="text-white border-white/50 bg-white/20 hover:bg-white/30">{initiative.status}</Badge>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  {isOwnProfile ? "You haven't created any initiatives yet." : "This user hasn't created any initiatives yet."}
                </p>
              )}
            </div>

            <div className="flex justify-between items-center mt-6 mb-4">
              <h3 className="text-lg font-semibold">Participating In</h3>
              {user.initiativeMemberships.length > 5 && (
                <Button variant="link" onClick={() => setShowParticipatingInModal(true)}>
                  View All ({user.initiativeMemberships.length})
                </Button>
              )}
            </div>
            <div className="flex flex-row space-x-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted/40 scrollbar-track-transparent">
              {user.initiativeMemberships.length > 0 ? (
                user.initiativeMemberships.slice(0, 5).map((membership: any) => (
                  <Link key={membership.initiative.id} href={`/initiatives/${membership.initiative.id}`} passHref>
                    <Card className="min-w-[300px] flex-shrink-0 cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden group h-[260px]">
                      {/* Background Image and Overlay */}
                      {membership.initiative.imageUrl ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                          style={{ backgroundImage: `url(${membership.initiative.imageUrl})` }}
                        >
                          <div className="absolute inset-0 bg-black/60" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
                      )}

                      {/* Content Layer */}
                      <div className="relative z-10 flex flex-col h-full justify-between">
                        <CardHeader className="p-4">
                          <CardTitle className="text-base line-clamp-2 text-white">{membership.initiative.title}</CardTitle>
                          <CardDescription className="line-clamp-3 text-gray-200">{membership.initiative.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <Badge variant="outline" className="text-white border-white/50 bg-white/20 hover:bg-white/30">{membership.initiative.status}</Badge>
                          <Badge variant="outline" className="ml-2 text-white border-white/50 bg-white/20 hover:bg-white/30">{membership.role}</Badge>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  {isOwnProfile ? "You aren't participating in any initiatives yet." : "This user isn't participating in any initiatives yet."}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <Card>
              <CardContent className="p-6">
                {activityFeed.length > 0 ? (
                  <div className="space-y-4">
                    {activityFeed.map((item: ContributionItem) => (
                      <div key={item.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                        {item.details && item.type !== 'comment' && <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{item.details}</p>}
                        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(item.date).toLocaleDateString()}</p>
                        {item.relatedInitiativeId && (
                          <Link href={`/initiatives/${item.relatedInitiativeId}`} className="text-primary hover:underline">
                            View Initiative
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    {isOwnProfile ? "You haven't posted any activity yet." : "This user hasn't posted any activity yet."}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Created Initiatives Modal */}
      <InitiativesListModal
        isOpen={showCreatedInitiativesModal}
        onClose={() => setShowCreatedInitiativesModal(false)}
        initiatives={user.createdInitiatives}
        title="Your Created Initiatives"
        emptyMessage={isOwnProfile ? "You haven't created any initiatives yet." : "This user hasn't created any initiatives yet."}
      />

      {/* Participating In Modal */}
      <InitiativesListModal
        isOpen={showParticipatingInModal}
        onClose={() => setShowParticipatingInModal(false)}
        initiatives={user.initiativeMemberships.map((m: any) => m.initiative)}
        title="Initiatives You're Participating In"
        emptyMessage={isOwnProfile ? "You aren't participating in any initiatives yet." : "This user isn't participating in any initiatives yet."}
      />

      <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {(user.followers && user.followers.length > 0) ? user.followers.map((f: any) => (
              <div key={f.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted transition">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={f.image || undefined} alt={f.name || f.username} />
                  <AvatarFallback>{f.name?.[0]?.toUpperCase() || f.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{f.name || f.username}</div>
                  <div className="text-xs text-gray-400">@{f.username}</div>
                </div>
              </div>
            )) : <div className="text-center text-gray-500">No followers yet.</div>}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {(user.following && user.following.length > 0) ? user.following.map((f: any) => (
              <div key={f.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted transition">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={f.image || undefined} alt={f.name || f.username} />
                  <AvatarFallback>{f.name?.[0]?.toUpperCase() || f.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{f.name || f.username}</div>
                  <div className="text-xs text-gray-400">@{f.username}</div>
                </div>
              </div>
            )) : <div className="text-center text-gray-500">Not following anyone yet.</div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}