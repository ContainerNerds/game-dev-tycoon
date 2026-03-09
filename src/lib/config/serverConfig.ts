import type { RegionId } from '@/lib/game/types';

export interface RegionDefinition {
  id: RegionId;
  name: string;
  unlockCost: number;           // money to unlock this region (0 = default unlocked)
  costMultiplier: number;       // multiplier on server costs in this region
  latencyTier: 1 | 2 | 3;      // 1 = best, 3 = worst (affects player satisfaction)
  playerDemandWeight: number;   // relative share of global player demand (sums to ~1.0)
}

export const SERVER_CONFIG = {
  colocated: {
    baseCostPerMonth: 200,      // dollars per server per month
    baseCapacity: 500,          // players per server
    maxRacksPerRegion: 4,
    serversPerRack: 8,
    rackLeaseCostPerMonth: 100, // cost to lease an empty rack
  },

  datacenter: {
    purchaseCost: 50_000,       // one-time cost to build
    baseCapacity: 10_000,       // players per datacenter
    maintenancePerMonth: 500,   // monthly maintenance
    requiresUpgrade: 'datacenter-unlocked',
  },

  overloadThreshold: 0.9,      // load % at which players start leaving
  overloadPlayerLossRate: 0.05, // % of players lost per tick while overloaded

  regions: [
    { id: 'us-east',       name: 'US East',       unlockCost: 0,      costMultiplier: 1.0, latencyTier: 1, playerDemandWeight: 0.25 },
    { id: 'us-west',       name: 'US West',       unlockCost: 2_000,  costMultiplier: 1.0, latencyTier: 1, playerDemandWeight: 0.15 },
    { id: 'brazil',        name: 'Brazil',        unlockCost: 5_000,  costMultiplier: 0.8, latencyTier: 2, playerDemandWeight: 0.08 },
    { id: 'saudi-arabia',  name: 'Saudi Arabia',  unlockCost: 8_000,  costMultiplier: 1.2, latencyTier: 2, playerDemandWeight: 0.05 },
    { id: 'russia',        name: 'Russia',        unlockCost: 6_000,  costMultiplier: 0.7, latencyTier: 2, playerDemandWeight: 0.07 },
    { id: 'india',         name: 'India',         unlockCost: 4_000,  costMultiplier: 0.6, latencyTier: 3, playerDemandWeight: 0.10 },
    { id: 'china',         name: 'China',         unlockCost: 10_000, costMultiplier: 1.3, latencyTier: 2, playerDemandWeight: 0.15 },
    { id: 'japan',         name: 'Japan',         unlockCost: 7_000,  costMultiplier: 1.1, latencyTier: 1, playerDemandWeight: 0.08 },
    { id: 'australia',     name: 'Australia',     unlockCost: 6_000,  costMultiplier: 1.1, latencyTier: 2, playerDemandWeight: 0.07 },
  ] satisfies RegionDefinition[],
} as const;
