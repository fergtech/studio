# society+ V1 Production Deployment Guide

## Current MVP Scope (V1.0)

**Visible Features:**
- ✅ TikTok-style debates feed (vertical scrolling)
- ✅ Debate creation and voting (Agree/Disagree)
- ✅ Comments/arguments on debates
- ✅ Search functionality (debates, users, content)
- ✅ User profiles and authentication
- ✅ Bottom navigation (mobile + desktop)
- ✅ Trending topics widget

**Hidden/Future Features:**
- ⏳ Initiatives, Societies, Ideas, Issues (implemented but not visible in V1)
- ⏳ Real-time chat (implemented but Socket.io disabled for Vercel)
- ⏳ Gamification widgets (desktop-only for now)

---

## Prerequisites

Before deploying to production, ensure you have:

1. **Hosting Platform Account**
   - Vercel (recommended) or Netlify
   - Connected to your GitHub repository

2. **Database**
   - PostgreSQL database (Neon, Supabase, or Railway recommended)
   - Connection string with SSL enabled

3. **API Keys & Services**
   - Google Gemini API key (for AI topic detection and moderation)
   - Cloudflare account (for R2 file storage and optional AI)
   - NewsAPI key (optional, for news features)

4. **Domain** (optional but recommended)
   - Custom domain configured in your hosting platform

---

## Step 1: Environment Variables Setup

### Required Variables

Copy `.env.example` to your production environment and set these **required** variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"

# Cloudflare R2 (File Storage)
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="your-bucket-name"
R2_PUBLIC_URL="https://your-bucket.r2.dev"

# Google AI
GOOGLE_GENAI_API_KEY="your-google-gemini-api-key"

# Encryption
ENCRYPTION_KEY="<generate with: openssl rand -hex 32>"

# Environment
NODE_ENV="production"
```

### Optional Variables (for enhanced features)

```bash
# Cloudflare AI (backup to Google Gemini)
CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"

# Cloudflare KV (for AI response caching)
KV_NAMESPACE_ID="your-kv-namespace-id"

# News APIs (if using news features)
NEWSAPI_KEY="your-newsapi-key"
NEWSDATA_API_KEY="your-newsdata-api-key"
```

### Setting Variables in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add each variable with value
3. Select **Production** environment
4. Click **Save**

---

## Step 2: Database Setup

### Initial Migration

Push your Prisma schema to production database:

```bash
# Set your production DATABASE_URL
export DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Push schema
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

Expected output:
```
✔ Your database is now in sync with your schema.
✔ Generated Prisma Client
```

### Verify Database

Check that all tables were created:

```bash
npx prisma studio
```

Or connect via psql and verify tables:
```sql
\dt  -- List all tables
-- Should see: User, DebateTopic, Argument, Vote, etc.
```

---

## Step 3: AI Topic Detection (Optional but Recommended)

The app uses AI to automatically detect and categorize debate topics. Run this once after initial deployment:

### Prerequisites for Topic Backfill

- Google Gemini API key set in `GOOGLE_GENAI_API_KEY`
- At least a few debates in your database
- Or use Cloudflare AI with `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`

### Run Topic Backfill

```bash
# Using Google Gemini (recommended for accuracy)
DATABASE_URL="your-production-url" \
GOOGLE_GENAI_API_KEY="your-api-key" \
node backfill-debate-topics.mjs

# OR using Cloudflare AI (free tier, faster)
DATABASE_URL="your-production-url" \
CLOUDFLARE_ACCOUNT_ID="your-account-id" \
CLOUDFLARE_API_TOKEN="your-token" \
node backfill-debate-topics.mjs

# OR both (Cloudflare primary, Gemini fallback)
DATABASE_URL="your-production-url" \
CLOUDFLARE_ACCOUNT_ID="your-account-id" \
CLOUDFLARE_API_TOKEN="your-token" \
GOOGLE_GENAI_API_KEY="your-gemini-key" \
node backfill-debate-topics.mjs
```

**What this does:**
- Analyzes debate titles and content with AI
- Extracts semantic topics (e.g., "climate change", "housing", "education")
- Creates Topic records in database
- Links debates to topics for trending topics widget

**Note:** This can be skipped initially and run later. Topics will auto-generate as new debates are created.

---

## Step 4: Code Deployment

### Option A: Deploy via Git Push (Vercel Auto-Deploy)

If your Vercel project is connected to GitHub:

```bash
# Stage all changes
git add .

# Commit
git commit -m "feat: V1 production deployment - debates-only MVP"

# Push to main/production branch
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Run build process
3. Deploy to production
4. Run `postinstall` script (prisma generate)

### Option B: Manual Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

---

## Step 5: Post-Deployment Verification

### Test Checklist

After deployment completes, verify these features:

#### ✅ 1. Homepage & Feed
- [ ] Navigate to your production domain
- [ ] Verify debates feed loads (TikTok-style cards)
- [ ] Test infinite scroll (more debates load automatically)
- [ ] Check that trending topics widget appears at top

#### ✅ 2. Authentication
- [ ] Click "Sign In" in bottom nav
- [ ] Create a new account
- [ ] Verify email/password login works
- [ ] Check that profile image upload works

#### ✅ 3. Create Debate
- [ ] Click the **+** FAB button (floating action button)
- [ ] Fill out debate title and content
- [ ] Upload an image (optional)
- [ ] Submit and verify debate appears in feed

#### ✅ 4. Voting & Interactions
- [ ] Click "Agree" or "Disagree" on a debate
- [ ] Verify vote count updates
- [ ] Double-tap to agree (mobile gesture)
- [ ] Tap comment icon to view/add arguments

#### ✅ 5. Search
- [ ] Click search icon in bottom nav
- [ ] Type a query (e.g., "climate")
- [ ] Verify search results appear
- [ ] Click a result and verify navigation

#### ✅ 6. User Profile
- [ ] Click profile avatar in bottom nav
- [ ] Verify profile page loads
- [ ] Check that created debates appear
- [ ] Test edit profile functionality

#### ✅ 7. Mobile Responsiveness
- [ ] Test on mobile device (or Chrome DevTools mobile view)
- [ ] Verify bottom nav bar appears correctly
- [ ] Test swipe gestures on debate cards
- [ ] Check that FAB doesn't overlap nav bar

---

## Step 6: Performance & Monitoring

### Recommended Monitoring Setup

**Vercel Analytics:**
- Enable in Vercel Dashboard → Analytics
- Track page views, load times, core web vitals

**Error Tracking:**
Consider adding Sentry for production error monitoring:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Database Monitoring:**
- Check Neon Dashboard for connection pool usage
- Monitor slow queries
- Set up alerts for connection limits

**AI API Usage:**
- Google Gemini: Check [Google Cloud Console](https://console.cloud.google.com/) for API usage
- Cloudflare: Check Cloudflare Dashboard → Analytics → Workers AI

---

## Step 7: Security Hardening

### Production Security Checklist

- [ ] **NEXTAUTH_SECRET** is a strong random string (min 32 chars)
- [ ] **ENCRYPTION_KEY** is a cryptographically random hex string
- [ ] **DATABASE_URL** uses SSL (`?sslmode=require`)
- [ ] **R2_SECRET_ACCESS_KEY** is kept private (never in client code)
- [ ] **CORS** is configured (Next.js handles this by default)
- [ ] **Rate Limiting** on API routes (consider adding Upstash Rate Limit)
- [ ] **Content Moderation** is enabled (Google Gemini auto-moderates)

### Optional: Add Rate Limiting

To prevent API abuse, add rate limiting to critical endpoints:

```bash
npm install @upstash/ratelimit @upstash/redis
```

Then protect routes like `/api/debates/route.ts`, `/api/search/route.ts`.

---

## Rollback Procedure

If something goes wrong after deployment:

### Code Rollback

```bash
# Find the last working commit
git log --oneline -5

# Revert to that commit
git revert <commit-hash>

# Push revert
git push origin main
```

Vercel will auto-deploy the reverted code.

### Database Rollback

⚠️ **Warning:** Prisma doesn't support automatic rollbacks.

If you need to rollback database changes:

```bash
# Connect to production DB
psql "$DATABASE_URL"

# Manually drop tables/columns if needed
DROP TABLE IF EXISTS "NewTableName";
ALTER TABLE "User" DROP COLUMN IF EXISTS "newColumn";
```

**Prevention:** Always test migrations on staging/development first!

---

## Scaling Considerations

### When to Scale

Monitor these metrics and scale when limits are reached:

**Database Connections:**
- Neon free tier: 100 concurrent connections
- Solution: Upgrade to paid tier or add PgBouncer

**File Storage:**
- Cloudflare R2 free tier: 10GB storage, 10M Class A operations/month
- Solution: Upgrade to paid plan ($0.015/GB/month)

**AI API Calls:**
- Google Gemini free tier: 15 requests/minute, 1500/day
- Cloudflare AI free tier: 10,000 requests/day
- Solution: Implement caching with Cloudflare KV

### Performance Optimizations

**Image Optimization:**
- Already using Next.js Image component
- Consider adding Cloudflare Images for resize/optimization

**Database Queries:**
- Add indexes on frequently queried columns (already configured in Prisma schema)
- Use `SELECT` only needed fields (already optimized in API routes)

**Caching:**
- Enable Vercel Edge Caching for static content
- Add Redis/KV for API response caching

---

## Troubleshooting Common Issues

### Build Fails with "Prisma Client not generated"

**Solution:**
```json
// package.json - ensure postinstall script exists
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Database Connection Timeout

**Solution:**
- Check DATABASE_URL is correct
- Verify SSL is enabled (`?sslmode=require`)
- Check Neon connection limits (free tier: 100 connections)

### AI Topic Detection Fails

**Solution:**
- Verify `GOOGLE_GENAI_API_KEY` or `CLOUDFLARE_API_TOKEN` is set
- Check API quota limits in respective dashboards
- Review error logs: `vercel logs`

### File Upload Fails

**Solution:**
- Verify R2 credentials (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`)
- Check bucket CORS settings in Cloudflare Dashboard
- Ensure `R2_PUBLIC_URL` is correct and publicly accessible

### Search Returns No Results

**Solution:**
- Run topic backfill script (Step 3)
- Check that debates have `moderationStatus: 'approved'` or `null`
- Verify Prisma queries in `/api/search/route.ts` don't have validation errors

---

## Production URLs

After successful deployment, these URLs should work:

- **Homepage:** `https://your-domain.com/`
- **Debates Feed:** `https://your-domain.com/` (default)
- **Search:** `https://your-domain.com/` (click search icon)
- **Profile:** `https://your-domain.com/profile/me`
- **Debate Detail:** `https://your-domain.com/debates/[id]`
- **Topic Page:** `https://your-domain.com/topics/[topic]`

---

## Next Steps After V1 Launch

Once V1 is stable in production:

1. **Collect User Feedback**
   - Monitor user engagement metrics
   - Track most popular topics
   - Identify pain points

2. **Gradual Feature Rollout** (V1.1+)
   - Unhide Initiatives feature
   - Add Societies/Communities
   - Enable Ideas and Issues
   - Redesign profile pages to match feed aesthetic

3. **Marketing & Growth**
   - Share on social media
   - Submit to Product Hunt
   - Engage early users for feedback

---

## Support & Resources

**Hosting:** [Vercel Docs](https://vercel.com/docs)
**Database:** [Neon Docs](https://neon.tech/docs)
**AI:** [Google Gemini Docs](https://ai.google.dev/docs)
**Storage:** [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)

---

**Last Updated:** 2025-10-24
**Version:** 1.0 (Debates-Only MVP)
