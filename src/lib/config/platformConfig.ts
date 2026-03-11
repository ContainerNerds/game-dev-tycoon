import type { Platform } from '@/lib/game/types';

export interface PlatformDefinition {
  platform: Platform;
  audienceMultiplier: number;   // multiplier on base player pool
  revenueCut: number;           // 0–1, fraction taken by platform (0 = self-published)
  portingCost: number;          // one-time cost to port to this platform
  requiresUpgrade: string | null; // legacy upgrade id required to unlock, or null if default
  requiresSkill: string | null;   // new skill tree node id, or null if default
}

export const PLATFORM_CONFIG = {
  platforms: [
    { platform: 'PC',      audienceMultiplier: 1.0, revenueCut: 0.0,  portingCost: 0,     requiresUpgrade: null, requiresSkill: null },
    { platform: 'Console', audienceMultiplier: 1.8, revenueCut: 0.30, portingCost: 5_000, requiresUpgrade: 'console-publishing', requiresSkill: 'tech-console' },
    { platform: 'Mobile',  audienceMultiplier: 2.5, revenueCut: 0.30, portingCost: 3_000, requiresUpgrade: 'mobile-publishing', requiresSkill: 'tech-mobile' },
  ] satisfies PlatformDefinition[],

  basePriceByPlatform: {
    PC: 29.99,
    Console: 59.99,
    Mobile: 4.99,
  } satisfies Record<Platform, number>,
} as const;
