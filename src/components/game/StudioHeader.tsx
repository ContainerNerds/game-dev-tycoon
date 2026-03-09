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

const SPEED_LABELS: Record<GameSpeed, string> = {
  0: 'Paused',
  1: '1x',
  2: '2x',
  4: '4x',
};

export default function StudioHeader() {
  const studioName = useGameStore((s) => s.studioName);
  const money = useGameStore((s) => s.money);
  const studioFans = useGameStore((s) => s.studioFans);
  const researchPoints = useGameStore((s) => s.researchPoints);
  const dailyRates = useGameStore((s) => s.dailyRates);
  const calendar = useGameStore((s) => s.calendar);
  const speed = useGameStore((s) => s.calendar.speed);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const save = useGameStore((s) => s.save);

  const currentGame = useGameStore((s) => s.currentGame);
  const gameInDev = useGameStore((s) => s.gameInDevelopment);

  const speedLabel = SPEED_LABELS[speed];

  const formatRate = (val: number, prefix: string = '') => {
    if (val === 0) return '';
    const sign = val > 0 ? '+' : '';
    return ` ${sign}${prefix}${Math.abs(val) >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}/d`;
  };

  return (
    <header className="flex items-center gap-4 border-b border-border bg-card px-4 py-2 shrink-0">
      <div className="font-bold text-foreground text-lg">{studioName}</div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-4 text-sm">
        <div className="text-green-400 font-mono">
          ${Math.floor(money).toLocaleString()}
          {dailyRates.moneyPerDay !== 0 && (
            <span className="text-xs text-green-400/60 ml-1">
              {formatRate(dailyRates.moneyPerDay, '$')}
            </span>
          )}
        </div>
        <div className="text-purple-400">
          {Math.floor(studioFans).toLocaleString()} fans
          {dailyRates.fansPerDay > 0 && (
            <span className="text-xs text-purple-400/60 ml-1">
              {formatRate(dailyRates.fansPerDay)}
            </span>
          )}
        </div>
        <div className="text-blue-400">
          {researchPoints.toFixed(1)} RP
          {dailyRates.rpPerDay > 0 && (
            <span className="text-xs text-blue-400/60 ml-1">
              {formatRate(dailyRates.rpPerDay)}
            </span>
          )}
        </div>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="text-sm text-muted-foreground">
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
          <span className="text-muted-foreground/50">No active project</span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Calendar with Day/Hour */}
        <div className="text-sm font-mono text-foreground">
          <span>{formatDate(calendar)}</span>
          <span className="text-muted-foreground ml-2">
            Day {calendar.day}, {String(calendar.hour).padStart(2, '0')}:00
          </span>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Speed controls + label */}
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold min-w-[3.5rem] text-center ${speed === 0 ? 'text-yellow-400' : 'text-green-400'}`}>
            {speedLabel}
          </span>
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
