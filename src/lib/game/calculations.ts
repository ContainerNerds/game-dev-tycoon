import type { ActiveGame, PillarWeights, StudioState, Employee } from './types';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { CALENDAR_CONFIG } from '@/lib/config/calendarConfig';
import { EMPLOYEE_CONFIG } from '@/lib/config/employeeConfig';
import { SKILL_TREE } from '@/lib/config/skillTreeConfig';
import { getIdealPillars, getComboMultiplier } from '@/lib/config/genreStyleConfig';

// ============================================================
// Employee Skill Aggregation
// ============================================================

export function getTotalSkill(employees: Employee[], skill: keyof Employee['skills']): number {
  return employees.reduce((sum, emp) => sum + emp.skills[skill], 0);
}

export function getDevSpeedMultiplier(employees: Employee[]): number {
  const totalDevel = getTotalSkill(employees, 'devel');
  return 1 + totalDevel * EMPLOYEE_CONFIG.bonuses.develSpeedBoost;
}

export function getBugRateMultiplier(employees: Employee[]): number {
  const totalDevel = getTotalSkill(employees, 'devel');
  return Math.max(0.1, 1 - totalDevel * EMPLOYEE_CONFIG.bonuses.develBugReduction);
}

export function getServerCostMultiplier(employees: Employee[]): number {
  const totalInfra = getTotalSkill(employees, 'infra');
  return Math.max(0.1, 1 - totalInfra * EMPLOYEE_CONFIG.bonuses.infraCostReduction);
}

// ============================================================
// Upgrade Effect Aggregation
// ============================================================

export function getUpgradeMultiplier(
  effectType: string,
  studioUpgrades: string[],
  gameUpgrades: string[]
): number {
  let multiplier = 1;
  const allUnlocked = [...studioUpgrades, ...gameUpgrades];

  for (const upgradeId of allUnlocked) {
    const node = SKILL_TREE.find((n) => n.id === upgradeId);
    if (!node) continue;
    for (const effect of node.effects) {
      if (effect.type === effectType) {
        multiplier *= effect.value;
      }
    }
  }

  return multiplier;
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

  // diff ranges 0 (perfect) to 200 (worst). Map to 0–1 score.
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

  const comboScore = getComboMultiplier(game.genre, game.style) / 3.0; // normalize 0–1

  const bugPenalty = Math.min(1, bugCount * 0.05);

  const raw = (pillarFit * 0.5 + comboScore * 0.3 + (1 - bugPenalty) * 0.2) * 10;

  return Math.round(raw * 10) / 10; // one decimal place, 0–10
}

// ============================================================
// Sales Calculations
// ============================================================

export function getSaleRatePerTick(
  game: ActiveGame,
  state: StudioState
): number {
  let baseRate = GAME_CONFIG.baseSaleRatePerTick;

  // Phase multiplier
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

  // Combo multiplier
  baseRate *= game.comboMultiplier;

  // Review score scales sales (0–10 maps to 0.2–2.0)
  const reviewMultiplier = 0.2 + (game.reviewScore / 10) * 1.8;
  baseRate *= reviewMultiplier;

  // Upgrade multipliers
  const saleUpgrade = getUpgradeMultiplier(
    'saleRateMultiplier',
    state.unlockedStudioUpgrades,
    game.unlockedGameUpgrades
  );
  baseRate *= saleUpgrade;

  // Studio fans guaranteed buys (only during growth)
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
