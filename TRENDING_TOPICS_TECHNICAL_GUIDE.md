# Trending Topics - Technical Implementation Guide

## Overview
This document outlines the current "trending topics" implementation that filters topics based on engagement metrics and multiple creators. This was temporarily replaced with a simpler "Topics" listing for early-stage growth, but can be restored when the platform has sufficient user activity.

## Current Implementation (Before Simplification)

### API Endpoint: `src/app/api/trending-topics/route.ts`

#### Key Logic Flow

1. **Database Query** (Lines 12-66)
   - Fetches topics with `postCount >= 2`
   - Orders by `weeklyPosts DESC`, then `postCount DESC`
   - Includes post relationships with moderation filters
   - Gets first media item for thumbnails
   - Includes creator info for attribution

2. **Multi-Creator Filter** (Lines 71-74)
   ```typescript
   const trendingTopics = allTopics.filter(topic => {
     const uniqueCreators = new Set(topic.postTopics.map(pt => pt.post.creatorId));
     return uniqueCreators.size >= 2; // Requires 2+ unique creators
   }).slice(0, limit);
   ```

3. **Moderation Filters** (Lines 27-33, 126-129)
   ```typescript
   // In main query
   where: {
     post: {
       OR: [
         { moderationStatus: 'approved' },
         { moderationStatus: null }
       ]
     }
   }

   // In fallback query
   where: {
     OR: [
       { moderationStatus: 'approved' },
       { moderationStatus: null }
     ],
     // ... other conditions
   }
   ```

4. **Thumbnail Selection** (Lines 82-87)
   - Prefers posts with media for visual appeal
   - Falls back to latest post if no media available
   - Returns thumbnail URL and type

5. **Fallback System** (Lines 120-162)
   - If no database topics found, falls back to legacy string-based topics
   - Analyzes last 7 days of posts
   - Counts topic frequency from post.topics arrays
   - Returns top N by count

#### Response Format
```typescript
{
  topics: [
    {
      topic: string,           // Topic name
      count: number,           // Total post count
      category: string,        // Topic category
      latestPost: {
        id: string,
        content: string,       // Preview (100 chars)
        timestamp: Date,
        thumbnail: {
          url: string,
          type: string
        } | null,
        author: {
          name: string,
          username: string,
          image: string
        }
      } | null
    }
  ],
  total: number,
  source: 'database' | 'fallback'
}
```

## Database Schema Requirements

### Topic Model
```prisma
model Topic {
  id          String   @id @default(cuid())
  name        String   @unique
  category    String   @default("general")
  postCount   Int      @default(0)
  weeklyPosts Int      @default(0)
  postTopics  PostTopic[]

  @@index([postCount])
  @@index([weeklyPosts])
  @@index([category])
}
```

### PostTopic Junction Table
```prisma
model PostTopic {
  id      String      @id @default(cuid())
  postId  String
  topicId String
  post    GeneralPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  topic   Topic       @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@unique([postId, topicId])
  @@index([topicId])
  @@index([postId])
}
```

## Trending Criteria

A topic qualifies as "trending" when:
1. ✅ Has at least 2 posts (`postCount >= 2`)
2. ✅ Posts from at least 2 different creators (`uniqueCreators.size >= 2`)
3. ✅ Posts are moderation-approved or legacy (null status)
4. ✅ Ordered by recent activity (`weeklyPosts DESC`) then total popularity (`postCount DESC`)

## Key Configuration Points

### Minimum Posts Requirement
- **Current**: 2 posts minimum (Line 14)
- **Location**: `where: { postCount: { gte: 2 } }`
- **Rationale**: Prevents single-post topics from appearing

### Multi-Creator Requirement
- **Current**: 2 unique creators minimum (Line 73)
- **Location**: `uniqueCreators.size >= 2`
- **Rationale**: Ensures genuine community interest, not just one user posting

### Result Limit
- **Current**: 8 topics (Line 7)
- **Location**: `parseInt(searchParams.get('limit') || '8', 10)`
- **Adjustable**: Via query param `?limit=N`

### Fallback Time Window
- **Current**: 7 days (Line 131)
- **Location**: `gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)`

## Frontend Integration

### Widget Component
- **Location**: `src/components/TrendingTopicsWidget.tsx` (assumed)
- **Fetches**: `/api/trending-topics?limit=8`
- **Displays**: Topic cards with thumbnails, names, post counts
- **Links to**: `/topics/[name]` pages

## When to Re-Enable Trending Logic

Re-enable this implementation when:
- ✅ Platform has 10+ active users
- ✅ Multiple users posting regularly
- ✅ Topics naturally have 2+ creators
- ✅ Want to surface popular/active topics vs. just listing all topics

## How to Restore

1. **Restore the multi-creator filter** in `src/app/api/trending-topics/route.ts`:
   ```typescript
   const trendingTopics = allTopics.filter(topic => {
     const uniqueCreators = new Set(topic.postTopics.map(pt => pt.post.creatorId));
     return uniqueCreators.size >= 2;
   }).slice(0, limit);
   ```

2. **Update widget title** from "Topics" back to "Trending Topics"

3. **Consider adjusting thresholds** based on platform size:
   - Larger platform: Increase to 3+ creators, 5+ posts
   - Smaller platform: Keep at 2+ creators, 2+ posts

## Notes

- The fallback system ensures graceful degradation if Topic table issues occur
- Moderation integration ensures only approved content appears
- Weekly posts counter allows time-based trending (most recent activity)
- Thumbnail selection prefers visual content for engagement
