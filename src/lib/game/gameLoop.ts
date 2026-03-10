import { useGameStore, type GameStore } from '@/lib/store/gameStore';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { CALENDAR_CONFIG } from '@/lib/config/calendarConfig';
import { SERVER_CONFIG } from '@/lib/config/serverConfig';
import {
  getSaleRatePerTick,
  getBugRateMultiplier,
  getUpgradeMultiplier,
  getLifecyclePhaseTicks,
} from './calculations';
import { calculateFanConversion } from './fanSystem';
import { buildMonthlyReport, getTotalMonthlyCosts } from './calendarSystem';
import { getEmployeePillarContribution, getBugChancePerContribution, generateCandidatePool, getStaminaEfficiency, drainStamina, processVacationDay } from './employeeSystem';
import { EMPLOYEE_CONFIG } from '@/lib/config/employeeConfig';
import type { Bug, BugSeverity, RegionId, StaffContribution, ActiveGame, DevPhase, PhaseCategories, StudioTask } from './types';
import { PHASE_CATEGORIES } from './types';

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

const isNewDay = (cal: { tickInDay: number }) => cal.tickInDay === 0;

function processPhaseProgress(task: StudioTask, employeeCount: number, crunchMultiplier: number, efficiency: number): Partial<StudioTask> {
  if (!task.currentPhase || !task.phaseProgress || !task.phaseWeights || !task.developmentDaysTarget) return {};

  const phase = task.currentPhase;
  const categories = PHASE_CATEGORIES[phase];
  const ticksInPhase = (task.ticksInCurrentPhase ?? 0) + 1;
  const daysElapsed = (task.developmentDaysElapsed ?? 0) + 0.25;
  const phaseDays = task.developmentDaysTarget / 3;
  const phaseTicks = phaseDays * 4;

  const newProgress = { ...task.phaseProgress };

  for (const cat of categories) {
    const weight = task.phaseWeights[cat] / 100;
    const basePoints = (0.5 + Math.random() * 0.5) * weight * employeeCount * crunchMultiplier * efficiency;
    newProgress[cat] = (newProgress[cat] ?? 0) + basePoints;
  }

  let newPhase = phase;
  let newTicksInPhase = ticksInPhase;

  if (ticksInPhase >= phaseTicks && phase < 3) {
    newPhase = (phase + 1) as DevPhase;
    newTicksInPhase = 0;
  }

  const totalProgress = (daysElapsed / task.developmentDaysTarget) * 100;

  return {
    currentPhase: newPhase,
    phaseProgress: newProgress,
    ticksInCurrentPhase: newTicksInPhase,
    developmentDaysElapsed: daysElapsed,
    progressPercent: Math.min(100, totalProgress),
  };
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

  // Weekly candidate pool refresh (on day boundaries, every 7 days)
  if (isNewDay(fresh.calendar) && fresh.calendar.day % 7 === 1) {
    const currentDay = fresh.calendar.day + (fresh.calendar.month - 1) * 30 + (fresh.calendar.year - 1) * 360;
    if (currentDay > fresh.lastCandidateRefreshDay) {
      store.setCandidatePool(generateCandidatePool());
      store.refreshCandidatePool();
    }
  }

  // 1b. Process employee stamina and vacations (once per day)
  if (isNewDay(fresh.calendar)) {
    const updatedEmployees = fresh.employees.map((emp) => {
      if (emp.onVacation) {
        const result = processVacationDay(emp.vacationDaysLeft, emp.stamina);
        return {
          ...emp,
          stamina: result.stamina,
          vacationDaysLeft: result.vacationDaysLeft,
          onVacation: result.onVacation,
          activity: result.onVacation ? emp.activity : 'idle' as const,
        };
      }
      return emp;
    });
    store.updateEmployees(updatedEmployees);
  }

  // Resolve auto-assigned employees to the first incomplete task
  {
    const latestState = useGameStore.getState();
    const firstIncompleteTask = latestState.activeTasks.find(
      (t) => t.progressPercent < 100 || t.type === 'patch'
    );
    const hasWork = !!firstIncompleteTask;
    const updatedEmps = latestState.employees.map((emp) => {
      if (!emp.autoAssign || emp.onVacation) return emp;
      const activity = hasWork ? 'developing' as const : 'idle' as const;
      return { ...emp, activity };
    });
    store.updateEmployees(updatedEmps);
  }

  // Drain stamina for working employees each tick
  {
    const latestState = useGameStore.getState();
    const staminaUpdated = latestState.employees.map((emp) => {
      if (emp.onVacation || emp.activity === 'idle') return emp;
      const isCrunching = latestState.activeTasks.some((t) => t.id === emp.assignedTaskId && t.isCrunching);
      return { ...emp, stamina: drainStamina(emp.stamina, isCrunching) };
    });
    store.updateEmployees(staminaUpdated);
  }

  // 2. Process all active tasks (dev contributions)
  const TICK_SCALE = 6;
  const contribs: StaffContribution[] = [];
  const currentEmployees = useGameStore.getState().employees;
  const autoAssignedEmployees = currentEmployees.filter((e) => e.autoAssign && !e.onVacation && e.assignedTaskId === null);
  let autoAssignedUsed = false;

  for (const task of state.activeTasks) {
    if (task.progressPercent >= 100 && task.type !== 'patch') continue;

    const crunchMultiplier = task.isCrunching ? GAME_CONFIG.crunchSpeedMultiplier : 1;

    let taskEmployees = currentEmployees.filter((e) => e.assignedTaskId === task.id && !e.onVacation);
    if (!autoAssignedUsed && autoAssignedEmployees.length > 0) {
      taskEmployees = [...taskEmployees, ...autoAssignedEmployees];
      autoAssignedUsed = true;
    }

    // Engine bonus for game tasks
    const engine = task.engineId ? state.engines.find((e) => e.id === task.engineId) : null;
    const engineBonus = engine?.completedAt ? {
      graphics: 1 + engine.graphicsBonus,
      gameplay: 1 + engine.gameplayBonus,
      sound: 1 + engine.soundBonus,
      polish: 1 + engine.polishBonus,
    } : { graphics: 1, gameplay: 1, sound: 1, polish: 1 };

    if (taskEmployees.length > 0) {
      for (const emp of taskEmployees) {
        const efficiency = getStaminaEfficiency(emp.stamina);
        const contrib = getEmployeePillarContribution(emp);
        const pillars = ['graphics', 'gameplay', 'sound', 'polish'] as const;
        const c: StaffContribution = {
          employeeId: emp.id, employeeName: emp.name,
          taskId: task.id, taskName: task.name,
          graphics: 0, gameplay: 0, sound: 0, polish: 0,
          bugsIntroduced: 0, bugsFixed: 0,
        };

        for (const pillar of pillars) {
          const points = contrib[pillar] * crunchMultiplier * efficiency * engineBonus[pillar] * 0.1 * TICK_SCALE;
          if (points > 0) {
            store.contributeToTask(task.id, pillar, points);
            c[pillar] += points;
          }
        }

        const bugChance = getBugChancePerContribution(emp) * (task.isCrunching ? 1.5 : 1) * TICK_SCALE;
        if (Math.random() < bugChance) {
          const severity = randomBugSeverity();
          store.addTaskBug(task.id, {
            id: generateBugId(), gameId: task.id, severity,
            name: randomBugName(),
            fixCost: Math.round(GAME_CONFIG.bugFixBaseCost * severityCostMultiplier(severity)),
            fixTarget: GAME_CONFIG.bugFixTargets[severity],
            fixProgress: 0, assignedFixerId: null, spawnedAt: Date.now(),
          });
          c.bugsIntroduced += 1;
        }

        contribs.push(c);
      }
    } else {
      const soloRate = GAME_CONFIG.baseDevProgressPerTick * 0.3 * crunchMultiplier * TICK_SCALE;
      const pillars = ['graphics', 'gameplay', 'sound', 'polish'] as const;
      for (const pillar of pillars) {
        store.contributeToTask(task.id, pillar, soloRate);
      }
    }

    // Advance phase-based development for game tasks
    if (task.currentPhase && task.phaseProgress) {
      const empCount = Math.max(1, taskEmployees.length);
      const avgEfficiency = taskEmployees.length > 0
        ? taskEmployees.reduce((sum, e) => sum + getStaminaEfficiency(e.stamina), 0) / taskEmployees.length
        : 0.5;
      const phaseUpdates = processPhaseProgress(task, empCount, crunchMultiplier, avgEfficiency);
      if (Object.keys(phaseUpdates).length > 0) {
        store.updateTask(task.id, phaseUpdates);
      }
    }
  }

  // Check for completed patch tasks — auto-reset; check engine tasks — complete engine
  const freshAfterTasks = useGameStore.getState();
  for (const task of freshAfterTasks.activeTasks) {
    if (task.type === 'patch' && task.progressPercent >= 100) {
      store.resetPatchTask(task.id);
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
    if (task.type === 'engine' && task.progressPercent >= 100 && task.targetGameId) {
      const engine = freshAfterTasks.engines.find((e) => e.id === task.targetGameId);
      if (engine) {
        const versionMatch = task.name.match(/v(\d+)/);
        const newVersion = versionMatch ? parseInt(versionMatch[1], 10) : engine.version + 1;
        const bonusPerVersion = 0.05;
        store.updateEngine(engine.id, {
          version: newVersion,
          graphicsBonus: newVersion * bonusPerVersion,
          soundBonus: newVersion * bonusPerVersion,
          gameplayBonus: newVersion * bonusPerVersion,
          polishBonus: newVersion * bonusPerVersion,
          completedAt: { year: fresh.calendar.year, month: fresh.calendar.month, day: fresh.calendar.day },
        });
      }
      store.removeTask(task.id);
    }
  }

  // 2c. Auto-fix pre-release bugs on completed game tasks
  const freshForAutofix = useGameStore.getState();
  for (const task of freshForAutofix.activeTasks) {
    if (task.type !== 'game' || task.progressPercent < 100 || !task.bugs?.length) continue;
    const idleEmployees = freshForAutofix.employees.filter(
      (e) => (e.assignedTaskId === null || e.assignedTaskId === task.id) && !e.onVacation
    );
    if (idleEmployees.length === 0) continue;

    let empIdx = 0;
    const updatedBugs = [...task.bugs];
    const bugsToRemove: string[] = [];

    for (let i = 0; i < updatedBugs.length && empIdx < idleEmployees.length; i++) {
      const bug = updatedBugs[i];
      const fixer = idleEmployees[empIdx];
      const eff = getStaminaEfficiency(fixer.stamina);
      const fixSkill = (fixer.skills.gameplay + fixer.skills.polish) / 2;
      const points = GAME_CONFIG.bugFixProgressPerTick * fixSkill * eff * TICK_SCALE;
      const progress = bug.fixProgress + points;
      if (progress >= bug.fixTarget) {
        bugsToRemove.push(bug.id);
        store.recordBugFix(fixer.id, bug.fixTarget);
      } else {
        updatedBugs[i] = { ...bug, fixProgress: progress, assignedFixerId: fixer.id };
      }
      empIdx++;
    }

    if (bugsToRemove.length > 0) {
      for (const bugId of bugsToRemove) {
        store.removeTaskBug(task.id, bugId);
      }
    } else if (empIdx > 0) {
      store.updateTask(task.id, { bugs: updatedBugs });
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
  const latestEmps = useGameStore.getState().employees;
  const bugfixEmployees = latestEmps.filter((e) => e.assignedTaskId === 'bugfix' && !e.onVacation);

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

    // Sales (with DLC boost)
    let saleRate = getSaleRatePerTick(game, state) * TICK_SCALE;
    if (game.dlcSalesBoost > 0) saleRate *= (1 + game.dlcSalesBoost);
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
      playerDecayRate = 0.002 * declineMultiplier * TICK_SCALE;
      if (game.isLiveService) playerDecayRate *= GAME_CONFIG.liveServiceDeclineSlowdown;
    } else if (game.phase === 'peak') {
      playerDecayRate = 0.0005 * TICK_SCALE;
    }

    if (playerDecayRate > 0) {
      const decayLoss = totalPlayers * playerDecayRate;
      const platformCount = platforms.length || 1;
      const lossPerPlatform = decayLoss / platformCount;
      for (const pr of platforms) {
        pr.activePlayers = Math.max(0, pr.activePlayers - lossPerPlatform);
      }
    }

    // Bug spawning with decay (decay once per day)
    let bugRateDecay = game.bugRateDecay;
    if (isNewDay(fresh.calendar)) {
      bugRateDecay = Math.max(GAME_CONFIG.bugMinDecay, bugRateDecay * GAME_CONFIG.bugDecayPerDay);
    }
    const bugRateMultiplier = getBugRateMultiplier(state.employees);
    const bugUpgradeMultiplier = getUpgradeMultiplier('bugRateMultiplier', state.unlockedStudioUpgrades, game.unlockedGameUpgrades);
    const bugChance = (GAME_CONFIG.bugBaseRatePerTick + totalPlayers * GAME_CONFIG.bugPlayerScaling) *
      bugRateMultiplier * bugUpgradeMultiplier * bugRateDecay * TICK_SCALE;
    if (Math.random() < bugChance) {
      const severity = randomBugSeverity();
      newBugs.push({
        id: generateBugId(), gameId: game.id, severity,
        name: randomBugName(),
        fixCost: Math.round(GAME_CONFIG.bugFixBaseCost * severityCostMultiplier(severity)),
        fixTarget: GAME_CONFIG.bugFixTargets[severity],
        fixProgress: 0, assignedFixerId: null, spawnedAt: Date.now(),
      });
    }

    // Bugfix employees fix released-game bugs (processed in same loop to avoid state overwrite)
    const allBugsForGame = [...game.bugs, ...newBugs];
    const bugsToRemove: string[] = [];
    const updatedBugs = [...allBugsForGame];
    if (bugfixEmployees.length > 0 && allBugsForGame.length > 0) {
      let empIdx = 0;
      for (let i = 0; i < updatedBugs.length && empIdx < bugfixEmployees.length; i++) {
        const bug = updatedBugs[i];
        const fixer = bugfixEmployees[empIdx];
        const efficiency = getStaminaEfficiency(fixer.stamina);
        const fixSkill = (fixer.skills.gameplay + fixer.skills.polish) / 2;
        const points = GAME_CONFIG.bugFixProgressPerTick * fixSkill * efficiency * TICK_SCALE;
        const progress = bug.fixProgress + points;
        if (progress >= bug.fixTarget) {
          bugsToRemove.push(bug.id);
          store.recordBugFix(fixer.id, bug.fixTarget);
        } else {
          updatedBugs[i] = { ...bug, fixProgress: progress, assignedFixerId: fixer.id };
        }
        empIdx++;
      }
    }
    const finalBugs = updatedBugs.filter((b) => !bugsToRemove.includes(b.id));

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

    // DLC sales boost decay (once per day)
    let dlcSalesBoost = game.dlcSalesBoost;
    if (dlcSalesBoost > 0 && isNewDay(fresh.calendar)) {
      dlcSalesBoost = Math.max(0, dlcSalesBoost - 0.02);
    }

    store.updateGame(game.id, {
      platformReleases: platforms,
      totalRevenue: game.totalRevenue + tickRevenue,
      phase, phaseTicks,
      bugs: finalBugs,
      bugRateDecay,
      regionalFans: mergedRegionalFans,
      dlcSalesBoost,
    });

    if (tickRevenue > 0) store.earnMoney(tickRevenue);
    if (newGameFans > 0) store.addGameFans(game.id, newGameFans);
    if (newStudioFans > 0) store.addStudioFans(newStudioFans);

    totalTickRevenue += tickRevenue;
    totalNewFans += newGameFans + newStudioFans;

    // Research: scale to per-tick (ticksPerDay ticks in a day)
    const researchPerTick = GAME_CONFIG.researchPointsPerGameDay / CALENDAR_CONFIG.ticksPerDay;
    if (researchPerTick > 0) {
      store.addResearchPoints(researchPerTick);
      totalRP += researchPerTick;
    }
  }

  // Daily rate tracking
  const monthlyCosts = getTotalMonthlyCosts(state);
  const costPerTick = monthlyCosts / (30 * CALENDAR_CONFIG.ticksPerDay);
  store.trackDailyRate(totalTickRevenue - costPerTick, totalNewFans, totalRP);

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
