# Production Deployment Steps

## Environment Variables to Add in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these for **Production** environment:

**Primary AI Provider (Cloudflare - Recommended):**
```
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
```

**Backup AI Provider (Optional but recommended):**
```
GOOGLE_GENAI_API_KEY=your-production-gemini-key-here
```

(DATABASE_URL should already be set from previous deployments)

**Why Cloudflare AI?**
- ✅ 1 million requests/day free tier
- ✅ Runs on edge network (faster)
- ✅ More cost-effective at scale
- 🤖 Gemini automatically used as backup if Cloudflare fails

---

## Step 1: Run Database Migration

```bash
npm run migrate:production
```

This pushes the new schema changes:
- Adds `activityScore`, `canCreateSociety`, `canCreateInitiative`, etc. to User table
- Creates `Topic` and `DebateTopicTopic` tables

---

## Step 2: Clean Old Topic Data (Optional but Recommended)

If you want to start fresh with AI-detected topics:

```bash
DATABASE_URL="postgresql://neondb_owner:npg_1BrxDI4jHaOS@ep-muddy-frost-adfi6vir-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" node clean-debate-topics.mjs
```

This removes all old topic relations so backfill starts clean.

---

## Step 3: Backfill Topics with AI

**With Cloudflare AI (Primary):**
```bash
DATABASE_URL="postgresql://neondb_owner:npg_1BrxDI4jHaOS@ep-muddy-frost-adfi6vir-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" CLOUDFLARE_ACCOUNT_ID="your-cf-account-id" CLOUDFLARE_API_TOKEN="your-cf-token" node backfill-debate-topics.mjs
```

**Or with Gemini AI (Backup):**
```bash
DATABASE_URL="postgresql://neondb_owner:npg_1BrxDI4jHaOS@ep-muddy-frost-adfi6vir-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" GOOGLE_GENAI_API_KEY="your-production-key" node backfill-debate-topics.mjs
```

**Or with Both (Cloudflare with Gemini fallback - Recommended):**
```bash
DATABASE_URL="postgresql://neondb_owner:npg_1BrxDI4jHaOS@ep-muddy-frost-adfi6vir-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require" CLOUDFLARE_ACCOUNT_ID="your-cf-account-id" CLOUDFLARE_API_TOKEN="your-cf-token" GOOGLE_GENAI_API_KEY="your-gemini-key" node backfill-debate-topics.mjs
```

This runs AI on all debates to detect semantic topics.
- Cloudflare: 1M requests/day, faster edge processing
- Gemini: Automatic fallback if Cloudflare fails

---

## Step 4: Push Code to GitHub

When you're ready:

```bash
git add .
git commit -m "feat: Add gamification and comprehensive search

- Progressive unlocking for initiatives (3 votes, 67% agreement)
- Comprehensive search across debates, initiatives, societies, posts, users
- AI-powered topic detection with Google Gemini
- New Topic and DebateTopicTopic models"

git push origin main
```

Vercel will auto-deploy from the push.

---

## Step 5: Verify in Production

After Vercel deploys:

1. **Search:** Click search icon, type a query, verify all content types show
2. **Topics:** Go to `/topics/housing` or any topic page
3. **Initiative Unlock:** Find a debate with 3+ votes (67%+ PRO) and check for unlock banner
4. **User Unlock API:** Open DevTools, navigate to create initiative, check `/api/user/unlock-status` response

---

## Rollback (If Needed)

If something breaks:

```bash
# Revert code
git revert HEAD
git push origin main

# Database changes are harder to rollback - contact me if needed
```

---

**Production Database URL:**
```
postgresql://neondb_owner:npg_1BrxDI4jHaOS@ep-muddy-frost-adfi6vir-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Scripts Ready:**
- ✅ `scripts/migrate-production.js` - DB migration
- ✅ `clean-debate-topics.mjs` - Clean old topic data
- ✅ `backfill-debate-topics.mjs` - AI topic detection
