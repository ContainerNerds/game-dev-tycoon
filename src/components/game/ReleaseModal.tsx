'use client';

import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGameStore } from '@/lib/store/gameStore';
import { convertTaskToActiveGame, generateBlogReviews, determineGamePrice } from '@/lib/game/developmentSystem';
import { calculateReviewScore } from '@/lib/game/calculations';
import { getMonthName } from '@/lib/game/calendarSystem';
import type { StudioTask, BlogReview } from '@/lib/game/types';
import { Star, DollarSign, Rocket, Quote, Calendar } from 'lucide-react';
import { useMemo } from 'react';

function scoreColor(score: number): string {
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-blue-400';
  if (score >= 4) return 'text-yellow-400';
  if (score >= 2) return 'text-orange-400';
  return 'text-red-400';
}

interface ReleaseModalProps {
  task: StudioTask | null;
  open: boolean;
  onClose: () => void;
}

export default function ReleaseModal({ task, open, onClose }: ReleaseModalProps) {
  const releaseGame = useGameStore((s) => s.releaseGame);
  const calendar = useGameStore((s) => s.calendar);

  const preview = useMemo(() => {
    if (!task || task.type !== 'game') return null;
    const state = useGameStore.getState();
    const formulaScore = calculateReviewScore(
      { genre: task.genre!, style: task.style!, pillarWeights: task.pillarWeights! },
      task.bugsFound,
      state.unlockedStudioUpgrades,
      []
    );
    const blogReviews = generateBlogReviews(formulaScore, task.name, task.genre!);
    const avgScore = Math.round((blogReviews.reduce((s, r) => s + r.score, 0) / blogReviews.length) * 10) / 10;
    const price = determineGamePrice(avgScore, task.devCostSpent ?? 0);
    return { blogReviews, avgScore, price };
  }, [task]);

  if (!task || !preview) return null;

  const handleLaunch = () => {
    const state = useGameStore.getState();
    const activeGame = convertTaskToActiveGame(task, state);
    releaseGame(task.id, activeGame);
    onClose();
  };

  const devDuration = (() => {
    const startM = task.startMonth;
    const startY = task.startYear;
    const endM = calendar.month;
    const endY = calendar.year;
    const months = (endY - startY) * 12 + (endM - startM);
    return months;
  })();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Rocket className="h-5 w-5 text-green-400" />
            Release: {task.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{task.genre} / {task.style}</Badge>
            <Badge variant="outline" className="capitalize">{task.mode === 'liveservice' ? 'Live Service' : 'Standard'}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Dev Time</p>
                <p className="font-medium">{devDuration} month{devDuration !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <div>
                <p className="text-xs text-muted-foreground">Review Score</p>
                <p className={`font-bold ${scoreColor(preview.avgScore)}`}>{preview.avgScore.toFixed(1)}/10</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-bold font-mono">${preview.price}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Press Reviews</h4>
            <div className="space-y-2">
              {preview.blogReviews.map((review, i) => (
                <div key={i} className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex-1">
                    <span className="font-semibold">{review.blogName}</span>
                    <p className="text-xs text-muted-foreground italic flex gap-1 mt-0.5">
                      <Quote className="h-3 w-3 shrink-0 mt-0.5" />{review.summary}
                    </p>
                  </div>
                  <Badge variant="outline" className={`font-mono font-bold shrink-0 ${scoreColor(review.score)}`}>
                    {review.score.toFixed(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {task.bugsFound > 0 && (
            <p className="text-xs text-orange-400">
              {task.bugsFound} bugs found during development (affects review score)
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={onClose}>Cancel</Button>
          <Button className="cursor-pointer" onClick={handleLaunch}>
            <Rocket className="h-4 w-4 mr-2" />
            Launch Game
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
