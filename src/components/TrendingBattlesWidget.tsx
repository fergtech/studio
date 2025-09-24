"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HotTakeBattleCard } from './HotTakeBattleCard';
import { Flame, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

interface TrendingBattlesWidgetProps {
  location?: string;
  limit?: number;
  showHeader?: boolean;
}

export function TrendingBattlesWidget({
  location,
  limit = 3,
  showHeader = true
}: TrendingBattlesWidgetProps) {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBattles();
  }, [location]);

  const fetchBattles = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/hot-take-battles', window.location.origin);
      if (location) {
        url.searchParams.set('location', location);
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch battles');
      }

      const data = await response.json();
      setBattles(data.battles.slice(0, limit));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load battles');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBattle = async (battleId: string, stance: any) => {
    try {
      const response = await fetch(`/api/hot-take-battles/${battleId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stance }),
      });

      if (!response.ok) {
        throw new Error('Failed to join battle');
      }

      // Refresh battles to show updated participation
      fetchBattles();
    } catch (error) {
      console.error('Error joining battle:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              Trending Battles
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              Trending Battles
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBattles}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (battles.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              Trending Battles
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-6">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No hot take battles yet in your area.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Be the first to start a debate!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            Trending Battles
            <span className="text-sm font-normal text-muted-foreground">
              in your area
            </span>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {battles.map((battle: any) => (
          <HotTakeBattleCard
            key={battle.id}
            battle={battle}
            onJoinBattle={handleJoinBattle}
            variant="widget"
          />
        ))}

        {battles.length >= limit && (
          <div className="pt-2">
            <Link href="/hot-takes">
              <Button variant="outline" size="sm" className="w-full">
                <Users className="h-4 w-4 mr-1" />
                View All Battles
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}