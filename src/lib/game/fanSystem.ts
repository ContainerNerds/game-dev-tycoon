import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { getFullEffectMultiplier } from './calculations';
import type { StudioState } from './types';

interface FanConversionResult {
  newGameFans: number;
  newStudioFans: number;
}

export function calculateFanConversion(
  copiesSoldThisTick: number,
  state: StudioState,
): FanConversionResult {
  if (copiesSoldThisTick <= 0) return { newGameFans: 0, newStudioFans: 0 };

  const baseFans = copiesSoldThisTick * GAME_CONFIG.fanConversionRate;

  const studioFanMultiplier = getFullEffectMultiplier('studioFanConversionMultiplier', state);
  const growthFanMultiplier = getFullEffectMultiplier('growthFanMultiplier', state);

  const totalNewFans = baseFans * growthFanMultiplier;
  const studioSplit = GAME_CONFIG.studioFanSplitRate * studioFanMultiplier;
  const clampedSplit = Math.min(1, studioSplit);

  const newStudioFans = totalNewFans * clampedSplit;
  const newGameFans = totalNewFans * (1 - clampedSplit);

  return {
    newGameFans: Math.max(0, newGameFans),
    newStudioFans: Math.max(0, newStudioFans),
  };
}
