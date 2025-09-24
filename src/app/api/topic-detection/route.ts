import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/ai-instance';

export interface TopicDetectionResult {
  semanticTopics: string[];
  confidence: number;
}

async function detectTopicsFromContentAI(content: string): Promise<TopicDetectionResult> {
  try {
    const prompt = `
Analyze this social media post and extract 1-3 semantic topic tags that represent the main themes or issues discussed.

Rules:
- Return only lowercase single words separated by commas
- Focus on broad, community-relevant topics like: housing, transportation, education, healthcare, environment, economy, safety, infrastructure
- Avoid very specific terms - prefer broader categories that others might also discuss
- If the post is about local community issues, prioritize those topics
- Maximum 3 topics

Post content: "${content.trim()}"

Respond with just the topics separated by commas, nothing else.
Example: housing, transportation, infrastructure`;

    const response = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 50,
      },
    });

    const aiResponse = response.text.trim();
    
    // Parse the response - should be comma-separated topics
    const topics = aiResponse
      .split(',')
      .map(topic => topic.trim().toLowerCase())
      .filter(topic => topic && topic.length > 0)
      .slice(0, 3); // Ensure max 3 topics

    if (topics.length === 0) {
      // Fallback if AI didn't return valid topics
      return {
        semanticTopics: ['general'],
        confidence: 0.1
      };
    }

    return {
      semanticTopics: topics,
      confidence: Math.max(0.5, Math.min(1.0, topics.length / 3)) // Higher confidence for more topics found
    };

  } catch (error) {
    console.error('Error detecting topics from AI:', error);
    return {
      semanticTopics: ['general'],
      confidence: 0.1
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content parameter' }, { status: 400 });
    }

    const result = await detectTopicsFromContentAI(content);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in topic-detection API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}