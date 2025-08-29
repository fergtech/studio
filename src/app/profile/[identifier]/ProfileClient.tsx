'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import AppSidebar from '@/components/AppSidebar';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { InitiativesListModal } from "@/components/initiatives/InitiativesListModal";
import { Initiative, ContributionItem } from "@/lib/types";
import { CalendarDays, Globe, Mail, MapPin, User2, Globe2, Link as LinkIcon, Edit2, Building2, School, Star, Users, MessageCircle, UserPlus, Settings, ExternalLink, Github, Linkedin, Globe as GlobeIcon, Coffee, Code, Palette, Rocket, Heart, Eye, TrendingUp, Clock, Award, Target, ChevronRight, Plus, Filter, CheckCircle, Lightbulb, AlertTriangle, Activity, Briefcase, BookOpen, MapPin as MapPinIcon, UserMinus, Users2, X, Save } from 'lucide-react';
import { followUserAction, unfollowUserAction } from '@/app/actions/userActions';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
// import { io, Socket } from 'socket.io-client'; // Temporarily disabled for Vercel deployment


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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  // Pagination and loading state for followers
  const [followers, setFollowers] = useState<any[]>([]);
  const [followersPage, setFollowersPage] = useState(1);
  const [followersTotal, setFollowersTotal] = useState(0);
  const [followersLoading, setFollowersLoading] = useState(false);
  // Pagination and loading state for following
  const [following, setFollowing] = useState<any[]>([]);
  const [followingPage, setFollowingPage] = useState(1);
  const [followingTotal, setFollowingTotal] = useState(0);
  const [followingLoading, setFollowingLoading] = useState(false);
  const PAGE_SIZE = 20;
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  // Inline editing state for skills and interests
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [skillsInput, setSkillsInput] = useState('');
  const [interestsInput, setInterestsInput] = useState('');
  const [currentSkills, setCurrentSkills] = useState<string[]>(user.skills || []);
  const [currentInterests, setCurrentInterests] = useState<string[]>(user.interests || []);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Socket connection temporarily disabled for Vercel deployment
    // TODO: Re-enable online status checking after implementing polling system
    // const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:9003';
    // const socket: Socket = io(SOCKET_URL, {
    //   path: '/api/socketio',
    //   transports: ['websocket', 'polling'],
    // });
    // let interval: NodeJS.Timeout | null = null;
    // function checkStatus() {
    //   if (user?.id) {
    //     socket.emit('checkUserStatus', user.id, (status: boolean) => {
    //       setIsOnline(status);
    //     });
    //   }
    // }
    // checkStatus();
    // interval = setInterval(checkStatus, 30000);
    // return () => {
    //   if (interval) clearInterval(interval);
    //   socket.disconnect();
    // };
    setIsOnline(false); // Default to offline when Socket.io is disabled
  }, [user?.id]);

  // Fetch followers when modal opens or page changes
  useEffect(() => {
    if (showFollowersModal) {
      setFollowersLoading(true);
      fetch(`/api/users/${user.id}/followers?page=${followersPage}&limit=${PAGE_SIZE}`)
        .then(res => res.json())
        .then(data => {
          setFollowers(data.users || []);
          setFollowersTotal(data.total || 0);
        })
        .finally(() => setFollowersLoading(false));
    }
  }, [showFollowersModal, followersPage, user.id]);

  // Fetch following when modal opens or page changes
  useEffect(() => {
    if (showFollowingModal) {
      setFollowingLoading(true);
      fetch(`/api/users/${user.id}/following?page=${followingPage}&limit=${PAGE_SIZE}`)
        .then(res => res.json())
        .then(data => {
          setFollowing(data.users || []);
          setFollowingTotal(data.total || 0);
        })
        .finally(() => setFollowingLoading(false));
    }
  }, [showFollowingModal, followingPage, user.id]);

  const handleFollow = async () => {
    if (isFollowing || isFollowLoading) return; // Prevent duplicate follow
    setIsFollowLoading(true);
    setIsFollowing(true);
    setFollowersCount((c: number) => c + 1);
    const res = await followUserAction(user.id);
    if (!res.success) {
      setIsFollowing(false);
      setFollowersCount((c: number) => Math.max(0, c - 1));
      toast({ title: 'Error', description: res.error || 'Failed to add to circle', variant: 'destructive' });
    } else {
      toast({ title: 'Added to Circle', description: `${user.name || 'This user'} has been added to your circle` });
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
      toast({ title: 'Error', description: res.error || 'Failed to remove from circle', variant: 'destructive' });
    } else {
      toast({ title: 'Removed from Circle', description: `${user.name || 'This user'} has been removed from your circle` });
    }
  };

  const handleMessage = () => {
    // Implementation of handleMessage function
  };

  // Helper to go to a user's profile and close modal
  const goToUserProfile = (u: any, closeModal: () => void) => {
    if (!u || !u.username) return;
    closeModal();
    router.push(`/profile/${u.username}`);
  };

  // Inline editing handlers
  const handleAddSkill = () => {
    const skill = skillsInput.trim();
    if (skill && !currentSkills.includes(skill) && currentSkills.length < 20) {
      setCurrentSkills([...currentSkills, skill]);
      setSkillsInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setCurrentSkills(currentSkills.filter(skill => skill !== skillToRemove));
  };

  const handleAddInterest = () => {
    const interest = interestsInput.trim();
    if (interest && !currentInterests.includes(interest) && currentInterests.length < 20) {
      setCurrentInterests([...currentInterests, interest]);
      setInterestsInput('');
    }
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    setCurrentInterests(currentInterests.filter(interest => interest !== interestToRemove));
  };

  const handleSaveSkillsAndInterests = async () => {
    if (!isOwnProfile) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/users/${user.id}/skills-interests`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skills: currentSkills,
          interests: currentInterests,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingSkills(false);
        setEditingInterests(false);
        toast({
          title: "Profile Updated",
          description: "Your skills and interests have been updated successfully.",
        });
        // Refresh the page to show updated data
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to update');
      }
    } catch (error) {
      console.error('Error updating skills and interests:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update your skills and interests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setCurrentSkills(user.skills || []);
    setCurrentInterests(user.interests || []);
    setSkillsInput('');
    setInterestsInput('');
    setEditingSkills(false);
    setEditingInterests(false);
  };


  // Calculate community impact metrics
  const communityStats = {
    initiativesCreated: user.createdInitiatives?.length || 0,
    initiativesJoined: user.initiativeMemberships?.length || 0,
    totalContributions: (user.createdInitiatives?.length || 0) + (user.initiativeMemberships?.length || 0),
    followers: user.followersCount || 0,
    following: user.followingCount || 0,
    memberSince: user.dateCreated ? new Date(user.dateCreated).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Recently'
  };

  // Prepare sidebar context data
  const sidebarContext = {
    type: 'profile' as const,
    profileData: {
      userId: user.id,
      username: user.username,
      userName: user.name,
      isOwnProfile,
      stats: {
        initiativesCreated: communityStats.initiativesCreated,
        initiativesJoined: communityStats.initiativesJoined,
        totalContributions: communityStats.totalContributions,
        followers: communityStats.followers,
        following: communityStats.following,
        memberSince: communityStats.memberSince,
        isOnline: isOnline
      },
      followersCount: communityStats.followers,
      followingCount: communityStats.following
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        {/* Sidebar */}
        <AppSidebar 
          widgets={['userControls', 'navigation', 'suggestions', 'location', 'resources', 'footer']}
          context={{ type: 'profile' }}
          onCollapseChange={setSidebarCollapsed}
        />
        
        {/* Main Profile Content - with dynamic left margin based on sidebar state */}
        <div className={`transition-all duration-300 px-4 lg:px-6 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
        }`}>
          {/* Community Profile Header */}
          <div className="relative w-full mb-8">
        {/* Banner */}
        <div className="relative h-56 sm:h-72 md:h-96 w-full rounded-t-xl overflow-hidden bg-muted">
          {user.bannerImageUrl ? (
            <Image src={user.bannerImageUrl} alt="Profile banner" fill className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-500 via-blue-600 to-green-500" />
          )}
          {isOwnProfile && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-4 top-4 z-10 border border-gray-300 bg-white/60 hover:bg-gray-200 text-gray-700 shadow-sm"
              onClick={() => user.username && router.push(`/profile/${user.username}/edit?banner=1`)}
            >
              Edit Cover Photo
            </Button>
          )}
        </div>
        
        {/* Profile Info Card */}
        <div className="relative max-w-4xl mx-auto -mt-16 z-10">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-lg">
                    <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                    <AvatarFallback>{user.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                
                {/* Name and Basic Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                    {user.primaryIntent && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {user.primaryIntent}
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">@{user.username}</p>
                  {user.bio && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm max-w-md line-clamp-2">
                      {user.bio.length > 120 ? `${user.bio.substring(0, 120)}...` : user.bio}
                    </p>
                  )}
                  
                  {/* Community Stats */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      {user.showLocation && user.city ? user.city : 'Location not set'}
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" />
                      Member since {communityStats.memberSince}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - UPDATED UI ONLY */}
              <div className="flex gap-3 flex-shrink-0">
                {isOwnProfile ? (
                  <Button 
                    onClick={() => router.push(`/profile/${user.id}/edit`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    {!isFollowing && (
                      <Button 
                        onClick={handleFollow} 
                        disabled={isFollowLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add to Circle
                      </Button>
                    )}
                    {isFollowing && (
                      <Button 
                        variant="outline" 
                        onClick={handleUnfollow} 
                        disabled={isFollowLoading}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <UserMinus className="w-4 h-4 mr-2" />
                        Remove from Circle
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/chat/${user.id}`)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* Community Impact Stats - UPDATED LABELS ONLY */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{communityStats.initiativesCreated}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Initiatives Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{communityStats.initiativesJoined}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Initiatives Joined</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{communityStats.totalContributions}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total Contributions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{communityStats.followers}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">In Their Circle</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{communityStats.following}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {isOwnProfile ? 'My Circle' : `${user.name?.split(' ')[0] || 'Their'} Circle`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="max-w-4xl mx-auto px-4">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="initiatives" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              <Rocket className="w-4 h-4 mr-2" />
              Initiatives
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              <Clock className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="circle" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              <Users2 className="w-4 h-4 mr-2" />
              Circle
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* About Section */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User2 className="w-5 h-5" />
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {user.bio ? (
                      <p className="text-gray-700 dark:text-gray-300">{user.bio}</p>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">No bio available yet.</p>
                    )}
                    
                    {/* Professional Info */}
                    {(user.profession || user.organization || user.institution) && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Professional Background</h4>
                        <div className="space-y-1 text-sm">
                          {user.profession && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700 dark:text-gray-300">{user.profession}</span>
                            </div>
                          )}
                          {user.organization && (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700 dark:text-gray-300">{user.organization}</span>
                            </div>
                          )}
                          {user.institution && (
                            <div className="flex items-center gap-2">
                              <School className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700 dark:text-gray-300">{user.institution}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Skills & Interests Sidebar */}
              <div className="space-y-6">
                {/* Skills */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Code className="w-5 h-5" />
                        Skills
                      </CardTitle>
                      {isOwnProfile && !editingSkills && !editingInterests && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSkills(true)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingSkills && isOwnProfile ? (
                      <div className="space-y-3">
                        {/* Input for adding new skills */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a skill..."
                            value={skillsInput}
                            onChange={(e) => setSkillsInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSkill();
                              }
                              if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            maxLength={50}
                            className="flex-1"
                            autoFocus
                          />
                          <Button 
                            onClick={handleAddSkill} 
                            size="sm" 
                            disabled={!skillsInput.trim() || currentSkills.length >= 20 || currentSkills.includes(skillsInput.trim())}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Current skills with remove buttons */}
                        {currentSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {currentSkills.map((skill: string, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 pr-1 group">
                                {skill}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveSkill(skill)}
                                  className="ml-1 h-4 w-4 p-0 hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {/* Action buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button onClick={handleSaveSkillsAndInterests} disabled={isUpdating} size="sm">
                            <Save className="h-4 w-4 mr-1" />
                            {isUpdating ? 'Saving...' : 'Save'}
                          </Button>
                          <Button onClick={handleCancelEdit} variant="outline" size="sm" disabled={isUpdating}>
                            Cancel
                          </Button>
                        </div>
                        
                        <p className="text-xs text-gray-500">Add up to 20 skills. Press Enter to add, Escape to cancel.</p>
                      </div>
                    ) : (
                      <>
                        {currentSkills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {currentSkills.map((skill: string, index: number) => (
                              <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                              {isOwnProfile ? "Click the pencil icon above to add your skills" : "No skills listed yet"}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Interests */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="w-5 h-5" />
                        Interests
                      </CardTitle>
                      {isOwnProfile && !editingSkills && !editingInterests && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingInterests(true)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingInterests && isOwnProfile ? (
                      <div className="space-y-3">
                        {/* Input for adding new interests */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add an interest..."
                            value={interestsInput}
                            onChange={(e) => setInterestsInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddInterest();
                              }
                              if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            maxLength={50}
                            className="flex-1"
                            autoFocus
                          />
                          <Button 
                            onClick={handleAddInterest} 
                            size="sm" 
                            disabled={!interestsInput.trim() || currentInterests.length >= 20 || currentInterests.includes(interestsInput.trim())}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Current interests with remove buttons */}
                        {currentInterests.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {currentInterests.map((interest: string, index: number) => (
                              <Badge key={index} variant="outline" className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-300 pr-1 group">
                                {interest}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveInterest(interest)}
                                  className="ml-1 h-4 w-4 p-0 hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {/* Action buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button onClick={handleSaveSkillsAndInterests} disabled={isUpdating} size="sm">
                            <Save className="h-4 w-4 mr-1" />
                            {isUpdating ? 'Saving...' : 'Save'}
                          </Button>
                          <Button onClick={handleCancelEdit} variant="outline" size="sm" disabled={isUpdating}>
                            Cancel
                          </Button>
                        </div>
                        
                        <p className="text-xs text-gray-500">Add up to 20 interests. Press Enter to add, Escape to cancel.</p>
                      </div>
                    ) : (
                      <>
                        {currentInterests.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {currentInterests.map((interest: string, index: number) => (
                              <Badge key={index} variant="outline" className="border-green-200 text-green-700 dark:border-green-800 dark:text-green-300">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                              {isOwnProfile ? "Click the pencil icon above to add your interests" : "No interests listed yet"}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Social Links */}
                {user.websites && user.websites.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5" />
                        Connect
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {user.websites.map((site: string, index: number) => (
                          <a 
                            key={index}
                            href={site.startsWith('http') ? site : `https://${site}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="truncate">{site.replace(/^https?:\/\//, '')}</span>
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Initiatives Tab */}
          <TabsContent value="initiatives" className="space-y-6 mt-6">
            {/* Created Initiatives */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="w-5 h-5" />
                    Initiatives Created
                  </CardTitle>
                  {user.createdInitiatives && user.createdInitiatives.length > 5 && (
                    <Button variant="outline" size="sm" onClick={() => setShowCreatedInitiativesModal(true)}>
                      View All ({user.createdInitiatives.length})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {user.createdInitiatives && user.createdInitiatives.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.createdInitiatives.slice(0, 6).map((initiative: Initiative) => (
                      <Link key={initiative.id} href={`/initiatives/${initiative.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Rocket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                  {initiative.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                  {initiative.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {initiative.status}
                                  </Badge>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {initiative.memberships?.length || 0} members
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {isOwnProfile ? "You haven't created any initiatives yet." : "This user hasn't created any initiatives yet."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Participating Initiatives */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Participating In
                  </CardTitle>
                  {user.initiativeMemberships && user.initiativeMemberships.length > 5 && (
                    <Button variant="outline" size="sm" onClick={() => setShowParticipatingInModal(true)}>
                      View All ({user.initiativeMemberships.length})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {user.initiativeMemberships && user.initiativeMemberships.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.initiativeMemberships.slice(0, 6).map((membership: any) => (
                      <Link key={membership.initiative.id} href={`/initiatives/${membership.initiative.id}`}>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                  {membership.initiative.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                  {membership.initiative.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {membership.role}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {membership.initiative.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {isOwnProfile ? "You aren't participating in any initiatives yet." : "This user isn't participating in any initiatives yet."}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityFeed.length > 0 ? (
                  <div className="space-y-4">
                    {activityFeed.map((item: ContributionItem, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                          {item.details && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.details}</p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                          {item.relatedInitiativeId && (
                            <Link 
                              href={`/initiatives/${item.relatedInitiativeId}`} 
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm mt-1 inline-block"
                            >
                              View Initiative →
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {isOwnProfile ? "You haven't posted any activity yet." : "This user hasn't posted any activity yet."}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Circle Tab - NEW TAB WITH CIRCLE UI */}
          <TabsContent value="circle" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* In Their Circle - VISUAL ONLY CHANGES */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-orange-600" />
                    {isOwnProfile ? 'In Your Circle' : `In ${user.name?.split(' ')[0] || 'Their'} Circle`}
                  </CardTitle>
                  <CardDescription>
                    {isOwnProfile 
                      ? `People who have added you to their circle (${communityStats.followers})`
                      : `People who have added ${user.name?.split(' ')[0] || 'them'} to their circle (${communityStats.followers})`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setShowFollowersModal(true)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Circle Members
                  </Button>
                </CardContent>
              </Card>

              {/* My Circle / Their Circle - VISUAL ONLY CHANGES */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-indigo-600" />
                    {isOwnProfile ? 'My Circle' : `${user.name?.split(' ')[0] || 'Their'} Circle`}
                  </CardTitle>
                  <CardDescription>
                    {isOwnProfile 
                      ? `People you have added to your circle (${communityStats.following})`
                      : `People ${user.name?.split(' ')[0] || 'they'} have added to their circle (${communityStats.following})`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setShowFollowingModal(true)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Circle Members
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Circle Insights - NEW VISUAL SECTION */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Circle Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-orange-600" />
                      <span className="font-medium">Circle Reach</span>
                    </div>
                    <span className="text-lg font-bold text-orange-600">{communityStats.followers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-indigo-600" />
                      <span className="font-medium">Circle Size</span>
                    </div>
                    <span className="text-lg font-bold text-indigo-600">{communityStats.following}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">Community Impact</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">{communityStats.totalContributions}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

          {/* Modals - UPDATED TITLES ONLY */}
      <InitiativesListModal
        isOpen={showCreatedInitiativesModal}
        onClose={() => setShowCreatedInitiativesModal(false)}
        initiatives={user.createdInitiatives}
        title="Your Created Initiatives"
        emptyMessage={isOwnProfile ? "You haven't created any initiatives yet." : "This user hasn't created any initiatives yet."}
      />

      <InitiativesListModal
        isOpen={showParticipatingInModal}
        onClose={() => setShowParticipatingInModal(false)}
        initiatives={user.initiativeMemberships.map((m: any) => m.initiative)}
        title="Initiatives You're Participating In"
        emptyMessage={isOwnProfile ? "You aren't participating in any initiatives yet." : "This user isn't participating in any initiatives yet."}
      />

      {/* Circle Modal - UPDATED TITLE AND MESSAGES ONLY */}
      <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isOwnProfile ? 'In Your Circle' : `In ${user.name?.split(' ')[0] || 'Their'} Circle`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {followersLoading ? (
              <div>Loading...</div>
            ) : followers.length > 0 ? (
              followers.map((f: any) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-muted transition cursor-pointer"
                  onClick={() => goToUserProfile(f, () => setShowFollowersModal(false))}
                  tabIndex={0}
                  role="button"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') goToUserProfile(f, () => setShowFollowersModal(false)); }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={f.image || undefined} alt={f.name || f.username} />
                    <AvatarFallback>{f.name?.[0]?.toUpperCase() || f.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{f.name || f.username}</div>
                    <div className="text-xs text-gray-400">@{f.username}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">
                {isOwnProfile ? "No one has added you to their circle yet." : "This user hasn't been added to any circles yet."}
              </div>
            )}
          </div>
          {/* Pagination controls */}
          <div className="flex justify-between mt-2">
            <Button size="sm" disabled={followersPage === 1} onClick={() => setFollowersPage(p => Math.max(1, p - 1))}>Prev</Button>
            <span>Page {followersPage} of {Math.max(1, Math.ceil(followersTotal / PAGE_SIZE))}</span>
            <Button size="sm" disabled={followersPage * PAGE_SIZE >= followersTotal} onClick={() => setFollowersPage(p => p + 1)}>Next</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* My Circle Modal - UPDATED TITLE AND MESSAGES ONLY */}
      <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isOwnProfile ? 'Your Circle' : `${user.name?.split(' ')[0] || 'Their'} Circle`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {followingLoading ? (
              <div>Loading...</div>
            ) : following.length > 0 ? (
              following.map((f: any) => (
                <div
                  key={f.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-muted transition cursor-pointer"
                  onClick={() => goToUserProfile(f, () => setShowFollowingModal(false))}
                  tabIndex={0}
                  role="button"
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') goToUserProfile(f, () => setShowFollowingModal(false)); }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={f.image || undefined} alt={f.name || f.username} />
                    <AvatarFallback>{f.name?.[0]?.toUpperCase() || f.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{f.name || f.username}</div>
                    <div className="text-xs text-gray-400">@{f.username}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500">
                {isOwnProfile ? "You haven't added anyone to your circle yet." : "This user hasn't added anyone to their circle yet."}
              </div>
            )}
          </div>
          {/* Pagination controls */}
          <div className="flex justify-between mt-2">
            <Button size="sm" disabled={followingPage === 1} onClick={() => setFollowingPage(p => Math.max(1, p - 1))}>Prev</Button>
            <span>Page {followingPage} of {Math.max(1, Math.ceil(followingTotal / PAGE_SIZE))}</span>
            <Button size="sm" disabled={followingPage * PAGE_SIZE >= followingTotal} onClick={() => setFollowingPage(p => p + 1)}>Next</Button>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}