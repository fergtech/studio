import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import { readFileSync } from 'fs';
import { join } from 'path';

// Note: Using nodejs runtime because Prisma Client requires it
// Images are still cached by Vercel CDN for performance
export const runtime = 'nodejs';

// Load logo as base64 at module level (cached)
let logoBase64: string | null = null;
try {
  const logoPath = join(process.cwd(), 'public', 'apple-touch-icon.png');
  const logoBuffer = readFileSync(logoPath);
  logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
} catch (error) {
  console.error('Failed to load logo:', error);
}

// Image sizes for different platforms
const SIZES = {
  story: { width: 1080, height: 1920 },  // Instagram Stories
  feed: { width: 1080, height: 1080 },   // Instagram Feed (square)
  facebook: { width: 1200, height: 630 }, // Facebook optimal size
};

// Brand gradients for each content type
const GRADIENTS = {
  idea: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',     // Teal
  issue: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',    // Red
  initiative: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple
  post: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',     // Blue
};

// Icons for each content type
const ICONS = {
  idea: '💡',
  issue: '⚠️',
  initiative: '🎯',
  post: '📝',
};

/**
 * Generate a QR code as base64 data URL
 */
async function generateQRCode(url: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR code generation failed:', error);
    return '';
  }
}

/**
 * Truncate text to fit within character limit
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Fetch an image and convert it to base64 data URL
 */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Convert to base64
    const base64 = buffer.toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

/**
 * GET /api/social/generate-image
 * Query params: contentType, contentId, size
 */
export async function GET(request: NextRequest) {
  // Declare variables at function scope for error logging
  let contentType: 'idea' | 'issue' | 'initiative' | 'post' | null = null;
  let contentId: string | null = null;
  let size: 'story' | 'feed' | 'facebook' = 'feed';
  let mediaUrl: string | null = null;
  let mediaBase64: string | null = null;

  try {
    const { searchParams } = new URL(request.url);
    contentType = searchParams.get('contentType') as 'idea' | 'issue' | 'initiative' | 'post';
    contentId = searchParams.get('contentId');
    size = (searchParams.get('size') || 'feed') as 'story' | 'feed' | 'facebook';

    if (!contentType || !contentId) {
      return new Response('Missing required parameters', { status: 400 });
    }

    // Fetch content from database
    let content: any;
    let title: string;
    let description: string;
    let creatorName: string;
    let creatorAvatar: string | null;

    switch (contentType) {
      case 'idea':
        content = await prisma.idea.findUnique({
          where: { id: contentId },
          include: {
            creator: true,
            media: true,
          },
        });
        if (!content) return new Response('Idea not found', { status: 404 });
        title = content.title;
        description = content.description;
        creatorName = content.creator?.name || 'Anonymous';
        creatorAvatar = content.creator?.image;
        // Get first image from media
        mediaUrl = content.media?.find((m: any) => m.type === 'image')?.url || null;
        break;

      case 'issue':
        content = await prisma.issue.findUnique({
          where: { id: contentId },
          include: {
            creator: true,
            media: true,
          },
        });
        if (!content) return new Response('Issue not found', { status: 404 });
        title = content.title;
        description = content.description;
        creatorName = content.creator?.name || 'Anonymous';
        creatorAvatar = content.creator?.image;
        // Get first image from media
        mediaUrl = content.media?.find((m: any) => m.type === 'image')?.url || null;
        break;

      case 'initiative':
        content = await prisma.initiative.findUnique({
          where: { id: contentId },
          include: { creator: true },
        });
        if (!content) return new Response('Initiative not found', { status: 404 });
        title = content.title;
        description = content.description;
        creatorName = content.creator?.name || 'Anonymous';
        creatorAvatar = content.creator?.image;
        // Use initiative imageUrl if available
        mediaUrl = content.imageUrl || null;
        break;

      case 'post':
        content = await prisma.generalPost.findUnique({
          where: { id: contentId },
          include: {
            creator: true,
            media: true,
          },
        });
        if (!content) return new Response('Post not found', { status: 404 });
        title = 'Community Post';
        description = content.content;
        creatorName = content.creator?.name || 'Anonymous';
        creatorAvatar = content.creator?.image;
        // Get first image from media
        mediaUrl = content.media?.find((m: any) => m.type === 'image')?.url || null;
        break;

      default:
        return new Response('Invalid content type', { status: 400 });
    }

    // Generate content URL with UTM parameters
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const contentUrl = `${baseUrl}/${contentType}s/${contentId}?utm_source=social&utm_medium=${size}`;

    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(contentUrl);

    // TODO: Fetch and convert media image to base64 if available
    // Currently disabled - Satori has issues rendering certain base64 images (u2 is not iterable error)
    // Logo works because it's PNG, but user-uploaded images fail
    // if (mediaUrl) {
    //   console.log('Fetching media from URL:', mediaUrl);
    //   mediaBase64 = await fetchImageAsBase64(mediaUrl);
    //   console.log('Media base64 conversion result:', mediaBase64 ? 'Success' : 'Failed');
    // }

    // Get dimensions for this size
    const { width, height } = SIZES[size];

    // Truncate text based on size
    const isStory = size === 'story';
    const maxTitleLength = isStory ? 60 : 50;
    const maxDescLength = isStory ? 150 : 120;

    const truncatedTitle = truncateText(title, maxTitleLength);
    const truncatedDesc = truncateText(description, maxDescLength);

    // Generate image using @vercel/og
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Background layer - gradient */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: GRADIENTS[contentType],
            }}
          />

          {/* Content wrapper */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: isStory ? '60px 40px' : '40px',
            }}
          >
          {/* Header with society+ logo */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: isStory ? '40px' : '30px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              {logoBase64 ? (
                <img
                  src={logoBase64}
                  width={isStory ? 56 : 48}
                  height={isStory ? 56 : 48}
                  style={{
                    borderRadius: '12px',
                  }}
                />
              ) : null}
              <div
                style={{
                  fontSize: isStory ? '28px' : '24px',
                  fontWeight: '600',
                  color: 'white',
                  opacity: 0.95,
                }}
              >
                society+
              </div>
            </div>
            <div
              style={{
                fontSize: isStory ? '56px' : '48px',
              }}
            >
              {ICONS[contentType]}
            </div>
          </div>

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
              gap: isStory ? '30px' : '20px',
            }}
          >
            <div
              style={{
                fontSize: isStory ? '56px' : '48px',
                fontWeight: 'bold',
                color: 'white',
                lineHeight: 1.2,
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              }}
            >
              {truncatedTitle}
            </div>

            <div
              style={{
                fontSize: isStory ? '32px' : '28px',
                color: 'white',
                opacity: 0.9,
                lineHeight: 1.4,
                textShadow: '0 1px 5px rgba(0,0,0,0.2)',
              }}
            >
              {truncatedDesc}
            </div>
          </div>

          {/* Footer with creator and QR code */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginTop: 'auto',
            }}
          >
            {/* Creator info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              {creatorAvatar ? (
                <img
                  src={creatorAvatar}
                  width={isStory ? 60 : 50}
                  height={isStory ? 60 : 50}
                  style={{
                    borderRadius: '50%',
                    border: '3px solid white',
                  }}
                />
              ) : null}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontSize: isStory ? '24px' : '20px',
                    fontWeight: '600',
                    color: 'white',
                  }}
                >
                  {creatorName}
                </div>
                <div
                  style={{
                    fontSize: isStory ? '20px' : '16px',
                    color: 'white',
                    opacity: 0.8,
                    textTransform: 'capitalize',
                  }}
                >
                  {contentType}
                </div>
              </div>
            </div>

            {/* QR Code - Made larger for better scannability */}
            {qrCodeDataUrl ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <img
                  src={qrCodeDataUrl}
                  width={isStory ? 200 : 180}
                  height={isStory ? 200 : 180}
                  style={{
                    backgroundColor: 'white',
                    padding: '12px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                />
                <div
                  style={{
                    fontSize: isStory ? '20px' : '16px',
                    color: 'white',
                    opacity: 0.95,
                    fontWeight: '600',
                  }}
                >
                  Scan to view
                </div>
              </div>
            ) : null}
          </div>
          </div>
        </div>
      ),
      {
        width,
        height,
      }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      contentType,
      contentId,
      size,
      hasMediaUrl: !!mediaUrl,
      hasMediaBase64: !!mediaBase64,
    });
    return new Response(
      JSON.stringify({
        error: 'Error generating image',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
