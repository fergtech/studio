interface KeywordCategory {
  primary: string[];
  secondary: string[];
  context: string[];
}

interface MatchResult {
  iconName: string;
  score: number;
  confidence: number;
  matches: {
    primary: string[];
    secondary: string[];
    context: string[];
    phrases: string[];
  };
}

export class KeywordMatcher {
  private categories: Record<string, KeywordCategory>;
  private categoryNames: string[];

  constructor(categories: Record<string, KeywordCategory>) {
    this.categories = categories;
    this.categoryNames = Object.keys(categories);
  }

  findBestMatch(
    tokens: string[],
    ngrams: string[],
    stemmed: string[],
    keyPhrases: string[]
  ): MatchResult {
    const categoryScores: Record<string, MatchResult> = {};

    // Calculate scores for each category
    for (const categoryName of this.categoryNames) {
      const category = this.categories[categoryName];
      const result = this.calculateCategoryScore(
        categoryName,
        category,
        tokens,
        ngrams,
        stemmed,
        keyPhrases
      );
      categoryScores[categoryName] = result;
    }

    // Find the best matching category
    const bestCategory = Object.values(categoryScores).reduce((best, current) =>
      current.score > best.score ? current : best
    );

    // Calculate confidence based on score distribution
    const scores = Object.values(categoryScores).map(r => r.score);
    const maxScore = Math.max(...scores);
    const secondMaxScore = scores.sort((a, b) => b - a)[1] || 0;

    // Confidence is higher when there's a clear winner
    const scoreDifference = maxScore - secondMaxScore;
    const normalizedConfidence = Math.min(maxScore * (1 + scoreDifference), 1);

    return {
      ...bestCategory,
      confidence: normalizedConfidence
    };
  }

  private calculateCategoryScore(
    categoryName: string,
    category: KeywordCategory,
    tokens: string[],
    ngrams: string[],
    stemmed: string[],
    keyPhrases: string[]
  ): MatchResult {
    const matches = {
      primary: [] as string[],
      secondary: [] as string[],
      context: [] as string[],
      phrases: [] as string[]
    };

    let score = 0;

    // Check primary keywords (highest weight)
    const primaryMatches = this.findMatches(category.primary, tokens, stemmed, ngrams);
    matches.primary = primaryMatches;
    score += primaryMatches.length * 3.0;

    // Check secondary keywords (medium weight)
    const secondaryMatches = this.findMatches(category.secondary, tokens, stemmed, ngrams);
    matches.secondary = secondaryMatches;
    score += secondaryMatches.length * 1.5;

    // Check context phrases (medium weight, bonus for exact matches)
    const contextMatches = this.findContextMatches(category.context, ngrams, keyPhrases);
    matches.context = contextMatches;
    score += contextMatches.length * 2.0;

    // Check key phrases extracted from text (bonus for multi-word matches)
    const phraseMatches = this.findPhraseMatches(category, keyPhrases);
    matches.phrases = phraseMatches;
    score += phraseMatches.length * 2.5;

    // Apply frequency bonus for multiple matches of the same type
    if (primaryMatches.length > 1) score += primaryMatches.length * 0.5;
    if (secondaryMatches.length > 1) score += secondaryMatches.length * 0.3;

    // Apply length normalization (avoid bias toward longer texts)
    const textLength = tokens.length;
    const normalizedScore = textLength > 0 ? score / Math.log(textLength + 1) : score;

    return {
      iconName: categoryName,
      score: normalizedScore,
      confidence: 0, // Will be calculated later
      matches
    };
  }

  private findMatches(keywords: string[], tokens: string[], stemmed: string[], ngrams: string[]): string[] {
    const matches: string[] = [];
    const allTerms = [...tokens, ...stemmed, ...ngrams];

    for (const keyword of keywords) {
      // Check for exact matches
      if (tokens.includes(keyword)) {
        matches.push(keyword);
        continue;
      }

      // Check for stemmed matches
      if (stemmed.includes(keyword)) {
        matches.push(keyword);
        continue;
      }

      // Check for partial matches in ngrams
      const ngramMatches = ngrams.filter(ngram =>
        ngram.includes(keyword) || keyword.includes(ngram)
      );
      if (ngramMatches.length > 0) {
        matches.push(keyword);
      }
    }

    return [...new Set(matches)]; // Remove duplicates
  }

  private findContextMatches(contextPhrases: string[], ngrams: string[], keyPhrases: string[]): string[] {
    const matches: string[] = [];
    const allPhrases = [...ngrams, ...keyPhrases];

    for (const contextPhrase of contextPhrases) {
      const phraseWords = contextPhrase.toLowerCase().split(/\s+/);

      // Check for exact phrase matches
      if (allPhrases.some(phrase => phrase.includes(contextPhrase))) {
        matches.push(contextPhrase);
        continue;
      }

      // Check for partial phrase matches (at least 50% of words)
      const partialMatches = allPhrases.filter(phrase => {
        const matchingWords = phraseWords.filter(word => phrase.includes(word));
        return matchingWords.length >= Math.ceil(phraseWords.length * 0.5);
      });

      if (partialMatches.length > 0) {
        matches.push(contextPhrase);
      }
    }

    return [...new Set(matches)];
  }

  private findPhraseMatches(category: KeywordCategory, keyPhrases: string[]): string[] {
    const matches: string[] = [];
    const allKeywords = [...category.primary, ...category.secondary];

    for (const phrase of keyPhrases) {
      // Check if the phrase contains category keywords
      const containsKeywords = allKeywords.some(keyword =>
        phrase.includes(keyword) || keyword.includes(phrase)
      );

      if (containsKeywords) {
        matches.push(phrase);
      }
    }

    return matches;
  }

  // Get detailed match explanation for debugging
  getMatchDetails(result: MatchResult): string {
    const details = [];

    if (result.matches.primary.length > 0) {
      details.push(`Primary: ${result.matches.primary.join(', ')}`);
    }
    if (result.matches.secondary.length > 0) {
      details.push(`Secondary: ${result.matches.secondary.join(', ')}`);
    }
    if (result.matches.context.length > 0) {
      details.push(`Context: ${result.matches.context.join(', ')}`);
    }
    if (result.matches.phrases.length > 0) {
      details.push(`Phrases: ${result.matches.phrases.join(', ')}`);
    }

    return details.join(' | ');
  }
}