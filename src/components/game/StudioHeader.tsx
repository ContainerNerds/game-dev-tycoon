'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGameStore } from '@/lib/store/gameStore';
import { formatDate } from '@/lib/game/calendarSystem';
import type { GameSpeed } from '@/lib/game/types';
import { Pause, Play, FastForward, SkipForward } from 'lucide-react';

const SPEED_OPTIONS: { speed: GameSpeed; label: string; icon: React.ReactNode }[] = [
  { speed: 0, label: 'Pause', icon: <Pause className="h-3.5 w-3.5" /> },
  { speed: 1, label: '1x', icon: <Play className="h-3.5 w-3.5" /> },
  { speed: 2, label: '2x', icon: <FastForward className="h-3.5 w-3.5" /> },
  { speed: 4, label: '4x', icon: <SkipForward className="h-3.5 w-3.5" /> },
];

export default function StudioHeader() {
  const studioName = useGameStore((s) => s.studioName);
  const money = useGameStore((s) => s.money);
  const studioFans = useGameStore((s) => s.studioFans);
  const researchPoints = useGameStore((s) => s.researchPoints);
  const calendar = useGameStore((s) => s.calendar);
  const speed = useGameStore((s) => s.calendar.speed);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const save = useGameStore((s) => s.save);

  const currentGame = useGameStore((s) => s.currentGame);
  const gameInDev = useGameStore((s) => s.gameInDevelopment);

  return (
    <header className="flex items-center gap-4 border-b border-slate-700 bg-slate-900/95 px-4 py-2 backdrop-blur">
      <div className="font-bold text-white text-lg">{studioName}</div>

      <Separator orientation="vertical" className="h-6 bg-slate-700" />

      <div className="flex items-center gap-4 text-sm">
        <div className="text-green-400 font-mono">
          ${Math.floor(money).toLocaleString()}
        </div>
        <div className="text-purple-400">
          {Math.floor(studioFans).toLocaleString()} fans
        </div>
        <div className="text-blue-400">
          {researchPoints.toFixed(1)} RP
        </div>
      </div>

      <Separator orientation="vertical" className="h-6 bg-slate-700" />

      {/* Game status */}
      <div className="text-sm text-slate-400">
        {gameInDev && (
          <span>
            Developing: <span className="text-yellow-400">{gameInDev.name}</span>
            {' '}({Math.floor(gameInDev.progressPercent)}%)
          </span>
        )}
        {currentGame && currentGame.phase !== 'retired' && (
          <span>
            Live: <span className="text-green-400">{currentGame.name}</span>
            {' '}
            <Badge variant="outline" className="text-xs">
              {currentGame.phase}
            </Badge>
          </span>
        )}
        {!gameInDev && !currentGame && (
          <span className="text-slate-500">No active project</span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Calendar */}
        <div className="text-sm font-mono text-slate-300">
          {formatDate(calendar)}
        </div>

        {/* Speed controls */}
        <div className="flex items-center gap-1">
          {SPEED_OPTIONS.map((opt) => (
            <Button
              key={opt.speed}
              size="sm"
              variant={speed === opt.speed ? 'default' : 'ghost'}
              className="h-7 w-7 p-0 cursor-pointer"
              onClick={() => setSpeed(opt.speed)}
              title={opt.label}
            >
              {opt.icon}
            </Button>
          ))}
        </div>

        <Button
          size="sm"
          variant="outline"
          className="text-xs cursor-pointer"
          onClick={save}
        >
          Save
        </Button>
      </div>
    </header>
  );
}
