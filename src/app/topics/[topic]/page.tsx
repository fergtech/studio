import { Metadata } from 'next';
import { TopicFeedClient } from './TopicFeedClient';

// Next.js 15 compatible dynamic route params
interface TopicPageProps {
  params: Promise<{ topic: string }>;
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { topic } = await params;
  const decodedTopic = decodeURIComponent(topic);

  return {
    title: `#${decodedTopic} - Topic Feed`,
    description: `Explore posts, discussions, and Hot Take Battles about ${decodedTopic}`,
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { topic } = await params;
  const decodedTopic = decodeURIComponent(topic);

  return <TopicFeedClient topic={decodedTopic} />;
}