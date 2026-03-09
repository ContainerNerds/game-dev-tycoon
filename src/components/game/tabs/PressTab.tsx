'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/store/gameStore';
import InteractiveChart from '@/components/game/InteractiveChart';
import { Newspaper, Star, Users, TrendingUp, TrendingDown, Quote } from 'lucide-react';

function scoreColor(score: number): string {
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-blue-400';
  if (score >= 4) return 'text-yellow-400';
  if (score >= 2) return 'text-orange-400';
  return 'text-red-400';
}

export default function PressTab() {
  const activeGames = useGameStore((s) => s.activeGames);
  const studioFans = useGameStore((s) => s.studioFans);
  const completedGames = useGameStore((s) => s.completedGames);

  const primaryGame = activeGames[0] ?? null;
  const gameFans = activeGames.reduce((sum, g) => sum + g.gameFans, 0);
  const reviewScore = primaryGame?.reviewScore ?? 0;
  const blogReviews = primaryGame?.blogReviews ?? [];
  const totalPlayers = activeGames.reduce((sum, g) => sum + g.platformReleases.reduce((s2, p) => s2 + p.activePlayers, 0), 0);
  const totalSold = activeGames.reduce((sum, g) => sum + g.platformReleases.reduce((s2, p) => s2 + p.totalCopiesSold, 0), 0);
  const phase = primaryGame?.phase;
  const monthlyHistory = primaryGame?.monthlyHistory ?? [];

  const sentiment = reviewScore >= 8 ? 'Overwhelmingly Positive' :
                    reviewScore >= 6 ? 'Mostly Positive' :
                    reviewScore >= 4 ? 'Mixed' :
                    reviewScore >= 2 ? 'Mostly Negative' : 'Overwhelmingly Negative';

  const sentimentColor = scoreColor(reviewScore);

  return (
    <div className="p-4 space-y-6">
      {/* Blog Reviews */}
      {blogReviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Launch Reviews
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {blogReviews.map((review, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{review.blogName}</span>
                    <Badge
                      variant="outline"
                      className={`font-mono font-bold ${scoreColor(review.score)}`}
                    >
                      {review.score.toFixed(1)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground italic flex gap-1">
                    <Quote className="h-3 w-3 shrink-0 mt-0.5" />
                    {review.summary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scores & Phase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Star className="h-8 w-8 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold">{reviewScore.toFixed(1)}/10</p>
              <p className="text-sm text-muted-foreground">Avg. Review Score</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Newspaper className={`h-8 w-8 ${sentimentColor}`} />
            <div>
              <p className={`text-lg font-semibold ${sentimentColor}`}>{sentiment}</p>
              <p className="text-sm text-muted-foreground">Public Sentiment</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            {phase === 'decline' ? (
              <TrendingDown className="h-8 w-8 text-red-400" />
            ) : (
              <TrendingUp className="h-8 w-8 text-green-400" />
            )}
            <div>
              <p className="text-lg font-semibold capitalize">{phase ?? 'N/A'}</p>
              <p className="text-sm text-muted-foreground">Game Phase</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popularity Chart */}
      {monthlyHistory.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Popularity Over Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Copies Sold / Month</p>
              <InteractiveChart data={monthlyHistory} dataKey="copiesSold" color="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Active Players</p>
              <InteractiveChart data={monthlyHistory} dataKey="activePlayers" color="text-green-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fan breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
              <p className="text-xl font-bold">{Math.floor(totalSold).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Past games */}
      {completedGames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Releases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm font-medium">{game.name}</span>
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
