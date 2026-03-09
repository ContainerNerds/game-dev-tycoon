'use client';

import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/store/gameStore';
import { convertDevToActiveGame } from '@/lib/game/developmentSystem';
import { Zap } from 'lucide-react';

export default function DevelopmentPanel() {
  const gameInDev = useGameStore((s) => s.gameInDevelopment);
  const toggleCrunch = useGameStore((s) => s.toggleCrunch);
  const releaseGame = useGameStore((s) => s.releaseGame);

  if (!gameInDev) return null;

  const isComplete = gameInDev.progressPercent >= 100;

  const handleRelease = () => {
    const state = useGameStore.getState();
    const activeGame = convertDevToActiveGame(gameInDev, state);
    releaseGame(activeGame);
  };

  return (
    <div className="border-b border-slate-700 bg-slate-800/50 px-4 py-2">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">
                Developing: {gameInDev.name}
              </span>
              <Badge variant="outline" className="text-xs">
                {gameInDev.genre} / {gameInDev.style}
              </Badge>
              {gameInDev.isCrunching && (
                <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/50">
                  <Zap className="h-3 w-3 mr-1" /> Crunching
                </Badge>
              )}
            </div>
            <span className="text-sm font-mono text-slate-300">
              {Math.floor(gameInDev.progressPercent)}%
            </span>
          </div>
          <Progress value={gameInDev.progressPercent} className="h-2" />
        </div>

        <Button
          size="sm"
          variant={gameInDev.isCrunching ? 'destructive' : 'outline'}
          className="text-xs cursor-pointer"
          onClick={toggleCrunch}
          disabled={isComplete}
        >
          <Zap className="h-3 w-3 mr-1" />
          {gameInDev.isCrunching ? 'Stop Crunch' : 'Crunch'}
        </Button>

        <Button
          size="sm"
          className="text-xs cursor-pointer"
          disabled={!isComplete}
          onClick={handleRelease}
        >
          Release Game
        </Button>
      </div>
    </div>
  );
}
