import { NextRequest, NextResponse } from 'next/server';

// Define the interface for link metadata
interface LinkMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  type?: string;
}

// Function to validate and normalize URL
function validateAndNormalizeUrl(url: string): string | null {
  try {
    // Add protocol if missing
    if (!url.match(/^https?:\/\//)) {
      url = 'https://' + url;
    }
    
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    // Block private IP ranges and localhost
    const hostname = urlObj.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) ||
      hostname === '0.0.0.0' ||
      hostname === '::1'
    ) {
      return null;
    }
    
    return urlObj.href;
  } catch (error) {
    return null;
  }
}

// Function to extract metadata from HTML
function extractMetadata(html: string, url: string): LinkMetadata {
  const metadata: LinkMetadata = { url };
  
  // Basic regex-based extraction (we'll enhance this later)
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }
  
  // Extract Open Graph tags
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
  if (ogTitleMatch) {
    metadata.title = ogTitleMatch[1].trim();
  }
  
  const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i);
  if (ogDescMatch) {
    metadata.description = ogDescMatch[1].trim();
  }
  
  const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
  if (ogImageMatch) {
    let imageUrl = ogImageMatch[1].trim();
    // Make relative URLs absolute
    if (imageUrl.startsWith('/')) {
      const baseUrl = new URL(url);
      imageUrl = baseUrl.origin + imageUrl;
    } else if (!imageUrl.match(/^https?:\/\//)) {
      const baseUrl = new URL(url);
      imageUrl = baseUrl.origin + '/' + imageUrl;
    }
    metadata.image = imageUrl;
  }
  
  const ogSiteMatch = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]*)"[^>]*>/i);
  if (ogSiteMatch) {
    metadata.siteName = ogSiteMatch[1].trim();
  }
  
  const ogTypeMatch = html.match(/<meta[^>]*property="og:type"[^>]*content="([^"]*)"[^>]*>/i);
  if (ogTypeMatch) {
    metadata.type = ogTypeMatch[1].trim();
  }
  
  // Extract Twitter Card tags as fallback
  if (!metadata.title) {
    const twitterTitleMatch = html.match(/<meta[^>]*name="twitter:title"[^>]*content="([^"]*)"[^>]*>/i);
    if (twitterTitleMatch) {
      metadata.title = twitterTitleMatch[1].trim();
    }
  }
  
  if (!metadata.description) {
    const twitterDescMatch = html.match(/<meta[^>]*name="twitter:description"[^>]*content="([^"]*)"[^>]*>/i);
    if (twitterDescMatch) {
      metadata.description = twitterDescMatch[1].trim();
    }
  }
  
  if (!metadata.image) {
    const twitterImageMatch = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]*)"[^>]*>/i);
    if (twitterImageMatch) {
      let imageUrl = twitterImageMatch[1].trim();
      // Make relative URLs absolute
      if (imageUrl.startsWith('/')) {
        const baseUrl = new URL(url);
        imageUrl = baseUrl.origin + imageUrl;
      } else if (!imageUrl.match(/^https?:\/\//)) {
        const baseUrl = new URL(url);
        imageUrl = baseUrl.origin + '/' + imageUrl;
      }
      metadata.image = imageUrl;
    }
  }
  
  // Extract description from meta description as fallback
  if (!metadata.description) {
    const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    if (metaDescMatch) {
      metadata.description = metaDescMatch[1].trim();
    }
  }
  
  // Extract favicon
  const faviconMatch = html.match(/<link[^>]*rel="(?:icon|shortcut icon)"[^>]*href="([^"]*)"[^>]*>/i);
  if (faviconMatch) {
    let faviconUrl = faviconMatch[1].trim();
    // Make relative URLs absolute
    if (faviconUrl.startsWith('/')) {
      const baseUrl = new URL(url);
      faviconUrl = baseUrl.origin + faviconUrl;
    } else if (!faviconUrl.match(/^https?:\/\//)) {
      const baseUrl = new URL(url);
      faviconUrl = baseUrl.origin + '/' + faviconUrl;
    }
    metadata.favicon = faviconUrl;
  } else {
    // Default favicon
    const baseUrl = new URL(url);
    metadata.favicon = baseUrl.origin + '/favicon.ico';
  }
  
  // Set default site name from hostname if not found
  if (!metadata.siteName) {
    const hostname = new URL(url).hostname;
    metadata.siteName = hostname.replace(/^www\./, '');
  }
  
  // Set default type
  if (!metadata.type) {
    metadata.type = 'website';
  }
  
  return metadata;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Validate and normalize URL
    const normalizedUrl = validateAndNormalizeUrl(url);
    if (!normalizedUrl) {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }
    
    // Fetch the URL with timeout and proper headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(normalizedUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SocietyBot/1.0; +https://society.app)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
          { status: 400 }
        );
      }
      
      // Check content type
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        return NextResponse.json(
          { error: 'URL does not return HTML content' },
          { status: 400 }
        );
      }
      
      // Get HTML content
      const html = await response.text();
      
      // Extract metadata
      const metadata = extractMetadata(html, normalizedUrl);
      
      return NextResponse.json({
        success: true,
        metadata,
      });
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - URL took too long to respond' },
          { status: 408 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to fetch URL: ${fetchError.message}` },
        { status: 400 }
      );
    }
    
  } catch (error: any) {
    console.error('Link preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing URL' },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    message: 'Link preview API is running',
    timestamp: new Date().toISOString(),
  });
}