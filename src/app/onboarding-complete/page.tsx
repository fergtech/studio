'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Users, Target, Heart, ArrowRight, Plus, Search } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd get this from the session or pass it via URL params
    // For now, we'll simulate getting user data
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'spot_issues': return <Target className="w-6 h-6" />;
      case 'share_ideas': return <Lightbulb className="w-6 h-6" />;
      case 'join_initiatives': return <Users className="w-6 h-6" />;
      case 'learn_skills': return <Heart className="w-6 h-6" />;
      case 'organize_communities': return <Users className="w-6 h-6" />;
      default: return <Target className="w-6 h-6" />;
    }
  };

  const getIntentTitle = (intent: string) => {
    switch (intent) {
      case 'spot_issues': return 'Issue Spotter';
      case 'share_ideas': return 'Idea Generator';
      case 'join_initiatives': return 'Community Contributor';
      case 'learn_skills': return 'Skill Learner';
      case 'organize_communities': return 'Community Organizer';
      default: return 'Community Member';
    }
  };

  const getIntentDescription = (intent: string) => {
    switch (intent) {
      case 'spot_issues': return 'You\'re ready to identify and highlight problems in your community. Start by creating your first issue post.';
      case 'share_ideas': return 'You have innovative solutions to share. Let\'s get your ideas out there and see who wants to help bring them to life.';
      case 'join_initiatives': return 'You\'re looking to contribute to existing projects. Browse initiatives that match your interests and skills.';
      case 'learn_skills': return 'You want to develop new skills through community involvement. Find initiatives that offer learning opportunities.';
      case 'organize_communities': return 'You\'re ready to lead and organize community initiatives. Start by creating your first initiative.';
      default: return 'Welcome to the community! Explore what others are working on.';
    }
  };

  const getRecommendedActions = (intent: string) => {
    switch (intent) {
      case 'spot_issues':
        return [
          { title: 'Create an Issue', description: 'Highlight a problem in your community', href: '/issues/create', icon: <Plus className="w-4 h-4" /> },
          { title: 'Browse Issues', description: 'See what others have identified', href: '/feed?type=issues', icon: <Search className="w-4 h-4" /> },
        ];
      case 'share_ideas':
        return [
          { title: 'Share an Idea', description: 'Post your innovative solution', href: '/ideas/create', icon: <Plus className="w-4 h-4" /> },
          { title: 'Browse Ideas', description: 'See what others are proposing', href: '/feed?type=ideas', icon: <Search className="w-4 h-4" /> },
        ];
      case 'join_initiatives':
        return [
          { title: 'Browse Initiatives', description: 'Find projects to join', href: '/initiatives', icon: <Search className="w-4 h-4" /> },
          { title: 'Explore Feed', description: 'See what\'s happening', href: '/feed', icon: <Search className="w-4 h-4" /> },
        ];
      case 'learn_skills':
        return [
          { title: 'Browse Initiatives', description: 'Find learning opportunities', href: '/initiatives', icon: <Search className="w-4 h-4" /> },
          { title: 'Explore Feed', description: 'See community activities', href: '/feed', icon: <Search className="w-4 h-4" /> },
        ];
      case 'organize_communities':
        return [
          { title: 'Create Initiative', description: 'Start organizing your community project', href: '/initiatives/create', icon: <Plus className="w-4 h-4" /> },
          { title: 'Browse Initiatives', description: 'See what others are organizing', href: '/initiatives', icon: <Search className="w-4 h-4" /> },
        ];
      default:
        return [
          { title: 'Explore Feed', description: 'See what\'s happening in the community', href: '/feed', icon: <Search className="w-4 h-4" /> },
          { title: 'Browse Initiatives', description: 'Find projects to get involved with', href: '/initiatives', icon: <Search className="w-4 h-4" /> },
        ];
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Setting up your experience...</p>
        </div>
      </div>
    );
  }

  const primaryIntent = userData?.primaryIntent || 'spot_issues';
  const recommendedActions = getRecommendedActions(primaryIntent);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
            {getIntentIcon(primaryIntent)}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to society+, {userData?.name || 'Community Member'}! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            You're now part of a community of changemakers
          </p>
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
            <span className="font-medium">{getIntentTitle(primaryIntent)}</span>
            <Badge variant="secondary">{primaryIntent.replace('_', ' ')}</Badge>
          </div>
        </div>

        {/* Intent Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getIntentIcon(primaryIntent)}
              <span>Your Journey Starts Here</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {getIntentDescription(primaryIntent)}
            </p>
          </CardContent>
        </Card>

        {/* Recommended Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {recommendedActions.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                      {action.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
                    <p className="text-gray-600 mb-4">{action.description}</p>
                    <Link href={action.href}>
                      <Button className="w-full">
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Here's what we know about you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userData?.interests?.length || 0}</div>
                <div className="text-sm text-gray-600">Interests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userData?.skills?.length || 0}</div>
                <div className="text-sm text-gray-600">Skills</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">Initiatives Joined</div>
              </div>
            </div>
            
            {userData?.interests && userData.interests.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Your Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {userData.interests.map((interest: string, index: number) => (
                    <Badge key={index} variant="outline">{interest}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skip to Feed */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">Or just explore what's happening in the community</p>
          <Link href="/feed">
            <Button variant="outline" size="lg">
              Explore Community Feed
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 
