import type { OwnedFurniture } from './types';
import { getFurnitureDef, type FurnitureBuffType } from '@/lib/config/furnitureConfig';

export interface AggregatedBuffs {
  staminaRecovery: number;
  staminaDrain: number;
  devSpeed: number;
  vacationDuration: number;
  bugFixSpeed: number;
  researchSpeed: number;
}

const ZERO_BUFFS: AggregatedBuffs = {
  staminaRecovery: 0,
  staminaDrain: 0,
  devSpeed: 0,
  vacationDuration: 0,
  bugFixSpeed: 0,
  researchSpeed: 0,
};

export function computeFurnitureBuffs(furniture: OwnedFurniture[]): AggregatedBuffs {
  const result = { ...ZERO_BUFFS };
  for (const owned of furniture) {
    const def = getFurnitureDef(owned.definitionId);
    if (!def) continue;
    for (const buff of def.buffs) {
      result[buff.type] += buff.value;
    }
  }
  return result;
}

export function getBuffMultiplier(buffs: AggregatedBuffs, type: FurnitureBuffType): number {
  return 1 + buffs[type];
}

export function getTotalFurnitureMaintenance(furniture: OwnedFurniture[]): number {
  let total = 0;
  for (const owned of furniture) {
    const def = getFurnitureDef(owned.definitionId);
    if (def) total += def.monthlyMaintenance;
  }
  return total;
}
