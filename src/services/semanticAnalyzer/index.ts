import { TextProcessor } from './textProcessor';
import { KeywordMatcher } from './keywordMatcher';
import topicConfig from '@/config/topicKeywords.json';

export interface TopicIconResult {
  iconName: string;
  confidence: number;
  debug?: {
    matchDetails: string;
    processedText: {
      tokens: string[];
      keyPhrases: string[];
    };
    score: number;
  };
}

export class SemanticAnalyzer {
  private textProcessor: TextProcessor;
  private keywordMatcher: KeywordMatcher;
  private minConfidence: number;
  private enableDebug: boolean;

  constructor(minConfidence: number = 0.1, enableDebug: boolean = false) {
    this.minConfidence = minConfidence;
    this.enableDebug = enableDebug;

    // Initialize text processor with stop words and stem exceptions
    this.textProcessor = new TextProcessor(
      topicConfig.stopWords,
      topicConfig.stemExceptions
    );

    // Initialize keyword matcher with icon categories
    this.keywordMatcher = new KeywordMatcher(topicConfig.iconCategories);
  }

  analyze(topic: string): TopicIconResult {
    if (!topic || topic.trim().length === 0) {
      return this.getFallbackResult('Empty topic provided');
    }

    try {
      // Process the text
      const processed = this.textProcessor.process(topic);
      const keyPhrases = this.textProcessor.extractKeyPhrases(topic);

      // Find the best matching category
      const matchResult = this.keywordMatcher.findBestMatch(
        processed.tokens,
        processed.ngrams,
        processed.stemmed,
        keyPhrases
      );

      // Apply confidence threshold
      if (matchResult.confidence < this.minConfidence) {
        return this.getFallbackResult(
          `Low confidence: ${matchResult.confidence.toFixed(3)}`
        );
      }

      const result: TopicIconResult = {
        iconName: matchResult.iconName,
        confidence: Math.min(matchResult.confidence, 0.95) // Cap confidence to avoid overconfidence
      };

      // Add debug information if enabled
      if (this.enableDebug) {
        result.debug = {
          matchDetails: this.keywordMatcher.getMatchDetails(matchResult),
          processedText: {
            tokens: processed.tokens,
            keyPhrases
          },
          score: matchResult.score
        };
      }

      return result;

    } catch (error) {
      console.error('Error in semantic analysis:', error);
      return this.getFallbackResult(`Analysis error: ${error}`);
    }
  }

  // Batch analyze multiple topics for efficiency
  analyzeMultiple(topics: string[]): Map<string, TopicIconResult> {
    const results = new Map<string, TopicIconResult>();

    for (const topic of topics) {
      results.set(topic, this.analyze(topic));
    }

    return results;
  }

  // Get available icon categories
  getAvailableIcons(): string[] {
    return Object.keys(topicConfig.iconCategories);
  }

  // Update minimum confidence threshold
  setMinConfidence(confidence: number): void {
    this.minConfidence = Math.max(0, Math.min(1, confidence));
  }

  // Enable/disable debug mode
  setDebugMode(enabled: boolean): void {
    this.enableDebug = enabled;
  }

  private getFallbackResult(reason?: string): TopicIconResult {
    const result: TopicIconResult = {
      iconName: 'Hash',
      confidence: 0.1
    };

    if (this.enableDebug && reason) {
      result.debug = {
        matchDetails: `Fallback: ${reason}`,
        processedText: { tokens: [], keyPhrases: [] },
        score: 0
      };
    }

    return result;
  }

  // Validate and test the analyzer with known examples
  selfTest(): { passed: number; failed: number; details: any[] } {
    const testCases = [
      { input: 'housing policy for affordable homes', expected: 'Home' },
      { input: 'public transportation and bus routes', expected: 'Bus' },
      { input: 'environmental protection and climate change', expected: 'Leaf' },
      { input: 'small business development downtown', expected: 'Store' },
      { input: 'education funding for schools', expected: 'GraduationCap' },
      { input: 'municipal budget and tax policy', expected: 'DollarSign' },
      { input: 'parks and recreation facilities', expected: 'Trees' },
      { input: 'police and public safety', expected: 'Shield' },
      { input: 'solar energy and renewable power', expected: 'Sun' },
      { input: 'healthcare services and hospitals', expected: 'Hospital' }
    ];

    let passed = 0;
    let failed = 0;
    const details: any[] = [];

    for (const testCase of testCases) {
      const result = this.analyze(testCase.input);
      const success = result.iconName === testCase.expected;

      if (success) {
        passed++;
      } else {
        failed++;
      }

      details.push({
        input: testCase.input,
        expected: testCase.expected,
        actual: result.iconName,
        confidence: result.confidence,
        success,
        debug: result.debug
      });
    }

    return { passed, failed, details };
  }
}

// Create a singleton instance for use across the application
let analyzerInstance: SemanticAnalyzer | null = null;

export function getSemanticAnalyzer(enableDebug: boolean = false): SemanticAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new SemanticAnalyzer(0.1, enableDebug);
  }
  return analyzerInstance;
}

// Convenience function that matches the existing AI interface
export async function getTopicIconSemantic(topic: string): Promise<TopicIconResult> {
  const analyzer = getSemanticAnalyzer();
  return analyzer.analyze(topic);
}