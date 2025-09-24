interface ProcessedText {
  tokens: string[];
  ngrams: string[];
  stemmed: string[];
  cleaned: string;
}

export class TextProcessor {
  private stopWords: Set<string>;
  private stemExceptions: Map<string, string>;

  constructor(stopWords: string[], stemExceptions: Record<string, string> = {}) {
    this.stopWords = new Set(stopWords.map(word => word.toLowerCase()));
    this.stemExceptions = new Map(Object.entries(stemExceptions));
  }

  process(text: string): ProcessedText {
    const cleaned = this.normalizeText(text);
    const tokens = this.tokenize(cleaned);
    const filteredTokens = this.removeStopWords(tokens);
    const stemmed = this.stemTokens(filteredTokens);
    const ngrams = this.generateNGrams(filteredTokens, 3);

    return {
      tokens: filteredTokens,
      ngrams,
      stemmed,
      cleaned
    };
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')  // Replace punctuation with spaces, keep hyphens
      .replace(/\s+/g, ' ')        // Normalize whitespace
      .trim();
  }

  private tokenize(text: string): string[] {
    return text.split(/\s+/).filter(token => token.length > 0);
  }

  private removeStopWords(tokens: string[]): string[] {
    return tokens.filter(token => !this.stopWords.has(token) && token.length > 1);
  }

  private stemTokens(tokens: string[]): string[] {
    return tokens.map(token => this.stem(token));
  }

  private stem(word: string): string {
    // Check exceptions first
    if (this.stemExceptions.has(word)) {
      return this.stemExceptions.get(word)!;
    }

    // Simple stemming rules for common suffixes
    const suffixes = [
      { pattern: /ing$/, replacement: '' },
      { pattern: /ly$/, replacement: '' },
      { pattern: /ed$/, replacement: '' },
      { pattern: /ies$/, replacement: 'y' },
      { pattern: /ied$/, replacement: 'y' },
      { pattern: /ies$/, replacement: 'y' },
      { pattern: /s$/, replacement: '' },
      { pattern: /es$/, replacement: '' }
    ];

    let stemmed = word;
    for (const { pattern, replacement } of suffixes) {
      if (pattern.test(stemmed) && stemmed.length > 3) {
        stemmed = stemmed.replace(pattern, replacement);
        break;
      }
    }

    return stemmed;
  }

  private generateNGrams(tokens: string[], maxN: number): string[] {
    const ngrams: string[] = [];

    for (let n = 1; n <= Math.min(maxN, tokens.length); n++) {
      for (let i = 0; i <= tokens.length - n; i++) {
        const ngram = tokens.slice(i, i + n).join(' ');
        ngrams.push(ngram);
      }
    }

    return ngrams;
  }

  // Extract meaningful phrases that might be important for classification
  extractKeyPhrases(text: string): string[] {
    const cleaned = this.normalizeText(text);
    const patterns = [
      // Two-word phrases with important civic terms
      /\b(public|city|county|state|federal|local|community|municipal)\s+\w+/g,
      /\b\w+\s+(policy|program|service|development|management|initiative|project)/g,

      // Three-word phrases
      /\b(affordable|public|community|economic|environmental|social)\s+\w+\s+\w+/g,

      // Compound terms with hyphens or common patterns
      /\b\w+-\w+(?:-\w+)*/g,
      /\b\w+\s+(?:and|or|of)\s+\w+/g
    ];

    const phrases: string[] = [];
    patterns.forEach(pattern => {
      const matches = cleaned.match(pattern);
      if (matches) {
        phrases.push(...matches.map(match => match.trim()));
      }
    });

    return [...new Set(phrases)]; // Remove duplicates
  }
}