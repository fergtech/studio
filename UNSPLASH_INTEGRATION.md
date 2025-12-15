# Unsplash Image Integration - Setup Guide

This feature allows users to search and select images from Unsplash when creating debate topics.

## What Was Implemented

✅ **Server-side Unsplash API integration** (keeps API keys secure)
✅ **Image search with query input**
✅ **Attribution display** (required by Unsplash guidelines)
✅ **Download tracking** (required by Unsplash guidelines)
✅ **Direct image URL usage** (no re-hosting, as per guidelines)
✅ **Clean modal UI** with search and grid display

## Files Created/Modified

### New Files:
- `src/app/api/unsplash/search/route.ts` - API route for searching images
- `src/app/api/unsplash/download/route.ts` - API route for tracking downloads
- `src/components/UnsplashImagePicker.tsx` - Reusable image picker component

### Modified Files:
- `src/components/CreateDebateTopicForm.tsx` - Added Unsplash picker integration
- `.env.example` - Added Unsplash API key documentation

### Dependencies Added:
- `unsplash-js@7.0.20` - Official Unsplash JavaScript SDK

## Setup Instructions

### 1. Get Unsplash API Keys

1. Go to [https://unsplash.com/developers](https://unsplash.com/developers)
2. Click "Register as a developer"
3. Create a new application
4. Copy your **Access Key** and **Secret Key**

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```bash
UNSPLASH_ACCESS_KEY="your-actual-access-key-here"
UNSPLASH_SECRET_KEY="your-actual-secret-key-here"
```

### 3. Test the Integration

1. Start your development server: `pnpm dev`
2. Navigate to `/debates/create`
3. Click the "Search Unsplash" button
4. Search for images (e.g., "technology", "nature", "politics")
5. Click an image to select it
6. Create a debate topic with the selected image

## Unsplash API Guidelines Compliance

✅ **Hotlinked URLs** - Images use `photo.urls.regular` directly from Unsplash
✅ **Download Tracking** - Calls `/api/unsplash/download` when user selects an image
✅ **Attribution** - Shows "Photo by [Name] on Unsplash" with proper UTM links
✅ **Secure API Keys** - Keys stored server-side, never exposed to client
✅ **UTM Parameters** - All links include `?utm_source=studio&utm_medium=referral`

## Usage

When users create a debate topic, they can now:
1. Click "Search Unsplash" button
2. Enter a search query
3. Browse 30 landscape-oriented images
4. Click to select an image
5. Image URL is automatically added to the debate topic
6. Proper attribution is displayed below the preview

## API Rate Limits

- **Free Tier**: 50 requests per hour
- **Production**: Apply for higher limits at [https://unsplash.com/oauth/applications](https://unsplash.com/oauth/applications)

## Future Enhancements

- [ ] Pagination for more than 30 results
- [ ] Filter by orientation (landscape/portrait/square)
- [ ] Filter by color
- [ ] Save frequently used images
- [ ] Support for other content types (Ideas, Issues, etc.)

## Troubleshooting

### "Unsplash API key not configured" error
- Make sure you've added `UNSPLASH_ACCESS_KEY` to your `.env.local`
- Restart your development server after adding environment variables

### No images appearing
- Check browser console for API errors
- Verify your API key is valid on Unsplash dashboard
- Check you haven't exceeded rate limits (50 requests/hour on free tier)

### Images not loading
- Unsplash URLs are hotlinked - ensure your `next.config.ts` allows `images.unsplash.com` domain
- Check that the image URL is using `https://`

## Support

For issues or questions:
- Unsplash API Docs: [https://unsplash.com/documentation](https://unsplash.com/documentation)
- Unsplash API Guidelines: [https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines)
