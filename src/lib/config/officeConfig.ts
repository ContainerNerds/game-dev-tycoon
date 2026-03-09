import type { OfficeTier } from '@/lib/game/types';

export interface OfficeTierDefinition {
  tier: OfficeTier;
  name: string;
  maxSeats: number;
  purchaseCost: number;
  monthlyOverhead: number;      // utilities, dev PCs, internet, etc.
  devSpeedBonus: number;        // multiplier on dev progress (1.0 = no bonus)
}

export const OFFICE_CONFIG = {
  tiers: [
    { tier: 0, name: 'Garage',         maxSeats: 0,  purchaseCost: 0,      monthlyOverhead: 0,     devSpeedBonus: 1.0 },
    { tier: 1, name: 'Garage + Desk',  maxSeats: 1,  purchaseCost: 500,    monthlyOverhead: 50,    devSpeedBonus: 1.0 },
    { tier: 2, name: 'Small Office',   maxSeats: 4,  purchaseCost: 8_000,  monthlyOverhead: 400,   devSpeedBonus: 1.1 },
    { tier: 3, name: 'Large Office',   maxSeats: 8,  purchaseCost: 20_000, monthlyOverhead: 900,   devSpeedBonus: 1.2 },
    { tier: 4, name: 'Studio Floor',   maxSeats: 16, purchaseCost: 60_000, monthlyOverhead: 2_200, devSpeedBonus: 1.35 },
  ] satisfies OfficeTierDefinition[],
} as const;
