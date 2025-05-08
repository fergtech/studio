import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pin, ThumbsUp, PartyPopper, Heart, Lightbulb, Send } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Update, EnhancedUpdate } from "@/lib/types";

interface ActivityFeedProps {
  updates: Update[];
  onLoadMore: () => void;
  hasMore: boolean;
}

export function ActivityFeed({ updates, onLoadMore, hasMore }: ActivityFeedProps) {
  const [enhancedUpdates, setEnhancedUpdates] = useState<EnhancedUpdate[]>(
    updates.map(update => ({
      ...update,
      comments: [],
      reactions: [],
      isPinned: false,
      reactionCount: 0,
      commentCount: 0
    }))
  );

  // ... rest of the ActivityFeed component code ...
  
  return (
    <div className="space-y-8">
      {/* ... existing content ... */}
      
      {hasMore && (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={onLoadMore}
        >
          Load More
        </Button>
      )}
    </div>
  );
} 