// Hashtag parsing and content processing utilities

export interface HashtagExtractionResult {
  hashtags: string[];
  cleanContent: string;
  processedContent: string;
}

export interface ContentAnalysis {
  hashtags: string[];
  mentions: string[];
  cleanText: string;
  processedText: string;
  hasHashtags: boolean;
  hasMentions: boolean;
}

/**
 * Extract hashtags from text content
 * Works like Instagram/TikTok - captures from # until space or end
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];

  // Simple regex like Instagram/TikTok:
  // - Starts with #
  // - Captures letters, numbers, underscores until space or end
  // - Minimum 2 characters to avoid single letters
  const hashtagRegex = /#([a-zA-Z0-9_]{2,50})(?=\s|$)/g;

  const hashtags: string[] = [];
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    const hashtag = match[1].toLowerCase();

    // Avoid duplicates
    if (!hashtags.includes(hashtag)) {
      hashtags.push(hashtag);
    }
  }

  return hashtags;
}

/**
 * Extract @mentions from text content
 */
export function extractMentions(text: string): string[] {
  if (!text) return [];

  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const mention = match[1].toLowerCase();
    if (!mentions.includes(mention) && mention.length <= 30) {
      mentions.push(mention);
    }
  }

  return mentions;
}

/**
 * Remove hashtags from content while preserving readability
 */
export function removeHashtagsFromContent(text: string): string {
  if (!text) return '';

  // Remove hashtags using same pattern as extraction
  return text
    .replace(/#[a-zA-Z0-9_]{2,50}(?=\s|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Process content to make hashtags clickable/styled
 * Returns HTML-like structure for rendering
 */
export function processContentForDisplay(text: string): string {
  if (!text) return '';

  // Replace hashtags with marked versions for styling
  return text.replace(
    /#([a-zA-Z0-9_]{2,50})(?=\s|$)/g,
    '<span class="hashtag">#$1</span>'
  );
}

/**
 * Comprehensive content analysis
 */
export function analyzeContent(text: string): ContentAnalysis {
  const hashtags = extractHashtags(text);
  const mentions = extractMentions(text);
  const cleanText = removeHashtagsFromContent(text);
  const processedText = processContentForDisplay(text);

  return {
    hashtags,
    mentions,
    cleanText,
    processedText,
    hasHashtags: hashtags.length > 0,
    hasMentions: mentions.length > 0,
  };
}

/**
 * Merge hashtags with existing topics, avoiding duplicates
 */
export function mergeHashtagsWithTopics(
  existingTopics: string[],
  hashtags: string[]
): string[] {
  const allTopics = [...existingTopics];

  hashtags.forEach(hashtag => {
    // Only add if not already present (case-insensitive)
    const lowercaseHashtag = hashtag.toLowerCase();
    const exists = allTopics.some(topic => topic.toLowerCase() === lowercaseHashtag);

    if (!exists) {
      allTopics.push(lowercaseHashtag);
    }
  });

  return allTopics;
}

/**
 * Validate hashtag format and content
 */
export function isValidHashtag(hashtag: string): boolean {
  if (!hashtag) return false;

  // Must be 1-50 characters, start with letter, contain only letters/numbers/underscores
  const hashtagPattern = /^[a-zA-Z][a-zA-Z0-9_]{0,49}$/;
  return hashtagPattern.test(hashtag);
}

/**
 * Suggest topics based on hashtags and content analysis
 * Integrates with your existing topic detection system
 */
export function suggestTopicsFromContent(
  content: string,
  existingKeywordTopics: string[] = []
): string[] {
  const analysis = analyzeContent(content);

  // Combine hashtag-derived topics with keyword-based topics
  const combinedTopics = mergeHashtagsWithTopics(
    existingKeywordTopics,
    analysis.hashtags
  );

  // Limit to reasonable number of topics
  return combinedTopics.slice(0, 5);
}

/**
 * Format hashtag for display (ensure it starts with #)
 */
export function formatHashtagForDisplay(hashtag: string): string {
  if (!hashtag) return '';
  return hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
}

/**
 * Auto-complete hashtag suggestions based on input
 * Could be enhanced to query your topic database
 */
export function getHashtagSuggestions(
  input: string,
  popularTags: string[] = []
): string[] {
  if (!input || input.length < 2) return [];

  const cleanInput = input.toLowerCase().replace(/^#/, '');

  // Filter popular tags that match the input
  const matchingTags = popularTags.filter(tag =>
    tag.toLowerCase().startsWith(cleanInput)
  );

  // Add some common civic hashtags as fallback
  const commonCivicTags = [
    'publicsafety', 'transportation', 'housing', 'education',
    'healthcare', 'environment', 'infrastructure', 'budget',
    'community', 'development', 'traffic', 'parks'
  ];

  const matchingCommon = commonCivicTags.filter(tag =>
    tag.startsWith(cleanInput) && !matchingTags.includes(tag)
  );

  return [...matchingTags, ...matchingCommon].slice(0, 6);
}