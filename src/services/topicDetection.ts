// Client-side service for topic detection - now uses API instead of direct AI imports

export interface TopicDetectionResult {
  semanticTopics: string[];
  confidence: number;
}

export async function detectTopicsFromContent(content: string): Promise<TopicDetectionResult> {
  try {
    const response = await fetch('/api/topic-detection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result || !Array.isArray(result.semanticTopics)) {
      throw new Error('Invalid response format from API');
    }

    return result;

  } catch (error) {
    console.error('Error detecting topics:', error);
    return {
      semanticTopics: ['general'],
      confidence: 0.1
    };
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
  // This would need its own API endpoint if used client-side
  // For now, return default values
  return {
    isOpposing: false,
    confidence: 0.0,
    summary: 'Opposing viewpoint detection not available client-side'
  };
}