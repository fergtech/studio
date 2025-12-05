'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { InitiativesListModal } from "@/components/initiatives/InitiativesListModal";
import { Initiative, ContributionItem } from "@/lib/types";
import { CalendarDays, Globe, Mail, MapPin, User2, Globe2, Link as LinkIcon, Edit2, Building2, School, Star, Users, MessageCircle, UserPlus, Settings, ExternalLink, Github, Linkedin, Globe as GlobeIcon, Coffee, Code, Palette, Rocket, Heart, Eye, TrendingUp, Clock, Award, Target, ChevronRight, ChevronLeft, Plus, Filter, CheckCircle, Lightbulb, AlertTriangle, Activity, Briefcase, BookOpen, MapPin as MapPinIcon, UserMinus, Users2, X, Save, MessageSquare } from 'lucide-react';
import { followUserAction, unfollowUserAction } from '@/app/actions/userActions';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { AvatarStack } from '@/components/ui/AvatarStack'; // Import AvatarStack
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
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('sidebarCollapsed:profile');
      if (stored !== null) return stored === 'true';
    }
    return false;
  });
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

  // Scroll refs for horizontal carousels
  const createdProjectsScrollRef = useRef<HTMLDivElement>(null);
  const participatingProjectsScrollRef = useRef<HTMLDivElement>(null);
  const [showCreatedLeftArrow, setShowCreatedLeftArrow] = useState(false);
  const [showCreatedRightArrow, setShowCreatedRightArrow] = useState(false);
  const [showParticipatingLeftArrow, setShowParticipatingLeftArrow] = useState(false);
  const [showParticipatingRightArrow, setShowParticipatingRightArrow] = useState(false);

  // Scroll handlers
  const handleScroll = (ref: React.RefObject<HTMLDivElement>, setShowLeft: (val: boolean) => void, setShowRight: (val: boolean) => void) => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    setShowLeft(scrollLeft > 10);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (!ref.current) return;
    const scrollAmount = 320; // Card width (300px) + gap (20px)
    const newPosition = direction === 'left'
      ? ref.current.scrollLeft - scrollAmount
      : ref.current.scrollLeft + scrollAmount;

    ref.current.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
  };

  // Inline editing state for skills and interests
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingInterests, setEditingInterests] = useState(false);
  const [skillsInput, setSkillsInput] = useState('');
  const [interestsInput, setInterestsInput] = useState('');
  const [currentSkills, setCurrentSkills] = useState<string[]>(user.skills || []);
  const [currentInterests, setCurrentInterests] = useState<string[]>(user.interests || []);
  const [isUpdating, setIsUpdating] = useState(false);

  // Activity feed pagination
  const [activityItemsToShow, setActivityItemsToShow] = useState(6);
  const ACTIVITY_LOAD_MORE_COUNT = 3;

  // Fetch initial followers and following for avatar stacks
  useEffect(() => {
    // Fetch initial followers
    fetch(`/api/users/${user.id}/followers?page=1&limit=10`)
      .then(res => res.json())
      .then(data => {
        setFollowers(data.users || []);
        if (followersPage === 1) { // Only set total if we are on the first page
          setFollowersTotal(data.total || 0);
        }
      });

    // Fetch initial following
    fetch(`/api/users/${user.id}/following?page=1&limit=10`)
      .then(res => res.json())
      .then(data => {
        setFollowing(data.users || []);
        if (followingPage === 1) {
          setFollowingTotal(data.total || 0);
        }
      });
  }, [user.id]);

  // Posts filter state
  const [postsFilter, setPostsFilter] = useState<'all' | 'general' | 'issues' | 'ideas' | 'debates'>('all');

  // Combine all posts and sort by date
  const getAllPosts = () => {
    const posts: Array<any> = [];

    // Add general posts
    if (user.createdGeneralPosts) {
      user.createdGeneralPosts.forEach((post: any) => {
        posts.push({
          ...post,
          type: 'general',
          createdAt: post.timestamp,
        });
      });
    }

    // Add issues
    if (user.createdIssues) {
      user.createdIssues.forEach((issue: any) => {
        posts.push({
          ...issue,
          type: 'issues',
        });
      });
    }

    // Add ideas
    if (user.createdIdeas) {
      user.createdIdeas.forEach((idea: any) => {
        posts.push({
          ...idea,
          type: 'ideas',
        });
      });
    }

    // Add debates
    if (user.createdDebateTopics) {
      user.createdDebateTopics.forEach((debate: any) => {
        posts.push({
          ...debate,
          type: 'debates',
        });
      });
    }

    // Sort by date (newest first)
    return posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  // Filter posts based on current filter
  const getFilteredPosts = () => {
    const allPosts = getAllPosts();
    if (postsFilter === 'all') return allPosts;
    return allPosts.filter(post => post.type === postsFilter);
  };

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

  // Activity feed pagination handlers
  const handleLoadMoreActivity = () => {
    setActivityItemsToShow(prev => prev + ACTIVITY_LOAD_MORE_COUNT);
  };

  const visibleActivityItems = activityFeed.slice(0, activityItemsToShow);
  const hasMoreActivity = activityItemsToShow < activityFeed.length;

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

  // Post card component for mixed post types
  const PostCard = ({ post }: { post: any }) => {
    let href = '#';
    let icon = null;
    let gradientClass = '';
    let typeLabel = '';

    if (post.type === 'general') {
      href = `/posts/${post.id}`;
      icon = <MessageCircle className="h-4 w-4 text-white" />;
      gradientClass = 'from-blue-600 to-blue-800';
      typeLabel = 'Post';
    } else if (post.type === 'issues') {
      href = `/issues/${post.id}`;
      icon = <AlertTriangle className="h-4 w-4 text-white" />;
      gradientClass = 'from-red-600 to-red-800';
      typeLabel = 'Issue';
    } else if (post.type === 'ideas') {
      href = `/ideas/${post.id}`;
      icon = <Lightbulb className="h-4 w-4 text-white" />;
      gradientClass = 'from-yellow-500 to-yellow-700';
      typeLabel = 'Idea';
    } else if (post.type === 'debates') {
      href = `/debates/${post.id}`;
      icon = <MessageSquare className="h-4 w-4 text-white" />;
      gradientClass = 'from-purple-600 to-purple-800';
      typeLabel = 'Debate';
    }

    const hasMedia = post.media && post.media.length > 0;
    const backgroundImage = hasMedia ? post.media[0].url : (post.background || null);

    return (
      <Link key={post.id} href={href} className="block h-[200px] cursor-pointer">
        <div className="relative cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group h-full rounded-lg">
          {/* Background Image and Overlay */}
          {backgroundImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundImage: `url(${backgroundImage})` }}
            >
              <div className="absolute inset-0 bg-black/60" />
            </div>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />
          )}
          {/* Content Layer */}
          <div className="relative z-10 flex flex-col h-full justify-between p-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="text-xs text-white font-medium">{typeLabel}</span>
                </div>
                {post.society && (
                  <div className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                    <span className="text-xs text-white font-medium">{post.society.name}</span>
                  </div>
                )}
              </div>
              <div className="text-base line-clamp-2 text-white font-semibold">
                {post.title || (post.content ? post.content.slice(0, 60) + '...' : 'Untitled')}
              </div>
              {(post.description || post.content) && (
                <div className="line-clamp-3 text-gray-200 text-xs mt-1">
                  {post.description || post.content}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
              {/* Show appropriate stats based on post type */}
              {post.type === 'debates' && (post.totalVotes !== undefined || post.votersCount !== undefined || post.votes) ? (
                <span className="text-xs text-gray-300">
                  🗳️ {post.totalVotes || post.votersCount || (post.votes && post.votes.length) || 0}
                </span>
              ) : (post.championCount !== undefined || post.likeCount !== undefined) && (
                <span className="text-xs text-gray-300">
                  💪 {post.championCount || post.likeCount || 0}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  // Calculate community impact metrics
  const contentContributions = (user.createdGeneralPosts?.length || 0) + 
                               (user.createdIssues?.length || 0) + 
                               (user.createdIdeas?.length || 0) + 
                               (user.createdDebateTopics?.length || 0);
                               
  const communityStats = {
    initiativesCreated: user.createdInitiatives?.length || 0,
    initiativesJoined: user.initiativeMemberships?.length || 0,
    totalContributions: (user.createdInitiatives?.length || 0) + (user.initiativeMemberships?.length || 0) + contentContributions,
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

  // Parallax effect for banner
  const [bannerOffset, setBannerOffset] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!bannerRef.current) return;
      // Get scroll position relative to banner
      const rect = bannerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      // Only apply parallax while banner is visible
      if (rect.bottom > 0) {
        setBannerOffset(scrollY * 0.4); // 0.4 = slower than scroll
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize scroll arrow visibility
  useEffect(() => {
    const checkScrollability = () => {
      if (createdProjectsScrollRef.current) {
        const { scrollWidth, clientWidth } = createdProjectsScrollRef.current;
        setShowCreatedRightArrow(scrollWidth > clientWidth);
        setShowCreatedLeftArrow(false); // Initially at start
      }
      if (participatingProjectsScrollRef.current) {
        const { scrollWidth, clientWidth } = participatingProjectsScrollRef.current;
        setShowParticipatingRightArrow(scrollWidth > clientWidth);
        setShowParticipatingLeftArrow(false); // Initially at start
      }
    };

    // Check immediately and after a small delay to ensure layout is complete
    checkScrollability();
    const timer1 = setTimeout(checkScrollability, 100);
    const timer2 = setTimeout(checkScrollability, 300);

    // Re-check on window resize
    window.addEventListener('resize', checkScrollability);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [user.createdInitiatives, user.initiativeMemberships]);

  useEffect(() => {
    const handleSidebarChange = (event: CustomEvent) => {
      setSidebarCollapsed(event.detail.collapsed);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarCollapsed:profile', String(event.detail.collapsed));
      }
    };

    window.addEventListener('sidebar:collapseChange', handleSidebarChange as EventListener);
    return () => {
      window.removeEventListener('sidebar:collapseChange', handleSidebarChange as EventListener);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        {/* Mobile Profile View - Only visible on mobile */}
        <div className="lg:hidden">
          {/* Mobile Header */}
          <div className="bg-gray-900 dark:bg-gray-900 border-b border-gray-800 h-[69px] fixed top-0 left-0 right-0 z-50">
            <div className="flex items-center justify-between h-full px-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="text-white hover:bg-gray-800"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-white">Profile</h1>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-gray-800"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Profile Content */}
          <div className="pt-[69px] pb-[85px] bg-gray-900 dark:bg-gray-900 min-h-screen">
            {/* Profile Header Section */}
            <div className="px-4 pt-6 pb-8">
              {/* Avatar */}
              <div className="flex justify-center mb-7">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-gray-700">
                    <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                    <AvatarFallback className="text-2xl">{user.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-gray-900 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              </div>

              {/* Name & Info */}
              <div className="text-center space-y-2 mb-6">
                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                <p className="text-base text-gray-400">@{user.username}</p>
                <p className="text-sm font-medium text-gray-300">{user.profession || user.bio?.slice(0, 50) || 'Member'}</p>
                
                {/* Location & Join Date */}
                <div className="flex items-center justify-center gap-6 text-sm text-gray-400 pt-2">
                  <div className="flex items-center gap-1.5">
                    <MapPinIcon className="w-3.5 h-3.5" />
                    <span>
                      {(() => {
                        const hasLocationSet = user.location || user.city;
                        if (user.showLocation) {
                          if (user.location) {
                            try {
                              const parsedLocation = JSON.parse(user.location);
                              return parsedLocation.displayName?.split(',')[0] || 'Location';
                            } catch {
                              return user.location.split(',')[0] || 'Location';
                            }
                          }
                          if (user.city) return user.city.split(',')[0];
                        } else if (hasLocationSet) {
                          return 'Hidden';
                        }
                        return 'Not set';
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Joined {new Date(user.dateCreated).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                {isOwnProfile ? (
                  <Button 
                    onClick={() => router.push(`/profile/${user.id}/edit`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-[42px] rounded-lg font-medium"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={isFollowing ? handleUnfollow : handleFollow}
                      disabled={isFollowLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-[42px] rounded-lg font-medium flex-1 max-w-[120px]"
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/chat/${user.id}`)}
                      className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 h-[42px] rounded-lg font-medium flex-1 max-w-[140px]"
                    >
                      Message
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Impact Overview Section */}
            <div className="px-4 pb-8">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white text-center mb-6">Impact Overview</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Initiatives Created */}
                  <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-4 text-center">
                    <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Rocket className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{communityStats.initiativesCreated}</div>
                    <div className="text-xs text-gray-400 leading-tight">
                      Initiatives<br />Created
                    </div>
                  </div>

                  {/* Initiatives Joined */}
                  <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-4 text-center">
                    <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Users className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{communityStats.initiativesJoined}</div>
                    <div className="text-xs text-gray-400 leading-tight">
                      Initiatives<br />Joined
                    </div>
                  </div>

                  {/* Total Contributions */}
                  <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-4 text-center">
                    <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{communityStats.totalContributions}</div>
                    <div className="text-xs text-gray-400 leading-tight">
                      Total<br />Contributions
                    </div>
                  </div>

                  {/* Circle Members */}
                  <div className="bg-gray-900/50 border border-gray-700/30 rounded-xl p-4 text-center">
                    <div className="w-10 h-10 bg-orange-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Users2 className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {communityStats.followers > 999 ? `${(communityStats.followers / 1000).toFixed(1)}K` : communityStats.followers}
                    </div>
                    <div className="text-xs text-gray-400 leading-tight">
                      Circle<br />Members
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="px-4">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              
              <div className="space-y-3">
                {visibleActivityItems.slice(0, 3).map((item: ContributionItem, index: number) => {
                  // Determine activity type and icon
                  const activityType = item.title.toLowerCase();
                  let iconBg = 'bg-blue-600/20';
                  let iconColor = 'text-blue-400';
                  let IconComponent = Rocket;

                  if (activityType.includes('joined')) {
                    iconBg = 'bg-green-600/20';
                    iconColor = 'text-green-400';
                    IconComponent = Users;
                  } else if (activityType.includes('contribution') || activityType.includes('added')) {
                    iconBg = 'bg-purple-600/20';
                    iconColor = 'text-purple-400';
                    IconComponent = Activity;
                  }

                  return (
                    <div key={index} className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className={`w-4 h-4 ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white mb-1">{item.title}</p>
                          {item.details && (
                            <p className="text-xs text-gray-400 line-clamp-2 mb-2">{item.details}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {(() => {
                              const now = new Date();
                              const itemDate = new Date(item.date);
                              const diffInHours = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60));
                              const diffInDays = Math.floor(diffInHours / 24);
                              
                              if (diffInHours < 1) return 'Just now';
                              if (diffInHours < 24) return `${diffInHours} hours ago`;
                              if (diffInDays === 1) return '1 day ago';
                              if (diffInDays < 7) return `${diffInDays} days ago`;
                              return itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {activityFeed.length === 0 && (
                  <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-8 text-center">
                    <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">
                      {isOwnProfile ? "No recent activity yet" : "This user has no recent activity"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 dark:bg-gray-900 border-t border-gray-800 h-[69px] z-50">
            <div className="flex items-center justify-around h-full px-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Activity className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/explore')}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Globe className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/initiatives/create')}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/activity')}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-500 hover:text-blue-400 hover:bg-gray-800"
              >
                <User2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop Profile View - Hidden on mobile */}
        <div className="hidden lg:block">
        {/* Main Profile Content */}
        <div className={`px-4 lg:px-6 pt-20 lg:pt-6 pb-32 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
        }`}>
          {/* Community Profile Header */}
          <div className="relative w-full mb-8">
        {/* Banner with Parallax */}
        <div ref={bannerRef} className="relative h-56 sm:h-72 md:h-96 w-full rounded-t-xl overflow-hidden bg-muted">
          {user.bannerImageUrl ? (
            <Image 
              src={user.bannerImageUrl} 
              alt="Profile banner" 
              fill 
              className="object-cover w-full h-full will-change-transform"
              style={{ transform: `translateY(${bannerOffset * 0.5}px)` }}
            />
          ) : (
            <div 
              className="w-full h-full bg-gradient-to-r from-blue-500 via-blue-600 to-green-500 will-change-transform"
              style={{ transform: `translateY(${bannerOffset * 0.5}px)` }}
            />
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
                      {(() => {
                        // Check if user has a location set (either structured or city)
                        const hasLocationSet = user.location || user.city;
                        
                        if (user.showLocation) {
                          // Try to parse structured location first
                          if (user.location) {
                            try {
                              const parsedLocation = JSON.parse(user.location);
                              return parsedLocation.displayName || 'Location set';
                            } catch {
                              // Fall back to user.location as string if JSON parse fails
                              return user.location;
                            }
                          }
                          // Fall back to city field
                          if (user.city) {
                            return user.city;
                          }
                        } else if (hasLocationSet) {
                          // User has location but chose to hide it
                          return 'Location hidden';
                        }
                        
                        // No location set yet
                        return 'Location not set';
                      })()}
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
                <div className="text-xs text-gray-500 dark:text-gray-400">Projects Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{communityStats.initiativesJoined}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Projects Joined</div>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Tabs defaultValue="posts" className="w-full">
          <div className="w-full overflow-x-auto scrollbar-hide mb-6">
            <TabsList className="flex bg-gray-100 dark:bg-gray-800 gap-1 p-1 rounded-lg min-w-max">
            <TabsTrigger value="overview" className="flex-shrink-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 min-w-max">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="initiatives" className="flex-shrink-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 min-w-max">
              <Rocket className="w-4 h-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="societies" className="flex-shrink-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 min-w-max">
              <Users className="w-4 h-4 mr-2" />
              Societies
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex-shrink-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 min-w-max">
              <Lightbulb className="w-4 h-4 mr-2" />
              Posts
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="activity" className="flex-shrink-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 min-w-max">
                <Clock className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
            )}
            <TabsTrigger value="circle" className="flex-shrink-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 min-w-max">
              <Users2 className="w-4 h-4 mr-2" />
              Circle
            </TabsTrigger>
          </TabsList>
          </div>

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
          <TabsContent value="initiatives" className="space-y-8 mt-6">
            {/* Created Initiatives */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-blue-600" />
                  Projects Created
                </h3>
                {user.createdInitiatives && user.createdInitiatives.length > 5 && (
                  <span className="text-sm text-gray-500">
                    {user.createdInitiatives.length} total
                  </span>
                )}
              </div>

              {user.createdInitiatives && user.createdInitiatives.length > 0 ? (
                <div className="relative group">
                  {/* Left Arrow */}
                  {showCreatedLeftArrow && (
                    <button
                      onClick={() => scrollTo(createdProjectsScrollRef, 'left')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center transition-all duration-200 hover:bg-white dark:hover:bg-gray-800 hover:scale-110"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                    </button>
                  )}

                  {/* Right Arrow */}
                  {showCreatedRightArrow && (
                    <button
                      onClick={() => scrollTo(createdProjectsScrollRef, 'right')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center transition-all duration-200 hover:bg-white dark:hover:bg-gray-800 hover:scale-110"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                    </button>
                  )}

                  {/* Gradient Fade Indicators */}
                  {showCreatedLeftArrow && (
                    <div className="absolute left-0 top-0 bottom-4 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none z-[5]" />
                  )}
                  {showCreatedRightArrow && (
                    <div className="absolute right-0 top-0 bottom-4 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none z-[5]" />
                  )}

                  <div
                    ref={createdProjectsScrollRef}
                    onScroll={() => handleScroll(createdProjectsScrollRef, setShowCreatedLeftArrow, setShowCreatedRightArrow)}
                    className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
                  >
                    {user.createdInitiatives.slice(0, 5).map((initiative: Initiative) => {
                      const memberCount = initiative.memberships?.length || 0;
                      const goalCount = initiative.goals?.length || 0;
                      const completedGoals = initiative.goals?.filter(g => g.status === 'Completed').length || 0;
                      const progressPercent = goalCount > 0 ? Math.round((completedGoals / goalCount) * 100) : 0;

                      // Status gradient colors
                      const statusGradient = initiative.status === 'InProgress'
                        ? 'from-blue-500 to-blue-600'
                        : initiative.status === 'Completed'
                        ? 'from-green-500 to-green-600'
                        : 'from-purple-500 to-purple-600';

                      return (
                        <Link key={initiative.id} href={`/initiatives/${initiative.id}`} className="flex-shrink-0 w-[300px] snap-center">
                          <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                            {/* Cover Image/Gradient */}
                            <div className={`h-32 bg-gradient-to-br ${statusGradient} relative overflow-hidden`}>
                              {initiative.imageUrl ? (
                                <img
                                  src={initiative.imageUrl}
                                  alt={initiative.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Rocket className="w-12 h-12 text-white/30" />
                                </div>
                              )}
                              {/* Status Badge */}
                              <Badge className="absolute top-2 right-2 bg-white/90 text-gray-900 backdrop-blur-sm">
                                {initiative.status}
                              </Badge>
                            </div>

                            <CardContent className="p-4 space-y-3">
                              {/* Title */}
                              <h4 className="font-semibold text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {initiative.title}
                              </h4>

                              {/* Description */}
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[40px]">
                                {initiative.description}
                              </p>

                              {/* Progress Bar */}
                              {goalCount > 0 && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>Progress</span>
                                    <span className="font-medium">{progressPercent}%</span>
                                  </div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full bg-gradient-to-r ${statusGradient} transition-all duration-500`}
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Members & Metrics */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                  {initiative.memberships && initiative.memberships.slice(0, 3).length > 0 ? (
                                    <div className="flex -space-x-2">
                                      {initiative.memberships.slice(0, 3).map((member, idx) => (
                                        <Avatar key={idx} className="w-6 h-6 border-2 border-white dark:border-gray-800">
                                          <AvatarImage src={member.user.image || undefined} />
                                          <AvatarFallback className="text-xs">{member.user.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                      ))}
                                      {memberCount > 3 && (
                                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                          <span className="text-[10px] font-medium">+{memberCount - 3}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-500">{memberCount} members</span>
                                  )}
                                </div>

                                <Badge variant="secondary" className="text-xs">
                                  Creator
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}

                    {/* View All Card */}
                    {user.createdInitiatives && user.createdInitiatives.length > 5 && (
                      <div
                        onClick={() => setShowCreatedInitiativesModal(true)}
                        className="flex-shrink-0 w-[300px] snap-center cursor-pointer"
                      >
                        <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed">
                          <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                              <Rocket className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h4 className="font-semibold text-lg mb-2">View All Projects</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              See all {user.createdInitiatives.length} projects
                            </p>
                            <Button variant="outline" size="sm">
                              View All
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                        <Rocket className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        {isOwnProfile ? "You haven't created any projects yet." : "This user hasn't created any projects yet."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Participating Initiatives */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Participating In
                </h3>
                {user.initiativeMemberships && user.initiativeMemberships.length > 5 && (
                  <span className="text-sm text-gray-500">
                    {user.initiativeMemberships.length} total
                  </span>
                )}
              </div>

              {user.initiativeMemberships && user.initiativeMemberships.length > 0 ? (
                <div className="relative group">
                  {/* Left Arrow */}
                  {showParticipatingLeftArrow && (
                    <button
                      onClick={() => scrollTo(participatingProjectsScrollRef, 'left')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center transition-all duration-200 hover:bg-white dark:hover:bg-gray-800 hover:scale-110"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                    </button>
                  )}

                  {/* Right Arrow */}
                  {showParticipatingRightArrow && (
                    <button
                      onClick={() => scrollTo(participatingProjectsScrollRef, 'right')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center transition-all duration-200 hover:bg-white dark:hover:bg-gray-800 hover:scale-110"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                    </button>
                  )}

                  {/* Gradient Fade Indicators */}
                  {showParticipatingLeftArrow && (
                    <div className="absolute left-0 top-0 bottom-4 w-20 bg-gradient-to-r from-background to-transparent pointer-events-none z-[5]" />
                  )}
                  {showParticipatingRightArrow && (
                    <div className="absolute right-0 top-0 bottom-4 w-20 bg-gradient-to-l from-background to-transparent pointer-events-none z-[5]" />
                  )}

                  <div
                    ref={participatingProjectsScrollRef}
                    onScroll={() => handleScroll(participatingProjectsScrollRef, setShowParticipatingLeftArrow, setShowParticipatingRightArrow)}
                    className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
                  >
                    {user.initiativeMemberships.slice(0, 5).map((membership: any) => {
                      const initiative = membership.initiative;
                      const memberCount = initiative.memberships?.length || 0;
                      const goalCount = initiative.goals?.length || 0;
                      const completedGoals = initiative.goals?.filter((g: any) => g.status === 'Completed').length || 0;
                      const progressPercent = goalCount > 0 ? Math.round((completedGoals / goalCount) * 100) : 0;

                      // Status gradient colors
                      const statusGradient = initiative.status === 'InProgress'
                        ? 'from-green-500 to-emerald-600'
                        : initiative.status === 'Completed'
                        ? 'from-green-500 to-green-600'
                        : 'from-teal-500 to-cyan-600';

                      // Role color
                      const roleColor = membership.role === 'ADMIN'
                        ? 'bg-orange-500 text-white'
                        : membership.role === 'CONTRIBUTOR'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-500 text-white';

                      return (
                        <Link key={initiative.id} href={`/initiatives/${initiative.id}`} className="flex-shrink-0 w-[300px] snap-center">
                          <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                            {/* Cover Image/Gradient */}
                            <div className={`h-32 bg-gradient-to-br ${statusGradient} relative overflow-hidden`}>
                              {initiative.imageUrl ? (
                                <img
                                  src={initiative.imageUrl}
                                  alt={initiative.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Users className="w-12 h-12 text-white/30" />
                                </div>
                              )}
                              {/* Status Badge */}
                              <Badge className="absolute top-2 right-2 bg-white/90 text-gray-900 backdrop-blur-sm">
                                {initiative.status}
                              </Badge>
                            </div>

                            <CardContent className="p-4 space-y-3">
                              {/* Title */}
                              <h4 className="font-semibold text-base line-clamp-1 group-hover:text-green-600 transition-colors">
                                {initiative.title}
                              </h4>

                              {/* Description */}
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[40px]">
                                {initiative.description}
                              </p>

                              {/* Progress Bar */}
                              {goalCount > 0 && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>Progress</span>
                                    <span className="font-medium">{progressPercent}%</span>
                                  </div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full bg-gradient-to-r ${statusGradient} transition-all duration-500`}
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Members & Role */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center">
                                  {initiative.memberships && initiative.memberships.slice(0, 3).length > 0 ? (
                                    <div className="flex -space-x-2">
                                      {initiative.memberships.slice(0, 3).map((member: any, idx: number) => (
                                        <Avatar key={idx} className="w-6 h-6 border-2 border-white dark:border-gray-800">
                                          <AvatarImage src={member.user.image || undefined} />
                                          <AvatarFallback className="text-xs">{member.user.name?.[0]}</AvatarFallback>
                                        </Avatar>
                                      ))}
                                      {memberCount > 3 && (
                                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                          <span className="text-[10px] font-medium">+{memberCount - 3}</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-500">{memberCount} members</span>
                                  )}
                                </div>

                                <Badge className={`text-xs ${roleColor}`}>
                                  {membership.role}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}

                    {/* View All Card */}
                    {user.initiativeMemberships && user.initiativeMemberships.length > 5 && (
                      <div
                        onClick={() => setShowParticipatingInModal(true)}
                        className="flex-shrink-0 w-[300px] snap-center cursor-pointer"
                      >
                        <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed">
                          <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                              <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h4 className="font-semibold text-lg mb-2">View All Projects</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              See all {user.initiativeMemberships.length} projects
                            </p>
                            <Button variant="outline" size="sm">
                              View All
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        {isOwnProfile ? "You aren't participating in any projects yet." : "This user isn't participating in any projects yet."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Societies Tab */}
          <TabsContent value="societies" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Societies
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.societyMemberships && user.societyMemberships.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.societyMemberships.map((membership: any) => (
                      <Link key={membership.society.id} href={`/societies/${membership.society.id}`} className="block">
                        <Card className="h-full hover:shadow-md transition-shadow">
                          <CardHeader className="flex flex-row items-center gap-4 p-4">
                            <Avatar>
                              <AvatarImage src={membership.society.image || '/images/placeholder-image.png'} alt={membership.society.name} />
                              <AvatarFallback>{membership.society.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <CardTitle className="text-base">{membership.society.name}</CardTitle>
                              <CardDescription className="text-xs">{membership.role}</CardDescription>
                            </div>
                          </CardHeader>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {isOwnProfile ? "You haven't joined any societies yet." : "This user hasn't joined any societies yet."}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab - Mixed post types with filtering */}
          <TabsContent value="posts" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Posts
                  </CardTitle>
                  {/* Filter buttons - scrollable on mobile */}
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 min-w-0 -mb-2 sm:mb-0">
                    <Button
                      variant={postsFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPostsFilter('all')}
                      className="flex-shrink-0"
                    >
                      All
                    </Button>
                    <Button
                      variant={postsFilter === 'general' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPostsFilter('general')}
                      className="flex-shrink-0"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Posts
                    </Button>
                    <Button
                      variant={postsFilter === 'issues' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPostsFilter('issues')}
                      className="flex-shrink-0"
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Issues
                    </Button>
                    <Button
                      variant={postsFilter === 'ideas' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPostsFilter('ideas')}
                      className="flex-shrink-0"
                    >
                      <Lightbulb className="w-4 h-4 mr-1" />
                      Ideas
                    </Button>
                    <Button
                      variant={postsFilter === 'debates' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPostsFilter('debates')}
                      className="flex-shrink-0"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Debates
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const filteredPosts = getFilteredPosts();
                  return filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredPosts.map((post: any) => (
                        <PostCard key={`${post.type}-${post.id}`} post={post} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      {postsFilter === 'all'
                        ? (isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet.")
                        : `No ${postsFilter} found.`
                      }
                    </p>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab - Only visible for own profile */}
          {isOwnProfile && (
            <TabsContent value="activity" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {activityFeed.length > 0 ? (
                  <div className="space-y-6">
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {visibleActivityItems.map((item: ContributionItem, index: number) => (
                          <li key={index}>
                            <div className="relative pb-8">
                              {index !== visibleActivityItems.length - 1 ? (
                                <span 
                                  className="absolute left-4 top-10 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" 
                                  aria-hidden="true"
                                />
                              ) : null}
                              <div className="relative flex space-x-3">
                                <div>
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
                                    <AvatarFallback className="bg-blue-500 text-white text-sm">
                                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {user.name || 'You'}
                                      </span>{' '}
                                      {item.title.toLowerCase()}
                                    </p>
                                    {item.details && (
                                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                                        <p className="line-clamp-2">{item.details}</p>
                                      </div>
                                    )}
                                    {item.relatedInitiativeId && (
                                      <div className="mt-2">
                                        <Link 
                                          href={`/initiatives/${item.relatedInitiativeId}`} 
                                          className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                                        >
                                          View Initiative →
                                        </Link>
                                      </div>
                                    )}
                                  </div>
                                  <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                                    <time dateTime={typeof item.date === 'string' ? item.date : item.date.toISOString()}>
                                      {(() => {
                                        const now = new Date();
                                        const itemDate = new Date(item.date);
                                        const diffInHours = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60));
                                        const diffInDays = Math.floor(diffInHours / 24);
                                        
                                        if (diffInHours < 1) return 'Just now';
                                        if (diffInHours < 24) return `${diffInHours}h ago`;
                                        if (diffInDays < 7) return `${diffInDays}d ago`;
                                        return itemDate.toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric' 
                                        });
                                      })()}
                                    </time>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Load More Button */}
                    {hasMoreActivity && (
                      <div className="flex justify-center pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button 
                          variant="outline" 
                          onClick={handleLoadMoreActivity}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Load More Activity ({activityFeed.length - activityItemsToShow} remaining)
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8">
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                      {isOwnProfile ? "You haven't posted any activity yet." : "This user hasn't posted any activity yet."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* Circle Tab - NEW TAB WITH CIRCLE UI */}
          <TabsContent value="circle" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* In Their Circle - VISUAL ONLY CHANGES */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-orange-600" />
                    {isOwnProfile ? 'Circles You\'re In' : `Circles ${user.name?.split(' ')[0] || 'Their'} is in`}
                  </CardTitle>
                  <CardDescription>
                    {isOwnProfile 
                      ? `People who have added you to their circle (${communityStats.following})`
                      : `People who have added ${user.name?.split(' ')[0] || 'them'} to their circle (${communityStats.followers})`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AvatarStack users={followers} />
                  <Button 
                    variant="outline" 
                    className="w-full mt-2" 
                    onClick={() => setShowFollowersModal(true)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Circles
                  </Button>
                </CardContent>
              </Card>

              {/* My Circle / Their Circle - VISUAL ONLY CHANGES */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-indigo-600" />
                    {isOwnProfile ? 'In Your Circle' : `${user.name?.split(' ')[0] || 'Their'}\'s Circle`}
                  </CardTitle>
                  <CardDescription>
                    {isOwnProfile 
                      ? `People you have added to your circle (${communityStats.followers})`
                      : `People ${user.name?.split(' ')[0] || 'they'} have added to their circle (${communityStats.following})`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AvatarStack users={following} />
                  <Button 
                    variant="outline" 
                    className="w-full mt-2" 
                    onClick={() => setShowFollowingModal(true)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Circle
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
              {isOwnProfile ? 'Others who\'ve added you' : `Others who\'ve added ${user.name?.split(' ')[0] || 'Their'}`}
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
              {isOwnProfile ? 'Your Circle' : `Others ${user.name?.split(' ')[0] || 'Their'} has added`}
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
    </div>
  );
}