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
          <div key={game.id} className="border-b border-border bg-card/30 px-4 py-1.5 shrink-0 flex items-center gap-3">
            <Badge variant="outline" className="text-xs capitalize">{game.phase}</Badge>
            <span className="text-sm font-medium">{game.name}</span>
            <Badge variant="outline" className="text-xs">{game.mode === 'liveservice' ? 'Live Service' : 'Standard'}</Badge>
            <span className="text-xs text-muted-foreground">
              {Math.floor(totalPlayers).toLocaleString()} players
            </span>
            <span className="text-xs text-green-400 font-mono">
              ${Math.floor(game.totalRevenue).toLocaleString()}
            </span>

            {/* Mini player count bar */}
            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden" title={`${Math.floor(totalPlayers)} players`}>
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalPlayers / Math.max(totalPlayers, 1000)) * 100)}%` }}
              />
            </div>

            <Button size="sm" variant="ghost" className="text-xs text-red-400 hover:text-red-300 cursor-pointer ml-auto" onClick={() => setRetireTarget(game.id)}>
              <Archive className="h-3 w-3 mr-1" />Retire
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
