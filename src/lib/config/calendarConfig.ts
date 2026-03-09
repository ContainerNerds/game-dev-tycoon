import type { GameSpeed } from '@/lib/game/types';

export const CALENDAR_CONFIG = {
  startYear: 2040,
  startMonth: 1,
  startDay: 1,
  startHour: 8,

  hoursPerTick: 1,

  // Real milliseconds between ticks at each speed setting
  msPerTickBySpeed: {
    0: Infinity,    // stopped
    1: 1000,        // 1 real second = 1 game hour
    2: 500,         // 2x speed
    4: 250,         // 4x speed
  } satisfies Record<GameSpeed, number>,

  daysInMonth: [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const,

  hoursPerDay: 24,
} as const;
