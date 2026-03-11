import type { ActiveGame, PillarWeights, StudioState, Employee } from './types';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { CALENDAR_CONFIG } from '@/lib/config/calendarConfig';
import { EMPLOYEE_CONFIG } from '@/lib/config/employeeConfig';
import { LEGACY_SKILL_TREE, getSkillEffectValue } from '@/lib/config/skillTreeConfig';
import { getIdealPillars, getComboMultiplier } from '@/lib/config/genreStyleConfig';
import { getEffectiveSkills } from './employeeSystem';

// ============================================================
// Employee Skill Aggregation (uses effective skills: IV + EV)
// ============================================================

export function getTotalEffectiveSkill(employees: Employee[], skill: keyof Employee['skills']): number {
  return employees.reduce((sum, emp) => sum + getEffectiveSkills(emp)[skill], 0);
}

export function getDevSpeedMultiplier(employees: Employee[]): number {
  const totalGameplay = getTotalEffectiveSkill(employees, 'gameplay');
  return 1 + totalGameplay * EMPLOYEE_CONFIG.bonuses.gameplaySpeedBoost;
}

export function getBugRateMultiplier(employees: Employee[]): number {
  const totalPolish = getTotalEffectiveSkill(employees, 'polish');
  return Math.max(0.1, 1 - totalPolish * EMPLOYEE_CONFIG.bonuses.polishBugReduction);
}

export function getServerCostMultiplier(employees: Employee[]): number {
  return 1;
}

// ============================================================
// Upgrade Effect Aggregation
// ============================================================

/**
 * Legacy upgrade multiplier. Reads from old flat upgrade IDs (for
 * backward compat with unlockedStudioUpgrades). Game upgrades are
 * no longer used but the parameter is kept so callers don't break.
 */
export function getUpgradeMultiplier(
  effectType: string,
  studioUpgrades: string[],
  gameUpgrades: string[]
): number {
  let multiplier = 1;
  const allUnlocked = [...studioUpgrades, ...gameUpgrades];

  for (const upgradeId of allUnlocked) {
    const node = LEGACY_SKILL_TREE.find((n) => n.id === upgradeId);
    if (!node) continue;
    for (const effect of node.effects) {
      if (effect.type === effectType) {
        multiplier *= effect.value;
      }
    }
  }

  return multiplier;
}

/**
 * New skill-tree-aware multiplier. Combines legacy unlockedStudioUpgrades
 * with the new allocatedSkills system. Multiplicative effects are multiplied.
 */
export function getFullEffectMultiplier(
  effectType: string,
  state: StudioState,
): number {
  const legacyMul = getUpgradeMultiplier(effectType, state.unlockedStudioUpgrades, []);
  const skillMul = getSkillEffectValue(effectType, state.allocatedSkills);
  return legacyMul * skillMul;
}

// ============================================================
// Review Score
// ============================================================

export function calculatePillarFitScore(
  weights: PillarWeights,
  idealWeights: PillarWeights
): number {
  const diff =
    Math.abs(weights.graphics - idealWeights.graphics) +
    Math.abs(weights.gameplay - idealWeights.gameplay) +
    Math.abs(weights.sound - idealWeights.sound) +
    Math.abs(weights.polish - idealWeights.polish);

  return Math.max(0, 1 - diff / 200);
}

export function calculateReviewScore(
  game: { genre: ActiveGame['genre']; style: ActiveGame['style']; pillarWeights: PillarWeights },
  bugCount: number,
  studioUpgrades: string[],
  gameUpgrades: string[]
): number {
  const ideal = getIdealPillars(game.genre, game.style);
  const pillarFit = ideal ? calculatePillarFitScore(game.pillarWeights, ideal) : 0.5;

  const comboScore = getComboMultiplier(game.genre, game.style) / 3.0;

  const bugPenalty = Math.min(1, bugCount * 0.05);

  const raw = (pillarFit * 0.5 + comboScore * 0.3 + (1 - bugPenalty) * 0.2) * 10;

  return Math.round(raw * 10) / 10;
}

// ============================================================
// Sales Calculations
// ============================================================

export function getSaleRatePerTick(
  game: ActiveGame,
  state: StudioState
): number {
  let baseRate = GAME_CONFIG.baseSaleRatePerTick;

  switch (game.phase) {
    case 'growth':
      baseRate *= 1.0;
      break;
    case 'peak':
      baseRate *= GAME_CONFIG.peakSaleRateMultiplier;
      break;
    case 'decline':
      baseRate *= GAME_CONFIG.declineSaleRateMultiplier;
      break;
    default:
      return 0;
  }

  baseRate *= game.comboMultiplier;

  const reviewMultiplier = 0.2 + (game.reviewScore / 10) * 1.8;
  baseRate *= reviewMultiplier;

  const saleUpgrade = getFullEffectMultiplier('saleRateMultiplier', state);
  baseRate *= saleUpgrade;

  if (game.phase === 'growth') {
    baseRate += state.studioFans * GAME_CONFIG.studioFanPurchaseRate * 0.01;
  }

  return Math.max(0, baseRate);
}

export function getServerLoad(totalPlayers: number, servers: { capacity: number }[]): number {
  const totalCapacity = servers.reduce((sum, s) => sum + s.capacity, 0);
  if (totalCapacity === 0) return totalPlayers > 0 ? Infinity : 0;
  return totalPlayers / totalCapacity;
}

export function getLifecyclePhaseTicks(
  phase: ActiveGame['phase'],
  studioUpgrades: string[],
  gameUpgrades: string[]
): number {
  const ticksPerMonth = CALENDAR_CONFIG.ticksPerDay * 30;
  let months: number;

  switch (phase) {
    case 'growth':
      months = GAME_CONFIG.lifecycle.growthMonths;
      break;
    case 'peak':
      months = GAME_CONFIG.lifecycle.peakMonths;
      months *= getUpgradeMultiplier('peakDurationMultiplier', studioUpgrades, gameUpgrades);
      break;
    case 'decline':
      months = GAME_CONFIG.lifecycle.declineMonths;
      break;
    default:
      return Infinity;
  }

  return months * ticksPerMonth;
}
