import { useGameStore, type GameStore } from '@/lib/store/gameStore';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { CALENDAR_CONFIG } from '@/lib/config/calendarConfig';
import { SERVER_CONFIG } from '@/lib/config/serverConfig';
import { STUDIO_LEVEL_CONFIG } from '@/lib/config/studioLevelConfig';
import { CATEGORY_DEV_CONFIG } from '@/lib/config/categoryConfig';
import {
  getSaleRatePerTick,
  getBugRateMultiplier,
  getFullEffectMultiplier,
  getLifecyclePhaseTicks,
} from './calculations';
import { calculateFanConversion } from './fanSystem';
import { buildMonthlyReport, getTotalMonthlyCosts } from './calendarSystem';
import {
  getEmployeeCategoryContribution,
  getEmployeeResearchPower,
  getBugChancePerContribution,
  getStaminaEfficiency,
  drainStamina,
  processVacationDay,
  getEffectiveSkills,
} from './employeeSystem';
import type { Bug, BugSeverity, RegionId, StaffContribution, ActiveGame, DevPhase, PhaseCategories } from './types';
import { PHASE_CATEGORIES } from './types';
import { computeFurnitureBuffs, getBuffMultiplier } from './furnitureSystem';

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

export function processTick(store: GameStore): void {
  const state = store;

  if (state.calendar.speed === 0) return;
  if (state.isBankrupt) return;

  store.advanceTick();
  const fresh = useGameStore.getState();
  if (fresh.calendar.monthEndPending) {
    handleMonthEnd(fresh as GameStore);
    return;
  }

  const furnitureBuffs = computeFurnitureBuffs(state.furniture);
  const recoveryMult = getBuffMultiplier(furnitureBuffs, 'staminaRecovery');
  const drainMult = getBuffMultiplier(furnitureBuffs, 'staminaDrain');
  const devSpeedMult = getBuffMultiplier(furnitureBuffs, 'devSpeed');
  const bugFixMult = getBuffMultiplier(furnitureBuffs, 'bugFixSpeed');
  const researchMult = getBuffMultiplier(furnitureBuffs, 'researchSpeed');

  // Process employee stamina and vacations (once per day)
  if (isNewDay(fresh.calendar)) {
    const updatedEmployees = fresh.employees.map((emp) => {
      if (emp.onVacation) {
        const result = processVacationDay(emp.vacationDaysLeft, emp.stamina, recoveryMult);
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
      return { ...emp, stamina: drainStamina(emp.stamina, isCrunching, drainMult) };
    });
    store.updateEmployees(staminaUpdated);
  }

  // Process all active tasks
  const TICK_SCALE = CATEGORY_DEV_CONFIG.tickScale;
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

    // Research tasks: only researchers contribute
    if (task.type === 'research') {
      const researchers = taskEmployees.filter((e) => e.employeeType === 'researcher');
      if (researchers.length > 0) {
        for (const emp of researchers) {
          const efficiency = getStaminaEfficiency(emp.stamina);
          const researchPower = getEmployeeResearchPower(emp);
          const points = researchPower * efficiency * crunchMultiplier * researchMult *
            CATEGORY_DEV_CONFIG.researchRateConstant * CATEGORY_DEV_CONFIG.researchTickScale;
          store.contributeToResearch(task.id, points);
          contribs.push({
            employeeId: emp.id, employeeName: emp.name,
            taskId: task.id, taskName: task.name,
            categories: {}, researchPoints: points,
            bugsIntroduced: 0, bugsFixed: 0,
          });
        }
      } else {
        // Solo research (slow fallback)
        const soloRate = GAME_CONFIG.baseDevProgressPerTick * 0.2 * crunchMultiplier * TICK_SCALE;
        store.contributeToResearch(task.id, soloRate);
      }
      continue;
    }

    // Game/DLC/Patch/Engine tasks: 9-category contributions
    // Games use phased categories; other tasks work on all categories at once
    const ALL_CATS = Object.keys(task.categoryTargets) as (keyof PhaseCategories)[];
    const activeCategories = (task.type === 'game' && task.currentPhase)
      ? PHASE_CATEGORIES[task.currentPhase]
      : ALL_CATS;

    // Developer employees contribute (and non-typed employees for backward compat)
    const devEmployees = taskEmployees.filter((e) =>
      e.employeeType === 'developer' || !e.employeeType
    );

    if (devEmployees.length > 0) {
      for (const emp of devEmployees) {
        const efficiency = getStaminaEfficiency(emp.stamina);
        const c: StaffContribution = {
          employeeId: emp.id, employeeName: emp.name,
          taskId: task.id, taskName: task.name,
          categories: {}, researchPoints: 0,
          bugsIntroduced: 0, bugsFixed: 0,
        };

        for (const cat of activeCategories) {
          if (task.categoryTargets[cat] <= 0) continue;
          const catContrib = getEmployeeCategoryContribution(emp, cat);
          const points = catContrib * crunchMultiplier * efficiency * devSpeedMult *
            CATEGORY_DEV_CONFIG.rateConstant * TICK_SCALE;
          if (points > 0) {
            store.contributeToTask(task.id, cat, points);
            c.categories[cat] = (c.categories[cat] ?? 0) + points;
          }
        }

        // Bug introduction (skip for patches — they fix bugs, not introduce them)
        if (task.type !== 'patch') {
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
        }

        contribs.push(c);
      }
    } else {
      // Solo fallback (no employees)
      const soloRate = GAME_CONFIG.baseDevProgressPerTick * 0.3 * crunchMultiplier * TICK_SCALE;
      for (const cat of activeCategories) {
        if (task.categoryTargets[cat] <= 0) continue;
        store.contributeToTask(task.id, cat, soloRate);
      }
    }

    // Phase advancement for games: completion-based (advance when all phase targets met)
    if (task.type === 'game' && task.currentPhase && task.currentPhase < 3) {
      const freshTask = useGameStore.getState().activeTasks.find((t) => t.id === task.id);
      if (freshTask) {
        const phaseCats = PHASE_CATEGORIES[freshTask.currentPhase!];
        const phaseComplete = phaseCats.every(
          (cat) => freshTask.categoryProgress[cat] >= freshTask.categoryTargets[cat]
        );
        if (phaseComplete) {
          store.updateTask(task.id, {
            currentPhase: (freshTask.currentPhase! + 1) as DevPhase,
            ticksInCurrentPhase: 0,
          });
        }
      }
    }

    // Track elapsed days for analytics
    if (task.developmentDaysTarget) {
      const daysElapsed = (task.developmentDaysElapsed ?? 0) + (1 / CALENDAR_CONFIG.ticksPerDay);
      store.updateTask(task.id, { developmentDaysElapsed: daysElapsed });
    }
  }

  // Check for completed research tasks
  const freshAfterTasks = useGameStore.getState();
  for (const task of freshAfterTasks.activeTasks) {
    if (task.type === 'research' && task.progressPercent >= 100 && task.targetFeatureId) {
      store.unlockFeature(task.targetFeatureId);
      store.removeTask(task.id);
      store.grantStudioXP(STUDIO_LEVEL_CONFIG.xpRewards.completeResearch);
    }
  }

  // Check for completed patch tasks — auto-reset
  const freshAfterResearch = useGameStore.getState();
  for (const task of freshAfterResearch.activeTasks) {
    if (task.type === 'patch' && task.progressPercent >= 100) {
      store.resetPatchTask(task.id);
      store.grantStudioXP(STUDIO_LEVEL_CONFIG.xpRewards.completePatch);
      if (task.targetGameId) {
        const targetGame = freshAfterResearch.activeGames.find((g) => g.id === task.targetGameId);
        if (targetGame) {
          store.updateGame(task.targetGameId, {
            isLiveService: true,
            bugRateDecay: Math.min(1.0, targetGame.bugRateDecay + 0.1),
          });
        }
      }
    }
  }

  // Auto-fix pre-release bugs on completed game tasks
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
      const effSkills = getEffectiveSkills(fixer);
      const fixSkill = (effSkills.gameplay + effSkills.polish) / 2;
      const points = GAME_CONFIG.bugFixProgressPerTick * fixSkill * eff * bugFixMult * TICK_SCALE;
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
    const blendedCats: Partial<Record<keyof PhaseCategories, number>> = {};
    const allCats = new Set([...Object.keys(nc.categories), ...Object.keys(p.categories)]) as Set<keyof PhaseCategories>;
    for (const cat of allCats) {
      blendedCats[cat] = (p.categories[cat] ?? 0) * blendFactor + (nc.categories[cat] ?? 0);
    }
    return {
      ...nc,
      categories: blendedCats,
      researchPoints: (p.researchPoints ?? 0) * blendFactor + nc.researchPoints,
      bugsIntroduced: p.bugsIntroduced * blendFactor + nc.bugsIntroduced,
      bugsFixed: p.bugsFixed * blendFactor + nc.bugsFixed,
    };
  });
  store.updateStaffContributions(merged);

  // Process all active games
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

    // Sales
    let saleRate = getSaleRatePerTick(game, state) * TICK_SCALE;
    if (game.dlcSalesBoost > 0) saleRate *= (1 + game.dlcSalesBoost);
    let actualCopies = Math.max(0, Math.round(saleRate * 100) / 100);
    const doubleSaleChance = getFullEffectMultiplier('doubleSaleChance', state) - 1;
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
      const fans = calculateFanConversion(actualCopies, state);
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
      const declineMultiplier = getFullEffectMultiplier('declineRateMultiplier', state);
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

    // Bug spawning with decay
    let bugRateDecay = game.bugRateDecay;
    if (isNewDay(fresh.calendar)) {
      bugRateDecay = Math.max(GAME_CONFIG.bugMinDecay, bugRateDecay * GAME_CONFIG.bugDecayPerDay);
    }
    const bugRateMultiplier = getBugRateMultiplier(state.employees);
    const bugUpgradeMultiplier = getFullEffectMultiplier('bugRateMultiplier', state);
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

    // Bugfix employees fix released-game bugs
    const allBugsForGame = [...game.bugs, ...newBugs];
    const bugsToRemove: string[] = [];
    const updatedBugs = [...allBugsForGame];
    if (bugfixEmployees.length > 0 && allBugsForGame.length > 0) {
      let empIdx = 0;
      for (let i = 0; i < updatedBugs.length && empIdx < bugfixEmployees.length; i++) {
        const bug = updatedBugs[i];
        const fixer = bugfixEmployees[empIdx];
        const efficiency = getStaminaEfficiency(fixer.stamina);
        const effSkills = getEffectiveSkills(fixer);
        const fixSkill = (effSkills.gameplay + effSkills.polish) / 2;
        const points = GAME_CONFIG.bugFixProgressPerTick * fixSkill * efficiency * bugFixMult * TICK_SCALE;
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
    const maxTicks = getLifecyclePhaseTicks(game.phase, state.unlockedStudioUpgrades, []);
    if (phaseTicks >= maxTicks) {
      if (phase === 'growth') phase = 'peak';
      else if (phase === 'peak') phase = 'decline';
      phaseTicks = 0;
    }

    const mergedRegionalFans = { ...game.regionalFans };
    for (const [region, count] of Object.entries(regionalFansDelta)) {
      mergedRegionalFans[region as RegionId] = (mergedRegionalFans[region as RegionId] ?? 0) + count;
    }

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
  store.grantFreePack();
  store.dismissMonthEnd();
}
