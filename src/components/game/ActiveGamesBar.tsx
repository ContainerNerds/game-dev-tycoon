'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useGameStore } from '@/lib/store/gameStore';
import type { ActiveGame, GameSummary } from '@/lib/game/types';
import { Archive, TriangleAlert } from 'lucide-react';

export default function ActiveGamesBar() {
  const activeGames = useGameStore((s) => s.activeGames);
  const retireGame = useGameStore((s) => s.retireGame);
  const addCompletedGame = useGameStore((s) => s.addCompletedGame);
  const addStudioFans = useGameStore((s) => s.addStudioFans);

  const [retireTarget, setRetireTarget] = useState<string | null>(null);

  if (activeGames.length === 0) return null;

  const handleRetire = (game: ActiveGame) => {
    const totalSold = game.platformReleases.reduce((s, p) => s + p.totalCopiesSold, 0);
    const totalPlayers = game.platformReleases.reduce((s, p) => s + p.activePlayers, 0);
    const fansConverted = Math.floor(game.gameFans * 0.3);

    const summary: GameSummary = {
      id: game.id, name: game.name, genre: game.genre, style: game.style,
      mode: game.mode, reviewScore: game.reviewScore, blogReviews: game.blogReviews,
      totalRevenue: game.totalRevenue, totalCopiesSold: totalSold,
      peakPlayers: Math.floor(totalPlayers), fansConverted,
      monthlyHistory: game.monthlyHistory,
      releaseMonth: game.releaseMonth, releaseYear: game.releaseYear,
    };

    addStudioFans(fansConverted);
    addCompletedGame(summary);
    retireGame(game.id);
    setRetireTarget(null);
  };

  const retireGameObj = activeGames.find((g) => g.id === retireTarget);

  return (
    <>
      {activeGames.filter((g) => g.phase !== 'retired').map((game) => {
        const totalPlayers = game.platformReleases.reduce((s, p) => s + p.activePlayers, 0);
        return (
          <div key={game.id} className="border-b border-border bg-card/30 px-3 sm:px-4 py-1.5 shrink-0 flex items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="text-xs capitalize shrink-0">{game.phase}</Badge>
            <span className="text-xs sm:text-sm font-medium truncate">{game.name}</span>
            <Badge variant="outline" className="text-xs hidden sm:inline-flex">{game.mode === 'liveservice' ? 'Live Service' : 'Standard'}</Badge>
            <span className="text-xs text-muted-foreground shrink-0">
              {Math.floor(totalPlayers).toLocaleString()} <span className="hidden sm:inline">players</span>
            </span>
            <span className="text-xs text-green-400 font-mono shrink-0">
              ${Math.floor(game.totalRevenue).toLocaleString()}
            </span>

            <div className="w-10 sm:w-16 h-2 bg-muted rounded-full overflow-hidden shrink-0" title={`${Math.floor(totalPlayers)} players`}>
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalPlayers / Math.max(totalPlayers, 1000)) * 100)}%` }}
              />
            </div>

            <Button size="sm" variant="ghost" className="text-xs h-6 sm:h-8 text-red-400 hover:text-red-300 cursor-pointer ml-auto shrink-0 px-1.5 sm:px-3" onClick={() => setRetireTarget(game.id)}>
              <Archive className="h-3 w-3 sm:mr-1" /><span className="hidden sm:inline">Retire</span>
            </Button>
          </div>
        );
      })}

      <Dialog open={retireTarget !== null} onOpenChange={(o) => !o && setRetireTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-yellow-400" />
              Retire {retireGameObj?.name}?
            </DialogTitle>
            <DialogDescription>
              Retiring shuts down all activity. {retireGameObj ? Math.floor(retireGameObj.gameFans * 0.3) : 0} fans will convert to studio fans.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="cursor-pointer" onClick={() => setRetireTarget(null)}>Cancel</Button>
            <Button variant="destructive" className="cursor-pointer" onClick={() => retireGameObj && handleRetire(retireGameObj)}>Retire</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
