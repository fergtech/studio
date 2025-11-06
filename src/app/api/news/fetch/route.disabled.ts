import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface NewsItem {
  title: string;
  summary: string;
  excerpt?: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: Date;
  location?: string;
  city?: string;
  urgencyLevel: number;
  tags: string[];
}

// Helper function to determine urgency level based on keywords
function determineUrgencyLevel(title: string, summary: string): number {
  const text = (title + ' ' + summary).toLowerCase();

  const highUrgencyKeywords = [
    'breaking', 'urgent', 'emergency', 'crisis', 'disaster', 'evacuation',
    'shooting', 'fire', 'accident', 'storm', 'flood', 'tornado'
  ];

  const mediumUrgencyKeywords = [
    'alert', 'warning', 'closes', 'closed', 'postponed', 'canceled',
    'investigation', 'arrest', 'protest', 'strike'
  ];

  let level;
  if (highUrgencyKeywords.some(keyword => text.includes(keyword))) {
    level = 3; // Breaking
  } else if (mediumUrgencyKeywords.some(keyword => text.includes(keyword))) {
    level = 2; // Important
  } else {
    level = 1; // Normal
  }

  console.log('DEBUG: urgencyLevel determined:', level, typeof level, 'for title:', title.substring(0, 30));
  return level;
}

// Helper function to extract location info from user data
function getUserLocationInfo(user: any) {
  let targetCity = user?.city;
  let country = 'US'; // Default fallback
  let locationFormatted = 'United States';

  // If user has structured location data, extract country and better city name
  if (user?.location) {
    try {
      const locationData = JSON.parse(user.location);
      country = getCountryCode(locationData.country) || 'US';
      locationFormatted = locationData.country || 'United States';
      
      // If city field is a postal code, try to get better location name
      if (targetCity && isPostalCode(targetCity, country)) {
        targetCity = locationData.county || locationData.city || locationData.displayName?.split(',')[0] || targetCity;
        console.log(`Converted postal code to location: ${user.city} -> ${targetCity}`);
      }
    } catch (error) {
      console.log('Could not parse location data, using defaults');
    }
  }

  return { targetCity, country, locationFormatted };
}

// Helper function to detect postal codes by country
function isPostalCode(value: string, country: string): boolean {
  const patterns: { [key: string]: RegExp } = {
    'US': /^\d{5}(-\d{4})?$/, // US ZIP codes
    'CA': /^[A-Z]\d[A-Z] \d[A-Z]\d$/, // Canadian postal codes
    'UK': /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, // UK postcodes
    'DE': /^\d{5}$/, // German postal codes
    'FR': /^\d{5}$/, // French postal codes
    'AU': /^\d{4}$/, // Australian postal codes
    // Add more patterns as needed
  };
  
  const pattern = patterns[country];
  return pattern ? pattern.test(value) : /^\d+$/.test(value); // Fallback: assume numeric values are postal codes
}

// Helper function to get country code for NewsAPI
function getCountryCode(countryName?: string): string | null {
  if (!countryName) return null;
  
  const countryMap: { [key: string]: string } = {
    'United States': 'us',
    'Canada': 'ca',
    'United Kingdom': 'gb',
    'Australia': 'au',
    'Germany': 'de',
    'France': 'fr',
    'Italy': 'it',
    'Spain': 'es',
    'Netherlands': 'nl',
    'Belgium': 'be',
    'Switzerland': 'ch',
    'Austria': 'at',
    'India': 'in',
    'Japan': 'jp',
    'South Korea': 'kr',
    'China': 'cn',
    'Brazil': 'br',
    'Mexico': 'mx',
    'Argentina': 'ar',
    'South Africa': 'za',
    'Egypt': 'eg',
    'Israel': 'il',
    'Turkey': 'tr',
    'Russia': 'ru',
    'Poland': 'pl',
    'Sweden': 'se',
    'Norway': 'no',
    'Denmark': 'dk',
    'Finland': 'fi',
    // Add more mappings as needed
  };
  
  return countryMap[countryName] || null;
}
function extractTags(title: string, summary: string): string[] {
  const text = (title + ' ' + summary).toLowerCase();
  const tags: string[] = [];

  // Category mapping
  const categoryMap = {
    'local': ['city', 'county', 'neighborhood', 'community', 'local'],
    'government': ['city council', 'mayor', 'government', 'politics', 'election', 'vote', 'policy'],
    'education': ['school', 'university', 'education', 'student', 'teacher'],
    'health': ['hospital', 'health', 'medical', 'doctor', 'patient', 'covid'],
    'transportation': ['road', 'highway', 'bridge', 'transit', 'traffic', 'construction'],
    'environment': ['environment', 'water', 'air quality', 'pollution', 'climate'],
    'crime': ['police', 'crime', 'arrest', 'investigation', 'theft', 'robbery'],
    'business': ['business', 'economy', 'jobs', 'employment', 'company'],
    'events': ['event', 'festival', 'concert', 'celebration', 'parade'],
  };

  Object.entries(categoryMap).forEach(([category, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      tags.push(category);
    }
  });

  // Default to 'local' if no other tags match
  if (tags.length === 0) {
    tags.push('local');
  }

  return tags;
}

// Helper function to extract city from location string
function extractCity(location?: string): string | null {
  if (!location) return null;

  // Simple city extraction - take the first part before comma
  const parts = location.split(',');
  return parts[0]?.trim() || null;
}

// Real function to fetch news from NewsAPI.org
async function fetchNewsFromSources(city?: string, country?: string, locationFormatted?: string): Promise<NewsItem[]> {
  const newsItems: NewsItem[] = [];
  const apiKey = process.env.NEWSAPI_KEY;

  if (!apiKey) {
    console.error('NEWSAPI_KEY not found in environment variables');
    return [];
  }

  try {
    // Use everything endpoint for city-specific searches (better results)
    // Use top-headlines for general country news
    const useEverything = !!city;
    const apiUrl = new URL(`https://newsapi.org/v2/${useEverything ? 'everything' : 'top-headlines'}`);
    apiUrl.searchParams.append('apiKey', apiKey);
    apiUrl.searchParams.append('pageSize', '10');
    
    if (useEverything && city) {
      // Everything endpoint - better for location-specific searches
      apiUrl.searchParams.append('q', city);
      apiUrl.searchParams.append('sortBy', 'publishedAt');
      apiUrl.searchParams.append('language', 'en');
    } else {
      // Top-headlines endpoint - for general country news
      const countryCode = country && country.toLowerCase();
      if (countryCode && countryCode !== 'unknown') {
        apiUrl.searchParams.append('country', countryCode);
      } else {
        // If no valid country, use everything endpoint with general terms
        apiUrl.searchParams.set('q', 'news');
        apiUrl.searchParams.set('sortBy', 'publishedAt');
        apiUrl.searchParams.set('language', 'en');
      }
    }

    console.log('Fetching news from NewsAPI...', apiUrl.toString());
    const headlinesResponse = await fetch(apiUrl.toString());

    if (headlinesResponse.ok) {
      const headlinesData = await headlinesResponse.json();
      console.log(`Headlines API returned ${headlinesData.totalResults || 0} total results, ${headlinesData.articles?.length || 0} articles`);

      if (headlinesData.articles && headlinesData.articles.length > 0) {
        for (const article of headlinesData.articles) {
          if (article.title && article.description && article.url) {
            const newsItem: NewsItem = {
              title: article.title,
              summary: article.description,
              excerpt: article.content ? article.content.substring(0, 200) + '...' : undefined,
              source: article.source?.name || 'Unknown Source',
              sourceUrl: article.url,
              imageUrl: article.urlToImage || undefined,
              publishedAt: new Date(article.publishedAt),
              location: city ? `${city}, ${locationFormatted || 'Unknown'}` : (locationFormatted || 'General'),
              city: city || extractCityFromContent(article.title + ' ' + article.description),
              urgencyLevel: determineUrgencyLevel(article.title, article.description),
              tags: extractTags(article.title, article.description),
            };
            newsItems.push(newsItem);
          }
        }
      } else if (city) {
        // If city-specific search returned no results, try general country news
        console.log('City-specific search returned 0 results, trying general country news...');
        const generalUrl = new URL('https://newsapi.org/v2/top-headlines');
        generalUrl.searchParams.append('apiKey', apiKey);
        generalUrl.searchParams.append('pageSize', '5');
        
        const countryCode = country && country.toLowerCase();
        if (countryCode && countryCode !== 'unknown') {
          generalUrl.searchParams.append('country', countryCode);
        } else {
          // Fallback to everything endpoint with general news
          generalUrl.pathname = '/v2/everything';
          generalUrl.searchParams.set('q', 'breaking news');
          generalUrl.searchParams.set('sortBy', 'publishedAt');
          generalUrl.searchParams.set('language', 'en');
        }

        const generalResponse = await fetch(generalUrl.toString());
        if (generalResponse.ok) {
          const generalData = await generalResponse.json();
          console.log(`General news returned ${generalData.articles?.length || 0} articles`);

          if (generalData.articles) {
            for (const article of generalData.articles) {
              if (article.title && article.description && article.url) {
                const newsItem: NewsItem = {
                  title: article.title,
                  summary: article.description,
                  excerpt: article.content ? article.content.substring(0, 200) + '...' : undefined,
                  source: article.source?.name || 'Unknown Source',
                  sourceUrl: article.url,
                  imageUrl: article.urlToImage || undefined,
                  publishedAt: new Date(article.publishedAt),
                  location: locationFormatted || 'General',
                  city: extractCityFromContent(article.title + ' ' + article.description) || 'General',
                  urgencyLevel: determineUrgencyLevel(article.title, article.description),
                  tags: extractTags(article.title, article.description),
                };
                newsItems.push(newsItem);
              }
            }
          }
        }
      }
    } else {
      console.error('NewsAPI request failed:', headlinesResponse.status, await headlinesResponse.text());
    }

    console.log(`Successfully fetched ${newsItems.length} news items`);
    return newsItems;

  } catch (error) {
    console.error('Error fetching news from sources:', error);
    return [];
  }
}

// Helper function to extract city from article content
function extractCityFromContent(content: string): string | undefined {
  // Simple regex to find city names (capitalize words followed by state abbreviations or common words)
  const cityPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*(?:in\s+)?([A-Z]{2}|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\b/i;

  const match = content.match(cityPattern);
  return match ? match[1] : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // For now, allow unauthenticated requests for news fetching
    // In production, you might want to restrict this to admin users or use API keys

    const body = await req.json();
    const { city, forceRefresh = false } = body;

    // Get user's location if authenticated and no city specified
    let locationInfo = { targetCity: city, country: 'US', locationFormatted: 'United States' };
    
    if (!locationInfo.targetCity && session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { city: true, location: true }
      });
      
      if (user) {
        locationInfo = getUserLocationInfo(user);
      }
    }

    // Check if we have recent news for this city (unless force refresh)
    if (!forceRefresh && locationInfo.targetCity) {
      const recentNews = await prisma.newsPost.findFirst({
        where: {
          city: locationInfo.targetCity,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Within last hour
          },
        },
      });

      if (recentNews) {
        return NextResponse.json({
          message: 'Recent news already exists for this city',
          lastFetch: recentNews.createdAt,
        });
      }
    }

    // Fetch news from external sources
    const newsItems = await fetchNewsFromSources(locationInfo.targetCity, locationInfo.country, locationInfo.locationFormatted);

    // TEMP: Add a test news item to debug database saving
    if (newsItems.length === 0) {
      console.log('Adding test news item for debugging...');
      newsItems.push({
        title: 'Test News Item',
        summary: 'This is a test summary for debugging database save',
        excerpt: 'Test excerpt',
        source: 'Test Source',
        sourceUrl: 'https://example.com/test',
        imageUrl: undefined,
        publishedAt: new Date(),
        location: 'Test Location',
        city: 'Test City',
        urgencyLevel: 1,
        tags: ['test']
      });
    }

    // Save news items to database
    const savedNews = [];
    for (const item of newsItems) {
      try {
        // Check if this news item already exists (by URL)
        const existingNews = await prisma.newsPost.findFirst({
          where: { sourceUrl: item.sourceUrl },
        });

        if (!existingNews) {
          console.log('Attempting to save news item:', {
            title: item.title?.substring(0, 50),
            urgencyLevel: item.urgencyLevel,
            urgencyLevelType: typeof item.urgencyLevel,
            city: item.city,
            cityLength: item.city?.length,
            tags: item.tags,
            tagsType: typeof item.tags
          });

          const newsPost = await prisma.newsPost.create({
            data: {
              title: item.title,
              summary: item.summary,
              excerpt: item.excerpt,
              source: item.source,
              sourceUrl: item.sourceUrl,
              imageUrl: item.imageUrl,
              publishedAt: item.publishedAt,
              location: item.location,
              city: item.city,
              urgencyLevel: item.urgencyLevel,
              tags: item.tags,
            },
          });
          savedNews.push(newsPost);
        }
      } catch (error) {
        console.error('Error saving news item:', item.title?.substring(0, 50), error);
        // Continue with other items
      }
    }

    return NextResponse.json({
      message: `Successfully fetched and saved ${savedNews.length} news items`,
      count: savedNews.length,
      city: locationInfo.targetCity || 'General',
      items: savedNews,
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    let city = searchParams.get('city');

    // Get user's city if authenticated and no city specified
    if (!city && session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { city: true, location: true }
      });
      
      if (user) {
        const locationInfo = getUserLocationInfo(user);
        city = locationInfo.targetCity;
      }
    } else if (!city) {
      city = 'General';
    }

    // Get the latest news fetch timestamp for this city
    const latestNews = await prisma.newsPost.findFirst({
      where: { city },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const newsCount = await prisma.newsPost.count({
      where: { city },
    });

    return NextResponse.json({
      city,
      newsCount,
      lastFetch: latestNews?.createdAt || null,
      needsRefresh: !latestNews ||
        new Date().getTime() - latestNews.createdAt.getTime() > 60 * 60 * 1000, // 1 hour
    });
  } catch (error) {
    console.error('Error checking news status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}