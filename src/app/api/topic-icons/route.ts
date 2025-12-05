import { NextRequest, NextResponse } from 'next/server';
import { getSemanticAnalyzer } from '@/services/semanticAnalyzer';

export const dynamic = 'force-dynamic';

// Available Lucide icon names that we can use
const AVAILABLE_ICONS = [
  'Home', 'Car', 'Bus', 'Plane', 'Bike', 'Train',
  'Leaf', 'TreePine', 'Recycle', 'Sun', 'CloudRain',
  'GraduationCap', 'BookOpen', 'School', 'Users',
  'Heart', 'Hospital', 'Stethoscope', 'Pill',
  'Building', 'Store', 'DollarSign', 'TrendingUp',
  'Hammer', 'Wrench', 'Briefcase', 'Factory',
  'Shield', 'Scale', 'Vote', 'Flag',
  'Music', 'Camera', 'Palette', 'Theater',
  'Coffee', 'Utensils', 'ShoppingCart', 'Gift',
  'Smartphone', 'Wifi', 'Monitor', 'Code',
  'MapPin', 'Globe', 'Mountain', 'Trees',
  'Baby', 'Users2', 'UserPlus', 'Crown',
  'Zap', 'Lightbulb', 'Settings', 'Target',
  'Hash' // fallback
];

export interface TopicIconResult {
  iconName: string;
  confidence: number;
}

// Server-side cache for icon mappings
const iconCache = new Map<string, TopicIconResult>();

async function getTopicIconSemantic(topic: string): Promise<TopicIconResult> {
  try {
    const analyzer = getSemanticAnalyzer();
    const result = analyzer.analyze(topic);

    // Validate the icon name is in our available list
    if (!AVAILABLE_ICONS.includes(result.iconName)) {
      console.warn(`Semantic analyzer suggested invalid icon: ${result.iconName}, using fallback`);
      return { iconName: 'Hash', confidence: 0.1 };
    }

    return {
      iconName: result.iconName,
      confidence: Math.min(Math.max(result.confidence, 0), 1)
    };

  } catch (error) {
    console.error('Error getting topic icon from semantic analyzer:', error);
    return { iconName: 'Hash', confidence: 0.1 };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topics } = body;

    if (!topics || !Array.isArray(topics)) {
      return NextResponse.json({ error: 'Invalid topics array' }, { status: 400 });
    }

    const results: Record<string, TopicIconResult> = {};

    // Process each topic
    for (const topic of topics) {
      if (typeof topic !== 'string') {
        continue;
      }

      const normalizedTopic = topic.toLowerCase();
      
      // Check cache first
      let iconResult = iconCache.get(normalizedTopic);
      
      if (!iconResult) {
        // Get from semantic analyzer and cache
        iconResult = await getTopicIconSemantic(topic);
        iconCache.set(normalizedTopic, iconResult);
      }

      results[topic] = iconResult;
    }

    return NextResponse.json({ icons: results });

  } catch (error) {
    console.error('Error in topic-icons API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support GET for single topic
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');

    if (!topic) {
      return NextResponse.json({ error: 'Topic parameter required' }, { status: 400 });
    }

    const normalizedTopic = topic.toLowerCase();
    
    // Check cache first
    let iconResult = iconCache.get(normalizedTopic);
    
    if (!iconResult) {
      // Get from semantic analyzer and cache
      iconResult = await getTopicIconSemantic(topic);
      iconCache.set(normalizedTopic, iconResult);
    }

    return NextResponse.json({ icon: iconResult });

  } catch (error) {
    console.error('Error in topic-icons API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}