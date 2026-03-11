'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import NotificationTray from '@/components/game/NotificationTray';
import { useGameStore } from '@/lib/store/gameStore';
import { formatDate } from '@/lib/game/calendarSystem';
import type { GameSpeed } from '@/lib/game/types';
import { Pause, Play, FastForward } from 'lucide-react';

const SPEED_OPTIONS: { speed: GameSpeed; label: string; icon: React.ReactNode }[] = [
  { speed: 0, label: 'Pause', icon: <Pause className="h-3.5 w-3.5" /> },
  { speed: 1, label: 'Play', icon: <Play className="h-3.5 w-3.5" /> },
  { speed: 2, label: '2x', icon: <FastForward className="h-3.5 w-3.5" /> },
];

const SPEED_LABELS: Record<GameSpeed, string> = {
  0: 'Paused',
  1: '1x',
  2: '2x',
};

interface StudioHeaderProps {
  slotId: number;
  onMenuClick: () => void;
  onNavigateToInbox?: () => void;
}

export default function StudioHeader({ slotId, onMenuClick, onNavigateToInbox }: StudioHeaderProps) {
  const studioName = useGameStore((s) => s.studioName);
  const money = useGameStore((s) => s.money);
  const studioFans = useGameStore((s) => s.studioFans);
  const researchPoints = useGameStore((s) => s.researchPoints);
  const dailyRates = useGameStore((s) => s.dailyRates);
  const calendar = useGameStore((s) => s.calendar);
  const speed = useGameStore((s) => s.calendar.speed);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const saveToSlot = useGameStore((s) => s.saveToSlot);

  const speedLabel = SPEED_LABELS[speed];

  const formatRate = (val: number, prefix: string = '') => {
    if (val === 0) return '';
    const sign = val > 0 ? '+' : '';
    return ` ${sign}${prefix}${Math.abs(val) >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}/d`;
  };

  return (
    <header className="border-b border-border bg-card px-3 py-1.5 sm:px-4 sm:py-2 shrink-0 space-y-1">
      {/* Row 1: Name, metrics (sm+), speed controls, date (sm+), save */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="font-bold text-foreground text-sm sm:text-lg hover:text-foreground/80 transition-colors cursor-pointer text-left shrink-0"
        >
          {studioName}
        </button>

        <Separator orientation="vertical" className="h-5 sm:h-6 hidden sm:block" />

        <div className="hidden sm:block text-green-400 font-mono text-sm">
          ${Math.floor(money).toLocaleString()}
          {dailyRates.moneyPerDay !== 0 && (
            <span className="text-xs text-green-400/60 ml-1">
              {formatRate(dailyRates.moneyPerDay, '$')}
            </span>
          )}
        </div>

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

          <Separator orientation="vertical" className="h-4 hidden sm:block" />

          <div className="hidden sm:block font-mono text-foreground text-sm">
            {formatDate(calendar)}
          </div>

          <NotificationTray onNavigateToInbox={onNavigateToInbox} />
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

      {/* Row 2: Mobile-only — metrics + date */}
      <div className="flex items-center gap-3 text-xs sm:hidden">
        <span className="text-green-400 font-mono">
          ${Math.floor(money).toLocaleString()}
        </span>
        <span className="text-purple-400">{Math.floor(studioFans).toLocaleString()} fans</span>
        <span className="text-blue-400">{researchPoints.toFixed(1)} RP</span>
        <span className="ml-auto font-mono text-foreground">
          {formatDate(calendar)}
        </span>
      </div>
    </header>
  );
}
