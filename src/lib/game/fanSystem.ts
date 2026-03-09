import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { getUpgradeMultiplier } from './calculations';

interface FanConversionResult {
  newGameFans: number;
  newStudioFans: number;
}

export function calculateFanConversion(
  copiesSoldThisTick: number,
  studioUpgrades: string[],
  gameUpgrades: string[]
): FanConversionResult {
  if (copiesSoldThisTick <= 0) return { newGameFans: 0, newStudioFans: 0 };

  const baseFans = copiesSoldThisTick * GAME_CONFIG.fanConversionRate;

  const studioFanMultiplier = getUpgradeMultiplier(
    'studioFanConversionMultiplier',
    studioUpgrades,
    gameUpgrades
  );

  const growthFanMultiplier = getUpgradeMultiplier(
    'growthFanMultiplier',
    studioUpgrades,
    gameUpgrades
  );

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
