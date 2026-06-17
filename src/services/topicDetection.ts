// Dynamic topic detection using database-driven topic management and enhanced NLP

import { extractHashtags, mergeHashtagsWithTopics } from '@/utils/hashtagUtils';
import { detectTopicsEnhanced } from './enhancedTopicDetection';
import { processPostForTopics, getTrendingTopics } from './topicManager';
import topicConfig from '@/config/topicKeywords.json';

export interface TopicDetectionResult {
  semanticTopics: string[];
  confidence: number;
  hashtagTopics?: string[];
  enhancedTopics?: string[];
  entities?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

// Extract topics from content using keyword matching and hashtag detection
async function extractTopicsFromContent(content: string): Promise<TopicDetectionResult> {
  console.log('🧐 extractTopicsFromContent called with:', content);

  if (!content || content.trim().length < 10) {
    console.log('❌ Content too short or empty, returning general');
    return {
      semanticTopics: ['general'],
      confidence: 0.1,
      hashtagTopics: []
    };
  }

  // 1. Extract hashtags from content
  const hashtagTopics = extractHashtags(content);
  console.log('🏷️ Extracted hashtags:', hashtagTopics);

  // 2. Run enhanced LLM detection (now async)
  const enhancedResult = await detectTopicsEnhanced(content);
  console.log('🧠 Enhanced LLM result:', enhancedResult);

  // 3. Traditional keyword matching (for civic topics)
  const contentLower = content.toLowerCase();
  const topics: { topic: string; confidence: number }[] = [];

  // Check each icon category for keyword matches
  for (const [iconName, category] of Object.entries(topicConfig.iconCategories)) {
    let score = 0;
    let matches = 0;

    // Check primary keywords (higher weight)
    for (const keyword of category.primary) {
      if (contentLower.includes(keyword.toLowerCase())) {
        score += 3;
        matches++;
      }
    }

    // Check secondary keywords (medium weight)
    for (const keyword of category.secondary) {
      if (contentLower.includes(keyword.toLowerCase())) {
        score += 2;
        matches++;
      }
    }

    // Check context phrases (highest weight for exact matches)
    for (const phrase of category.context) {
      if (contentLower.includes(phrase.toLowerCase())) {
        score += 5;
        matches++;
      }
    }

    // Calculate confidence based on score and matches
    if (matches > 0) {
      const confidence = Math.min(0.95, (score * matches) / (content.length / 50));
      if (confidence > 0.3) {
        // Convert icon names to topic names
        const topicName = iconNameToTopic(iconName);
        topics.push({ topic: topicName, confidence });
      }
    }
  }

  // Sort by confidence and take top 3
  topics.sort((a, b) => b.confidence - a.confidence);
  const topTopics = topics.slice(0, 3);

  // 4. Merge all topic sources intelligently
  const keywordTopics = topTopics.map(t => t.topic);
  console.log('🔑 Keyword topics found:', keywordTopics);

  // Combine all topic sources
  let allTopics = [...keywordTopics];

  // Add enhanced NLP topics (higher priority for general content)
  if (enhancedResult.topics.length > 0 && enhancedResult.confidence > 0.5) {
    allTopics = [...enhancedResult.topics, ...allTopics];
  }

  // Add hashtags last (user-defined topics)
  allTopics = mergeHashtagsWithTopics(allTopics, hashtagTopics);

  console.log('🔀 All merged topics:', allTopics);

  // Fallback logic
  if (allTopics.length === 0) {
    // Use enhanced dynamic topics as fallback
    if (enhancedResult.dynamicTopics.length > 0) {
      allTopics = enhancedResult.dynamicTopics.slice(0, 2);
      console.log('📝 Using dynamic topics as fallback:', allTopics);
    } else {
      allTopics = ['general'];
      console.log('⚠️ No topics found, returning general');
    }
  }

  // Calculate final confidence
  const civicConfidence = topTopics[0]?.confidence || 0;
  const hashtagConfidence = hashtagTopics.length > 0 ? 0.8 : 0;
  const finalConfidence = Math.max(civicConfidence, enhancedResult.confidence, hashtagConfidence);

  const result = {
    semanticTopics: allTopics.slice(0, 5), // Limit to 5 topics
    confidence: finalConfidence,
    hashtagTopics,
    enhancedTopics: enhancedResult.topics,
    entities: enhancedResult.entities,
    sentiment: enhancedResult.sentiment
  };

  console.log('✅ Final hybrid topic detection result:', result);
  return result;
}

// Convert icon names to human-readable topic names
function iconNameToTopic(iconName: string): string {
  const iconToTopic: Record<string, string> = {
    'Home': 'housing',
    'Car': 'transportation',
    'Bus': 'transit',
    'Plane': 'aviation',
    'Bike': 'cycling',
    'Train': 'rail',
    'Leaf': 'environment',
    'TreePine': 'parks',
    'Recycle': 'waste',
    'Sun': 'energy',
    'Droplets': 'utilities',
    'Store': 'business',
    'Briefcase': 'employment',
    'DollarSign': 'economy',
    'GraduationCap': 'education',
    'Hospital': 'healthcare',
    'Shield': 'safety',
    'Scale': 'justice',
    'Users': 'community',
    'Building': 'development',
    'Hammer': 'infrastructure',
    'Wifi': 'technology',
    'Camera': 'media',
    'Music': 'arts',
    'Gamepad2': 'recreation',
    'Hash': 'general'
  };

  return iconToTopic[iconName] || iconName.toLowerCase();
}

export async function detectTopicsFromContent(content: string, postId?: string): Promise<TopicDetectionResult> {
  try {
    console.log('🔍 Dynamic Topic Detection Called with content:', content);

    // If we have a postId, use the new dynamic system
    if (postId) {
      const assignedTopics = await processPostForTopics(postId, content);

      // Also run the enhanced detection for additional metadata
      const enhancedResult = await detectTopicsEnhanced(content);
      const hashtagTopics = extractHashtags(content);

      return {
        semanticTopics: assignedTopics,
        confidence: enhancedResult.confidence,
        hashtagTopics,
        enhancedTopics: enhancedResult.topics,
        entities: enhancedResult.entities,
        sentiment: enhancedResult.sentiment
      };
    }

    // Fallback to old system for compatibility
    const result = extractTopicsFromContent(content);
    console.log('🎯 Topic Detection Result:', result);
    return result;
  } catch (error) {
    console.error('Error detecting topics:', error);
    return {
      semanticTopics: ['general'],
      confidence: 0.1
    };
  }
}

// New function to get trending topics from database
export async function getTrendingTopicsFromDB(limit: number = 10) {
  try {
    return await getTrendingTopics(limit);
  } catch (error) {
    console.error('Error getting trending topics from database:', error);
    return [];
  }
}

export async function findRelatedPosts(topics: string[], postId?: string) {
  // This will be implemented when we build the semantic search functionality
  // For now, return empty array
  return [];
}

export async function detectOpposingViewpoints(post1Content: string, post2Content: string): Promise<{
  isOpposing: boolean;
  confidence: number;
  summary?: string;
}> {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ No Google AI API key for opposition detection');
      return { isOpposing: false, confidence: 0.0 };
    }

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Analyze these two posts and determine if they express opposing viewpoints on the same topic.

Post 1: "${post1Content}"

Post 2: "${post2Content}"

Return a JSON object with:
{
  "isOpposing": boolean,
  "confidence": number (0.0 to 1.0),
  "summary": "brief explanation of the opposition"
}

If they clearly disagree on the same topic, set isOpposing to true with high confidence.
If they're about different topics or agree, set isOpposing to false.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));

    return {
      isOpposing: parsed.isOpposing || false,
      confidence: parsed.confidence || 0.0,
      summary: parsed.summary
    };

  } catch (error: any) {
    console.error('Error detecting opposing viewpoints:', error.message);

    // If rate limited, skip battle detection
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      console.warn('⏳ Rate limited during opposition detection - skipping battle');
      return { isOpposing: false, confidence: 0.0 };
    }

    return { isOpposing: false, confidence: 0.0 };
  }
}