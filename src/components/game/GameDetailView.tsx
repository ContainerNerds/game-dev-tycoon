'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGameStore } from '@/lib/store/gameStore';
import InteractiveChart from '@/components/game/InteractiveChart';
import type { BlogReview, MonthlySnapshot } from '@/lib/game/types';
import { getMonthName } from '@/lib/game/calendarSystem';
import {
  Star, DollarSign, Users, Gamepad2, Quote, TrendingUp,
} from 'lucide-react';

function scoreColor(score: number): string {
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-blue-400';
  if (score >= 4) return 'text-yellow-400';
  if (score >= 2) return 'text-orange-400';
  return 'text-red-400';
}

interface GameDetailViewProps {
  gameId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function GameDetailView({ gameId, open, onClose }: GameDetailViewProps) {
  const currentGame = useGameStore((s) => s.currentGame);
  const completedGames = useGameStore((s) => s.completedGames);

  if (!gameId) return null;

  let name = '';
  let genre = '';
  let style = '';
  let mode = '';
  let reviewScore = 0;
  let blogReviews: BlogReview[] = [];
  let totalRevenue = 0;
  let totalCopiesSold = 0;
  let activePlayers = 0;
  let fansConverted: number | undefined;
  let monthlyHistory: MonthlySnapshot[] = [];
  let releaseMonth = 0;
  let releaseYear = 0;
  let phase = '';

  if (currentGame && currentGame.id === gameId) {
    name = currentGame.name;
    genre = currentGame.genre;
    style = currentGame.style;
    mode = currentGame.mode;
    reviewScore = currentGame.reviewScore;
    blogReviews = currentGame.blogReviews;
    totalRevenue = currentGame.totalRevenue;
    totalCopiesSold = currentGame.platformReleases.reduce((s, p) => s + p.totalCopiesSold, 0);
    activePlayers = currentGame.platformReleases.reduce((s, p) => s + p.activePlayers, 0);
    monthlyHistory = currentGame.monthlyHistory;
    releaseMonth = currentGame.releaseMonth;
    releaseYear = currentGame.releaseYear;
    phase = currentGame.phase;
  } else {
    const completed = completedGames.find((g) => g.id === gameId);
    if (!completed) return null;
    name = completed.name;
    genre = completed.genre;
    style = completed.style;
    mode = completed.mode;
    reviewScore = completed.reviewScore;
    blogReviews = completed.blogReviews;
    totalRevenue = completed.totalRevenue;
    totalCopiesSold = completed.totalCopiesSold;
    activePlayers = completed.peakPlayers;
    fansConverted = completed.fansConverted;
    monthlyHistory = completed.monthlyHistory;
    releaseMonth = completed.releaseMonth;
    releaseYear = completed.releaseYear;
    phase = 'retired';
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Gamepad2 className="h-5 w-5" />
            {name}
            <Badge variant="outline" className="text-xs">{genre} / {style}</Badge>
            <Badge variant="outline" className="text-xs uppercase">{mode === 'multiplayer' ? 'MP' : 'SP'}</Badge>
            {phase && <Badge variant="outline" className="text-xs capitalize">{phase}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{reviewScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold font-mono">${Math.floor(totalRevenue).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{Math.floor(totalCopiesSold).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Copies Sold</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{Math.floor(activePlayers).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{fansConverted !== undefined ? 'Fans Converted' : 'Active Players'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-sm text-muted-foreground">
            Released {getMonthName(releaseMonth)} {releaseYear}
          </p>

          {blogReviews.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Press Reviews</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {blogReviews.map((review, i) => (
                    <Card key={i}>
                      <CardContent className="p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{review.blogName}</span>
                          <Badge variant="outline" className={`font-mono font-bold ${scoreColor(review.score)}`}>
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
            </>
          )}

          {monthlyHistory.length >= 2 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Performance Over Time</h4>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Copies Sold / Month</p>
                  <InteractiveChart data={monthlyHistory} dataKey="copiesSold" color="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Active Players</p>
                  <InteractiveChart data={monthlyHistory} dataKey="activePlayers" color="text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Revenue / Month</p>
                  <InteractiveChart data={monthlyHistory} dataKey="revenue" color="text-emerald-400" prefix="$" />
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
