'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  content: string;
  creatorName: string;
  topics: string[];
  timestamp: string;
}

export default function CreateBattlePage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost1, setSelectedPost1] = useState<string | null>(null);
  const [selectedPost2, setSelectedPost2] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/debug/create-battle');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBattle = async () => {
    if (!selectedPost1 || !selectedPost2) {
      toast({
        title: "Please select two posts",
        description: "You need to select exactly two posts to create a battle",
        variant: "destructive"
      });
      return;
    }

    if (selectedPost1 === selectedPost2) {
      toast({
        title: "Invalid selection",
        description: "Please select two different posts",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/debug/create-battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post1Id: selectedPost1,
          post2Id: selectedPost2
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Battle Created! 🔥",
          description: `Hot Take Battle "${data.battle.title}" has been created!`
        });

        // Reset selections and refresh posts
        setSelectedPost1(null);
        setSelectedPost2(null);
        fetchPosts();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create battle');
      }
    } catch (error) {
      console.error('Error creating battle:', error);
      toast({
        title: "Failed to create battle",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to access debug tools</h1>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔥 Create Hot Take Battle (Debug)</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Select exactly two posts below by clicking on them</li>
              <li>Selected posts will be highlighted in blue</li>
              <li>Click "Create Battle" to create a Hot Take Battle between them</li>
              <li>The battle will appear in topic feeds and trending battles</li>
            </ol>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Available Posts ({selectedPost1 && selectedPost2 ? '2' : selectedPost1 || selectedPost2 ? '1' : '0'} selected)
          </h2>
          <Button
            onClick={createBattle}
            disabled={!selectedPost1 || !selectedPost2 || creating}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {creating ? 'Creating...' : 'Create Battle 🔥'}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading posts...</div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => {
              const isSelected = selectedPost1 === post.id || selectedPost2 === post.id;
              const isPost1 = selectedPost1 === post.id;
              const isPost2 = selectedPost2 === post.id;

              return (
                <Card
                  key={post.id}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:ring-1 hover:ring-gray-300'
                  }`}
                  onClick={() => {
                    if (isSelected) {
                      // Unselect
                      if (isPost1) setSelectedPost1(null);
                      if (isPost2) setSelectedPost2(null);
                    } else {
                      // Select
                      if (!selectedPost1) {
                        setSelectedPost1(post.id);
                      } else if (!selectedPost2) {
                        setSelectedPost2(post.id);
                      } else {
                        // Replace first selection
                        setSelectedPost1(post.id);
                        setSelectedPost2(null);
                      }
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{post.creatorName}</span>
                        {isPost1 && <Badge variant="default">Post 1</Badge>}
                        {isPost2 && <Badge variant="secondary">Post 2</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm mb-3 line-clamp-3">{post.content}</p>

                    {post.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.topics.map((topic) => (
                          <Badge key={topic} variant="outline" className="text-xs">
                            #{topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No posts available</h3>
              <p className="text-muted-foreground">
                Create some posts first, then come back to create battles between them.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}