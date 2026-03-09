'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGameStore } from '@/lib/store/gameStore';
import { Newspaper, Star, Users, TrendingUp, TrendingDown } from 'lucide-react';

export default function PressTab() {
  const currentGame = useGameStore((s) => s.currentGame);
  const studioFans = useGameStore((s) => s.studioFans);
  const completedGames = useGameStore((s) => s.completedGames);

  const gameFans = currentGame?.gameFans ?? 0;
  const reviewScore = currentGame?.reviewScore ?? 0;
  const totalPlayers = currentGame?.platformReleases.reduce((sum, p) => sum + p.activePlayers, 0) ?? 0;
  const totalSold = currentGame?.platformReleases.reduce((sum, p) => sum + p.totalCopiesSold, 0) ?? 0;
  const phase = currentGame?.phase;

  const sentiment = reviewScore >= 8 ? 'Overwhelmingly Positive' :
                    reviewScore >= 6 ? 'Mostly Positive' :
                    reviewScore >= 4 ? 'Mixed' :
                    reviewScore >= 2 ? 'Mostly Negative' : 'Overwhelmingly Negative';

  const sentimentColor = reviewScore >= 8 ? 'text-green-400' :
                         reviewScore >= 6 ? 'text-blue-400' :
                         reviewScore >= 4 ? 'text-yellow-400' :
                         reviewScore >= 2 ? 'text-orange-400' : 'text-red-400';

  return (
    <div className="p-4 space-y-6">
      {/* Review & Sentiment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <Star className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold text-foreground">{reviewScore.toFixed(1)}/10</p>
              <p className="text-sm text-muted-foreground">Review Score</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <Newspaper className={`h-8 w-8 ${sentimentColor}`} />
            <div>
              <p className={`text-lg font-semibold ${sentimentColor}`}>{sentiment}</p>
              <p className="text-sm text-muted-foreground">Public Sentiment</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            {phase === 'decline' ? (
              <TrendingDown className="h-8 w-8 text-red-400" />
            ) : (
              <TrendingUp className="h-8 w-8 text-green-400" />
            )}
            <div>
              <p className="text-lg font-semibold text-foreground capitalize">{phase ?? 'N/A'}</p>
              <p className="text-sm text-muted-foreground">Game Phase</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fan breakdown */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Users className="h-5 w-5" />
            Fan Base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Game Fans</p>
              <p className="text-xl font-bold text-purple-400">{Math.floor(gameFans).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground/60">Buy DLC, hype sequels</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Studio Fans</p>
              <p className="text-xl font-bold text-blue-400">{Math.floor(studioFans).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground/60">Auto-buy new releases</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground">Active Players</p>
              <p className="text-xl font-bold text-green-400">{Math.floor(totalPlayers).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Copies Sold</p>
              <p className="text-xl font-bold text-foreground">{Math.floor(totalSold).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Past games */}
      {completedGames.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Past Releases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm font-medium text-foreground">{game.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{game.genre} / {game.style}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-yellow-400">{game.reviewScore.toFixed(1)}/10</span>
                    <span className="text-green-400">${game.totalRevenue.toLocaleString()}</span>
                    <span className="text-muted-foreground">{game.totalCopiesSold.toLocaleString()} sold</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
