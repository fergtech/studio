'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AppSidebar from '@/components/AppSidebar';
import { Shield, CheckCircle, XCircle, AlertTriangle, Users, UserPlus, UserMinus, Crown, ShieldCheck } from 'lucide-react';

interface PendingContent {
  id: string;
  contentType: 'post' | 'issue' | 'idea';
  content?: string;
  title?: string;
  description?: string;
  moderationFlags: string[];
  moderationScore?: number;
  moderationReasoning?: string;
  creator: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  media?: Array<{ url: string; type: string }>;
  timestamp?: Date;
  createdAt?: Date;
}

interface StaffMember {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  image: string | null;
  isModerator: boolean;
  isAdmin: boolean;
  dateCreated: Date;
  lastActiveAt: Date | null;
}

export default function ModerationQueuePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [pendingContent, setPendingContent] = useState<PendingContent[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'moderator' | 'admin'>('moderator');
  const [currentUserRole, setCurrentUserRole] = useState<{ isAdmin: boolean; isModerator: boolean } | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('sidebarCollapsed:moderation');
      if (stored !== null) return stored === 'true';
    }
    // Use AppSidebar's smart default for moderation pages (utility page = open by default)
    return false;
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    fetchPendingContent();
    fetchStaffMembers();
  }, []);

  const fetchPendingContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/moderation');

      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: 'Access Denied',
            description: 'You do not have moderator permissions',
            variant: 'destructive'
          });
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch moderation queue');
      }

      const data = await response.json();
      setPendingContent(data.pending || []);
      
      // Set current user role from session extension
      if (session?.user) {
        const userResponse = await fetch('/api/user/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setCurrentUserRole({
            isAdmin: userData.isAdmin || false,
            isModerator: userData.isModerator || false
          });
        }
      }
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      toast({
        title: 'Error',
        description: 'Failed to load moderation queue',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      setLoadingStaff(true);
      const response = await fetch('/api/admin/staff');

      if (!response.ok) {
        if (response.status === 403) {
          // User is not admin or moderator, cannot view staff
          setStaffMembers([]);
          return;
        }
        throw new Error('Failed to fetch staff members');
      }

      const data = await response.json();
      setStaffMembers(data.staff || []);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleModeration = async (contentId: string, contentType: string, action: 'approve' | 'reject') => {
    setProcessingId(contentId);

    try {
      const response = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, contentType, action })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} content`);
      }

      toast({
        title: action === 'approve' ? 'Content Approved' : 'Content Rejected',
        description: `${contentType} has been ${action}d`,
      });

      // Remove from list
      setPendingContent(prev => prev.filter(c => c.id !== contentId));

    } catch (error) {
      console.error(`Error ${action}ing content:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} content`,
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRoleChange = async (userId: string, action: 'add' | 'remove', role: 'moderator' | 'admin') => {
    setPromotingUserId(userId);

    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, role })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} ${role} role`);
      }

      const data = await response.json();
      
      toast({
        title: 'Role Updated',
        description: data.message,
      });

      // Refresh staff list
      fetchStaffMembers();

    } catch (error) {
      console.error(`Error updating role:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to update ${role} role`,
        variant: 'destructive'
      });
    } finally {
      setPromotingUserId(null);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/search-users?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePromoteUser = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a user email',
        variant: 'destructive'
      });
      return;
    }

    try {
      // First find the user by email
      const userResponse = await fetch(`/api/admin/find-user?email=${encodeURIComponent(newUserEmail)}`);
      
      if (!userResponse.ok) {
        throw new Error('User not found with that email');
      }

      const userData = await userResponse.json();
      
      // Then promote them
      await handleRoleChange(userData.id, 'add', selectedRole);
      
      setNewUserEmail('');
      
    } catch (error) {
      console.error('Error promoting user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to promote user',
        variant: 'destructive'
      });
    }
  };

  const handlePromoteUserFromSearch = async (user: any) => {
    try {
      await handleRoleChange(user.id, 'add', selectedRole);
      setUserSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error promoting user from search:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="w-full min-w-0 overflow-hidden">
        <AppSidebar
          className="hidden lg:flex"
          widgets={['userControls', 'navigation', 'resources', 'footer']}
          context={{ type: 'moderation' }}
          onCollapseChange={(collapsed: boolean) => {
            setSidebarCollapsed(collapsed);
            if (typeof window !== 'undefined') {
              localStorage.setItem('sidebarCollapsed:moderation', String(collapsed));
            }
          }}
        />
        <div className={`px-4 lg:px-6 pt-20 lg:pt-6 pb-32 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
        }`}>
          <div className="max-w-7xl mx-auto py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-muted-foreground">Loading moderation queue...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <AppSidebar
        className="hidden lg:flex"
        widgets={['userControls', 'navigation', 'resources', 'footer']}
        context={{ type: 'moderation' }}
        onCollapseChange={(collapsed: boolean) => {
          setSidebarCollapsed(collapsed);
          if (typeof window !== 'undefined') {
            localStorage.setItem('sidebarCollapsed:moderation', String(collapsed));
          }
        }}
      />
      <div className={`px-4 lg:px-6 pt-20 lg:pt-6 pb-32 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80 xl:ml-96'
      }`}>
        <div className="max-w-7xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Admin & Moderation Center</h1>
          <p className="text-muted-foreground">Manage content moderation and platform administration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Main Column - Content Moderation */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Content Moderation Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingContent.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">All Clear!</h2>
                  <p className="text-muted-foreground">No content pending review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    {pendingContent.length} item{pendingContent.length !== 1 ? 's' : ''} pending review
                  </div>

                  {pendingContent.map((item) => (
                    <Card key={item.id} className="overflow-hidden border-l-4 border-l-orange-500">
                      <CardHeader className="bg-muted/50 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="capitalize">
                              {item.contentType}
                            </Badge>
                            {item.moderationFlags.length > 0 && (
                              <div className="flex gap-1">
                                {item.moderationFlags.map((flag) => (
                                  <Badge key={flag} variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {flag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {item.moderationScore && (
                              <Badge variant="secondary" className="text-xs">
                                Score: {(item.moderationScore * 100).toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            By: {item.creator.name || item.creator.email}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-4">
                        {/* Content Preview */}
                        <div className="mb-4">
                          {item.title && (
                            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                          )}
                          <p className="text-sm whitespace-pre-wrap line-clamp-6">
                            {item.content || item.description}
                          </p>
                        </div>

                        {/* Media Preview */}
                        {item.media && item.media.length > 0 && (
                          <div className="mb-4 flex gap-2">
                            {item.media.slice(0, 3).map((media, idx) => (
                              <div key={idx} className="relative w-24 h-24 rounded border overflow-hidden">
                                {media.type === 'image' ? (
                                  <img src={media.url} alt="Content media" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="flex items-center justify-center w-full h-full bg-muted text-xs">
                                    Video
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* AI Reasoning */}
                        {item.moderationReasoning && (
                          <div className="mb-4 p-3 bg-muted rounded text-sm">
                            <div className="font-medium mb-1">AI Analysis:</div>
                            <div className="text-muted-foreground">{item.moderationReasoning}</div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleModeration(item.id, item.contentType, 'approve')}
                            disabled={processingId === item.id}
                            className="flex-1"
                            variant="default"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleModeration(item.id, item.contentType, 'reject')}
                            disabled={processingId === item.id}
                            className="flex-1"
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Staff Management */}
        <div className="space-y-6">
          {/* Current Staff Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Platform Staff
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingStaff ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : staffMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No staff members found.</p>
              ) : (
                <div className="space-y-3">
                  {staffMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 p-3 rounded border">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.image || undefined} />
                        <AvatarFallback>
                          {(member.name || member.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {member.name || member.email}
                          </p>
                          <div className="flex gap-1">
                            {member.isAdmin && (
                              <Badge variant="default" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                            {member.isModerator && !member.isAdmin && (
                              <Badge variant="secondary" className="text-xs">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Mod
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.username ? `@${member.username}` : member.email}
                        </p>
                      </div>
                      
                      {/* Role Management Actions (only for admins) */}
                      {currentUserRole?.isAdmin && member.id !== session?.user?.id && (
                        <div className="flex gap-1">
                          {!member.isModerator && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleChange(member.id, 'add', 'moderator')}
                              disabled={promotingUserId === member.id}
                              title="Make Moderator"
                            >
                              <UserPlus className="h-3 w-3" />
                            </Button>
                          )}
                          {member.isModerator && !member.isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleChange(member.id, 'remove', 'moderator')}
                              disabled={promotingUserId === member.id}
                              title="Remove Moderator"
                            >
                              <UserMinus className="h-3 w-3" />
                            </Button>
                          )}
                          {!member.isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleChange(member.id, 'add', 'admin')}
                              disabled={promotingUserId === member.id}
                              title="Make Admin"
                            >
                              <Crown className="h-3 w-3" />
                            </Button>
                          )}
                          {member.isAdmin && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRoleChange(member.id, 'remove', 'admin')}
                              disabled={promotingUserId === member.id}
                              title="Remove Admin"
                            >
                              <UserMinus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Promote User Section (only for admins) */}
          {currentUserRole?.isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Promote User
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role to Assign</label>
                  <Select value={selectedRole} onValueChange={(value: 'moderator' | 'admin') => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* User Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Users</label>
                  <Input
                    placeholder="Search by name, username, or email..."
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                  />
                  
                  {/* Search Results */}
                  {userSearchQuery && (
                    <div className="border rounded-md max-h-64 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Searching users...
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {userSearchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No users found'}
                        </div>
                      ) : (
                        <div className="space-y-1 p-2">
                          {searchResults.map((user) => (
                            <div key={user.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer" onClick={() => handlePromoteUserFromSearch(user)}>
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.image || undefined} />
                                <AvatarFallback className="text-xs">
                                  {(user.name || user.email).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium truncate">
                                    {user.name || user.email}
                                  </p>
                                  <div className="flex gap-1">
                                    {user.isAdmin && (
                                      <Badge variant="default" className="text-xs">
                                        <Crown className="h-2 w-2 mr-1" />
                                        Admin
                                      </Badge>
                                    )}
                                    {user.isModerator && !user.isAdmin && (
                                      <Badge variant="secondary" className="text-xs">
                                        <ShieldCheck className="h-2 w-2 mr-1" />
                                        Mod
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {user.username ? `@${user.username}` : user.email}
                                </p>
                              </div>
                              {(user.isAdmin || user.isModerator) ? (
                                <Badge variant="outline" className="text-xs">Already Staff</Badge>
                              ) : (
                                <Button size="sm" variant="outline" className="text-xs" disabled={promotingUserId === user.id}>
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Make {selectedRole}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Or separator */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or promote by email</span>
                  </div>
                </div>

                {/* Email Promotion (fallback method) */}
                <div className="space-y-3">
                  <Input
                    placeholder="Enter user's email address"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    type="email"
                  />
                  <Button 
                    onClick={handlePromoteUser}
                    disabled={!newUserEmail.trim() || promotingUserId !== null}
                    className="w-full"
                    variant="outline"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Promote by Email
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Admins have full platform control. Moderators can moderate content but cannot manage other staff.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
