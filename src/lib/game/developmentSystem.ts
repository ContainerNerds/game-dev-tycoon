import type { GameInDev, ActiveGame, StudioState, PlatformRelease } from './types';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { OFFICE_CONFIG } from '@/lib/config/officeConfig';
import { PLATFORM_CONFIG } from '@/lib/config/platformConfig';
import { getComboMultiplier } from '@/lib/config/genreStyleConfig';
import {
  getDevSpeedMultiplier,
  calculateReviewScore,
  getUpgradeMultiplier,
} from './calculations';

export function calculateDevProgressPerTick(state: StudioState): number {
  if (!state.gameInDevelopment) return 0;

  const officeDef = OFFICE_CONFIG.tiers.find((t) => t.tier === state.office.tier);
  const officeBonus = officeDef?.devSpeedBonus ?? 1.0;

  const employeeSpeed = getDevSpeedMultiplier(state.employees);

  const projectBoost = getUpgradeMultiplier(
    'projectSpeedBoost',
    state.unlockedStudioUpgrades,
    []
  );

  let progress = GAME_CONFIG.baseDevProgressPerTick * employeeSpeed * officeBonus * projectBoost;

  if (state.gameInDevelopment.isCrunching) {
    progress *= GAME_CONFIG.crunchSpeedMultiplier;
  }

  // Minimum progress even with no employees (solo dev in garage)
  return Math.max(GAME_CONFIG.baseDevProgressPerTick * 0.5, progress);
}

export function convertDevToActiveGame(
  dev: GameInDev,
  state: StudioState
): ActiveGame {
  const comboMultiplier = getComboMultiplier(dev.genre, dev.style);

  const reviewScore = calculateReviewScore(
    { genre: dev.genre, style: dev.style, pillarWeights: dev.pillarWeights },
    Math.floor(dev.crunchBugPenalty * 10),
    state.unlockedStudioUpgrades,
    []
  );

  const platformReleases: PlatformRelease[] = dev.platforms.map((platform) => {
    const def = PLATFORM_CONFIG.platforms.find((p) => p.platform === platform)!;
    return {
      platform,
      portingCost: def.portingCost,
      audienceMultiplier: def.audienceMultiplier,
      revenueCut: def.revenueCut,
      activePlayers: 0,
      totalCopiesSold: 0,
    };
  });

  return {
    id: dev.id,
    name: dev.name,
    genre: dev.genre,
    style: dev.style,
    comboMultiplier,
    phase: 'growth',
    pillarWeights: dev.pillarWeights,
    reviewScore,
    releaseMonth: state.calendar.month,
    releaseYear: state.calendar.year,
    phaseTicks: 0,
    platformReleases,
    gameFans: 0,
    gamePrice: PLATFORM_CONFIG.basePriceByPlatform[dev.platforms[0] ?? 'PC'],
    bugs: [],
    dlcs: [],
    servers: [],
    unlockedGameUpgrades: [],
    totalRevenue: 0,
  };
}
