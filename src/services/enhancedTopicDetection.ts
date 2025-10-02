// Enhanced NLP-based topic detection system
// Uses semantic analysis, entity recognition, and dynamic topic generation

export interface EnhancedTopicResult {
  topics: string[];
  confidence: number;
  entities: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  categories: string[];
  dynamicTopics: string[];
}

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

// Extract key nouns and topics from text
function extractKeyTopics(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2); // Filter short words

  // Simple frequency analysis
  const wordFreq: { [key: string]: number } = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Get most frequent meaningful words
  return Object.entries(wordFreq)
    .filter(([word, freq]) => freq >= 1 && !isStopWord(word))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
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

// Main enhanced topic detection function
export function detectTopicsEnhanced(content: string): EnhancedTopicResult {
  console.log('🧠 Enhanced NLP topic detection for:', content.substring(0, 100) + '...');

  const contentLower = content.toLowerCase();
  const detectedTopics: string[] = [];
  const confidenceScores: number[] = [];

  // 1. Pattern-based detection
  for (const [category, patterns] of Object.entries(SEMANTIC_PATTERNS)) {
    let score = 0;

    // Check keywords
    const keywordMatches = patterns.keywords.filter(keyword =>
      contentLower.includes(keyword.toLowerCase())
    ).length;
    score += keywordMatches * 3;

    // Check phrases
    const phraseMatches = patterns.phrases.filter(phrase =>
      contentLower.includes(phrase.toLowerCase())
    ).length;
    score += phraseMatches * 5;

    // Check entities
    const entityMatches = patterns.entities.filter(entity =>
      contentLower.includes(entity.toLowerCase())
    ).length;
    score += entityMatches * 4;

    if (score > 0) {
      detectedTopics.push(category);
      confidenceScores.push(Math.min(0.95, score / content.length * 100));
    }
  }

  // 2. Extract entities
  const entities = extractEntities(content);

  // 3. Analyze sentiment
  const sentiment = analyzeSentiment(content);

  // 4. Extract dynamic topics from content
  const dynamicTopics = extractKeyTopics(content);

  // 5. Combine results
  const finalTopics = detectedTopics.length > 0 ? detectedTopics : dynamicTopics.slice(0, 3);
  const finalConfidence = confidenceScores.length > 0
    ? Math.max(...confidenceScores)
    : (dynamicTopics.length > 0 ? 0.6 : 0.1);

  const result: EnhancedTopicResult = {
    topics: finalTopics.slice(0, 5),
    confidence: finalConfidence,
    entities: entities.slice(0, 10),
    sentiment,
    categories: detectedTopics,
    dynamicTopics: dynamicTopics.slice(0, 5)
  };

  console.log('🎯 Enhanced detection result:', result);
  return result;
}