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
import type { Bug, BugSeverity, RegionId } from './types';

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

function getRegionalSaleWeights(game: { servers: { regionId: string }[]; mode: string }): Record<string, number> {
  const weights: Record<string, number> = {};
  let total = 0;
  for (const region of SERVER_CONFIG.regions) {
    const hasServer = game.servers.some((s) => s.regionId === region.id);
    const w = region.playerDemandWeight * (game.mode === 'multiplayer' && hasServer ? 10 : 1);
    weights[region.id] = w;
    total += w;
  }
  if (total > 0) {
    for (const key of Object.keys(weights)) weights[key] /= total;
  }
  return weights;
}

function pickWeightedRegion(weights: Record<string, number>): string {
  const roll = Math.random();
  let cumulative = 0;
  for (const [region, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll < cumulative) return region;
  }
  return 'us-east';
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

  // 2. Development progress via employee contributions (only dev-assigned employees)
  const devEmployees = state.employees.filter((e) => e.assignment === 'development');
  const bugfixEmployees = state.employees.filter((e) => e.assignment === 'bugfix');

  if (state.gameInDevelopment && state.gameInDevelopment.progressPercent < 100) {
    const dev = state.gameInDevelopment;
    const crunchMultiplier = dev.isCrunching ? GAME_CONFIG.crunchSpeedMultiplier : 1;

    if (devEmployees.length > 0) {
      for (const emp of devEmployees) {
        const contrib = getEmployeePillarContribution(emp);
        const pillars = ['graphics', 'gameplay', 'sound', 'polish'] as const;

        for (const pillar of pillars) {
          const points = contrib[pillar] * crunchMultiplier * 0.1;
          if (points > 0) {
            store.contributePillarPoints(pillar, points);
          }
        }

        const bugChance = getBugChancePerContribution(emp) * (dev.isCrunching ? 1.5 : 1);
        if (Math.random() < bugChance) {
          store.addDevBugs(1);
        }
      }
    } else {
      const soloRate = GAME_CONFIG.baseDevProgressPerTick * 0.3 * crunchMultiplier;
      const pillars = ['graphics', 'gameplay', 'sound', 'polish'] as const;
      for (const pillar of pillars) {
        store.contributePillarPoints(pillar, soloRate);
      }
    }
  }

  // 2b. Bugfix employees auto-fix bugs on the active game
  if (state.currentGame && bugfixEmployees.length > 0 && state.currentGame.bugs.length > 0) {
    const totalDevelSkill = bugfixEmployees.reduce((sum, e) => sum + e.skills.devel, 0);
    const fixRate = totalDevelSkill / GAME_CONFIG.bugfixTicksPerDevelPoint;
    if (Math.random() < fixRate) {
      const oldestBug = state.currentGame.bugs[0];
      if (oldestBug) {
        store.removeBug(oldestBug.id);
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
    const regionalFansDelta: Record<string, number> = {};
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

      // Distribute fans across regions weighted by server presence
      const regionWeights = getRegionalSaleWeights(game);
      const totalNewFans = fans.newGameFans;
      for (let i = 0; i < Math.ceil(totalNewFans); i++) {
        const region = pickWeightedRegion(regionWeights);
        regionalFansDelta[region] = (regionalFansDelta[region] ?? 0) + 1;
      }
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

    // Server overload only matters for multiplayer games
    let overloadLoss = 0;
    let avgLatency = 0;
    if (game.mode === 'multiplayer' && game.servers.length > 0) {
      const loadByRegion = getLoadByRegion({ ...game, platformReleases: platforms });
      const overloaded = Object.entries(loadByRegion)
        .filter(([, load]) => isRegionOverloaded(load))
        .map(([regionId]) => regionId);
      overloadLoss = calculatePlayerLossFromOverload(totalPlayers, overloaded);

      // Average latency across active regions
      let latencySum = 0;
      let latencyCount = 0;
      for (const region of SERVER_CONFIG.regions) {
        const hasServer = game.servers.some((s) => s.regionId === region.id);
        if (hasServer) {
          const baseLat = region.latencyTier === 1 ? 25 : region.latencyTier === 2 ? 80 : 150;
          const load = loadByRegion[region.id] ?? 0;
          latencySum += baseLat * (1 + Math.max(0, load - 0.5));
          latencyCount++;
        }
      }
      avgLatency = latencyCount > 0 ? Math.round(latencySum / latencyCount) : 0;
    }

    if (playerDecayRate > 0 || overloadLoss > 0) {
      const decayLoss = totalPlayers * playerDecayRate;
      const totalLoss = decayLoss + overloadLoss;
      const platformCount = platforms.length || 1;
      const lossPerPlatform = totalLoss / platformCount;
      for (const pr of platforms) {
        pr.activePlayers = Math.max(0, pr.activePlayers - lossPerPlatform);
      }
    }

    // --- Bug spawning with decay ---
    let bugRateDecay = game.bugRateDecay;
    // Decay once per game-day (every 24 ticks)
    if (phaseTicks % 24 === 0) {
      bugRateDecay = Math.max(GAME_CONFIG.bugMinDecay, bugRateDecay * GAME_CONFIG.bugDecayPerDay);
    }

    const bugRateMultiplier = getBugRateMultiplier(state.employees);
    const bugUpgradeMultiplier = getUpgradeMultiplier(
      'bugRateMultiplier',
      state.unlockedStudioUpgrades,
      game.unlockedGameUpgrades
    );
    const bugChance = (GAME_CONFIG.bugBaseRatePerTick + totalPlayers * GAME_CONFIG.bugPlayerScaling) *
      bugRateMultiplier * bugUpgradeMultiplier * bugRateDecay;

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

    // --- Merge regional fan deltas ---
    const mergedRegionalFans = { ...game.regionalFans };
    for (const [region, count] of Object.entries(regionalFansDelta)) {
      mergedRegionalFans[region as RegionId] = (mergedRegionalFans[region as RegionId] ?? 0) + count;
    }

    // --- Single atomic write for all game state changes ---
    store.updateCurrentGame({
      platformReleases: platforms,
      totalRevenue: game.totalRevenue + tickRevenue,
      phase,
      phaseTicks,
      bugs: newBugs.length > 0 ? [...game.bugs, ...newBugs] : game.bugs,
      bugRateDecay,
      regionalFans: mergedRegionalFans,
      averageLatencyMs: avgLatency,
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

  if (state.currentGame) {
    report.lineItems.unshift({
      label: 'Game revenue',
      amount: state.currentGame.totalRevenue,
    });
    report.income = state.currentGame.totalRevenue;

    // Snapshot monthly metrics for the popularity chart
    const totalPlayers = state.currentGame.platformReleases.reduce((sum, p) => sum + p.activePlayers, 0);
    const totalSold = state.currentGame.platformReleases.reduce((sum, p) => sum + p.totalCopiesSold, 0);
    const prevSold = state.currentGame.monthlyHistory.length > 0
      ? state.currentGame.monthlyHistory[state.currentGame.monthlyHistory.length - 1].copiesSold
      : 0;

    store.updateCurrentGame({
      monthlyHistory: [
        ...state.currentGame.monthlyHistory,
        {
          month: report.month,
          year: report.year,
          copiesSold: Math.floor(totalSold - prevSold),
          activePlayers: Math.floor(totalPlayers),
          revenue: Math.floor(state.currentGame.totalRevenue),
        },
      ],
    });
  }

  report.netCashFlow = report.income - report.employeeCosts - report.computeCosts - report.devOverheadCosts;

  const totalCosts = getTotalMonthlyCosts(state);
  store.spendMoney(totalCosts);

  store.setMonthEndReport(report);
}
