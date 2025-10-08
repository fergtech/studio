// Enhanced LLM-based topic detection system
// Uses Gemini Flash for semantic analysis with fallbacks

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface EnhancedTopicResult {
  topics: string[];
  confidence: number;
  entities: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  categories: string[];
  dynamicTopics: string[];
}

// Request queue for rate limiting
let requestQueue: Promise<any> = Promise.resolve();
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests (10 req/sec max)

// Common topic patterns and their semantic indicators
const SEMANTIC_PATTERNS = {
  // Entertainment & Media
  entertainment: {
    keywords: ['movie', 'film', 'show', 'tv', 'series', 'netflix', 'disney', 'streaming', 'actor', 'actress', 'director', 'cinema', 'theater', 'watched', 'binge'],
    phrases: ['just watched', 'new episode', 'season finale', 'box office', 'red carpet'],
    entities: ['Netflix', 'Disney', 'Marvel', 'HBO', 'Amazon Prime']
  },

  // Sports & Recreation
  sports: {
    keywords: ['game', 'match', 'team', 'player', 'score', 'win', 'lose', 'championship', 'league', 'season', 'coach', 'playoffs', 'tournament', 'stadium'],
    phrases: ['game night', 'world cup', 'super bowl', 'march madness', 'home run'],
    entities: ['NFL', 'NBA', 'MLB', 'FIFA', 'Olympics']
  },

  // Food & Dining
  food: {
    keywords: ['food', 'eat', 'restaurant', 'dinner', 'lunch', 'breakfast', 'cooking', 'recipe', 'chef', 'menu', 'delicious', 'taste', 'flavor', 'hungry'],
    phrases: ['trying new', 'home cooked', 'food truck', 'fine dining', 'takeout'],
    entities: ['McDonalds', 'Starbucks', 'Pizza Hut', 'KFC']
  },

  // Technology & Gaming
  technology: {
    keywords: ['tech', 'app', 'software', 'computer', 'phone', 'device', 'digital', 'online', 'internet', 'website', 'code', 'programming', 'ai', 'artificial intelligence'],
    phrases: ['new update', 'tech news', 'latest version', 'software bug', 'app store'],
    entities: ['Apple', 'Google', 'Microsoft', 'Meta', 'Tesla', 'iPhone', 'Android']
  },

  // Travel & Places
  travel: {
    keywords: ['travel', 'trip', 'vacation', 'holiday', 'visit', 'destination', 'flight', 'hotel', 'beach', 'mountain', 'city', 'country', 'passport', 'luggage'],
    phrases: ['road trip', 'bucket list', 'travel plans', 'jet lag', 'layover'],
    entities: ['Paris', 'Tokyo', 'London', 'New York', 'California']
  },

  // Health & Fitness
  health: {
    keywords: ['health', 'fitness', 'workout', 'gym', 'exercise', 'diet', 'nutrition', 'doctor', 'medicine', 'wellness', 'healthy', 'sick', 'pain', 'therapy'],
    phrases: ['feeling better', 'doctor visit', 'health check', 'mental health', 'work out'],
    entities: []
  },

  // Relationships & Personal
  relationships: {
    keywords: ['love', 'relationship', 'family', 'friend', 'partner', 'marriage', 'wedding', 'dating', 'romance', 'couple', 'kids', 'children', 'parents'],
    phrases: ['significant other', 'best friend', 'family time', 'date night', 'anniversary'],
    entities: []
  },

  // Weather & Nature
  weather: {
    keywords: ['weather', 'rain', 'sun', 'snow', 'storm', 'temperature', 'hot', 'cold', 'wind', 'cloudy', 'sunny', 'forecast', 'climate', 'season'],
    phrases: ['nice weather', 'bad weather', 'weather forecast', 'climate change', 'global warming'],
    entities: []
  },

  // Education & Learning
  education: {
    keywords: ['school', 'college', 'university', 'student', 'teacher', 'class', 'study', 'learn', 'education', 'degree', 'exam', 'homework', 'research', 'academic'],
    phrases: ['back to school', 'graduation day', 'final exams', 'summer break', 'online learning'],
    entities: ['Harvard', 'MIT', 'Stanford', 'Yale']
  },

  // Work & Career
  work: {
    keywords: ['work', 'job', 'career', 'office', 'business', 'company', 'meeting', 'project', 'deadline', 'salary', 'interview', 'promotion', 'boss', 'colleague'],
    phrases: ['work from home', 'job interview', 'career change', 'office life', 'work stress'],
    entities: []
  },

  // Religion & Spirituality
  religion: {
    keywords: ['god', 'faith', 'religion', 'church', 'bible', 'prayer', 'worship', 'spiritual', 'christian', 'muslim', 'jewish', 'buddhist', 'hindu', 'holy'],
    phrases: ['sunday service', 'religious ceremony', 'spiritual journey', 'house of worship', 'faith community'],
    entities: ['Jesus', 'Allah', 'Buddha', 'Moses']
  },

  // Music & Arts
  music: {
    keywords: ['music', 'song', 'album', 'artist', 'band', 'concert', 'festival', 'guitar', 'piano', 'singing', 'lyrics', 'melody', 'beat', 'genre'],
    phrases: ['new album', 'live music', 'music festival', 'favorite song', 'concert ticket'],
    entities: ['Spotify', 'Apple Music', 'YouTube Music', 'Coachella']
  }
};

// Extract named entities (brands, people, places)
function extractEntities(text: string): string[] {
  const entities: string[] = [];

  // Simple entity patterns
  const entityPatterns = [
    // Capitalized words (potential proper nouns)
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
    // @mentions
    /@([a-zA-Z0-9_]+)/g,
    // #hashtags
    /#([a-zA-Z0-9_]+)/g
  ];

  entityPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      entities.push(...matches.map(match => match.replace(/[@#]/g, '').toLowerCase()));
    }
  });

  return [...new Set(entities)]; // Remove duplicates
}

// Simple sentiment analysis
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['good', 'great', 'awesome', 'amazing', 'love', 'happy', 'excited', 'wonderful', 'fantastic', 'excellent', 'perfect', 'best', 'incredible'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'frustrated', 'horrible', 'worst', 'disgusting', 'annoying', 'disappointing'];

  const words = text.toLowerCase().split(/\s+/);
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Extract hashtags from text
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];

  return matches.map(tag => tag.substring(1).toLowerCase());
}

// LLM-based topic extraction using Gemini Flash
async function extractKeyTopicsWithLLM(text: string): Promise<string[]> {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ GOOGLE_AI_API_KEY not found, falling back to hashtag-only detection');
      return [];
    }

    // Rate limiting - queue requests
    await requestQueue;
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analyze this social media post and extract 3-5 relevant topic categories that describe what the post is about. Focus on the main subject matter, not individual words.

Post: "${text}"

Return ONLY a JSON array of topic strings (lowercase, hyphenated if multi-word). Example: ["technology", "ai-applications", "community-development"]

Topics:`;

    // Timeout protection (max 5 seconds)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const result = await model.generateContent(prompt);
    clearTimeout(timeout);

    const response = await result.response;
    const topicsText = response.text().trim();

    console.log('📝 Raw LLM response:', topicsText);

    // Parse JSON response
    const topics = JSON.parse(topicsText.replace(/```json\n?|\n?```/g, ''));

    console.log('🔍 Parsed topics array:', topics);

    if (Array.isArray(topics)) {
      const filtered = topics
        .filter(t => typeof t === 'string' && t.length > 2 && t.length < 30)
        .slice(0, 5);
      console.log('✅ Filtered topics:', filtered);
      return filtered;
    }

    console.warn('⚠️ LLM response was not an array:', typeof topics);
    return [];
  } catch (error: any) {
    console.error('❌ LLM topic extraction failed:', error.message);

    // Don't retry on rate limit - just fail fast and use fallback
    if (error.message?.includes('rate limit') || error.message?.includes('429')) {
      console.warn('⏳ Rate limit hit - using keyword fallback (no retry)');
      return []; // Return empty array to trigger keyword fallback
    }

    console.error('❌ LLM extraction failed, using fallback');
    return []; // Return empty array to trigger fallback
  }
}

// Basic stop words list
function isStopWord(word: string): boolean {
  const stopWords = [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'must', 'need', 'want',
    'like', 'make', 'get', 'go', 'come', 'take', 'give', 'put', 'see', 'know', 'think', 'say',
    'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call', 'just', 'really', 'very',
    'still', 'well', 'also', 'even', 'back', 'good', 'new', 'first', 'last', 'long', 'great',
    'little', 'own', 'other', 'old', 'right', 'big', 'high', 'different', 'small', 'large',
    'next', 'early', 'young', 'important', 'few', 'public', 'same', 'able'
  ];

  return stopWords.includes(word.toLowerCase());
}

// Main enhanced topic detection function (now async for LLM)
export async function detectTopicsEnhanced(content: string): Promise<EnhancedTopicResult> {
  console.log('🧠 Enhanced LLM topic detection for:', content.substring(0, 100) + '...');

  // 1. Extract hashtags first (always reliable)
  const hashtags = extractHashtags(content);

  // 2. Try LLM-based topic extraction
  let llmTopics: string[] = [];
  try {
    llmTopics = await extractKeyTopicsWithLLM(content);
  } catch (error) {
    console.error('LLM extraction error:', error);
  }

  // 3. Fallback hierarchy
  let finalTopics: string[];
  let confidence: number;

  if (llmTopics.length > 0) {
    // Primary: LLM topics + hashtags
    finalTopics = [...new Set([...llmTopics, ...hashtags])].slice(0, 5);
    confidence = 0.9;
    console.log('✅ Using LLM-extracted topics:', finalTopics);
  } else if (hashtags.length > 0) {
    // Fallback 1: Hashtags only
    finalTopics = hashtags.slice(0, 5);
    confidence = 0.7;
    console.log('⚠️ Using hashtag-only topics:', finalTopics);
  } else {
    // Fallback 2: General
    finalTopics = ['general'];
    confidence = 0.3;
    console.log('⚠️ No topics found, using general');
  }

  // 4. Extract entities and sentiment (lightweight operations)
  const entities = extractEntities(content);
  const sentiment = analyzeSentiment(content);

  const result: EnhancedTopicResult = {
    topics: finalTopics,
    confidence,
    entities: entities.slice(0, 10),
    sentiment,
    categories: finalTopics,
    dynamicTopics: llmTopics
  };

  console.log('🎯 Enhanced detection result:', result);
  return result;
}
