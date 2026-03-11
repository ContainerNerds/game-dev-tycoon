export const STUDIO_LEVEL_CONFIG = {
  maxLevel: 30,

  /** XP required to reach each level (index = target level, 0 unused). */
  xpPerLevel: Array.from({ length: 31 }, (_, level) => {
    if (level === 0) return 0;
    return Math.round(80 * level + 20 * level * level);
  }),

  xpRewards: {
    releaseGame: { small: 120, medium: 200, large: 350, mmorpg: 600 },
    releaseDLC: 80,
    completePatch: 40,
    completeResearch: 30,
    completeContract: 100,
  },
} as const;

export type GameSizeXP = keyof typeof STUDIO_LEVEL_CONFIG.xpRewards.releaseGame;

/**
 * Compute how many levels are gained from adding `xpToAdd` to `currentXP`
 * at `currentLevel`. Returns the new level and remaining XP.
 */
export function computeLevelUp(
  currentXP: number,
  currentLevel: number,
  xpToAdd: number,
): { newXP: number; newLevel: number; pointsGained: number } {
  let xp = currentXP + xpToAdd;
  let level = currentLevel;
  let points = 0;

  while (level < STUDIO_LEVEL_CONFIG.maxLevel) {
    const needed = STUDIO_LEVEL_CONFIG.xpPerLevel[level + 1];
    if (xp < needed) break;
    xp -= needed;
    level += 1;
    points += 1;
  }

  if (level >= STUDIO_LEVEL_CONFIG.maxLevel) {
    xp = 0;
  }

  return { newXP: xp, newLevel: level, pointsGained: points };
}
