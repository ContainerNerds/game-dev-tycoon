import type { GameSize } from '@/lib/game/types';

export interface GameSizeDef {
  size: GameSize;
  label: string;
  devMonthsMin: number;
  devMonthsMax: number;
  cost: number;
  baseComplexity: number;
}

export const GAME_SIZE_CONFIG: Record<GameSize, GameSizeDef> = {
  small: {
    size: 'small',
    label: 'Small Game',
    devMonthsMin: 3,
    devMonthsMax: 6,
    cost: 10_000,
    baseComplexity: 60,
  },
  medium: {
    size: 'medium',
    label: 'Medium Game',
    devMonthsMin: 12,
    devMonthsMax: 24,
    cost: 50_000,
    baseComplexity: 150,
  },
  large: {
    size: 'large',
    label: 'Large Game',
    devMonthsMin: 24,
    devMonthsMax: 48,
    cost: 100_000,
    baseComplexity: 300,
  },
  mmorpg: {
    size: 'mmorpg',
    label: 'MMORPG',
    devMonthsMin: 36,
    devMonthsMax: 96,
    cost: 2_000_000,
    baseComplexity: 600,
  },
};

export const ALL_GAME_SIZES: GameSize[] = ['small', 'medium', 'large', 'mmorpg'];

export const ALL_GAME_RATINGS = ['E', 'T', 'M'] as const;
