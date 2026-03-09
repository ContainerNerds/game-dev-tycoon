'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { CALENDAR_CONFIG } from '@/lib/config/calendarConfig';
import { processTick } from './gameLoop';
import type { GameSpeed } from './types';

export function useGameTick(): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const speed = useGameStore((s) => s.calendar.speed);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (speed === 0) return;

    const ms = CALENDAR_CONFIG.msPerTickBySpeed[speed as Exclude<GameSpeed, 0>];
    if (!ms || ms === Infinity) return;

    intervalRef.current = setInterval(() => {
      const store = useGameStore.getState();
      processTick(store as Parameters<typeof processTick>[0]);
    }, ms);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [speed]);
}
