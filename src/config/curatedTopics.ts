/**
 * Curated Topics List - Reddit-Style Categories
 * These are the ONLY topics that should be auto-assigned by AI
 * Users can still create custom topics via hashtags
 */

export interface CuratedTopic {
  name: string;
  displayName: string;
  description: string;
  category: 'entertainment' | 'lifestyle' | 'knowledge' | 'community' | 'creative';
  keywords: string[]; // Help AI classify posts into this topic
}

export const CURATED_TOPICS: CuratedTopic[] = [
  // Entertainment & Media
  {
    name: 'movies-tv',
    displayName: 'Movies & TV',
    description: 'Film, television, streaming shows, and entertainment industry',
    category: 'entertainment',
    keywords: ['movie', 'film', 'show', 'series', 'netflix', 'tv', 'cinema', 'actor', 'streaming', 'watched', 'episode', 'season']
  },
  {
    name: 'games',
    displayName: 'Games',
    description: 'Video games, gaming news, and game discussions',
    category: 'entertainment',
    keywords: ['game', 'gaming', 'play', 'console', 'pc', 'xbox', 'playstation', 'nintendo', 'esports', 'stream']
  },
  {
    name: 'music',
    displayName: 'Music',
    description: 'Music, artists, albums, concerts, and music industry',
    category: 'entertainment',
    keywords: ['music', 'song', 'album', 'artist', 'band', 'concert', 'spotify', 'lyrics', 'listen']
  },
  {
    name: 'sports',
    displayName: 'Sports',
    description: 'Sports news, games, teams, and athletics',
    category: 'entertainment',
    keywords: ['sport', 'game', 'team', 'player', 'match', 'score', 'win', 'championship', 'nfl', 'nba', 'mlb', 'soccer', 'football']
  },
  {
    name: 'anime',
    displayName: 'Anime',
    description: 'Anime, manga, and Japanese animation',
    category: 'entertainment',
    keywords: ['anime', 'manga', 'otaku', 'japan', 'crunchyroll']
  },

  // Lifestyle
  {
    name: 'food-drinks',
    displayName: 'Food & Drinks',
    description: 'Food, cooking, recipes, restaurants, and beverages',
    category: 'lifestyle',
    keywords: ['food', 'eat', 'cooking', 'recipe', 'restaurant', 'dinner', 'lunch', 'breakfast', 'chef', 'delicious', 'meal', 'drink', 'coffee', 'beer', 'wine']
  },
  {
    name: 'travel',
    displayName: 'Travel',
    description: 'Travel destinations, trips, and adventures',
    category: 'lifestyle',
    keywords: ['travel', 'trip', 'vacation', 'holiday', 'visit', 'destination', 'flight', 'hotel', 'tourist', 'explore']
  },
  {
    name: 'fashion-beauty',
    displayName: 'Fashion & Beauty',
    description: 'Fashion, style, beauty, and personal care',
    category: 'lifestyle',
    keywords: ['fashion', 'style', 'outfit', 'clothes', 'beauty', 'makeup', 'skincare', 'hair', 'clothing']
  },
  {
    name: 'health-fitness',
    displayName: 'Health & Fitness',
    description: 'Health, fitness, exercise, and wellness',
    category: 'lifestyle',
    keywords: ['health', 'fitness', 'workout', 'gym', 'exercise', 'diet', 'nutrition', 'wellness', 'doctor', 'medicine']
  },
  {
    name: 'home-garden',
    displayName: 'Home & Garden',
    description: 'Home improvement, gardening, and interior design',
    category: 'lifestyle',
    keywords: ['home', 'house', 'garden', 'plant', 'interior', 'design', 'diy', 'furniture', 'decor']
  },

  // Knowledge & Professional
  {
    name: 'technology',
    displayName: 'Technology',
    description: 'Tech news, gadgets, software, and innovation',
    category: 'knowledge',
    keywords: ['tech', 'technology', 'software', 'app', 'computer', 'phone', 'device', 'digital', 'ai', 'artificial intelligence', 'code', 'programming', 'developer']
  },
  {
    name: 'science',
    displayName: 'Science',
    description: 'Science, research, and scientific discoveries',
    category: 'knowledge',
    keywords: ['science', 'research', 'study', 'scientist', 'discovery', 'experiment', 'physics', 'chemistry', 'biology']
  },
  {
    name: 'education',
    displayName: 'Education & Career',
    description: 'Education, learning, career, and professional development',
    category: 'knowledge',
    keywords: ['education', 'school', 'college', 'university', 'learn', 'study', 'career', 'job', 'work', 'professional', 'degree', 'student']
  },
  {
    name: 'business',
    displayName: 'Business',
    description: 'Business, entrepreneurship, and economy',
    category: 'knowledge',
    keywords: ['business', 'company', 'startup', 'entrepreneur', 'economy', 'market', 'finance', 'money', 'investment']
  },

  // Community & Social
  {
    name: 'news-politics',
    displayName: 'News & Politics',
    description: 'Current events, news, and political discussions',
    category: 'community',
    keywords: ['news', 'politic', 'government', 'election', 'vote', 'policy', 'law', 'president', 'congress']
  },
  {
    name: 'community',
    displayName: 'Community',
    description: 'Local community, neighborhood, and civic discussions',
    category: 'community',
    keywords: ['community', 'local', 'neighborhood', 'city', 'town', 'civic', 'public']
  },
  {
    name: 'relationships',
    displayName: 'Relationships',
    description: 'Relationships, dating, family, and social life',
    category: 'community',
    keywords: ['relationship', 'dating', 'love', 'family', 'friend', 'marriage', 'partner', 'couple']
  },
  {
    name: 'qas',
    displayName: 'Q&As',
    description: 'Questions, answers, advice, and help',
    category: 'community',
    keywords: ['question', 'ask', 'help', 'advice', 'how', 'what', 'why', 'eli5', 'explain']
  },

  // Creative & Arts
  {
    name: 'arts',
    displayName: 'Arts',
    description: 'Art, artists, and creative works',
    category: 'creative',
    keywords: ['art', 'artist', 'paint', 'draw', 'creative', 'gallery', 'design']
  },
  {
    name: 'books',
    displayName: 'Books',
    description: 'Books, reading, and literature',
    category: 'creative',
    keywords: ['book', 'read', 'reading', 'novel', 'author', 'literature', 'story']
  },
  {
    name: 'photography',
    displayName: 'Photography',
    description: 'Photography, cameras, and photo sharing',
    category: 'creative',
    keywords: ['photo', 'photography', 'camera', 'picture', 'shot', 'lens']
  },

  // More Specific Topics
  {
    name: 'nature-outdoors',
    displayName: 'Nature & Outdoors',
    description: 'Nature, hiking, camping, and outdoor activities',
    category: 'lifestyle',
    keywords: ['nature', 'outdoor', 'hiking', 'camping', 'wildlife', 'environment', 'park', 'forest']
  },
  {
    name: 'pets-animals',
    displayName: 'Pets & Animals',
    description: 'Pets, animals, and wildlife',
    category: 'lifestyle',
    keywords: ['pet', 'dog', 'cat', 'animal', 'puppy', 'kitten']
  },
  {
    name: 'cars-vehicles',
    displayName: 'Cars & Vehicles',
    description: 'Cars, motorcycles, and vehicles',
    category: 'lifestyle',
    keywords: ['car', 'vehicle', 'drive', 'auto', 'motorcycle', 'truck']
  },
  {
    name: 'transportation',
    displayName: 'Transportation',
    description: 'Public transit, urban mobility, and infrastructure',
    category: 'community',
    keywords: ['transport', 'transit', 'bus', 'train', 'subway', 'bike', 'commute', 'traffic']
  },
  {
    name: 'housing',
    displayName: 'Housing',
    description: 'Housing, real estate, and urban development',
    category: 'community',
    keywords: ['housing', 'rent', 'apartment', 'house', 'real estate', 'homeless', 'affordable', 'development']
  },
  {
    name: 'pop-culture',
    displayName: 'Pop Culture',
    description: 'Memes, trends, viral content, and internet culture',
    category: 'entertainment',
    keywords: ['meme', 'viral', 'trend', 'popular', 'culture', 'internet']
  },

  // Catch-all
  {
    name: 'general',
    displayName: 'General',
    description: 'General discussions and miscellaneous topics',
    category: 'community',
    keywords: []
  }
];

// Export just topic names for quick lookup
export const CURATED_TOPIC_NAMES = CURATED_TOPICS.map(t => t.name);

// Helper to get topic display name
export function getTopicDisplayName(topicName: string): string {
  const topic = CURATED_TOPICS.find(t => t.name === topicName);
  return topic?.displayName || topicName;
}

// Helper to get topic by category
export function getTopicsByCategory(category: CuratedTopic['category']): CuratedTopic[] {
  return CURATED_TOPICS.filter(t => t.category === category);
}
