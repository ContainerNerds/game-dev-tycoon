'use client';

import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/store/gameStore';
import { convertDevToActiveGame } from '@/lib/game/developmentSystem';
import { Zap, Paintbrush, Gamepad2, Volume2, Sparkles } from 'lucide-react';

const PILLAR_CONFIG = [
  { key: 'graphics' as const, label: 'Graphics', icon: Paintbrush, color: 'text-pink-400' },
  { key: 'gameplay' as const, label: 'Gameplay', icon: Gamepad2, color: 'text-blue-400' },
  { key: 'sound' as const, label: 'Sound', icon: Volume2, color: 'text-green-400' },
  { key: 'polish' as const, label: 'Polish', icon: Sparkles, color: 'text-yellow-400' },
];

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
    <div className="border-b border-border bg-card/50 px-4 py-2 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Developing: {gameInDev.name}
              </span>
              <Badge variant="outline" className="text-xs">
                {gameInDev.genre} / {gameInDev.style}
              </Badge>
              {gameInDev.isCrunching && (
                <Badge variant="outline" className="text-xs text-orange-400 border-orange-500/50">
                  <Zap className="h-3 w-3 mr-1" /> Crunching
                </Badge>
              )}
              {gameInDev.bugsFound > 0 && (
                <Badge variant="outline" className="text-xs text-red-400 border-red-500/50">
                  {gameInDev.bugsFound} bugs
                </Badge>
              )}
            </div>
            <span className="text-sm font-mono text-muted-foreground">
              {Math.floor(gameInDev.progressPercent)}%
            </span>
          </div>

          {/* Overall progress */}
          <Progress value={gameInDev.progressPercent} className="h-1.5 mb-2" />

          {/* Pillar breakdown */}
          <div className="grid grid-cols-4 gap-3">
            {PILLAR_CONFIG.map(({ key, label, icon: Icon, color }) => {
              const current = gameInDev.pillarProgress[key];
              const target = gameInDev.pillarTargets[key];
              const pct = target > 0 ? Math.min(100, (current / target) * 100) : 100;
              const done = current >= target;
              return (
                <div key={key} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs flex items-center gap-1 ${done ? 'text-green-400' : color}`}>
                      <Icon className="h-3 w-3" />
                      {label}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {Math.floor(current)}/{target}
                    </span>
                  </div>
                  <Progress value={pct} className="h-1" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
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
    </div>
  );
}
