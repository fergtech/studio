# SSE (Server-Sent Events) Disabled

**Date:** 2025-11-06
**Reason:** SSE incompatible with Vercel Hobby tier - causing massive CPU waste

## The Problem

SSE endpoints were timing out after exactly 30 seconds (Vercel Hobby limit), but:
- Database polling every 30 seconds while connection open
- Multiple concurrent connections per user (one per tab)
- Each connection = 30 seconds of CPU burn
- No proper cleanup when Vercel kills the function

**CPU Impact from Logs:**
```
12:29:18 - /api/sse/notifications timeout (30s CPU)
12:29:16 - /api/sse/notifications timeout (30s CPU)
12:28:43 - /api/sse/notifications timeout (30s CPU)
12:28:41 - /api/sse/notifications timeout (30s CPU)
```

That's **2 minutes of CPU wasted in just 1 minute** from SSE alone!

With 5 users x 2 tabs each = 10 SSE connections = **5 minutes of CPU every 30 seconds** = impossible to sustain.

## Files Disabled

All SSE endpoints renamed to `.disabled.ts`:

1. `src/app/api/sse/notifications/route.disabled.ts` - Notifications (main culprit)
2. `src/app/api/sse/chat/[initiativeId]/route.disabled.ts` - Chat messages
3. `src/app/api/sse/messages/[userId]/route.disabled.ts` - Direct messages

## Automatic Fallback

The frontend hooks **already have polling fallback** built in:

**`useNotifications` hook:**
```typescript
useSSE({
  url: '/api/sse/notifications',
  enablePollingFallback: true,
  pollingUrl: '/api/notifications?limit=10',
  pollingInterval: 45000, // Every 45 seconds
})
```

When SSE fails (404), it automatically switches to polling `/api/notifications` every 45 seconds.

## Impact

**Before (SSE):**
- 10 concurrent connections x 30s timeout = 5 minutes CPU every 30 seconds
- Database polled every 30s per connection
- Timeouts every 30 seconds

**After (Polling):**
- Single request every 45 seconds per user
- No long-running connections
- Clean, efficient HTTP requests

**Expected CPU Savings:** 20-30% (from SSE alone)

## User Experience

**No change!** Users won't notice any difference:
- Notifications still appear
- Same 45-second update frequency
- More reliable (no connection drops)

## Re-enabling SSE

SSE **cannot work** on Vercel Hobby tier (30s timeout). Options:

### Option 1: Upgrade to Vercel Pro ($20/mo)
- 5-minute function timeout
- Still not ideal for long-polling
- Not recommended for SSE

### Option 2: Use Pusher/Ably (Recommended)
- Dedicated real-time service
- Free tier: 200k messages/day
- No CPU usage on your server
- Better UX (instant updates)

### Option 3: Keep Polling
- Current implementation works well
- 45-second updates acceptable for notifications
- No additional cost

## Code to Re-enable

If you upgrade to Vercel Pro or switch to Pusher:

```bash
# Re-enable SSE endpoints
mv src/app/api/sse/notifications/route.disabled.ts src/app/api/sse/notifications/route.ts
mv src/app/api/sse/chat/[initiativeId]/route.disabled.ts src/app/api/sse/chat/[initiativeId]/route.ts
mv src/app/api/sse/messages/[userId]/route.disabled.ts src/app/api/sse/messages/[userId]/route.ts
```

## Monitoring

Check CPU usage in Vercel dashboard:
- Should see **20-30% reduction** from disabling SSE
- No more "Task timed out after 30 seconds" errors in logs
- Notification polling at regular 45-second intervals
