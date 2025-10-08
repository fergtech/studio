'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, Users } from 'lucide-react';
import { getTopicDisplayName } from '@/config/curatedTopics';

interface Topic {
  id: string;
  name: string;
  description?: string;
  category?: string;
  postCount: number;
  weeklyPosts: number;
  uniqueCreators?: number;
}

export function AllTopicsClient() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchAllTopics();
  }, []);

  useEffect(() => {
    filterTopics();
  }, [searchQuery, selectedCategory, topics]);

  async function fetchAllTopics() {
    try {
      const response = await fetch('/api/topics/all');
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterTopics() {
    let filtered = [...topics];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(topic =>
        getTopicDisplayName(topic.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(topic => topic.category === selectedCategory);
    }

    setFilteredTopics(filtered);
  }

  const categories = ['entertainment', 'lifestyle', 'knowledge', 'community', 'creative'];

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'entertainment': return 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
      case 'lifestyle': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'knowledge': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'community': return 'bg-orange-500/10 text-orange-700 dark:text-orange-300';
      case 'creative': return 'bg-pink-500/10 text-pink-700 dark:text-pink-300';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading topics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse All Topics</h1>
        <p className="text-muted-foreground">
          Explore {topics.length} topics and find communities that interest you
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Badge
          variant={selectedCategory === null ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          All
        </Badge>
        {categories.map(category => (
          <Badge
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            className="cursor-pointer capitalize"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      {/* Topics Grid */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No topics found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map(topic => (
            <Link key={topic.id} href={`/topics/${encodeURIComponent(topic.name)}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">
                      {getTopicDisplayName(topic.name)}
                    </CardTitle>
                    {topic.weeklyPosts > 0 && (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  {topic.category && (
                    <Badge className={getCategoryColor(topic.category)} variant="secondary">
                      {topic.category}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{topic.postCount} posts</span>
                    </div>
                    {topic.weeklyPosts > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>{topic.weeklyPosts} this week</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
