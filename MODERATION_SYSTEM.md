# Content Moderation System

## Overview

Automated AI-powered content moderation system for text, images, and videos using Cloudflare Workers AI + Google Gemini fallback.

## Architecture

### 1. **Moderation Service** (`src/services/contentModeration.ts`)
- Multi-layer AI moderation pipeline
- Text moderation using Cloudflare/Gemini
- Image moderation using Google Vision API
- Confidence scoring and flag-based decisions

### 2. **API Endpoints**
- `POST /api/ai/moderate-text` - Text content moderation
- `POST /api/ai/moderate-image` - Image content moderation
- `GET /api/admin/moderation` - Fetch pending content (moderators only)
- `POST /api/admin/moderation` - Approve/reject content (moderators only)

### 3. **Database Schema**
Added to `GeneralPost`, `Issue`, `Idea` models:
```prisma
moderationStatus    String?   @default("approved")  // 'approved', 'rejected', 'pending_review'
moderationFlags     String[]  @default([])
moderationScore     Float?
moderationReasoning String?
```

Added to `User` model:
```prisma
isModerator Boolean @default(false)
isAdmin     Boolean @default(false)
```

## How It Works

### Content Creation Flow

1. **User submits content** (post, issue, or idea)
2. **AI moderation runs automatically**
   - Text content analyzed for violations
   - Images checked with Google Vision API
   - Confidence score calculated
3. **Decision made**:
   - **Auto-approve** (score > 0.7, no flags) → Content published immediately
   - **Auto-reject** (high-risk flags, score < 0.3) → User gets error message
   - **Human review** (0.3-0.7 score or borderline flags) → Sent to moderation queue

### Moderation Flags

The AI checks for:
- Hate speech, harassment, discrimination
- Spam, scams, commercial solicitation
- Violence, graphic content, threats
- Adult/sexual content
- Misinformation
- Illegal activities
- Text-in-images (OCR)

### Admin Moderation Queue

**Access**: `/admin/moderation`

**Who can access**: Users with `isModerator: true` or `isAdmin: true`

**Features**:
- View all content pending review
- See AI flags and confidence scores
- Read AI reasoning for flagging
- Approve or reject with one click
- Auto-refreshes after actions

## Setup Instructions

### 1. Run Database Migration

```bash
# On production database (Neon)
psql $DATABASE_URL -f migrations/add-content-moderation.sql
```

Or run this SQL manually:
```sql
-- See migrations/add-content-moderation.sql
```

### 2. Set Admin/Moderator Roles

```sql
-- Make yourself an admin (replace with your email)
UPDATE "User"
SET "isAdmin" = TRUE, "isModerator" = TRUE
WHERE email = 'your-email@example.com';
```

### 3. Environment Variables

Already configured:
```env
GOOGLE_AI_API_KEY=your_key  # Used for Gemini + Vision API
CLOUDFLARE_ACCOUNT_ID=your_id
CLOUDFLARE_API_TOKEN=your_token
```

## Testing the System

### Test Approved Content
Create a normal post:
```
"Hello everyone! Looking forward to connecting with the community."
```
Result: Auto-approved, published immediately

### Test Flagged Content
Create a post with spam:
```
"Buy cheap watches now!!! Click here for amazing deals! $$$ Make money fast!"
```
Result: Flagged as spam, sent to moderation queue or rejected

### Test Image Moderation
Upload an image with inappropriate content
Result: Flagged by Google Vision API, sent for review

### Access Moderation Queue
1. Navigate to `/admin/moderation`
2. View all pending content
3. Approve or reject items

## Configuration

### Adjust Thresholds

In `src/services/contentModeration.ts`:

```typescript
private config: ModerationConfig = {
  textThreshold: 0.7,        // Min confidence to auto-approve
  imageThreshold: 0.6,       // Min confidence for images
  autoRejectThreshold: 0.3,  // Below this = auto-reject
  humanReviewThreshold: 0.6  // Between reject and approve = human review
};
```

### Customize Flags

Add/remove moderation categories in the AI prompt (line 92 in `contentModeration.ts`):

```typescript
Check for:
- Hate speech, harassment, discrimination
- Spam, scams, commercial solicitation
- ... (add your own)
```

## User Experience

### For Regular Users
- **Good content**: Posts immediately, no friction
- **Flagged content**: Gets error message with reason, or "Submitted for review" message
- **Borderline content**: "Your post has been submitted for moderator review"

### For Moderators
- Access special `/admin/moderation` page
- See queue of pending content
- Review AI analysis
- Make final decision

## API Usage Costs

### Free Tier Limits
- **Cloudflare Workers AI**: 1M requests/day (primary)
- **Google Gemini**: 50 requests/day (fallback)
- **Google Vision API**: 1,000 requests/month free

### Expected Usage
- ~10-100 posts/day = Well within free limits
- Cloudflare handles most requests
- Gemini only used if Cloudflare fails

## Monitoring

### Check Moderation Logs

```bash
# Search application logs for moderation activity
grep "🛡️ Running" logs/app.log
grep "📊 Moderation result" logs/app.log
```

### Database Queries

```sql
-- Count pending reviews
SELECT COUNT(*) FROM "GeneralPost" WHERE "moderationStatus" = 'pending_review';
SELECT COUNT(*) FROM "Issue" WHERE "moderationStatus" = 'pending_review';
SELECT COUNT(*) FROM "Idea" WHERE "moderationStatus" = 'pending_review';

-- View rejected content
SELECT * FROM "GeneralPost"
WHERE "moderationStatus" = 'rejected'
ORDER BY "timestamp" DESC
LIMIT 10;

-- See most common flags
SELECT unnest("moderationFlags") as flag, COUNT(*)
FROM "GeneralPost"
GROUP BY flag
ORDER BY count DESC;
```

## Troubleshooting

### Content not being moderated
- Check if AI services are running (Cloudflare/Gemini)
- Verify `GOOGLE_AI_API_KEY` is set
- Look for errors in logs

### Can't access moderation queue
- Ensure user has `isModerator: true` or `isAdmin: true`
- Check browser console for 403 errors
- Verify `/api/admin/moderation` endpoint is accessible

### False positives
- Adjust `humanReviewThreshold` to send more content to human review
- Lower `autoRejectThreshold` to reduce auto-rejections

### AI not working
System has graceful fallbacks:
1. Cloudflare AI fails → Try Gemini
2. Both fail → Auto-approve with flag (`moderation-unavailable`)
3. Never blocks content creation completely

## Future Enhancements

### Phase 2 (Optional)
- [ ] User appeal system for rejected content
- [ ] Analytics dashboard (rejection rates, common flags)
- [ ] Email notifications for moderators
- [ ] Bulk actions (approve/reject multiple items)
- [ ] Content edit + resubmit flow
- [ ] Video frame extraction for better video moderation
- [ ] Custom moderation rules per community

## Notes

- System "fails open" - If AI is down, content is approved with a flag
- Moderation happens BEFORE post creation to prevent bad content from ever appearing
- All moderation decisions are logged with reasoning for transparency
- Users can have both `isModerator` and `isAdmin` roles (admin implies moderator)
