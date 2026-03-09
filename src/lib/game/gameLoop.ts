import type { GameStore } from '@/lib/store/gameStore';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { SERVER_CONFIG } from '@/lib/config/serverConfig';
import {
  getSaleRatePerTick,
  getBugRateMultiplier,
  getUpgradeMultiplier,
  getLifecyclePhaseTicks,
} from './calculations';
import { calculateFanConversion } from './fanSystem';
import { getLoadByRegion, isRegionOverloaded, calculatePlayerLossFromOverload } from './serverSystem';
import { buildMonthlyReport, getTotalMonthlyCosts } from './calendarSystem';
import { getEmployeePillarContribution, getBugChancePerContribution } from './employeeSystem';
import type { Bug, BugSeverity } from './types';

function generateBugId(): string {
  return `bug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const BUG_NAMES = [
  'Null pointer in save system', 'Memory leak in particle engine', 'UI overlap on widescreen',
  'Audio cuts out during cutscenes', 'Physics glitch near walls', 'Crash on level load',
  'Infinite loading screen', 'Item duplication exploit', 'AI pathfinding failure',
  'Texture flickering', 'Frame drops in combat', 'Save corruption on exit',
  'Multiplayer desync', 'Input lag on controller', 'Localization string missing',
  'Shader compilation stutter', 'Animation blend error', 'Quest flag not triggering',
  'Inventory sort broken', 'Achievement not unlocking',
];

function randomBugName(): string {
  return BUG_NAMES[Math.floor(Math.random() * BUG_NAMES.length)];
}

function randomBugSeverity(): BugSeverity {
  const roll = Math.random();
  if (roll < 0.4) return 'low';
  if (roll < 0.7) return 'medium';
  if (roll < 0.9) return 'high';
  return 'critical';
}

function severityCostMultiplier(severity: BugSeverity): number {
  switch (severity) {
    case 'low': return 0.5;
    case 'medium': return 1.0;
    case 'high': return 2.0;
    case 'critical': return 4.0;
  }
}

/**
 * Process one game tick. Called by the React tick hook.
 * Reads from and writes to the Zustand store via the provided actions.
 */
export function processTick(store: GameStore): void {
  const state = store;

  if (state.calendar.speed === 0 || state.calendar.monthEndPending) return;
  if (state.isBankrupt) return;

  // 1. Advance calendar
  store.advanceTick();

  // Check if month-end was triggered by advanceTick
  const calAfter = store.calendar;
  if (calAfter.monthEndPending) {
    handleMonthEnd(store);
    return;
  }

  // 2. Development progress via employee contributions
  if (state.gameInDevelopment && state.gameInDevelopment.progressPercent < 100) {
    const dev = state.gameInDevelopment;
    const crunchMultiplier = dev.isCrunching ? GAME_CONFIG.crunchSpeedMultiplier : 1;

    if (state.employees.length > 0) {
      for (const emp of state.employees) {
        const contrib = getEmployeePillarContribution(emp);
        const pillars = ['graphics', 'gameplay', 'sound', 'polish'] as const;

        for (const pillar of pillars) {
          const points = contrib[pillar] * crunchMultiplier * 0.1;
          if (points > 0) {
            store.contributePillarPoints(pillar, points);
          }
        }

        // Each contribution has a chance to introduce bugs
        const bugChance = getBugChancePerContribution(emp) * (dev.isCrunching ? 1.5 : 1);
        if (Math.random() < bugChance) {
          store.addDevBugs(1);
        }
      }
    } else {
      // Solo dev in garage — slow baseline progress
      const soloRate = GAME_CONFIG.baseDevProgressPerTick * 0.3 * crunchMultiplier;
      const pillars = ['graphics', 'gameplay', 'sound', 'polish'] as const;
      for (const pillar of pillars) {
        store.contributePillarPoints(pillar, soloRate);
      }
    }
  }

  // 3. Active game processing — accumulate all mutations locally, write once
  const game = state.currentGame;
  if (game && game.phase !== 'retired') {
    const platforms = game.platformReleases.map((pr) => ({ ...pr }));
    let tickRevenue = 0;
    let newGameFans = 0;
    let newStudioFans = 0;
    let phase = game.phase;
    let phaseTicks = game.phaseTicks + 1;
    const newBugs: Bug[] = [];

    // --- Sales ---
    const saleRate = getSaleRatePerTick(game, state);
    const copiesSold = Math.max(0, Math.round(saleRate * 100) / 100);

    const doubleSaleChance = getUpgradeMultiplier(
      'doubleSaleChance',
      state.unlockedStudioUpgrades,
      game.unlockedGameUpgrades
    ) - 1;
    let actualCopies = copiesSold;
    if (doubleSaleChance > 0 && Math.random() < doubleSaleChance) {
      actualCopies *= 2;
    }

    if (actualCopies > 0) {
      const platformCount = platforms.length || 1;
      const copiesPerPlatform = actualCopies / platformCount;

      for (const pr of platforms) {
        const netRevenue = copiesPerPlatform * game.gamePrice * (1 - pr.revenueCut);
        tickRevenue += netRevenue;
        pr.totalCopiesSold += copiesPerPlatform;
        pr.activePlayers += copiesPerPlatform * 0.5;
      }

      const fans = calculateFanConversion(
        actualCopies,
        state.unlockedStudioUpgrades,
        game.unlockedGameUpgrades
      );
      newGameFans += fans.newGameFans;
      newStudioFans += fans.newStudioFans;
    }

    // --- Player decay ---
    const totalPlayers = platforms.reduce((sum, p) => sum + p.activePlayers, 0);
    let playerDecayRate = 0;
    if (game.phase === 'decline') {
      const declineMultiplier = getUpgradeMultiplier(
        'declineRateMultiplier',
        state.unlockedStudioUpgrades,
        game.unlockedGameUpgrades
      );
      playerDecayRate = 0.002 * declineMultiplier;
    } else if (game.phase === 'peak') {
      playerDecayRate = 0.0005;
    }

    const loadByRegion = getLoadByRegion({ ...game, platformReleases: platforms });
    const overloaded = Object.entries(loadByRegion)
      .filter(([, load]) => isRegionOverloaded(load))
      .map(([regionId]) => regionId);
    const overloadLoss = calculatePlayerLossFromOverload(totalPlayers, overloaded);

    if (playerDecayRate > 0 || overloadLoss > 0) {
      const decayLoss = totalPlayers * playerDecayRate;
      const totalLoss = decayLoss + overloadLoss;
      const platformCount = platforms.length || 1;
      const lossPerPlatform = totalLoss / platformCount;
      for (const pr of platforms) {
        pr.activePlayers = Math.max(0, pr.activePlayers - lossPerPlatform);
      }
    }

    // --- Bug spawning ---
    const bugRateMultiplier = getBugRateMultiplier(state.employees);
    const bugUpgradeMultiplier = getUpgradeMultiplier(
      'bugRateMultiplier',
      state.unlockedStudioUpgrades,
      game.unlockedGameUpgrades
    );
    const bugChance = (GAME_CONFIG.bugBaseRatePerTick + totalPlayers * GAME_CONFIG.bugPlayerScaling) *
      bugRateMultiplier * bugUpgradeMultiplier;

    if (Math.random() < bugChance) {
      const severity = randomBugSeverity();
      newBugs.push({
        id: generateBugId(),
        severity,
        name: randomBugName(),
        fixCost: Math.round(GAME_CONFIG.bugFixBaseCost * severityCostMultiplier(severity)),
        fixTimeHours: Math.round(GAME_CONFIG.bugFixBaseHours * severityCostMultiplier(severity)),
        fixProgressHours: 0,
        spawnedAt: Date.now(),
      });
    }

    // --- Phase progression ---
    const maxTicks = getLifecyclePhaseTicks(
      game.phase,
      state.unlockedStudioUpgrades,
      game.unlockedGameUpgrades
    );

    if (phaseTicks >= maxTicks) {
      if (phase === 'growth') phase = 'peak';
      else if (phase === 'peak') phase = 'decline';
      phaseTicks = 0;
    }

    // --- Single atomic write for all game state changes ---
    store.updateCurrentGame({
      platformReleases: platforms,
      totalRevenue: game.totalRevenue + tickRevenue,
      phase,
      phaseTicks,
      bugs: newBugs.length > 0 ? [...game.bugs, ...newBugs] : game.bugs,
    });

    if (tickRevenue > 0) store.earnMoney(tickRevenue);
    if (newGameFans > 0) store.addGameFans(newGameFans);
    if (newStudioFans > 0) store.addStudioFans(newStudioFans);

    // Research points (earned while game is online)
    const researchPerTick = GAME_CONFIG.researchPointsPerGameDay / 24;
    if (researchPerTick > 0) {
      store.addResearchPoints(researchPerTick);
    }
  }

  // 4. Bankruptcy check
  if (store.money <= GAME_CONFIG.bankruptcyThreshold) {
    store.setBankrupt();
  }
}

function handleMonthEnd(store: GameStore): void {
  const state = store;
  const report = buildMonthlyReport(state);

  // Add income line item for the month
  if (state.currentGame) {
    report.lineItems.unshift({
      label: 'Game revenue',
      amount: state.currentGame.totalRevenue,
    });
    report.income = state.currentGame.totalRevenue;
  }

  report.netCashFlow = report.income - report.employeeCosts - report.computeCosts - report.devOverheadCosts;

  // Deduct monthly costs atomically
  const totalCosts = getTotalMonthlyCosts(state);
  store.spendMoney(totalCosts);

  store.setMonthEndReport(report);
}
