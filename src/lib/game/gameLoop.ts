import { useGameStore, type GameStore } from '@/lib/store/gameStore';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { SERVER_CONFIG } from '@/lib/config/serverConfig';
import {
  getSaleRatePerTick,
  getBugRateMultiplier,
  getUpgradeMultiplier,
  getLifecyclePhaseTicks,
} from './calculations';
import { calculateFanConversion } from './fanSystem';
import { buildMonthlyReport, getTotalMonthlyCosts } from './calendarSystem';
import { getEmployeePillarContribution, getBugChancePerContribution, generateCandidatePool } from './employeeSystem';
import type { Bug, BugSeverity, RegionId, StaffContribution, ActiveGame } from './types';

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

function getRegionalSaleWeights(game: ActiveGame, servers: { regionId: string }[]): Record<string, number> {
  const weights: Record<string, number> = {};
  let total = 0;
  for (const region of SERVER_CONFIG.regions) {
    const hasServer = servers.some((s) => s.regionId === region.id);
    const w = region.playerDemandWeight * (game.mode === 'liveservice' && hasServer ? 10 : 1);
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

export function processTick(store: GameStore): void {
  const state = store;

  if (state.calendar.speed === 0) return;
  if (state.isBankrupt) return;

  // 1. Advance calendar
  store.advanceTick();
  const fresh = useGameStore.getState();
  if (fresh.calendar.monthEndPending) {
    handleMonthEnd(fresh as GameStore);
    return;
  }

  // Weekly candidate pool refresh
  if (fresh.calendar.hour === 0 && fresh.calendar.day % 7 === 1) {
    const currentDay = fresh.calendar.day + (fresh.calendar.month - 1) * 30 + (fresh.calendar.year - 2040) * 360;
    if (currentDay > fresh.lastCandidateRefreshDay) {
      store.setCandidatePool(generateCandidatePool());
      store.refreshCandidatePool();
    }
  }

  // 2. Process all active tasks (dev contributions)
  const contribs: StaffContribution[] = [];

  for (const task of state.activeTasks) {
    if (task.progressPercent >= 100 && task.type !== 'patch') continue;

    const crunchMultiplier = task.isCrunching ? GAME_CONFIG.crunchSpeedMultiplier : 1;

    // Get employees assigned to this task (or auto-assign unassigned ones)
    let taskEmployees = state.employees.filter((e) => e.assignedTaskId === task.id);
    if (task.autoAssign) {
      const unassigned = state.employees.filter((e) => e.assignedTaskId === null && e.assignedTaskId !== 'bugfix');
      taskEmployees = [...taskEmployees, ...unassigned];
    }

    if (taskEmployees.length > 0) {
      for (const emp of taskEmployees) {
        const contrib = getEmployeePillarContribution(emp);
        const pillars = ['graphics', 'gameplay', 'sound', 'polish'] as const;
        const c: StaffContribution = {
          employeeId: emp.id, employeeName: emp.name,
          taskId: task.id, taskName: task.name,
          graphics: 0, gameplay: 0, sound: 0, polish: 0,
          bugsIntroduced: 0, bugsFixed: 0,
        };

        for (const pillar of pillars) {
          const points = contrib[pillar] * crunchMultiplier * 0.1;
          if (points > 0) {
            store.contributeToTask(task.id, pillar, points);
            c[pillar] += points;
          }
        }

        const bugChance = getBugChancePerContribution(emp) * (task.isCrunching ? 1.5 : 1);
        if (Math.random() < bugChance) {
          store.addTaskBugs(task.id, 1);
          c.bugsIntroduced += 1;
        }

        contribs.push(c);
      }
    } else {
      // Solo dev fallback
      const soloRate = GAME_CONFIG.baseDevProgressPerTick * 0.3 * crunchMultiplier;
      const pillars = ['graphics', 'gameplay', 'sound', 'polish'] as const;
      for (const pillar of pillars) {
        store.contributeToTask(task.id, pillar, soloRate);
      }
    }
  }

  // Check for completed patch tasks — auto-reset
  const freshAfterTasks = useGameStore.getState();
  for (const task of freshAfterTasks.activeTasks) {
    if (task.type === 'patch' && task.progressPercent >= 100) {
      store.resetPatchTask(task.id);
      // Boost the target game's player retention
      if (task.targetGameId) {
        const targetGame = freshAfterTasks.activeGames.find((g) => g.id === task.targetGameId);
        if (targetGame) {
          store.updateGame(task.targetGameId, {
            isLiveService: true,
            bugRateDecay: Math.min(1.0, targetGame.bugRateDecay + 0.1),
          });
        }
      }
    }
  }

  // 2b. Bugfix employees auto-fix bugs
  const bugfixEmployees = state.employees.filter((e) => e.assignedTaskId === 'bugfix');
  if (bugfixEmployees.length > 0) {
    for (const game of state.activeGames) {
      if (game.bugs.length > 0) {
        const totalDevelSkill = bugfixEmployees.reduce((sum, e) => sum + e.skills.devel, 0);
        const fixRate = totalDevelSkill / GAME_CONFIG.bugfixTicksPerDevelPoint;
        if (Math.random() < fixRate) {
          const oldestBug = game.bugs[0];
          if (oldestBug) {
            store.removeBug(game.id, oldestBug.id);
          }
        }
        break; // fix bugs on first game with bugs
      }
    }
  }

  // Blend contributions with previous
  const prev = state.staffContributions;
  const blendFactor = 0.95;
  const merged = contribs.map((nc) => {
    const p = prev.find((pc) => pc.employeeId === nc.employeeId && pc.taskId === nc.taskId);
    if (!p) return nc;
    return {
      ...nc,
      graphics: p.graphics * blendFactor + nc.graphics,
      gameplay: p.gameplay * blendFactor + nc.gameplay,
      sound: p.sound * blendFactor + nc.sound,
      polish: p.polish * blendFactor + nc.polish,
      bugsIntroduced: p.bugsIntroduced * blendFactor + nc.bugsIntroduced,
      bugsFixed: p.bugsFixed * blendFactor + nc.bugsFixed,
    };
  });
  store.updateStaffContributions(merged);

  // 3. Process all active games
  let totalTickRevenue = 0;
  let totalNewFans = 0;
  let totalRP = 0;

  for (const game of state.activeGames) {
    if (game.phase === 'retired') continue;

    const platforms = game.platformReleases.map((pr) => ({ ...pr }));
    let tickRevenue = 0;
    let newGameFans = 0;
    let newStudioFans = 0;
    const regionalFansDelta: Record<string, number> = {};
    let phase = game.phase;
    let phaseTicks = game.phaseTicks + 1;
    const newBugs: Bug[] = [];

    // Sales
    const saleRate = getSaleRatePerTick(game, state);
    let actualCopies = Math.max(0, Math.round(saleRate * 100) / 100);
    const doubleSaleChance = getUpgradeMultiplier('doubleSaleChance', state.unlockedStudioUpgrades, game.unlockedGameUpgrades) - 1;
    if (doubleSaleChance > 0 && Math.random() < doubleSaleChance) actualCopies *= 2;

    if (actualCopies > 0) {
      const platformCount = platforms.length || 1;
      const copiesPerPlatform = actualCopies / platformCount;
      for (const pr of platforms) {
        const netRevenue = copiesPerPlatform * game.gamePrice * (1 - pr.revenueCut);
        tickRevenue += netRevenue;
        pr.totalCopiesSold += copiesPerPlatform;
        pr.activePlayers += copiesPerPlatform * 0.5;
      }
      const fans = calculateFanConversion(actualCopies, state.unlockedStudioUpgrades, game.unlockedGameUpgrades);
      newGameFans += fans.newGameFans;
      newStudioFans += fans.newStudioFans;

      const regionWeights = getRegionalSaleWeights(game, state.servers);
      for (let i = 0; i < Math.ceil(fans.newGameFans); i++) {
        const region = pickWeightedRegion(regionWeights);
        regionalFansDelta[region] = (regionalFansDelta[region] ?? 0) + 1;
      }
    }

    // Player decay
    const totalPlayers = platforms.reduce((sum, p) => sum + p.activePlayers, 0);
    let playerDecayRate = 0;
    if (game.phase === 'decline') {
      const declineMultiplier = getUpgradeMultiplier('declineRateMultiplier', state.unlockedStudioUpgrades, game.unlockedGameUpgrades);
      playerDecayRate = 0.002 * declineMultiplier;
      if (game.isLiveService) playerDecayRate *= GAME_CONFIG.liveServiceDeclineSlowdown;
    } else if (game.phase === 'peak') {
      playerDecayRate = 0.0005;
    }

    if (playerDecayRate > 0) {
      const decayLoss = totalPlayers * playerDecayRate;
      const platformCount = platforms.length || 1;
      const lossPerPlatform = decayLoss / platformCount;
      for (const pr of platforms) {
        pr.activePlayers = Math.max(0, pr.activePlayers - lossPerPlatform);
      }
    }

    // Bug spawning with decay
    let bugRateDecay = game.bugRateDecay;
    if (phaseTicks % 24 === 0) {
      bugRateDecay = Math.max(GAME_CONFIG.bugMinDecay, bugRateDecay * GAME_CONFIG.bugDecayPerDay);
    }
    const bugRateMultiplier = getBugRateMultiplier(state.employees);
    const bugUpgradeMultiplier = getUpgradeMultiplier('bugRateMultiplier', state.unlockedStudioUpgrades, game.unlockedGameUpgrades);
    const bugChance = (GAME_CONFIG.bugBaseRatePerTick + totalPlayers * GAME_CONFIG.bugPlayerScaling) *
      bugRateMultiplier * bugUpgradeMultiplier * bugRateDecay;
    if (Math.random() < bugChance) {
      const severity = randomBugSeverity();
      newBugs.push({
        id: generateBugId(), gameId: game.id, severity,
        name: randomBugName(),
        fixCost: Math.round(GAME_CONFIG.bugFixBaseCost * severityCostMultiplier(severity)),
        fixTimeHours: Math.round(GAME_CONFIG.bugFixBaseHours * severityCostMultiplier(severity)),
        fixProgressHours: 0, spawnedAt: Date.now(),
      });
    }

    // Phase progression
    const maxTicks = getLifecyclePhaseTicks(game.phase, state.unlockedStudioUpgrades, game.unlockedGameUpgrades);
    if (phaseTicks >= maxTicks) {
      if (phase === 'growth') phase = 'peak';
      else if (phase === 'peak') phase = 'decline';
      phaseTicks = 0;
    }

    const mergedRegionalFans = { ...game.regionalFans };
    for (const [region, count] of Object.entries(regionalFansDelta)) {
      mergedRegionalFans[region as RegionId] = (mergedRegionalFans[region as RegionId] ?? 0) + count;
    }

    store.updateGame(game.id, {
      platformReleases: platforms,
      totalRevenue: game.totalRevenue + tickRevenue,
      phase, phaseTicks,
      bugs: newBugs.length > 0 ? [...game.bugs, ...newBugs] : game.bugs,
      bugRateDecay,
      regionalFans: mergedRegionalFans,
    });

    if (tickRevenue > 0) store.earnMoney(tickRevenue);
    if (newGameFans > 0) store.addGameFans(game.id, newGameFans);
    if (newStudioFans > 0) store.addStudioFans(newStudioFans);

    totalTickRevenue += tickRevenue;
    totalNewFans += newGameFans + newStudioFans;

    const researchPerTick = GAME_CONFIG.researchPointsPerGameDay / 24;
    if (researchPerTick > 0) {
      store.addResearchPoints(researchPerTick);
      totalRP += researchPerTick;
    }
  }

  // Daily rate tracking
  const monthlyCosts = getTotalMonthlyCosts(state);
  const hourlyCostRate = monthlyCosts / (30 * 24);
  store.trackDailyRate(totalTickRevenue - hourlyCostRate, totalNewFans, totalRP);

  // Bankruptcy check
  if (store.money <= GAME_CONFIG.bankruptcyThreshold) {
    store.setBankrupt();
  }
}

function handleMonthEnd(store: GameStore): void {
  const state = store;
  const report = buildMonthlyReport(state);

  let totalMonthlyRevenue = 0;
  for (const game of state.activeGames) {
    if (game.phase === 'retired') continue;
    const totalPlayers = game.platformReleases.reduce((sum, p) => sum + p.activePlayers, 0);
    const totalSold = game.platformReleases.reduce((sum, p) => sum + p.totalCopiesSold, 0);
    const history = game.monthlyHistory;
    const prevRevenue = history.length > 0 ? history[history.length - 1].revenue : 0;
    const prevSold = history.length > 0 ? history[history.length - 1].copiesSold : 0;
    const monthlyRevenue = Math.max(0, game.totalRevenue - prevRevenue);
    totalMonthlyRevenue += monthlyRevenue;

    report.lineItems.push({ label: `Revenue: ${game.name}`, amount: monthlyRevenue });

    store.updateGame(game.id, {
      monthlyHistory: [
        ...history,
        {
          month: report.month, year: report.year,
          copiesSold: Math.floor(totalSold - prevSold),
          activePlayers: Math.floor(totalPlayers),
          revenue: game.totalRevenue,
        },
      ],
    });
  }

  report.income = totalMonthlyRevenue;
  report.netCashFlow = report.income - report.employeeCosts - report.computeCosts - report.devOverheadCosts;

  const totalCosts = getTotalMonthlyCosts(state);
  store.spendMoney(totalCosts);
  store.pushMonthlyReport(report);
  store.dismissMonthEnd();
}
