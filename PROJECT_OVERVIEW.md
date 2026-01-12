# Project Overview: society+ - Civic Engagement & Social Action Platform

## Executive Summary

**society+** is intended to be a comprehensive Hyperlocal community engagement and social action platform built with Next.js 15 that combines social networking, project management, and community organizing tools. The platform enables users to identify community issues, propose ideas, create initiatives, organize projects, engage in debates, and collaborate on solutions to societal challenges.

**Tagline**: Built for changemakers

---

## Core Concept

A **social platform for communal action** that transforms community discussions into actionable initiatives. society+ provides the digital infrastructure for communities to:

- Surface and discuss issues affecting their communities
- Propose ideas for solutions
- Create and manage initiatives (projects) to address these issues
- Organize events, track progress, and collaborate with team members
- Engage in structured debates on policy and social topics
- Connect with like-minded individuals and form societies (community groups)
- Share updates and content through a social feed
- Discover trending topics and local content based on location

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.7 (App Router)
- **React**: 18.3.1
- **Styling**: TailwindCSS 3.4.1
- **UI Components**: Radix UI (comprehensive component library)
- **Animations**: Framer Motion 12.23.24
- **Icons**: Lucide React 0.475.0
- **Forms**: React Hook Form 7.56.2 + Zod 3.24.4 validation
- **State Management**: TanStack Query 5.66.0
- **Theme**: next-themes 0.4.6 (dark mode support)

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: PostgreSQL (via Prisma ORM 6.14.0)
- **Authentication**: NextAuth.js 4.24.11
- **Password Hashing**: bcryptjs 3.0.2
- **File Storage**:
  - Vercel Blob 1.1.1 (primary)
  - AWS S3 (via @aws-sdk/client-s3)
  - Azure Blob Storage 12.27.0
  - Cloudflare R2 (via @cloudflare/kv-asset-handler)

### AI & Content Moderation
- **AI Framework**: Google Genkit 1.0.4
- **AI Provider**: Google Generative AI 0.24.1
- **Features**:
  - Content moderation (text & images)
  - Topic detection and categorization
  - AI-generated initiative guidance
  - Smart suggestions for user connections

### Media Processing
- **Image Compression**: browser-image-compression 2.0.2
- **FFmpeg**: @ffmpeg/ffmpeg 0.12.15 (video processing)
- **QR Codes**: qrcode 1.5.4
- **Image Provider**: Unsplash API integration

### Communication
- **Real-time**: Socket.io 4.8.1 (currently disabled for Vercel deployment)
- **Email**: Resend 6.4.2
- **Notifications**: In-app notification system with email support

### Deployment & Infrastructure
- **Platform**: Vercel (primary)
- **Database**: Neon PostgreSQL (serverless)
- **Environment**: Railway 2.0.17 (alternative deployment option)
- **CDN**: Multiple CDN providers for media delivery

### Development Tools
- **Language**: TypeScript 5
- **Testing**: Jest 29.7.0 + React Testing Library 16.3.0
- **Linting**: ESLint 9.34.0 with Next.js config
- **Package Manager**: npm/pnpm

---

## Database Schema Overview

### Core Entities

#### Users (`User`)
Comprehensive user profiles with:
- Authentication credentials (email, hashed password)
- Profile information (bio, skills, interests, profession, organization)
- Location data with privacy controls (lat/long, city, state, country)
- Activity tracking and gamification (activity score)
- Permission levels (admin, moderator, initiative/society creation rights)
- Social graph (followers/following)
- Notification preferences (email, in-app)
- Profile customization (avatar, banner, websites)

#### Initiatives (`Initiative`)
Community projects with:
- Title, description, mission, and cover imagery
- Status workflow (Idea → Planning → Seeking Members → In Progress → Completed)
- Location-based filtering and discovery
- AI-generated guidance for project planning
- Goals, milestones, steps, actions hierarchy
- Team membership with roles (Admin, Member, Contributor, Guest, Sponsor, Mentor)
- Resource management (documents, links, media)
- Event organization with RSVP tracking
- Update feed with multiple update types
- Progress tracking and analytics

#### Goals, Milestones, Steps, Actions
**Hierarchical project management system:**
- **Goals**: High-level objectives for initiatives with status tracking
- **Milestones**: Major checkpoints with completion tracking
- **Steps**: Granular tasks within milestones with status management
- **Actions**: Specific action items with assignees, due dates, priorities, and completion status

#### Ideas (`Idea`)
Solution proposals with:
- Description and tagging
- Community validation (likes, shares, comments)
- Location context for local ideas
- Ability to "champion" (promote to initiative)
- Issue linking (connect ideas to specific problems)
- Content moderation and flagging
- Topic categorization

#### Issues (`Issue`)
Community problems with:
- Description and categorization
- Location-based filtering for local issues
- Champion system (who takes ownership)
- Initiative linking (when problem is being addressed)
- Social engagement features (likes, shares, comments)
- Topic tagging
- Content moderation

#### Societies (`Society`)
Community groups/organizations with:
- Membership management with roles
- Dedicated content feeds
- Associated initiatives, ideas, and issues
- Location-based filtering
- Group customization (logo, banner, description)
- Privacy controls (public/private)

#### Debates (`DebateTopic`)
Structured discussion platform:
- PRO/CON binary voting system
- Nested arguments with replies
- Argument voting (upvote/downvote)
- Topic categorization
- Voter transparency (view who voted which side)
- TikTok-style swipeable mobile interface
- Content moderation
- Share functionality

#### Social Features
- **GeneralPost**: Main content feed posts with media, links, topics
- **Comments**: Multi-level threading with nested replies
- **Likes, Shares**: Social engagement tracking
- **UserFollow**: Social graph for followers/following
- **DirectMessages**: Private messaging via `ChatMessage`
- **ChatMessage**: Team chat and direct messaging

#### Hot Take Battles
Gamified opinion contests:
- Compare two opposing viewpoints (posts)
- Users pick sides or share neutral perspectives
- Track participation, votes, and engagement
- Related posts aggregation
- Can escalate to actionable initiatives
- Trending battle discovery

#### Notifications (`Notification`)
- Type-based notifications (messages, follows, initiative invites, etc.)
- Read/unread tracking
- Email delivery option (configurable per user)
- Real-time polling system
- Deep linking to content

#### Content Management
- **MediaItem**: Images and videos for posts/updates/debates
- **LinkPreview**: Rich link previews with Open Graph data
- **Document**: File attachments for initiatives
- **Topic**: Auto-detected (AI) and manual content categorization
- **UserTopicInterest**: Personalized feed algorithm based on interests

#### News Integration
- **NewsPost**: Curated local news from RSS feeds
- **NewsAction**: User responses to news (creating initiatives/posts from news)
- Location-based news filtering
- Urgency-based prioritization

#### Social Media Integration
- **SocialAccount**: Connected Instagram, Facebook, TikTok accounts
- **SocialPost**: Cross-posting tracking and analytics

---

## Application Features

### 1. Authentication & User Management
**Routes**: `/login`, `/register`, `/forgot-password`

- Email/password authentication
- Password reset flow (email-based token system)
- Protected routes with NextAuth middleware
- Role-based access control (admin, moderator, regular users)
- User profile management with customizable fields
- Privacy controls for location sharing
- Activity score tracking for feature unlocks

### 2. Social Feed
**Route**: `/` (Home)
**Components**: `HomeClient.tsx`, `FeedView.tsx`, `TikTokHomeFeed.tsx`

- Unified algorithmic feed with topic-based filtering
- Post creation with:
  - Rich text content
  - Media attachments (images, videos)
  - Link previews (auto-generated)
  - Topic tagging (AI-powered)
- Engagement features (likes, shares, comments)
- Nested comment threads with replies
- Content moderation (AI-powered flagging)
- Trending topics widget
- Smart user suggestions
- Mobile TikTok-style vertical scrolling
- Pull-to-refresh on mobile

### 3. Issues & Ideas
**Routes**: `/issues/*`, `/ideas/*`, `/local/issues`, `/local/ideas`

**Issues System:**
- Community problem identification
- Location-based discovery (find local issues)
- Tagging and categorization
- Champion system (users can champion issues)
- Social engagement (likes, shares, comments)
- Content moderation and flagging
- Link to related initiatives
- TikTok-style mobile view

**Ideas System:**
- Solution proposals
- Link to specific issues (connect ideas to problems)
- Champion mechanism (promote idea to initiative)
- Implementation pathway to initiatives
- Community feedback and validation
- Location-based filtering
- Mobile-optimized card view

### 4. Initiatives (Project Management)
**Routes**: `/initiatives/*`, `/local/initiatives`
**Key Components**: `InitiativeClientPage.tsx`, `CreateEventDialog.tsx`

**Core Features:**
- Initiative creation (unlocked by activity score)
- Status workflow management (Idea → Planning → Active → Completed)
- Team collaboration:
  - Role-based membership (Admin, Member, Contributor, Guest, Sponsor, Mentor)
  - Team chat (via ChatMessage)
  - Invite system with notifications
- Hierarchical task management:
  - Goals → Milestones → Steps → Actions
  - Assignment and tracking
  - Due dates and priorities
  - Progress indicators and completion tracking
- Resource management:
  - Documents, links, media attachments
  - Categorization and pinning
  - Resource library
- Event organization:
  - Event creation and scheduling
  - RSVP tracking (Going, Maybe, Not Going)
  - Event updates and reminders
- Update feed with multiple types:
  - Member join notifications
  - Status changes
  - Milestone/step completions
  - Resource additions
  - Event announcements
- AI-generated guidance for project planning
- Location-based initiative discovery
- Mission progress banner with completion tracking
- Social sharing capabilities

### 5. Debates
**Routes**: `/debates/*`
**Components**: `MobileDebateCard.tsx`, `DebateTopicCard.tsx`

- TikTok-style mobile interface (swipeable vertical cards)
- Desktop grid view with thumbnails
- PRO/CON binary voting system
- Nested arguments with:
  - Side-based organization (Pro vs Con)
  - Reply threading
  - Upvote/downvote system for arguments
- Community response visualization (vote percentages)
- Voters list with transparency (see who voted)
- Share functionality (social media, link)
- Topic categorization and filtering
- Content moderation
- Responsive debate viewer

### 6. Hot Take Battles
**Routes**: `/debug/create-battle/*`
**API**: `/api/hot-take-battles/*`

- Gamified opinion contests
- Side-by-side post comparison interface
- Participation tracking:
  - Support post 1
  - Support post 2
  - Neutral stance
  - Custom takes (create your own response)
- Related posts aggregation
- Voting and engagement tracking
- Escalation to actionable initiatives
- Trending battles discovery

### 7. Societies (Groups/Communities)
**Routes**: `/societies/*`, `/local/societies`

- Community group creation (unlocked by activity score)
- Membership management with roles
- Dedicated content feeds for society posts
- Associated initiatives, ideas, and issues
- Location-based filtering and discovery
- Privacy settings (public/private groups)
- Society customization (logo, banner, description)
- Member directory

### 8. Messaging & Chat
**Routes**: `/chat/*`, `/messages/*`

- Direct messaging between users
- Initiative team chat (embedded in initiative pages)
- Message reactions (emoji support)
- Reply threading
- Read receipts
- Online status indicators
- Real-time delivery (via polling, Socket.io support exists)
- Unread message counts

### 9. Notifications
**Routes**: `/notifications`
**Hook**: `useNotifications.ts`

- In-app notification center with badge counts
- Email notifications (configurable per user)
- Notification types:
  - Direct messages
  - New followers
  - Initiative invites
  - Milestone/goal completions
  - Responses to your content (comments, likes)
  - Event reminders
- Real-time polling (2-minute intervals)
- Read/unread tracking
- Deep linking to relevant content
- Notification preferences management

### 10. Explore & Discovery
**Route**: `/explore`

- Featured content curation
- Search functionality:
  - Users (by name, username)
  - Initiatives
  - Ideas
  - Issues
  - Posts
  - Debates
  - Societies
- Topic-based browsing
- Trending topics with engagement metrics
- Location-based filtering
- Content type filtering

### 11. Local Content
**Routes**: `/local/*` (initiatives, ideas, issues, societies)

- Location-aware content discovery
- Filtered views for:
  - Local initiatives (nearby projects)
  - Local ideas (community solutions)
  - Local issues (neighborhood problems)
  - Local societies (area groups)
- Radius-based filtering (configurable distance)
- Nearby areas detection
- Map integration for location visualization

### 12. Topic System
**Routes**: `/topics/*`
**API**: `/api/trending-topics`, `/api/topic-icons`

- AI-powered topic detection (Google Generative AI)
- Manual topic selection during content creation
- Topic-based content feeds
- User interest tracking (follow topics)
- Trending topic analytics with debate/post counts
- Topic icons and visual categorization
- Featured topic content

### 13. User Profiles
**Routes**: `/profile/*`

- Public profile pages with activity timeline
- Customizable profile information:
  - Bio, profession, organization
  - Skills and interests
  - Websites and social links
  - Banner and avatar images
- Activity score and contribution tracking
- Follow/unfollow functionality
- Content contributions display (posts, debates, initiatives)
- Privacy controls for location and activity
- Profile editing with image upload

### 14. Activity & Gamification
**Route**: `/activity`

- Activity score system with point tracking
- Contribution tracking:
  - Posts and comments
  - Initiative participation
  - Goal/milestone completions
  - Resource sharing
  - Debate arguments
- Unlock system:
  - Initiative creation (threshold-based)
  - Society creation (threshold-based)
- Activity feed visualization
- Leaderboards and rankings

### 15. News Integration
**API**: `/api/news/*`

- RSS feed aggregation from news sources
- Local news curation (location-based)
- Urgency-based filtering and prioritization
- User action tracking (create posts/initiatives from news)
- Location-based news delivery
- Configurable news preferences
- News post creation with source attribution

### 16. Admin & Moderation
**Route**: `/admin`

**Admin Features:**
- User management and search
- Role assignment (admin, moderator, staff)
- Content moderation dashboard
- System analytics and metrics
- Content flagging review

**AI Moderation:**
- Text content analysis (sentiment, appropriateness)
- Image content analysis (safety, appropriateness)
- Automatic flagging system
- Moderation scores and thresholds
- Approval workflow for flagged content

### 17. Social Media Integration
**API**: `/api/social/*`

- Instagram, Facebook, TikTok account connectivity
- Cross-posting capabilities
- OAuth flow management
- Post tracking and analytics
- Image generation for social sharing (OG images)
- Share preview optimization

### 18. Media Management

- Image upload and compression (browser-side)
- Video upload and processing (FFmpeg)
- Unsplash integration for stock photos
- Multiple storage backends (Vercel Blob, S3, Azure, R2)
- Automatic image optimization
- Thumbnail generation
- Media galleries for posts and initiatives

---

## Key Design Patterns

### 1. Mobile-First Responsive Design
- TikTok-style vertical swiping for debates and feed
- Responsive sheets/modals (bottom drawer on mobile, center modal on desktop)
- Touch-optimized interactions
- Gesture support (swipe, double-tap, pull-to-refresh)
- Bottom navigation bar on mobile
- Collapsible sidebars

### 2. Real-Time Features
- Polling-based updates (30 seconds to 2 minutes)
- Online status tracking for users
- Notification delivery system
- Unread count updates
- Socket.io infrastructure (optional, currently disabled)
- Optimistic UI updates for instant feedback

### 3. Location-Based Features
- Lat/long storage for all location-aware entities
- Privacy controls for location sharing
- Radius-based filtering (configurable distance)
- Nearby content discovery
- Local news integration
- Location autocomplete with geocoding

### 4. AI-Powered Features
- Content moderation (Google Generative AI)
- Topic detection and categorization
- Initiative guidance generation
- Smart user suggestions
- Image content analysis
- Automated topic tagging

### 5. Gamification
- Activity scoring system with points
- Unlockable features (initiative/society creation)
- Champion system for ideas/issues
- Hot take battles with voting
- Progress tracking and achievements
- Leaderboards and community rankings

### 6. Content Moderation
- AI-powered pre-moderation
- Manual moderation dashboard for admins
- Flag-based reporting system
- Scoring and thresholds for auto-flagging
- Approval workflows for flagged content
- User reporting capabilities

### 7. Hierarchical Organization
- Initiatives → Goals → Milestones → Steps → Actions
- Issues → Ideas → Initiatives (problem → solution → action)
- Posts → Comments → Replies (nested threading)
- Debates → Arguments → Replies (structured discussion)
- Societies → Members → Content (group organization)

---

## API Architecture

### RESTful Endpoints
**Structure**: `/api/{resource}/{action}`

**Major Resource Groups:**

#### User Management
- `/api/users` - User CRUD operations
- `/api/users/online` - Online status tracking
- `/api/auth/*` - Authentication endpoints (NextAuth)

#### Content Resources
- `/api/general-posts` - Social feed posts
- `/api/debates` - Debate topics and arguments
- `/api/ideas` - Community ideas
- `/api/issues` - Community issues
- `/api/initiatives` - Initiative management
- `/api/societies` - Society/group management

#### Engagement & Social
- `/api/feed` - Unified feed with filtering
- `/api/comments` - Comment threads
- `/api/likes` - Like tracking
- `/api/shares` - Share tracking
- `/api/follow` - Follow/unfollow

#### Communication
- `/api/chat` - Messaging system
- `/api/notifications` - Notification delivery

#### Discovery & Search
- `/api/explore` - Search and discovery
- `/api/trending-topics` - Trending topic analytics
- `/api/topic-icons` - Topic visualization
- `/api/content/local` - Location-based content

#### AI & Moderation
- `/api/ai/*` - AI moderation and analysis
- `/api/admin/*` - Admin functions

#### Media & External
- `/api/social/*` - Social media integration
- `/api/news/*` - News feed integration
- `/api/location/*` - Location services

### Authentication
- NextAuth.js session-based authentication
- JWT tokens for API authorization
- Protected API routes with middleware
- Role-based access control (RBAC)
- CSRF protection

### File Upload
- Multi-backend support (Vercel Blob, S3, Azure)
- Client-side image compression
- Video processing pipeline (FFmpeg)
- Direct upload from client
- Progress tracking for large files

---

## State Management

### Client-Side State
- **TanStack Query (React Query)**: Server state caching, synchronization, and invalidation
- **React Hook Form**: Form state management with validation
- **React Context**: ModalContext, PostStatsContext, AuthProvider
- **useState/useReducer**: Component-level state
- **Custom Hooks**: Reusable state logic (useNotifications, useIsMobile, usePullToRefresh)

### Server-Side State
- **Prisma ORM**: Type-safe database operations
- **Next.js Server Components**: Server-side data fetching with caching
- **API Routes**: RESTful backend with request handlers
- **Server Actions**: Form submissions and mutations

### Real-Time Updates
- **Polling**: Primary mechanism (30s - 2min intervals)
- **Socket.io**: Optional real-time (currently disabled for Vercel)
- **Optimistic UI updates**: Immediate feedback for user actions
- **Query invalidation**: Automatic refetch after mutations

---

## Performance Optimizations

### Frontend
- Next.js App Router with React Server Components
- Incremental static regeneration (ISR) for static pages
- Image optimization (Next.js Image component with multiple formats)
- Code splitting and lazy loading
- Debounced search and input handling
- Virtual scrolling for long lists (debates, feed)
- Prefetching for navigation
- Progressive image loading

### Backend
- Database indexing strategy:
  - User activity and scores
  - Location coordinates (lat/long)
  - Topic associations
  - Created timestamps
- Prisma query optimization with select/include
- Efficient pagination with cursor-based pagination
- Batch operations for related data
- Caching layer for link previews and topics

### Media
- Client-side image compression before upload
- Progressive image loading with blur placeholders
- Video transcoding (FFmpeg) with quality presets
- Adaptive media serving based on device
- CDN distribution for global performance
- Multi-region storage backends

---

## Security Features

### Authentication & Authorization
- Secure password hashing (bcryptjs with salt rounds)
- Session management (NextAuth with JWT)
- CSRF protection on all forms
- Role-based access control (RBAC)
- Secure token generation for password reset
- Session expiration and refresh

### Content Security
- AI-powered content moderation (text and images)
- XSS prevention (React automatic escaping)
- SQL injection prevention (Prisma parameterized queries)
- File upload validation (type, size, content)
- Rate limiting on API endpoints
- Input sanitization and validation (Zod schemas)

### Privacy
- Location privacy controls (opt-in sharing)
- Optional profile data visibility
- User-controlled notification preferences
- GDPR-compliant data handling
- Secure deletion of user data
- Privacy settings per content type

### Infrastructure
- Environment variable security (never committed)
- Secret management (Vercel/Railway secrets)
- HTTPS enforcement
- Secure headers (CSP, HSTS, X-Frame-Options)
- Database connection encryption
- Regular dependency updates

---

## Deployment

### Production Environment

**Platform**: Vercel
- Automatic deployments from Git (main branch)
- Edge Functions for global performance
- CDN distribution worldwide
- Built-in analytics and monitoring
- Preview deployments for branches
- Automatic SSL certificates

**Database**: Neon PostgreSQL
- Serverless Postgres with auto-scaling
- Connection pooling for performance
- Automatic backups and point-in-time recovery
- Read replicas for scaling
- Built-in connection management

**File Storage**: Multi-backend architecture
- Vercel Blob (primary for production)
- AWS S3 (fallback and large files)
- Azure Blob Storage (alternative)
- Cloudflare R2 (media CDN)

### Environment Variables

**Required**:
```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://your-domain.com"

# AI Services
GOOGLE_GENERATIVE_AI_API_KEY="..."

# Storage (choose one or multiple)
BLOB_READ_WRITE_TOKEN="..." # Vercel Blob
AWS_S3_BUCKET="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."

# Email
RESEND_API_KEY="..."
```

**Optional**:
```bash
# Social Media
INSTAGRAM_CLIENT_ID="..."
FACEBOOK_APP_ID="..."
TIKTOK_CLIENT_KEY="..."

# Analytics
VERCEL_ANALYTICS_ID="..."
```

### CI/CD Pipeline
- Automatic builds on Git push
- Prisma migrations on deploy (`prisma generate && prisma migrate deploy`)
- TypeScript type checking in build process
- ESLint validation (warnings allowed)
- Build success/failure notifications
- Rollback capabilities

### Deployment Commands
```bash
# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel (automatic on push)
vercel --prod

# Database migrations
npx prisma migrate deploy
```

---

## Future Enhancements & Roadmap

### Planned Features

1. **Enhanced Real-Time Communication**:
   - Restore Socket.io for instant messaging
   - Live collaboration features (co-editing)
   - Real-time initiative updates
   - Live debate participation counters
   - Typing indicators in chat

2. **Mobile Applications**:
   - React Native iOS app
   - React Native Android app
   - Push notifications (FCM, APNs)
   - Offline support with sync
   - Native camera integration

3. **Advanced Analytics Dashboard**:
   - User engagement metrics
   - Initiative success tracking
   - Community health indicators
   - Content performance analytics
   - Geographic heatmaps

4. **Third-Party Integrations**:
   - GitHub for code-based projects
   - Google Calendar/Outlook sync for events
   - Stripe for crowdfunding initiatives
   - Zoom/Teams for virtual events
   - Slack/Discord webhooks

5. **Enhanced AI Capabilities**:
   - Improved content recommendations
   - Automated project planning assistance
   - Smart matching for collaborators
   - AI-powered debate summaries
   - Sentiment analysis for discussions

6. **Accessibility Improvements**:
   - Screen reader optimization
   - Comprehensive keyboard navigation
   - WCAG 2.1 AA compliance
   - High contrast themes
   - Text-to-speech integration

7. **Gamification Expansion**:
   - Achievement system with badges
   - Community challenges
   - Contribution streaks
   - Skill endorsements
   - Reputation system

8. **Content Creation Tools**:
   - Rich text editor with formatting
   - Collaborative document editing
   - Video editing capabilities
   - Infographic creation
   - Poll and survey builder

---

## Development Workflow

### Setup
```bash
# Clone repository
git clone <repository-url>
cd studio-deploy

# Install dependencies
npm install
# or
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Setup database
npx prisma generate
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed

# Run development server
npm run dev
```

Development server will be available at `http://localhost:3000`

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Database Management
```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio
```

### AI Development
```bash
# Start Genkit development UI
npm run genkit:dev

# Start Genkit with auto-reload
npm run genkit:watch
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Run TypeScript type checking
npm run typecheck

# Format code with Prettier
npm run format
```

---

## Key Files & Directories

```
studio-deploy/
├── prisma/
│   ├── schema.prisma           # Database schema definition
│   └── migrations/            # Database migration history
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # Auth pages (login, register)
│   │   ├── api/              # API routes
│   │   ├── initiatives/      # Initiative features
│   │   ├── debates/          # Debate platform
│   │   ├── societies/        # Community groups
│   │   ├── ideas/            # Ideas system
│   │   ├── issues/           # Issues tracking
│   │   ├── local/            # Location-based content
│   │   ├── profile/          # User profiles
│   │   ├── messages/         # Messaging
│   │   ├── notifications/    # Notification center
│   │   ├── explore/          # Discovery features
│   │   ├── admin/            # Admin dashboard
│   │   ├── about/            # About page
│   │   ├── page.tsx          # Home page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   ├── ui/              # Base UI components (Radix)
│   │   ├── modals/          # Modal components
│   │   ├── animations/      # Animation components
│   │   ├── initiatives/     # Initiative-specific components
│   │   ├── social/          # Social sharing components
│   │   └── ...              # Feature components
│   ├── lib/                 # Utilities and configurations
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── prisma.ts        # Prisma client singleton
│   │   ├── utils.ts         # Helper functions
│   │   ├── types.ts         # TypeScript type definitions
│   │   └── email.ts         # Email service
│   ├── hooks/               # Custom React hooks
│   │   ├── useNotifications.ts
│   │   ├── useIsMobile.ts
│   │   └── usePullToRefresh.ts
│   ├── context/             # React Context providers
│   │   ├── ModalContext.tsx
│   │   └── PostStatsContext.tsx
│   ├── ai/                  # AI/Genkit logic
│   │   └── flows.ts         # AI workflow definitions
│   ├── services/            # Service layer
│   │   └── location.ts      # Location services
│   ├── scripts/             # Utility scripts
│   │   ├── backfillTopics.ts
│   │   └── createTestPosts.ts
│   └── providers/           # Provider components
│       └── QueryProvider.tsx
├── public/                  # Static assets
│   ├── images/             # Image assets
│   └── favicon.ico         # Site favicon
├── .env.example            # Environment template
├── .env.local              # Local environment (gitignored)
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── PROJECT_OVERVIEW.md     # This file
```

---

## Contributing Guidelines

### Code Style
- Use TypeScript for all new code (type safety required)
- Follow ESLint configuration (warnings are acceptable)
- Use Prettier for consistent formatting
- Component-based architecture (small, focused components)
- Server/client component separation (mark with 'use client' when needed)
- Meaningful variable and function names

### Git Workflow
- Create feature branches from `main`
- Use descriptive commit messages
- Pull requests require review
- Squash commits before merging
- Keep commits atomic and focused

### Best Practices
- Use Prisma for all database operations (no raw SQL)
- Implement comprehensive error handling
- Add loading and error states to all async operations
- Follow NextAuth patterns for authentication
- Use TanStack Query for server state management
- Implement optimistic updates for better UX
- Add TypeScript types for all props and functions
- Document complex logic with comments
- Write unit tests for critical functionality

### Component Structure
```typescript
// Imports
import { ComponentType } from 'library';

// Types
interface ComponentProps {
  // props definition
}

// Component
export function Component({ props }: ComponentProps) {
  // hooks
  // state
  // effects
  // handlers

  return (
    // JSX
  );
}
```

### Security Checklist
- ✅ Never commit secrets or `.env` files
- ✅ Validate all user inputs with Zod schemas
- ✅ Use parameterized queries (Prisma handles this)
- ✅ Implement content moderation for user-generated content
- ✅ Add rate limiting for sensitive endpoints
- ✅ Test authentication flows thoroughly
- ✅ Sanitize data before rendering
- ✅ Use HTTPS in production
- ✅ Implement CSRF protection

---

## Support & Resources

### Documentation
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **NextAuth.js**: https://next-auth.js.org
- **Radix UI**: https://www.radix-ui.com
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TanStack Query**: https://tanstack.com/query
- **Google Generative AI**: https://ai.google.dev/docs

### Community
- **GitHub Repository**: [Repository URL]
- **Issue Tracker**: [Issues URL]
- **Discussions**: [Discussions URL]
- **Discord/Slack**: [Community chat URL]

### Getting Help
- Check the documentation first
- Search existing issues on GitHub
- Ask questions in community channels
- Create a detailed issue report with:
  - Description of the problem
  - Steps to reproduce
  - Expected vs actual behavior
  - Screenshots/logs if applicable

---

## License

[Specify your license - e.g., MIT, Apache 2.0, Proprietary]

---

## Acknowledgments

**society+** is built with love using these amazing open-source projects:

- **Next.js** - The React Framework for Production
- **React** - A JavaScript library for building user interfaces
- **Prisma** - Next-generation ORM for Node.js and TypeScript
- **NextAuth.js** - Authentication for Next.js
- **Google Generative AI** - AI-powered content moderation and analysis
- **Radix UI** - Unstyled, accessible component library
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Query** - Powerful asynchronous state management
- **Framer Motion** - Production-ready motion library for React
- **Zod** - TypeScript-first schema validation
- **And many other open-source projects** that make this platform possible

Special thanks to the open-source community for their incredible contributions.

---

## Project Metadata

**Project Name**: society+
**Version**: 1.0.0
**Status**: Active Development
**Last Updated**: January 2026
**Maintained By**: [Your name/organization]
**Contact**: [Contact information]

---

**Built for changemakers. Powered by community.**
