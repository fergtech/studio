// Client-side service for topic icons - now uses API instead of direct AI imports

export interface TopicIconResult {
  iconName: string;
  confidence: number;
}

// Cache for icon mappings to avoid repeated API calls
const iconCache = new Map<string, TopicIconResult>();

export async function getTopicIcon(topic: string): Promise<TopicIconResult> {
  // Check cache first
  const cached = iconCache.get(topic.toLowerCase());
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(`/api/topic-icons?topic=${encodeURIComponent(topic)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const topicIcon = data.icon;

    if (!topicIcon) {
      throw new Error('No icon returned from API');
    }

    // Cache the result
    iconCache.set(topic.toLowerCase(), topicIcon);

    return topicIcon;

  } catch (error) {
    console.error('Error getting topic icon:', error);
    const fallback = { iconName: 'Hash', confidence: 0.1 };
    iconCache.set(topic.toLowerCase(), fallback);
    return fallback;
  }
}

// Batch process multiple topics for efficiency
export async function getTopicIcons(topics: string[]): Promise<Map<string, TopicIconResult>> {
  const results = new Map<string, TopicIconResult>();

  // Process topics that aren't cached
  const uncachedTopics = topics.filter(topic => !iconCache.has(topic.toLowerCase()));

  // Add cached results
  topics.forEach(topic => {
    const cached = iconCache.get(topic.toLowerCase());
    if (cached) {
      results.set(topic, cached);
    }
  });

  // Process uncached topics via API
  if (uncachedTopics.length > 0) {
    try {
      const response = await fetch('/api/topic-icons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topics: uncachedTopics }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const icons = data.icons || {};

      // Add new results to cache and return map
      uncachedTopics.forEach(topic => {
        const iconResult = icons[topic] || { iconName: 'Hash', confidence: 0.1 };
        iconCache.set(topic.toLowerCase(), iconResult);
        results.set(topic, iconResult);
      });

    } catch (error) {
      console.error('Error getting topic icons from API:', error);
      // Add fallbacks for uncached topics
      uncachedTopics.forEach(topic => {
        const fallback = { iconName: 'Hash', confidence: 0.1 };
        iconCache.set(topic.toLowerCase(), fallback);
        results.set(topic, fallback);
      });
    }
  }

  return results;
}