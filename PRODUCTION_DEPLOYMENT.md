# Production Deployment Guide

This guide covers deploying the latest changes including:
- Gamification system (initiative unlocking)
- Search functionality (comprehensive search modal)
- Topic detection and backfill
- Database schema updates

## Prerequisites

- Production database URL (Neon PostgreSQL)
- Google Gemini API key
- Git access to push changes

## Environment Variables Needed

Make sure these are set in your production environment:
- `DATABASE_URL` - Your Neon database connection string
- `GOOGLE_GENAI_API_KEY` - For AI topic detection
- All other existing env vars (NextAuth, Cloudflare, etc.)

---

## Step-by-Step Deployment

### 1. Database Migration

Push the schema changes to production database:

```bash
DATABASE_URL="postgresql://neondb_owner:npg_1BrxDI4jHaOS@ep-muddy-frost-adfi6vir-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" npx prisma db push --accept-data-loss
```

Expected output:
- Schema changes applied
- Prisma Client regenerated

**New fields added to User table:**
- `activityScore` (Int, default 0)
- `canCreateSociety` (Boolean, default false)
- `canCreateInitiative` (Boolean, default false)
- `societyUnlockedAt` (DateTime, nullable)
- `initiativeUnlockedAt` (DateTime, nullable)

**New tables created:**
- `Topic` - Canonical topic records
- `DebateTopicTopic` - Many-to-many relation between debates and topics

---

### 2. Backfill Production Debates with AI Topics

Run the topic detection script against production data:

```bash
DATABASE_URL="postgresql://neondb_owner:npg_1BrxDI4jHaOS@ep-muddy-frost-adfi6vir-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" GOOGLE_GENAI_API_KEY="your-production-gemini-key" node backfill-debate-topics.mjs
```

**What this does:**
- Fetches all approved debates from production
- Uses Google Gemini 2.0 Flash to semantically detect topics
- Creates Topic records with accurate debateCount
- Creates DebateTopicTopic relations
- Updates legacy topics array for backward compatibility

**Monitor the output:**
- Should show progress for each debate
- Look for "✅ Successfully processed X debates"
- Check for any errors or API rate limits

**Rate limiting:**
- Google Gemini free tier: 15 requests/minute
- If you have many debates, the script may need rate limiting
- Consider running in batches if needed

---

### 3. Code Deployment

#### Option A: Via Git Push (Vercel/Netlify)

```bash
# Stage all changes
git add .

# Create commit
git commit -m "feat: Add gamification, comprehensive search, and AI topic detection

- Implement progressive unlocking system for initiatives
- Add comprehensive search across all content types
- Integrate Google Gemini for semantic topic detection
- Add Topic and DebateTopicTopic models for better topic management
- Fix Prisma validation errors in search endpoints
- Update thresholds: 3 votes, 67% agreement for initiative unlock"

# Push to production branch
git push origin main  # or your production branch
```

#### Option B: Manual Deployment

If using a platform like Vercel:
1. Push code to Git repository
2. Vercel will auto-deploy from the connected branch
3. Ensure environment variables are set in Vercel dashboard

---

### 4. Verify Environment Variables in Production

**Critical production env vars:**

```bash
# Database
DATABASE_URL="your-neon-production-url"

# Google Gemini AI (for topic detection)
GOOGLE_GENAI_API_KEY="your-production-gemini-key"

# Cloudflare AI (if used as backup)
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_AI_GATEWAY_TOKEN="your-token"

# NextAuth
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-production-domain.com"

# File Storage (Cloudflare R2)
CLOUDFLARE_R2_ACCESS_KEY_ID="your-r2-key"
CLOUDFLARE_R2_SECRET_ACCESS_KEY="your-r2-secret"
CLOUDFLARE_R2_BUCKET_NAME="your-bucket"
CLOUDFLARE_R2_ACCOUNT_ID="your-account-id"
```

**Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Verify all variables are set for Production
3. Redeploy if you added new variables

---

### 5. Post-Deployment Testing

#### Test 1: Search Functionality
1. Go to production site
2. Click search icon in navbar
3. Type a query (e.g., "housing")
4. Verify results show: debates, initiatives, societies, posts, users
5. Click on different result types to ensure navigation works

#### Test 2: Topic Pages
1. Navigate to a topic page (e.g., `/topics/housing`)
2. Verify debates are displayed with the new topic
3. Check that topic statistics are accurate
4. Verify related topics are shown

#### Test 3: Initiative Unlocking (if you have qualifying debates)
1. Find a debate with 3+ votes and 67%+ PRO agreement
2. Verify "Unlock Achieved!" banner appears on the debate card
3. Click "Create Initiative" button
4. Verify form opens with pre-filled title/description
5. Try creating an initiative

#### Test 4: User Unlock Status
1. Open browser DevTools → Network tab
2. Navigate to create initiative form
3. Check for `/api/user/unlock-status` request
4. Verify response shows correct activity score and unlock status

---

### 6. Monitoring and Rollback

**Monitor these metrics:**
- API error rates (check Vercel logs)
- Database connection pool usage (Neon dashboard)
- Google Gemini API usage and costs
- User-reported search issues

**Rollback procedure (if needed):**

```bash
# Revert code changes
git revert <commit-hash>
git push origin main

# Database rollback (CAREFUL!)
# Prisma doesn't have automatic rollback
# You'd need to manually remove the new columns:
DATABASE_URL="your-production-url" psql -c "
  ALTER TABLE \"User\" DROP COLUMN IF EXISTS \"activityScore\";
  ALTER TABLE \"User\" DROP COLUMN IF EXISTS \"canCreateSociety\";
  ALTER TABLE \"User\" DROP COLUMN IF EXISTS \"canCreateInitiative\";
  ALTER TABLE \"User\" DROP COLUMN IF EXISTS \"societyUnlockedAt\";
  ALTER TABLE \"User\" DROP COLUMN IF EXISTS \"initiativeUnlockedAt\";
  DROP TABLE IF EXISTS \"DebateTopicTopic\";
  DROP TABLE IF EXISTS \"Topic\";
"
```

---

## Common Issues and Solutions

### Issue: Prisma Client cache in production
**Solution:** Ensure `npx prisma generate` runs during build
- Vercel does this automatically
- Check `package.json` has `"postinstall": "prisma generate"`

### Issue: AI topic detection errors
**Solution:**
- Verify GOOGLE_GENAI_API_KEY is set
- Check API quota limits
- Review script logs for specific errors

### Issue: Search returns 500 error
**Solution:**
- Check Prisma queries don't use `in: ['approved', null]`
- Should use `OR: [{ moderationStatus: 'approved' }, { moderationStatus: null }]`
- Verify in `/api/explore/search` and `/api/search`

### Issue: Initiative unlock not showing
**Solution:**
- Verify debate has 3+ total votes
- Check PRO percentage >= 67%
- Look at DebateTopicCard rendering logic
- Check browser console for errors

---

## Production Optimization (Future)

After successful deployment, consider:

1. **Caching:** Add Redis/KV caching for topic counts
2. **Rate Limiting:** Protect search endpoints from abuse
3. **Batch Processing:** If backfill takes too long, split into batches
4. **Monitoring:** Set up Sentry or similar for error tracking
5. **Analytics:** Track initiative unlock conversion rates

---

## Contacts and Support

- Database: Neon PostgreSQL (check Neon dashboard for metrics)
- AI: Google Gemini 2.0 Flash (check Google Cloud Console for usage)
- Deployment: Vercel/Netlify (check deployment logs)

---

**Last Updated:** 2025-10-24
**Deployed By:** [Your Name]
