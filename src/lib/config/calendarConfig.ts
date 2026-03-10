import type { GameSpeed } from '@/lib/game/types';

export const CALENDAR_CONFIG = {
  startYear: 1,
  startMonth: 1,
  startDay: 1,

  ticksPerDay: 4,

  msPerTickBySpeed: {
    0: Infinity,
    1: 500,       // 2 seconds per game day at 1x
    2: 250,       // 1 second per game day at 2x
  } satisfies Record<GameSpeed, number>,

  daysInMonth: [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const,
} as const;
