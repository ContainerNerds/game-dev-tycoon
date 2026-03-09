'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ActiveGame, GameSummary, BlogReview, MonthlySnapshot } from '@/lib/game/types';
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

function MiniChart({ data, dataKey }: { data: MonthlySnapshot[]; dataKey: 'copiesSold' | 'activePlayers' | 'revenue' }) {
  if (data.length < 2) return null;
  const values = data.map((d) => d[dataKey]);
  const max = Math.max(...values, 1);
  const width = 400;
  const height = 80;
  const padding = 4;
  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - (v / max) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400" />
    </svg>
  );
}

interface GameData {
  id: string;
  name: string;
  genre: string;
  style: string;
  mode: string;
  reviewScore: number;
  blogReviews: BlogReview[];
  totalRevenue: number;
  totalCopiesSold: number;
  peakPlayers: number;
  fansConverted?: number;
  monthlyHistory: MonthlySnapshot[];
  releaseMonth: number;
  releaseYear: number;
}

function toGameData(game: ActiveGame): GameData {
  return {
    id: game.id,
    name: game.name,
    genre: game.genre,
    style: game.style,
    mode: game.mode,
    reviewScore: game.reviewScore,
    blogReviews: game.blogReviews,
    totalRevenue: game.totalRevenue,
    totalCopiesSold: game.platformReleases.reduce((s, p) => s + p.totalCopiesSold, 0),
    peakPlayers: game.platformReleases.reduce((s, p) => s + p.activePlayers, 0),
    monthlyHistory: game.monthlyHistory,
    releaseMonth: game.releaseMonth,
    releaseYear: game.releaseYear,
  };
}

function summaryToGameData(game: GameSummary): GameData {
  return {
    id: game.id,
    name: game.name,
    genre: game.genre,
    style: game.style,
    mode: game.mode,
    reviewScore: game.reviewScore,
    blogReviews: game.blogReviews,
    totalRevenue: game.totalRevenue,
    totalCopiesSold: game.totalCopiesSold,
    peakPlayers: game.peakPlayers,
    fansConverted: game.fansConverted,
    monthlyHistory: game.monthlyHistory,
    releaseMonth: game.releaseMonth,
    releaseYear: game.releaseYear,
  };
}

interface GameDetailViewProps {
  game: GameData | null;
  open: boolean;
  onClose: () => void;
}

export default function GameDetailView({ game, open, onClose }: GameDetailViewProps) {
  if (!game) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Gamepad2 className="h-5 w-5" />
            {game.name}
            <Badge variant="outline" className="text-xs">{game.genre} / {game.style}</Badge>
            <Badge variant="outline" className="text-xs uppercase">{game.mode === 'multiplayer' ? 'MP' : 'SP'}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{game.reviewScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold font-mono">${Math.floor(game.totalRevenue).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{Math.floor(game.totalCopiesSold).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Copies Sold</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold">{Math.floor(game.peakPlayers).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{game.fansConverted !== undefined ? 'Fans Converted' : 'Active Players'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-sm text-muted-foreground">
            Released {getMonthName(game.releaseMonth)} {game.releaseYear}
          </p>

          {/* Blog Reviews */}
          {game.blogReviews.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Press Reviews</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {game.blogReviews.map((review, i) => (
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

          {/* Charts */}
          {game.monthlyHistory.length >= 2 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Performance Over Time</h4>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Copies Sold / Month</p>
                  <MiniChart data={game.monthlyHistory} dataKey="copiesSold" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Active Players</p>
                  <MiniChart data={game.monthlyHistory} dataKey="activePlayers" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                  <MiniChart data={game.monthlyHistory} dataKey="revenue" />
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { toGameData, summaryToGameData };
export type { GameData };
