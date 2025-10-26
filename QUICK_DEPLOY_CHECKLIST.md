# 🚀 Quick Deploy Checklist - society+ V1

**Use this for rapid deployments. See PRODUCTION_DEPLOYMENT_V1.md for detailed guide.**

---

## Pre-Flight (First Time Only)

### 1. Environment Variables (Vercel Dashboard)
```bash
✅ DATABASE_URL              # Neon PostgreSQL URL with ?sslmode=require
✅ NEXTAUTH_URL              # https://your-domain.com
✅ NEXTAUTH_SECRET           # openssl rand -base64 32
✅ R2_ACCOUNT_ID             # Cloudflare R2
✅ R2_ACCESS_KEY_ID          # Cloudflare R2
✅ R2_SECRET_ACCESS_KEY      # Cloudflare R2
✅ R2_BUCKET_NAME            # Your bucket name
✅ R2_PUBLIC_URL             # https://your-bucket.r2.dev
✅ GOOGLE_GENAI_API_KEY      # Google Gemini
✅ ENCRYPTION_KEY            # openssl rand -hex 32
✅ NODE_ENV=production
```

### 2. Database Migration (Run Once)
```bash
export DATABASE_URL="your-production-url"
npx prisma db push
npx prisma generate
```

### 3. Topic Backfill (Optional, Run Once)
```bash
DATABASE_URL="..." GOOGLE_GENAI_API_KEY="..." node backfill-debate-topics.mjs
```

---

## Deploy Process (Every Time)

### Step 1: Test Locally
```bash
npm run build
npm run start
# Visit http://localhost:3000 and verify
```

### Step 2: Commit & Push
```bash
git add .
git commit -m "feat: your changes here"
git push origin main
```

### Step 3: Verify Deployment
- Vercel auto-deploys from GitHub push
- Check deployment status: https://vercel.com/dashboard
- Expected build time: 2-3 minutes

### Step 4: Smoke Test Production
Visit these URLs after deployment:

```bash
✅ https://your-domain.com/                    # Homepage - debates feed
✅ https://your-domain.com/                    # Click Search - search modal opens
✅ https://your-domain.com/                    # Click + FAB - create debate modal
✅ https://your-domain.com/                    # Click Profile - profile page
✅ https://your-domain.com/debates/[any-id]    # Debate detail page
```

**Quick Test Actions:**
- [ ] Create a debate → Appears in feed
- [ ] Vote on debate → Count updates
- [ ] Add comment → Comment appears
- [ ] Search for "test" → Results show
- [ ] View profile → Shows user info

---

## Rollback (If Needed)

```bash
# Find last working commit
git log --oneline -5

# Revert
git revert <commit-hash>
git push origin main
```

---

## Common Issues - Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| Build fails | Check `npm run build` locally first |
| Prisma errors | Run `npx prisma generate` locally |
| DB connection fails | Verify `DATABASE_URL` has `?sslmode=require` |
| Images not uploading | Check R2 credentials in Vercel env vars |
| Search broken | Run topic backfill script |
| 500 errors | Check Vercel logs: `vercel logs` |

---

## Performance Monitoring

**After Each Deploy, Check:**
- Vercel Analytics: Page load times < 3s
- Error rate: < 1%
- Database connections: < 50 (Neon free tier limit: 100)

---

## Version History

- **V1.0** (2025-10-24): Debates-only MVP, TikTok-style feed
- Add future versions here...

---

**Need detailed help?** See `PRODUCTION_DEPLOYMENT_V1.md`
