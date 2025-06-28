'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InitiativesListModal } from "@/components/initiatives/InitiativesListModal";
import { Initiative, ContributionItem } from "@/lib/types";
import { CalendarDays, Globe, Mail, MapPin, User2 } from 'lucide-react';
import { followUserAction, unfollowUserAction } from '@/app/actions/userActions';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();

  const handleFollow = async () => {
    setIsFollowing(true);
    setFollowersCount((c) => c + 1);
    const res = await followUserAction(user.id);
    if (!res.success) {
      setIsFollowing(false);
      setFollowersCount((c) => Math.max(0, c - 1));
      toast({ title: 'Error', description: res.error || 'Failed to follow user', variant: 'destructive' });
    } else {
      toast({ title: 'Followed', description: `You are now following ${user.name || 'this user'}` });
    }
  };

  const handleUnfollow = async () => {
    setIsFollowing(false);
    setFollowersCount((c) => Math.max(0, c - 1));
    const res = await unfollowUserAction(user.id);
    if (!res.success) {
      setIsFollowing(true);
      setFollowersCount((c) => c + 1);
      toast({ title: 'Error', description: res.error || 'Failed to unfollow user', variant: 'destructive' });
    } else {
      toast({ title: 'Unfollowed', description: `You have unfollowed ${user.name || 'this user'}` });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Banner */}
      <div className="relative h-64 md:h-80 w-full z-0">
        {user.bannerImageUrl ? (
          <Image
            src={user.bannerImageUrl}
            alt={`${user.name ?? 'User'}'s banner`}
            width={1200}
            height={300}
            priority
            className="brightness-75 object-cover w-full h-full"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-purple-600 to-blue-500" />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Profile Content - This container will overlap the banner */}
      <div className="relative -mt-20 z-10">
        <div className="container mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
            {/* Profile Header */}
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                {/* Profile Image */}
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-gray-700 shadow-lg overflow-hidden">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name ?? 'User profile'}
                      width={160}
                      height={160}
                      priority
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="bg-gray-200 dark:bg-gray-700 h-full w-full flex items-center justify-center">
                      <User2 className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {user.name ?? 'Anonymous User'}
                      </h1>
                      {user.username && (
                        <p className="text-gray-600 dark:text-gray-400">
                          @{user.username}
                        </p>
                      )}
                    </div>
                    {isOwnProfile ? (
                      <Button asChild variant="outline" size="sm" className="md:ml-auto">
                        <Link href={`/profile/${user.id}/edit`}>Edit Profile</Link>
                      </Button>
                    ) : (
                      <div className="flex gap-2 md:ml-auto">
                        {isFollowing ? (
                          <Button variant="secondary" size="sm" onClick={handleUnfollow}>
                            Unfollow
                          </Button>
                        ) : (
                          <Button variant="default" size="sm" onClick={handleFollow}>
                            Follow
                          </Button>
                        )}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/chat/${user.id}`}><Mail className="w-4 h-4 mr-1" /> Message</Link>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-4 flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CalendarDays className="w-4 h-4" />
                      <span>Joined {new Date(user.dateCreated).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                    </div>
                    {user.organization && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>{user.organization}</span>
                      </div>
                    )}
                    {user.websites && user.websites.length > 0 && (
                      user.websites.map((website: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Globe className="w-4 h-4" />
                          <a href={website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {new URL(website).hostname}
                          </a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              {user.bio && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {user.bio}
                  </p>
                </div>
              )}

              {/* Skills & Interests */}
              {(user.skills?.length > 0 || user.interests?.length > 0) && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user.skills?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.skills.map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {user.interests?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.interests.map((interest: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tabs Section */}
            <div className="border-t border-gray-200 dark:border-gray-700">
              <Tabs defaultValue="initiatives" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
                  <TabsTrigger value="initiatives" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                    Initiatives
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                    Activity
                  </TabsTrigger>
                </TabsList>

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
          </div>
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
      </div>
    </div>
  );
}