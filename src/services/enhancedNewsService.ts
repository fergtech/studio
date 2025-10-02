/**
 * Enhanced Multi-Tier News Service
 *
 * Features:
 * - Hyper-local news using Google News RSS
 * - Multi-tier location strategy (local -> regional -> national -> global)
 * - Smart query generation using nearby areas
 * - Intelligent deduplication and relevance scoring
 * - Civic engagement focus
 */

import Parser from 'rss-parser';
import { ResolvedLocation, findNearbyAreas } from './location';

// Initialize RSS parser
const rssParser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['description', 'description'],
    ]
  }
});

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  publishedAt: string;
  location?: string;
  city?: string;
  tier: 'hyper-local' | 'regional' | 'national' | 'global';
  relevanceScore: number;
  urgencyLevel: number;
  tags: string[];
  type: 'live-news';
}

interface NewsTier {
  tier: 'hyper-local' | 'regional' | 'national' | 'global';
  queries: string[];
  weight: number; // Higher weight = more articles from this tier
}

/**
 * Generate smart search queries based on user location
 */
export async function generateLocationQueries(
  location: ResolvedLocation
): Promise<NewsTier[]> {
  const tiers: NewsTier[] = [];

  // Tier 1: Hyper-Local (City/County + nearby areas)
  const hyperLocalQueries: string[] = [];

  if (location.city) {
    hyperLocalQueries.push(location.city);
  }
  if (location.county && location.county !== location.city) {
    hyperLocalQueries.push(location.county);
  }

  // Add nearby areas for better coverage
  try {
    const nearbyAreas = await findNearbyAreas(location.coordinates, 25);
    const nearbyNames = nearbyAreas
      .slice(0, 5) // Top 5 nearby areas
      .map(area => area.city || area.county)
      .filter((name): name is string => !!name);

    hyperLocalQueries.push(...nearbyNames);
  } catch (error) {
    console.log('Could not fetch nearby areas:', error);
  }

  if (hyperLocalQueries.length > 0) {
    tiers.push({
      tier: 'hyper-local',
      queries: hyperLocalQueries.slice(0, 8), // Limit to 8 locations max
      weight: 60 // 60% of articles should be hyper-local
    });
  }

  // Tier 2: Regional (State/Province)
  if (location.state) {
    tiers.push({
      tier: 'regional',
      queries: [location.state],
      weight: 20 // 20% regional
    });
  }

  // Tier 3: National (Country)
  if (location.country) {
    tiers.push({
      tier: 'national',
      queries: [location.country],
      weight: 15 // 15% national
    });
  }

  // Tier 4: Global (World news)
  tiers.push({
    tier: 'global',
    queries: ['world news', 'international'],
    weight: 5 // 5% global
  });

  return tiers;
}

/**
 * Build Google News RSS URL with smart query
 */
function buildGoogleNewsRssUrl(
  query: string,
  options: {
    when?: '1d' | '7d' | '30d';
    language?: string;
    country?: string;
  } = {}
): string {
  const { when = '7d', language = 'en', country = 'US' } = options;

  const baseUrl = 'https://news.google.com/rss/search';
  const params = new URLSearchParams({
    q: query,
    hl: `${language}-${country}`,
    gl: country,
    ceid: `${country}:${language}`,
  });

  // Add time filter if specified
  if (when) {
    params.set('q', `${query} when:${when}`);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Fetch news from Google News RSS
 */
async function fetchGoogleNews(
  query: string,
  tier: NewsTier['tier'],
  location: ResolvedLocation
): Promise<NewsArticle[]> {
  try {
    const url = buildGoogleNewsRssUrl(query, { when: '7d' });
    console.log(`📰 Fetching ${tier} news: ${query}`);

    const feed = await rssParser.parseURL(url);

    if (!feed.items || feed.items.length === 0) {
      return [];
    }

    return feed.items
      .filter(item => item.title && item.link)
      .map((item, index) => {
        const publishedAt = item.pubDate || new Date().toISOString();
        const summary = item.contentSnippet || item.description || item.title || '';
        const title = item.title || 'Untitled';

        return {
          id: `google-news-${tier}-${Date.now()}-${index}`,
          title,
          summary: summary.substring(0, 500), // Limit summary length
          source: item.creator || extractSource(item.link || '') || 'Google News',
          sourceUrl: item.link || '',
          imageUrl: extractImageUrl(item),
          publishedAt,
          location: formatLocationString(location, tier),
          city: location.city || location.county || 'General',
          tier,
          relevanceScore: 0, // Will be calculated later
          urgencyLevel: determineUrgencyLevel(title, summary),
          tags: extractTags(title, summary),
          type: 'live-news'
        };
      });

  } catch (error) {
    console.error(`❌ Error fetching ${tier} news for "${query}":`, error);
    return [];
  }
}

/**
 * Extract source name from URL
 */
function extractSource(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Remove 'www.' and extract main domain
    return hostname
      .replace(/^www\./, '')
      .split('.')[0]
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  } catch {
    return null;
  }
}

/**
 * Extract image URL from RSS item
 */
function extractImageUrl(item: any): string | undefined {
  // Try various possible image fields
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  if (item.media && item.media.$ && item.media.$.url) {
    return item.media.$.url;
  }
  if (item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
    return item['media:content'].$.url;
  }
  return undefined;
}

/**
 * Format location string based on tier
 */
function formatLocationString(location: ResolvedLocation, tier: NewsTier['tier']): string {
  switch (tier) {
    case 'hyper-local':
      return location.city || location.county || location.displayName;
    case 'regional':
      return location.state || location.country || 'Regional';
    case 'national':
      return location.country || 'National';
    case 'global':
      return 'Global';
    default:
      return location.displayName;
  }
}

/**
 * Determine urgency level based on keywords
 */
function determineUrgencyLevel(title: string, summary: string): number {
  const text = (title + ' ' + summary).toLowerCase();

  const highUrgencyKeywords = [
    'breaking', 'urgent', 'emergency', 'crisis', 'disaster', 'evacuation',
    'shooting', 'fire', 'major', 'severe', 'critical'
  ];

  const mediumUrgencyKeywords = [
    'alert', 'warning', 'important', 'significant', 'closes', 'closed',
    'postponed', 'canceled', 'investigation', 'develops', 'update'
  ];

  if (highUrgencyKeywords.some(keyword => text.includes(keyword))) {
    return 3; // Breaking
  } else if (mediumUrgencyKeywords.some(keyword => text.includes(keyword))) {
    return 2; // Important
  }
  return 1; // Normal
}

/**
 * Extract relevant tags from content
 */
function extractTags(title: string, summary: string): string[] {
  const text = (title + ' ' + summary).toLowerCase();
  const tags: string[] = [];

  const categoryMap: Record<string, string[]> = {
    'local': ['city', 'county', 'neighborhood', 'community', 'local', 'town'],
    'government': ['city council', 'mayor', 'government', 'politics', 'election', 'vote', 'policy', 'legislation'],
    'education': ['school', 'university', 'education', 'student', 'teacher', 'college', 'district'],
    'health': ['hospital', 'health', 'medical', 'doctor', 'patient', 'covid', 'pandemic', 'clinic'],
    'transportation': ['road', 'highway', 'bridge', 'transit', 'traffic', 'construction', 'transportation'],
    'environment': ['environment', 'water', 'air quality', 'pollution', 'climate', 'park', 'wildlife'],
    'crime': ['police', 'crime', 'arrest', 'investigation', 'theft', 'robbery', 'law enforcement'],
    'business': ['business', 'economy', 'jobs', 'employment', 'company', 'economic', 'development'],
    'events': ['event', 'festival', 'concert', 'celebration', 'parade', 'gathering'],
    'housing': ['housing', 'rent', 'apartment', 'development', 'construction', 'zoning', 'building'],
  };

  Object.entries(categoryMap).forEach(([category, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      tags.push(category);
    }
  });

  // Always include 'news' tag
  tags.push('news');

  return Array.from(new Set(tags)); // Deduplicate
}

/**
 * Calculate relevance score for civic engagement
 */
function calculateRelevanceScore(
  article: NewsArticle,
  location: ResolvedLocation,
  tier: NewsTier['tier']
): number {
  const text = `${article.title} ${article.summary}`.toLowerCase();
  let score = 0;

  // Tier-based base score
  const tierScores = {
    'hyper-local': 50,
    'regional': 30,
    'national': 15,
    'global': 5
  };
  score += tierScores[tier];

  // Location mention bonus
  const locationTerms = [
    location.city,
    location.county,
    location.state
  ].filter((term): term is string => !!term);

  for (const term of locationTerms) {
    if (text.includes(term.toLowerCase())) {
      score += 15;
      break; // Only count once
    }
  }

  // Civic engagement keywords
  const civicKeywords = [
    'proposal', 'plan', 'initiative', 'project', 'program', 'meeting',
    'vote', 'approval', 'public comment', 'hearing', 'community',
    'residents', 'citizens', 'town hall', 'petition', 'reform'
  ];

  let civicMatches = 0;
  for (const keyword of civicKeywords) {
    if (text.includes(keyword)) {
      civicMatches++;
    }
  }
  score += civicMatches * 5;

  // Recency bonus (prefer articles from last 24 hours)
  const publishedDate = new Date(article.publishedAt);
  const hoursOld = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);

  if (hoursOld < 24) {
    score += 10;
  } else if (hoursOld < 72) {
    score += 5;
  }

  // Urgency bonus
  score += article.urgencyLevel * 5;

  // Tag diversity bonus
  score += Math.min(article.tags.length * 2, 10);

  return Math.max(0, score);
}

/**
 * Deduplicate articles using similarity scoring
 */
function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const seenTitles = new Set<string>();
  const uniqueArticles: NewsArticle[] = [];

  // Sort by relevance score first (keep highest scoring duplicates)
  const sortedArticles = [...articles].sort((a, b) => b.relevanceScore - a.relevanceScore);

  for (const article of sortedArticles) {
    const normalizedTitle = article.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Check similarity with existing titles
    let isDuplicate = false;
    for (const seenTitle of seenTitles) {
      const similarity = calculateSimilarity(normalizedTitle, seenTitle);
      if (similarity > 0.75) { // 75% similarity threshold
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seenTitles.add(normalizedTitle);
      uniqueArticles.push(article);
    }
  }

  return uniqueArticles;
}

/**
 * Calculate Jaccard similarity between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(' '));
  const words2 = new Set(str2.split(' '));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Main function: Fetch multi-tier news for a location
 */
export async function fetchMultiTierNews(
  location: ResolvedLocation,
  totalArticles: number = 20
): Promise<NewsArticle[]> {
  console.log('🗞️ Fetching multi-tier news for:', location.displayName);

  // Generate location-based queries
  const tiers = await generateLocationQueries(location);
  console.log('📊 News tiers:', tiers.map(t => `${t.tier} (${t.weight}%)`).join(', '));

  // Calculate how many articles to fetch from each tier
  const tierTargets = tiers.map(tier => ({
    ...tier,
    targetCount: Math.ceil((tier.weight / 100) * totalArticles * 1.5) // Fetch 1.5x for deduplication
  }));

  // Fetch news from all tiers in parallel
  const allArticles: NewsArticle[] = [];

  for (const tierTarget of tierTargets) {
    // Distribute articles across queries in this tier
    const articlesPerQuery = Math.ceil(tierTarget.targetCount / tierTarget.queries.length);

    const tierArticles = await Promise.all(
      tierTarget.queries.map(query =>
        fetchGoogleNews(query, tierTarget.tier, location)
      )
    );

    // Flatten and limit
    const flattenedTierArticles = tierArticles
      .flat()
      .slice(0, tierTarget.targetCount);

    allArticles.push(...flattenedTierArticles);
  }

  console.log(`📰 Fetched ${allArticles.length} total articles before deduplication`);

  // Calculate relevance scores
  allArticles.forEach(article => {
    article.relevanceScore = calculateRelevanceScore(article, location, article.tier);
  });

  // Deduplicate
  const uniqueArticles = deduplicateArticles(allArticles);
  console.log(`✨ ${uniqueArticles.length} unique articles after deduplication`);

  // Sort by relevance score and limit to target
  const finalArticles = uniqueArticles
    .sort((a, b) => {
      // Sort by urgency first, then relevance, then recency
      if (a.urgencyLevel !== b.urgencyLevel) {
        return b.urgencyLevel - a.urgencyLevel;
      }
      if (Math.abs(a.relevanceScore - b.relevanceScore) > 5) {
        return b.relevanceScore - a.relevanceScore;
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, totalArticles);

  console.log('✅ Returning', finalArticles.length, 'top articles');
  console.log('📊 Distribution:', {
    'hyper-local': finalArticles.filter(a => a.tier === 'hyper-local').length,
    'regional': finalArticles.filter(a => a.tier === 'regional').length,
    'national': finalArticles.filter(a => a.tier === 'national').length,
    'global': finalArticles.filter(a => a.tier === 'global').length,
  });

  return finalArticles;
}

/**
 * Fetch only hyper-local news (for widget)
 */
export async function fetchHyperLocalNews(
  location: ResolvedLocation,
  limit: number = 10
): Promise<NewsArticle[]> {
  console.log('🏘️ Fetching hyper-local news for:', location.displayName);

  const queries: string[] = [];

  if (location.city) queries.push(location.city);
  if (location.county && location.county !== location.city) {
    queries.push(location.county);
  }

  // Add nearby areas
  try {
    const nearbyAreas = await findNearbyAreas(location.coordinates, 15);
    const nearbyNames = nearbyAreas
      .slice(0, 3)
      .map(area => area.city || area.county)
      .filter((name): name is string => !!name);

    queries.push(...nearbyNames);
  } catch (error) {
    console.log('Could not fetch nearby areas');
  }

  const allArticles: NewsArticle[] = [];

  for (const query of queries.slice(0, 5)) {
    const articles = await fetchGoogleNews(query, 'hyper-local', location);
    allArticles.push(...articles);
  }

  // Calculate relevance and deduplicate
  allArticles.forEach(article => {
    article.relevanceScore = calculateRelevanceScore(article, location, 'hyper-local');
  });

  const uniqueArticles = deduplicateArticles(allArticles);

  return uniqueArticles
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}
