# Topic Backfill Guide

This guide explains how to backfill topics for existing posts on production Vercel.

## What Does This Do?

The backfill script processes existing posts that don't have topic assignments and:
1. Detects topics from post content using hashtags + keyword matching
2. Creates `Topic` records in the database
3. Creates `PostTopic` relationship records
4. Updates trending topic counters

This uses the **NEW dynamic topic system** (Topic + PostTopic tables), not just the legacy `topics` array field.

---

## Option 1: Using the API Endpoint (Recommended for Production)

### Step 1: Deploy to Vercel

Make sure your latest code is pushed to GitHub and deployed to Vercel.

```bash
git add .
git commit -m "Add improved topic backfill API endpoint"
git push origin aug-sept
```

### Step 2: Call the API from Browser/Postman

**Dry Run (Preview Only - Safe to Test)**

```bash
# Using curl
curl -X POST https://your-app.vercel.app/api/admin/backfill-topics \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"limit": 100, "dryRun": true}'

# Or just open in browser while logged in:
# POST https://your-app.vercel.app/api/admin/backfill-topics
# Body: {"limit": 100, "dryRun": true}
```

**Live Run (Actually Updates Database)**

```bash
curl -X POST https://your-app.vercel.app/api/admin/backfill-topics \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"limit": 100, "dryRun": false}'
```

### Step 3: Check Results

The endpoint returns:
```json
{
  "success": true,
  "dryRun": true,
  "results": {
    "processed": 50,
    "updated": 45,
    "skipped": 5,
    "errors": [],
    "samples": [
      {
        "id": "post123",
        "preview": "it would be cool if our town had its own local sports organization...",
        "topics": ["sports", "community"]
      }
    ]
  }
}
```

### Step 4: Run Multiple Times if Needed

If you have many posts, run the endpoint multiple times:
- First: `{"limit": 100, "dryRun": false}`
- Check results, then run again with higher limit or multiple times

---

## Option 2: Local Script (For Development)

Use the standalone Node script for local testing:

```bash
# Dry run - preview only
node scripts/backfill-dynamic-topics.mjs --limit=10 --dry-run

# Live run - actually updates database
node scripts/backfill-dynamic-topics.mjs --limit=100

# Process all posts
node scripts/backfill-dynamic-topics.mjs --type=general
```

---

## Testing Locally First

Before running on production, test locally:

1. **Start dev server:**
   ```bash
   pnpm run dev
   ```

2. **Sign in to your local app** (http://localhost:3000)

3. **Call the API endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/backfill-topics \
     -H "Content-Type: application/json" \
     -d '{"limit": 10, "dryRun": true}'
   ```

4. **Check the response** - should show detected topics for posts

5. **Run live if dry run looks good:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/backfill-topics \
     -H "Content-Type: application/json" \
     -d '{"limit": 10, "dryRun": false}'
   ```

---

## How to Get Your Session Cookie (for curl)

### Method 1: Browser Developer Tools
1. Sign in to your Vercel app
2. Open DevTools (F12)
3. Go to Application/Storage → Cookies
4. Copy the `next-auth.session-token` cookie value
5. Use in curl: `-H "Cookie: next-auth.session-token=YOUR_TOKEN"`

### Method 2: Use Postman/Insomnia
1. Sign in through the app in Postman
2. Cookies are automatically managed
3. Just make the POST request

### Method 3: Browser Console (Easiest)
1. Sign in to your app
2. Open browser console (F12)
3. Run this code:

```javascript
fetch('/api/admin/backfill-topics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ limit: 100, dryRun: true })
})
  .then(r => r.json())
  .then(console.log)
```

---

## Example: Processing Your "Sports Organization" Post

Your example post:
> "it would be cool if our town had its own local sports organization where town members can join different teams and play and have a good time"

Would detect topics:
- `sports` (keywords: "sports", "organization", "teams", "play")
- `community` (keywords: "town", "members", "join")

If you add `#sports`:
- `sports` (from hashtag)
- `community` (from keywords)

The post would then:
1. Create/find `sports` topic in database
2. Create/find `community` topic in database
3. Create `PostTopic` records linking the post to both topics
4. Increment `postCount` and `weeklyPosts` on both topics
5. Show in trending topics list on main page

---

## Monitoring on Production

After running backfill on Vercel:

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for: `🚀 Backfill started by...`

2. **Verify Topics Were Created:**
   - Check your app's trending topics list
   - Should see new topics appearing

3. **Check Individual Posts:**
   - Click on a topic from the trending list
   - Should see posts that were backfilled

---

## Troubleshooting

**"Unauthorized" error:**
- Make sure you're signed in
- Session cookies must be valid
- Try refreshing your login

**"All posts skipped":**
- Posts already have topic assignments
- This is normal if backfill already ran

**Timeout on Vercel:**
- Vercel functions have 10-60s timeout
- Reduce `limit` to smaller batches (e.g., 50)
- Run multiple times

**Topics not showing in trending list:**
- Check `postCount` is > 0
- Check `weeklyPosts` is > 0
- Trending widget may have minimum threshold

---

## Safety Features

✅ **Authentication Required** - Only signed-in users can run it

✅ **Dry Run Default** - Defaults to `dryRun: true` unless explicitly set to `false`

✅ **Skips Already Processed** - Won't duplicate work for posts with existing PostTopic records

✅ **Rate Limiting** - Processes in batches to avoid overwhelming the database

✅ **Error Handling** - Continues processing even if individual posts fail
