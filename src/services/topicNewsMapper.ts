import topicConfig from '@/config/topicKeywords.json';

interface TopicNewsMapping {
  newsKeywords: string[];
  civicKeywords: string[];
  excludeKeywords: string[];
}

export class TopicNewsMapper {
  private topicMappings: Map<string, TopicNewsMapping>;

  constructor() {
    this.topicMappings = new Map();
    this.initializeMappings();
  }

  private initializeMappings() {
    // Map each icon category to news-relevant keywords
    const iconCategories = topicConfig.iconCategories;

    Object.entries(iconCategories).forEach(([iconName, category]) => {
      const mapping: TopicNewsMapping = {
        newsKeywords: this.generateNewsKeywords(category),
        civicKeywords: this.generateCivicKeywords(category),
        excludeKeywords: this.generateExcludeKeywords(iconName)
      };

      this.topicMappings.set(iconName.toLowerCase(), mapping);
    });

    // Add custom mappings for common civic topics
    this.addCustomMappings();
  }

  private generateNewsKeywords(category: any): string[] {
    // Extract keywords that are relevant for news searches
    const keywords = [
      ...category.primary,
      ...category.secondary,
      ...category.context.map((ctx: string) => ctx.split(' ').slice(0, 2).join(' ')) // First 2 words of context
    ];

    // Filter out very generic terms
    const genericTerms = ['the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by'];
    return keywords.filter((keyword: string) =>
      keyword.length > 2 &&
      !genericTerms.includes(keyword.toLowerCase())
    );
  }

  private generateCivicKeywords(category: any): string[] {
    // Keywords that indicate civic engagement potential
    return [
      'policy', 'initiative', 'proposal', 'plan', 'project',
      'community', 'public', 'government', 'municipal', 'county', 'city',
      'funding', 'budget', 'development', 'improvement', 'program',
      'meeting', 'council', 'commission', 'board', 'committee',
      'residents', 'citizens', 'neighborhood', 'local'
    ];
  }

  private generateExcludeKeywords(iconName: string): string[] {
    // Keywords to exclude for better civic relevance
    const commonExcludes = [
      'murder', 'killing', 'death', 'died', 'fatal', 'crash', 'accident',
      'celebrity', 'entertainment', 'sports', 'game', 'movie', 'tv',
      'arrest', 'prison', 'jail', 'crime', 'robbery', 'theft',
      'weather', 'storm', 'hurricane', 'tornado', 'flood',
      'business earnings', 'stock', 'market', 'profit', 'loss'
    ];

    // Add specific excludes based on topic
    const specificExcludes: { [key: string]: string[] } = {
      'car': ['car accident', 'car crash', 'vehicle collision'],
      'hospital': ['patient death', 'medical emergency', 'injury'],
      'school': ['school shooting', 'student death', 'bullying incident']
    };

    return [
      ...commonExcludes,
      ...(specificExcludes[iconName.toLowerCase()] || [])
    ];
  }

  private addCustomMappings() {
    // Add high-relevance civic topics that might not be covered
    this.topicMappings.set('budget', {
      newsKeywords: ['budget', 'fiscal', 'spending', 'revenue', 'taxes', 'appropriation'],
      civicKeywords: ['municipal budget', 'public spending', 'tax policy', 'fiscal plan'],
      excludeKeywords: ['personal budget', 'household budget', 'business budget']
    });

    this.topicMappings.set('planning', {
      newsKeywords: ['planning', 'zoning', 'development', 'construction', 'permit'],
      civicKeywords: ['city planning', 'urban development', 'zoning board', 'planning commission'],
      excludeKeywords: ['wedding planning', 'vacation planning', 'business planning']
    });

    this.topicMappings.set('infrastructure', {
      newsKeywords: ['infrastructure', 'roads', 'bridges', 'utilities', 'maintenance'],
      civicKeywords: ['public works', 'infrastructure improvement', 'road repair', 'utility upgrade'],
      excludeKeywords: ['it infrastructure', 'cloud infrastructure', 'network infrastructure']
    });
  }

  // Map trending topics to news search keywords
  mapTopicsToNewsKeywords(trendingTopics: string[]): string[] {
    const allKeywords = new Set<string>();

    for (const topic of trendingTopics) {
      const normalizedTopic = topic.toLowerCase();

      // Direct mapping if exists
      const mapping = this.topicMappings.get(normalizedTopic);
      if (mapping) {
        mapping.newsKeywords.forEach(keyword => allKeywords.add(keyword));
        continue;
      }

      // Fuzzy matching for partial topic matches
      for (const [iconName, iconMapping] of this.topicMappings.entries()) {
        if (iconName.includes(normalizedTopic) || normalizedTopic.includes(iconName)) {
          iconMapping.newsKeywords.forEach(keyword => allKeywords.add(keyword));
        }
      }

      // If no mapping found, use the topic itself
      if (!mapping) {
        allKeywords.add(topic);
      }
    }

    return Array.from(allKeywords);
  }

  // Get civic engagement keywords to boost relevance
  getCivicKeywords(): string[] {
    const allCivicKeywords = new Set<string>();

    for (const mapping of this.topicMappings.values()) {
      mapping.civicKeywords.forEach(keyword => allCivicKeywords.add(keyword));
    }

    return Array.from(allCivicKeywords);
  }

  // Get exclude keywords to filter out irrelevant content
  getExcludeKeywords(topics: string[]): string[] {
    const allExcludeKeywords = new Set<string>();

    for (const topic of topics) {
      const mapping = this.topicMappings.get(topic.toLowerCase());
      if (mapping) {
        mapping.excludeKeywords.forEach(keyword => allExcludeKeywords.add(keyword));
      }
    }

    return Array.from(allExcludeKeywords);
  }

  // Score news article relevance for civic engagement
  scoreArticleRelevance(title: string, description: string, topics: string[], location: string): number {
    const text = `${title} ${description}`.toLowerCase();
    let score = 0;

    // Bonus for location keywords
    if (text.includes(location.toLowerCase())) {
      score += 5;
    }

    // Positive scoring for civic keywords
    const civicKeywords = this.getCivicKeywords();
    for (const keyword of civicKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }

    // Positive scoring for topic-related keywords
    const topicKeywords = this.mapTopicsToNewsKeywords(topics);
    for (const keyword of topicKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 4; // Increased score
      }
    }

    // Negative scoring for exclude keywords
    const excludeKeywords = this.getExcludeKeywords(topics);
    for (const keyword of excludeKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        score -= 5;
      }
    }

    // Bonus for policy/action words
    const actionWords = ['proposal', 'plan', 'initiative', 'project', 'program', 'meeting', 'vote', 'approval'];
    for (const word of actionWords) {
      if (text.includes(word)) {
        score += 4;
      }
    }

    return Math.max(0, score); // Don't return negative scores
  }

  // Build optimized news query from trending topics
  buildNewsQuery(location: string, topics: string[], limit: number = 20): {
    query: string;
    excludeQuery: string;
  } {
    const topicKeywords = this.mapTopicsToNewsKeywords(topics);
    const civicKeywords = this.getCivicKeywords();
    const excludeKeywords = this.getExcludeKeywords(topics);

    // Adjust keyword limits for a more comprehensive search
    const maxTopicKeywords = 10;
    const maxCivicKeywords = 5;
    const maxExcludeKeywords = 5;

    const selectedTopicKeywords = topicKeywords.slice(0, maxTopicKeywords);
    const selectedCivicKeywords = civicKeywords.slice(0, maxCivicKeywords);
    const selectedExcludeKeywords = excludeKeywords.slice(0, maxExcludeKeywords);

    // Build a more flexible main query
    let query = `${location} AND (`;
    const allKeywords = [...new Set([...selectedTopicKeywords, ...selectedCivicKeywords])];
    
    if (allKeywords.length > 0) {
      query += allKeywords.join(' OR ');
    } else {
      // Fallback to broad location-based search if no keywords
      query += 'local OR community OR public';
    }
    query += ')';

    // Build a more targeted exclude query
    const excludeQuery = selectedExcludeKeywords.length > 0
      ? `NOT (${selectedExcludeKeywords.join(' OR ')})`
      : '';

    return { query, excludeQuery };
  }
}

// Create singleton instance
let mapperInstance: TopicNewsMapper | null = null;

export function getTopicNewsMapper(): TopicNewsMapper {
  if (!mapperInstance) {
    mapperInstance = new TopicNewsMapper();
  }
  return mapperInstance;
}