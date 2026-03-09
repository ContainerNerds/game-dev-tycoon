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

interface StudioHeaderProps {
  slotId: number;
  onMenuClick: () => void;
}

export default function StudioHeader({ slotId, onMenuClick }: StudioHeaderProps) {
  const studioName = useGameStore((s) => s.studioName);
  const money = useGameStore((s) => s.money);
  const studioFans = useGameStore((s) => s.studioFans);
  const researchPoints = useGameStore((s) => s.researchPoints);
  const dailyRates = useGameStore((s) => s.dailyRates);
  const calendar = useGameStore((s) => s.calendar);
  const speed = useGameStore((s) => s.calendar.speed);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const saveToSlot = useGameStore((s) => s.saveToSlot);

  const activeGames = useGameStore((s) => s.activeGames);
  const activeTasks = useGameStore((s) => s.activeTasks);

  const speedLabel = SPEED_LABELS[speed];

  const formatRate = (val: number, prefix: string = '') => {
    if (val === 0) return '';
    const sign = val > 0 ? '+' : '';
    return ` ${sign}${prefix}${Math.abs(val) >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}/d`;
  };

  const liveGames = activeGames.filter((g) => g.phase !== 'retired');
  const hasActivity = activeTasks.length > 0 || liveGames.length > 0;

  return (
    <header className="border-b border-border bg-card px-3 py-1.5 sm:px-4 sm:py-2 shrink-0 space-y-1">
      {/* Row 1: Name, Money, Speed controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="font-bold text-foreground text-sm sm:text-lg hover:text-foreground/80 transition-colors cursor-pointer text-left shrink-0"
        >
          {studioName}
        </button>

        <Separator orientation="vertical" className="h-5 sm:h-6 hidden sm:block" />

        <div className="text-green-400 font-mono text-xs sm:text-sm">
          ${Math.floor(money).toLocaleString()}
          <span className="hidden sm:inline">
            {dailyRates.moneyPerDay !== 0 && (
              <span className="text-xs text-green-400/60 ml-1">
                {formatRate(dailyRates.moneyPerDay, '$')}
              </span>
            )}
          </span>
        </div>

        {/* Fans & RP — hidden on mobile, shown on sm+ */}
        <div className="hidden sm:flex items-center gap-4 text-sm">
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

        {/* Dev status — hidden on mobile (TaskBar shows it) */}
        <div className="hidden md:flex text-sm text-muted-foreground items-center gap-3">
          {activeTasks.map((task) => (
            <span key={task.id}>
              Developing: <span className="text-yellow-400">{task.name}</span>
              {' '}({Math.floor(task.progressPercent)}%)
            </span>
          ))}
          {liveGames.map((game) => {
            const players = game.platformReleases.reduce((s, p) => s + p.activePlayers, 0);
            return (
              <span key={game.id} className="flex items-center gap-1.5">
                <span className="text-green-400">{game.name}</span>
                <Badge variant="outline" className="text-xs capitalize">{game.phase}</Badge>
                <div className="w-12 h-2 bg-muted rounded-full overflow-hidden" title={`${Math.floor(players)} players`}>
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, (players / Math.max(players, 500)) * 100)}%` }} />
                </div>
                <span className="text-xs text-muted-foreground font-mono">{Math.floor(players).toLocaleString()}</span>
              </span>
            );
          })}
          {!hasActivity && (
            <span className="text-muted-foreground/50">No active project</span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className={`hidden sm:inline text-xs font-semibold min-w-[3.5rem] text-center ${speed === 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {speedLabel}
            </span>
            {SPEED_OPTIONS.map((opt) => (
              <Button
                key={opt.speed}
                size="sm"
                variant={speed === opt.speed ? 'default' : 'ghost'}
                className="h-6 w-6 sm:h-7 sm:w-7 p-0 cursor-pointer"
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
            className="text-xs cursor-pointer hidden sm:inline-flex"
            onClick={() => saveToSlot(slotId)}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Row 2: Mobile-only secondary info + calendar */}
      <div className="flex items-center gap-3 text-xs">
        {/* Fans & RP on mobile */}
        <span className="text-purple-400 sm:hidden">{Math.floor(studioFans).toLocaleString()} fans</span>
        <span className="text-blue-400 sm:hidden">{researchPoints.toFixed(1)} RP</span>
        <div className="ml-auto font-mono text-foreground text-xs sm:text-sm">
          <span>{formatDate(calendar)}</span>
          <span className="text-muted-foreground ml-1 sm:ml-2">
            <span className="sm:hidden">D{calendar.day}</span>
            <span className="hidden sm:inline">Day {calendar.day},</span>
            {' '}{String(calendar.hour).padStart(2, '0')}:00
          </span>
        </div>
      </div>
    </header>
  );
}
