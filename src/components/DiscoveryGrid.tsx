'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Target, MessageSquare, Heart, MapPin, Calendar, Eye } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { TikTokPostDetail } from './TikTokPostDetail';

interface SearchUser {
  id: string;
  name: string;
  username: string;
  image?: string;
  bio?: string;
  dateCreated: string;
}

interface SearchInitiative {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

interface SearchPost {
  id: string;
  title?: string;
  content: string;
  description?: string;
  type: 'general' | 'issue' | 'idea';
  mediaUrl?: string;
  mediaType?: string;
  userId: string;
  user: {
    name: string;
    username: string;
    image?: string;
  };
}

interface SearchSociety {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  memberCount: number;
}

type ContentType = 'all' | 'users' | 'posts' | 'initiatives' | 'societies';

interface DiscoveryGridProps {
  searchResults: {
    users: SearchUser[];
    initiatives: SearchInitiative[];
    posts: SearchPost[];
    societies: SearchSociety[];
  };
  isSearching: boolean;
  hasSearched: boolean;
}

export function DiscoveryGrid({ searchResults, isSearching, hasSearched }: DiscoveryGridProps) {
  const [activeCategory, setActiveCategory] = useState<ContentType>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isTikTokDetailOpen, setIsTikTokDetailOpen] = useState(false);
  const router = useRouter();
  const gridRef = useRef<HTMLDivElement>(null);

  // Helper function to check if URL is a video
  const isVideoFile = (url: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  // Combine all content for the "all" view
  const allContent = [
    ...searchResults.users.map(item => ({ ...item, _type: 'user' as const })),
    ...searchResults.posts.map(item => ({ ...item, _type: 'post' as const })),
    ...searchResults.initiatives.map(item => ({ ...item, _type: 'initiative' as const })),
    ...searchResults.societies.map(item => ({ ...item, _type: 'society' as const }))
  ].sort(() => Math.random() - 0.5); // Shuffle for discovery

  const getFilteredContent = () => {
    switch (activeCategory) {
      case 'users': return searchResults.users.map(item => ({ ...item, _type: 'user' as const }));
      case 'posts': return searchResults.posts.map(item => ({ ...item, _type: 'post' as const }));
      case 'initiatives': return searchResults.initiatives.map(item => ({ ...item, _type: 'initiative' as const }));
      case 'societies': return searchResults.societies.map(item => ({ ...item, _type: 'society' as const }));
      default: return allContent;
    }
  };

  const filteredContent = getFilteredContent();

  const handleItemClick = (item: any) => {
    if (item._type === 'post') {
      // Use TikTok-style detail for posts
      setSelectedPost({
        ...item,
        likes: 0, // Will be loaded from API
        shares: 0, // Will be loaded from API
        comments: [], // Will be loaded from API
        createdAt: item.createdAt || new Date().toISOString()
      });
      setIsTikTokDetailOpen(true);
    } else {
      // Use preview modal for other content types
      setSelectedItem(item);
      setIsPreviewOpen(true);
    }
  };

  const handleCategoryChange = (category: ContentType) => {
    setActiveCategory(category);
  };

  // Instagram-style grid item component
  const GridItem = ({ item, index }: { item: any; index: number }) => {
    const isUser = item._type === 'user';
    const isPost = item._type === 'post';
    const isInitiative = item._type === 'initiative';
    const isSociety = item._type === 'society';

    const getAspectRatio = () => {
      // Vary aspect ratios for Pinterest-style layout
      const ratios = ['aspect-square', 'aspect-[4/5]', 'aspect-[3/4]'];
      return ratios[index % ratios.length];
    };

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={cn(
          "relative rounded-xl overflow-hidden cursor-pointer group",
          getAspectRatio()
        )}
        onClick={() => handleItemClick(item)}
      >
        {/* Background Image or Color */}
        <div className="absolute inset-0">
          {(item.imageUrl || item.mediaUrl || item.image) ? (
            (() => {
              const mediaUrl = item.imageUrl || item.mediaUrl || item.image;
              const isVideo = isVideoFile(mediaUrl);
              
              return isVideo ? (
                <video
                  src={mediaUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  muted
                  loop
                  playsInline
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => e.currentTarget.pause()}
                />
              ) : (
                <Image
                  src={mediaUrl}
                  alt={item.title || item.name || item.content}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              );
            })()
          ) : (
            <div className={cn(
              "w-full h-full",
              isUser && "bg-gradient-to-br from-purple-400 to-pink-400",
              isPost && "bg-gradient-to-br from-blue-400 to-cyan-400", 
              isInitiative && "bg-gradient-to-br from-green-400 to-emerald-400",
              isSociety && "bg-gradient-to-br from-orange-400 to-red-400"
            )} />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between text-white">
          {/* Top Badge */}
          <div className="flex justify-between items-start">
            <Badge variant="secondary" className="bg-black/20 text-white border-0 text-xs">
              {isUser && "👤 User"}
              {isPost && "📝 Post"}
              {isInitiative && "🎯 Initiative"}
              {isSociety && "🏛️ Society"}
            </Badge>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Bottom Content */}
          <div className="space-y-2">
            {isUser && (
              <>
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8 border-2 border-white">
                    <AvatarImage src={item.image} alt={item.name} />
                    <AvatarFallback>{item.name?.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold line-clamp-1">{item.name}</p>
                    <p className="text-xs opacity-80">@{item.username}</p>
                  </div>
                </div>
                {item.bio && (
                  <p className="text-xs opacity-90 line-clamp-2">{item.bio}</p>
                )}
              </>
            )}

            {isPost && (
              <>
                <p className="text-sm font-semibold line-clamp-2">{item.content}</p>
                <div className="flex items-center gap-2 text-xs opacity-80">
                  <Avatar className="w-4 h-4">
                    <AvatarImage src={item.user.image} alt={item.user.name} />
                    <AvatarFallback className="text-[8px]">{item.user.name?.substring(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span>{item.user.name}</span>
                </div>
              </>
            )}

            {isInitiative && (
              <>
                <p className="text-sm font-semibold line-clamp-2">{item.title}</p>
                <p className="text-xs opacity-90 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-1 text-xs opacity-80">
                  <Target className="w-3 h-3" />
                  <span>Initiative</span>
                </div>
              </>
            )}

            {isSociety && (
              <>
                <p className="text-sm font-semibold line-clamp-2">{item.name}</p>
                <p className="text-xs opacity-90 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-1 text-xs opacity-80">
                  <Users className="w-3 h-3" />
                  <span>{item.memberCount} members</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
    );
  };

  // Preview Modal Component
  const PreviewModal = () => {
    if (!selectedItem || !isPreviewOpen) return null;

    const handleNavigate = () => {
      // For posts, open TikTok-style detail instead of redirecting
      if (selectedItem._type === 'post') {
        setIsPreviewOpen(false);
        setSelectedPost({
          ...selectedItem,
          likes: 0, // Will be loaded from API
          shares: 0, // Will be loaded from API
          comments: [], // Will be loaded from API
          createdAt: selectedItem.createdAt || new Date().toISOString()
        });
        setIsTikTokDetailOpen(true);
        return;
      }
      
      // For other content types, redirect as normal
      setIsPreviewOpen(false);
      
      setTimeout(() => {
        switch (selectedItem._type) {
          case 'user':
            router.push(`/profile/${selectedItem.username}`);
            break;
          case 'initiative':
            router.push(`/initiatives/${selectedItem.id}`);
            break;
          case 'society':
            router.push(`/societies/${selectedItem.id}`);
            break;
        }
      }, 150);
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-background rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              {/* Preview content based on type */}
              {selectedItem._type === 'user' && (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={selectedItem.image} alt={selectedItem.name} />
                      <AvatarFallback className="text-lg">{selectedItem.name?.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{selectedItem.name}</h3>
                      <p className="text-muted-foreground">@{selectedItem.username}</p>
                    </div>
                  </div>
                  
                  {selectedItem.bio && (
                    <div className="mb-4">
                      <p className="text-sm leading-relaxed">{selectedItem.bio}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Joined {new Date(selectedItem.dateCreated).toLocaleDateString()}</span>
                    </div>
                  </div>
                </>
              )}

              {selectedItem._type === 'post' && (
                <>
                  {/* Post Media */}
                  {selectedItem.mediaUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      {isVideoFile(selectedItem.mediaUrl) ? (
                        <video
                          src={selectedItem.mediaUrl}
                          className="w-full max-h-64 object-cover"
                          controls
                          muted
                          playsInline
                        />
                      ) : (
                        <Image
                          src={selectedItem.mediaUrl}
                          alt={selectedItem.content || 'Post image'}
                          width={400}
                          height={300}
                          className="w-full max-h-64 object-cover"
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Post Content */}
                  {selectedItem.content && (
                    <div className="mb-4">
                      <p className="font-medium text-base leading-relaxed">{selectedItem.content}</p>
                    </div>
                  )}
                  
                  {/* Post Title (if exists) */}
                  {selectedItem.title && (
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold">{selectedItem.title}</h3>
                    </div>
                  )}
                  
                  {/* Post Type Badge */}
                  <div className="mb-3">
                    <Badge variant={
                      selectedItem.type === 'issue' ? 'destructive' : 
                      selectedItem.type === 'idea' ? 'default' : 'secondary'
                    }>
                      {selectedItem.type === 'issue' ? '🚨 Issue' : 
                       selectedItem.type === 'idea' ? '💡 Idea' : '📝 General'}
                    </Badge>
                  </div>
                  
                  {/* Author Info */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={selectedItem.user.image} alt={selectedItem.user.name} />
                      <AvatarFallback className="text-xs">{selectedItem.user.name?.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-medium">{selectedItem.user.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">@{selectedItem.user.username}</span>
                    </div>
                  </div>
                </>
              )}

              {selectedItem._type === 'initiative' && (
                <>
                  {/* Initiative Image */}
                  {selectedItem.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={selectedItem.imageUrl}
                        alt={selectedItem.title}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  
                  <h3 className="text-lg font-semibold mb-2">{selectedItem.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedItem.description}</p>
                  
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="w-4 h-4 text-green-500" />
                      <span className="font-medium">Initiative</span>
                    </div>
                  </div>
                </>
              )}

              {selectedItem._type === 'society' && (
                <>
                  {/* Society Image */}
                  {selectedItem.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={selectedItem.imageUrl}
                        alt={selectedItem.name}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  
                  <h3 className="text-lg font-semibold mb-2">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{selectedItem.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>{selectedItem.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-500" />
                      <span>Community</span>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleNavigate} className="flex-1">
                  View Full
                </Button>
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Full-Screen TikTok-Style Post Viewer
  const FullPostViewer = () => {
    if (!selectedItem || !isFullViewOpen || selectedItem._type !== 'post') return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
            <button
              onClick={() => setIsFullViewOpen(false)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-white font-semibold">Post</h2>
            <div className="w-6" /> {/* Spacer */}
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md mx-auto bg-black">
              {/* Media Section */}
              {selectedItem.mediaUrl && (
                <div className="relative w-full aspect-square mb-4">
                  {isVideoFile(selectedItem.mediaUrl) ? (
                    <video
                      src={selectedItem.mediaUrl}
                      className="w-full h-full object-cover rounded-lg"
                      controls
                      autoPlay
                      muted
                      playsInline
                      loop
                    />
                  ) : (
                    <Image
                      src={selectedItem.mediaUrl}
                      alt={selectedItem.content || 'Post'}
                      fill
                      className="object-cover rounded-lg"
                    />
                  )}
                </div>
              )}

              {/* Content Section */}
              <div className="text-white space-y-4">
                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedItem.user.image} alt={selectedItem.user.name} />
                    <AvatarFallback className="bg-gray-700 text-white">
                      {selectedItem.user.name?.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedItem.user.name}</p>
                    <p className="text-gray-400 text-sm">@{selectedItem.user.username}</p>
                  </div>
                  <Badge variant={
                    selectedItem.type === 'issue' ? 'destructive' : 
                    selectedItem.type === 'idea' ? 'default' : 'secondary'
                  } className="ml-auto">
                    {selectedItem.type === 'issue' ? '🚨 Issue' : 
                     selectedItem.type === 'idea' ? '💡 Idea' : '📝 General'}
                  </Badge>
                </div>

                {/* Post Title */}
                {selectedItem.title && (
                  <h3 className="text-xl font-bold">{selectedItem.title}</h3>
                )}

                {/* Post Content */}
                {selectedItem.content && (
                  <p className="text-white leading-relaxed">{selectedItem.content}</p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t border-gray-800">
                  <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">Like</span>
                  </button>
                  <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-sm">Comment</span>
                  </button>
                  <button 
                    onClick={() => {
                      setIsFullViewOpen(false);
                      router.push(`/posts/${selectedItem.id}`);
                    }}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors ml-auto"
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-sm">View on Page</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="space-y-6">
      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { key: 'all', label: 'All', icon: '🔍' },
          { key: 'users', label: 'People', icon: '👤' },
          { key: 'posts', label: 'Posts', icon: '📝' },
          { key: 'initiatives', label: 'Initiatives', icon: '🎯' },
          { key: 'societies', label: 'Societies', icon: '🏛️' }
        ].map(({ key, label, icon }) => (
          <Button
            key={key}
            variant={activeCategory === key ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(key as ContentType)}
            className={cn(
              "flex-shrink-0 transition-all duration-200",
              activeCategory === key && "shadow-lg"
            )}
          >
            <span className="mr-1">{icon}</span>
            {label}
            {key !== 'all' && (
              <Badge variant="secondary" className="ml-1 h-4 text-xs">
                {searchResults[key as keyof typeof searchResults].length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {isSearching && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isSearching && filteredContent.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">
            {hasSearched ? 'No results found' : 'Start discovering'}
          </h3>
          <p className="text-muted-foreground">
            {hasSearched 
              ? 'Try a different search term or explore different categories'
              : 'Search for people, posts, initiatives, and societies'
            }
          </p>
        </div>
      )}

      {/* Discovery Grid */}
      {!isSearching && filteredContent.length > 0 && (
        <motion.div
          ref={gridRef}
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
        >
          {filteredContent.map((item, index) => (
            <GridItem key={`${item._type}-${item.id}-${index}`} item={item} index={index} />
          ))}
        </motion.div>
      )}

      {/* Preview Modal */}
      <PreviewModal />
      
      {/* TikTok-style Post Detail */}
      {selectedPost && (
        <TikTokPostDetail
          post={selectedPost}
          isOpen={isTikTokDetailOpen}
          onClose={() => {
            setIsTikTokDetailOpen(false);
            setSelectedPost(null);
          }}
        />
      )}
    </div>
  );
}