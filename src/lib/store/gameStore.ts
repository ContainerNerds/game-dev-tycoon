import { create } from 'zustand';
import type {
  StudioState,
  ActiveGame,
  Employee,
  GameSummary,
  CalendarState,
  OfficeState,
  GameSpeed,
  MonthlyReport,
  MonthlyReportLineItem,
  Bug,
  Server,
  OfficeTier,
  StudioTask,
  ServerRack,
  StaffContribution,
  PhaseCategories,
  OwnedFurniture,
  GameEmail,
  GameNotification,
} from '@/lib/game/types';
import { zeroCategoryMap } from '@/lib/game/types';
import { CALENDAR_CONFIG } from '@/lib/config/calendarConfig';
import { OFFICE_CONFIG } from '@/lib/config/officeConfig';
import { EMAIL_CONFIG } from '@/lib/config/emailConfig';
import { getStartingUnlockedFeatures, getFeatureDef, canAddFeatureToEngine } from '@/lib/config/engineFeaturesConfig';
import { computeLevelUp, STUDIO_LEVEL_CONFIG } from '@/lib/config/studioLevelConfig';
import type { GameSizeXP } from '@/lib/config/studioLevelConfig';
import { saveToSlot, loadFromSlot } from './saveLoad';
import { generateGameReviewEmail } from '@/lib/game/emailSystem';
import { createEmailNotification } from '@/lib/game/notificationSystem';
import { canEmployeeWorkOnTask, canEmployeeBugFix } from '@/lib/game/employeeSystem';
import { EMPLOYEE_TASK_ABILITIES } from '@/lib/config/employeeConfig';

// ============================================================
// Initial State Factory
// ============================================================

function createInitialCalendar(): CalendarState {
  return {
    year: CALENDAR_CONFIG.startYear,
    month: CALENDAR_CONFIG.startMonth,
    day: CALENDAR_CONFIG.startDay,
    tickInDay: 0,
    speed: 0,
    monthEndPending: false,
    lastMonthReport: null,
  };
}

function createInitialOffice(): OfficeState {
  const tier0 = OFFICE_CONFIG.tiers[0];
  return { tier: tier0.tier, maxSeats: tier0.maxSeats, monthlyOverhead: tier0.monthlyOverhead };
}

export function createPlayerEmployee(playerName: string): Employee {
  return {
    id: 'player',
    name: playerName,
    title: 'CEO',
    employeeType: 'developer',
    rarity: 'rare',
    skills: { graphics: 15, sound: 10, gameplay: 15, polish: 10 },
    evs: { graphics: 0, sound: 0, gameplay: 0, polish: 0 },
    assignedTaskId: null,
    activity: 'idle',
    autoAssign: true,
    isPlayer: true,
    hireCost: 0,
    monthlySalary: 0,
    stamina: 100,
    onVacation: false,
    vacationDaysLeft: 0,
    bugsFixed: 0,
    totalBugFixPoints: 0,
  };
}

export function createInitialState(studioName: string, playerName: string, startingMoney: number): StudioState {
  const player = createPlayerEmployee(playerName);
  return {
    studioName,
    playerName,
    money: startingMoney,
    totalLifetimeMoney: startingMoney,
    studioFans: 0,
    researchPoints: 0,
    unlockedStudioUpgrades: [],
    unlockedFeatures: getStartingUnlockedFeatures(),
    studioXP: 0,
    studioLevel: 0,
    skillPoints: 0,
    allocatedSkills: {},
    activeGames: [],
    activeTasks: [],
    completedGames: [],
    maxParallelTasks: 1,
    maxActiveGames: 1,
    servers: [],
    racks: [],
    employees: [player],
    currentPack: [],
    packRevealed: [],
    freePackAvailable: true,
    engines: [],
    furniture: [],
    office: createInitialOffice(),
    calendar: createInitialCalendar(),
    dailyRates: { moneyPerDay: 0, fansPerDay: 0, rpPerDay: 0 },
    staffContributions: [],
    monthlyReports: [],
    inbox: [],
    notifications: [],
    _dayAccMoney: 0,
    _dayAccFans: 0,
    _dayAccRP: 0,
    _dayTickCounter: 0,
    pendingMonthlyLineItems: [],
    autoVacationThreshold: 0,
    isBankrupt: false,
  };
}

// ============================================================
// Store Actions Interface
// ============================================================

interface GameActions {
  newGame: (studioName: string, playerName: string, startingMoney: number) => void;
  loadSlot: (slotId: number) => boolean;
  saveToSlot: (slotId: number) => void;

  // Calendar
  setSpeed: (speed: GameSpeed) => void;
  advanceTick: () => void;
  dismissMonthEnd: () => void;
  setMonthEndReport: (report: MonthlyReport) => void;

  // Money
  spendMoney: (amount: number) => boolean;
  earnMoney: (amount: number) => void;

  // Tasks (unified: game dev, DLC, patch, engine, research)
  addTask: (task: StudioTask) => void;
  removeTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<StudioTask>) => void;
  contributeToTask: (taskId: string, category: keyof PhaseCategories, points: number) => void;
  contributeToResearch: (taskId: string, points: number) => void;
  addTaskBugs: (taskId: string, count: number) => void;
  addTaskBug: (taskId: string, bug: Bug) => void;
  removeTaskBug: (taskId: string, bugId: string) => void;
  toggleTaskCrunch: (taskId: string) => void;
  resetPatchTask: (taskId: string) => void;

  // Game lifecycle
  releaseGame: (taskId: string, activeGame: ActiveGame) => void;
  releaseDLC: (taskId: string) => void;
  retireGame: (gameId: string) => void;
  updateGame: (gameId: string, updates: Partial<ActiveGame>) => void;
  addCompletedGame: (summary: GameSummary) => void;

  // Servers & Racks (studio-wide)
  addServer: (server: Server) => void;
  removeServer: (serverId: string) => void;
  addRack: (rack: ServerRack) => void;
  addServerToRack: (rackId: string, server: Server) => void;

  // Employees & Packs
  openFreePack: (pack: Employee[]) => void;
  buyPack: (pack: Employee[], cost: number) => void;
  revealPackCard: (index: number) => void;
  grantFreePack: () => void;
  hireEmployee: (employee: Employee) => void;
  fireEmployee: (employeeId: string) => void;
  assignEmployee: (employeeId: string, taskId: string | null) => void;
  setEmployeeAutoAssign: (employeeId: string) => void;
  sendOnVacation: (employeeId: string) => void;
  updateEmployees: (employees: Employee[]) => void;

  // Office
  upgradeOffice: (tier: OfficeTier) => void;
  upgradeParallelTasks: () => void;
  upgradeActiveGames: () => void;

  // Furniture
  buyFurniture: (item: OwnedFurniture, cost: number) => void;
  sellFurniture: (furnitureId: string) => void;

  // Upgrades
  unlockStudioUpgrade: (upgradeId: string) => void;
  unlockGameUpgrade: (gameId: string, upgradeId: string) => void;

  // Studio XP & Skill Tree
  grantStudioXP: (amount: number) => void;
  allocateSkillPoint: (skillId: string) => void;

  // Engines (component-based)
  createEngine: (name: string) => void;
  addFeatureToEngine: (engineId: string, featureId: string) => boolean;
  removeFeatureFromEngine: (engineId: string, featureId: string) => void;

  // Research
  unlockFeature: (featureId: string) => void;

  // Bugs
  addBug: (gameId: string, bug: Bug) => void;
  removeBug: (gameId: string, bugId: string) => void;
  recordBugFix: (employeeId: string, fixPoints: number) => void;

  // Fans
  addGameFans: (gameId: string, count: number) => void;
  addStudioFans: (count: number) => void;
  addResearchPoints: (points: number) => void;

  // Email & Notifications
  addEmail: (email: GameEmail) => void;
  markEmailRead: (emailId: string) => void;
  deleteEmail: (emailId: string) => void;
  markAllEmailsRead: () => void;
  addNotification: (notification: GameNotification) => void;
  dismissNotification: (notificationId: string) => void;
  clearDismissedNotifications: () => void;
  clearAllNotifications: () => void;

  // Settings
  setAutoVacationThreshold: (threshold: number) => void;

  // Tracking
  setBankrupt: () => void;
  trackDailyRate: (moneyDelta: number, fansDelta: number, rpDelta: number) => void;
  pushMonthlyReport: (report: MonthlyReport) => void;
  pushPendingLineItem: (item: MonthlyReportLineItem) => void;
  clearPendingLineItems: () => void;
  updateStaffContributions: (contributions: StaffContribution[]) => void;

  setState: (state: StudioState) => void;
}

// ============================================================
// Store
// ============================================================

export type GameStore = StudioState & GameActions;

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState('', '', 0),

  // ----------------------------------------------------------
  // Lifecycle
  // ----------------------------------------------------------

  newGame: (studioName, playerName, startingMoney) => {
    set(createInitialState(studioName, playerName, startingMoney));
  },

  loadSlot: (slotId) => {
    const saved = loadFromSlot(slotId);
    if (saved) { set(saved); return true; }
    return false;
  },

  saveToSlot: (slotId) => {
    const state = get();
    const stateOnly: StudioState = {
      studioName: state.studioName,
      playerName: state.playerName,
      money: state.money,
      totalLifetimeMoney: state.totalLifetimeMoney,
      studioFans: state.studioFans,
      researchPoints: state.researchPoints,
      unlockedStudioUpgrades: state.unlockedStudioUpgrades,
      unlockedFeatures: state.unlockedFeatures,
      studioXP: state.studioXP,
      studioLevel: state.studioLevel,
      skillPoints: state.skillPoints,
      allocatedSkills: state.allocatedSkills,
      activeGames: state.activeGames,
      activeTasks: state.activeTasks,
      completedGames: state.completedGames,
      maxParallelTasks: state.maxParallelTasks,
      maxActiveGames: state.maxActiveGames,
      servers: state.servers,
      racks: state.racks,
      employees: state.employees,
      currentPack: state.currentPack,
      packRevealed: state.packRevealed,
      freePackAvailable: state.freePackAvailable,
      engines: state.engines,
      furniture: state.furniture,
      office: state.office,
      calendar: state.calendar,
      dailyRates: state.dailyRates,
      staffContributions: state.staffContributions,
      monthlyReports: state.monthlyReports,
      inbox: state.inbox,
      pendingMonthlyLineItems: state.pendingMonthlyLineItems,
      notifications: [],
      _dayAccMoney: 0, _dayAccFans: 0, _dayAccRP: 0, _dayTickCounter: 0,
      autoVacationThreshold: state.autoVacationThreshold,
      isBankrupt: state.isBankrupt,
    };
    saveToSlot(slotId, stateOnly);
  },

  // ----------------------------------------------------------
  // Calendar
  // ----------------------------------------------------------

  setSpeed: (speed) => set((s) => ({ calendar: { ...s.calendar, speed } })),

  advanceTick: () => set((s) => {
    const cal = { ...s.calendar };
    cal.tickInDay += 1;
    if (cal.tickInDay >= CALENDAR_CONFIG.ticksPerDay) {
      cal.tickInDay = 0;
      cal.day += 1;
      const daysInCurrentMonth = CALENDAR_CONFIG.daysInMonth[cal.month];
      if (cal.day > daysInCurrentMonth) {
        cal.day = 1;
        cal.monthEndPending = true;
        cal.month += 1;
        if (cal.month > 12) { cal.month = 1; cal.year += 1; }
      }
    }
    return { calendar: cal };
  }),

  dismissMonthEnd: () => set((s) => ({
    calendar: { ...s.calendar, monthEndPending: false },
  })),

  setMonthEndReport: (report) => set((s) => ({
    calendar: { ...s.calendar, lastMonthReport: report },
  })),

  // ----------------------------------------------------------
  // Money
  // ----------------------------------------------------------

  spendMoney: (amount) => {
    const state = get();
    if (state.money < amount) return false;
    set({ money: state.money - amount });
    return true;
  },

  earnMoney: (amount) => set((s) => ({
    money: s.money + amount,
    totalLifetimeMoney: s.totalLifetimeMoney + amount,
  })),

  // ----------------------------------------------------------
  // Tasks
  // ----------------------------------------------------------

  addTask: (task) => set((s) => {
    if (s.activeTasks.length >= s.maxParallelTasks) return {};
    const employees = s.employees.map((e) => {
      if (!e.autoAssign || e.onVacation || e.assignedTaskId !== null) return e;
      if (!canEmployeeWorkOnTask(e, task.type)) return e;
      const activity = EMPLOYEE_TASK_ABILITIES[e.employeeType].activityWhenWorking;
      return { ...e, assignedTaskId: task.id, activity, autoAssign: false };
    });
    return { activeTasks: [...s.activeTasks, task], employees };
  }),

  removeTask: (taskId) => set((s) => ({
    activeTasks: s.activeTasks.filter((t) => t.id !== taskId),
    employees: s.employees.map((e) =>
      e.assignedTaskId === taskId ? { ...e, assignedTaskId: null, activity: 'idle' as const, autoAssign: true } : e
    ),
  })),

  updateTask: (taskId, updates) => set((s) => ({
    activeTasks: s.activeTasks.map((t) => t.id === taskId ? { ...t, ...updates } : t),
  })),

  contributeToTask: (taskId, category, points) => set((s) => ({
    activeTasks: s.activeTasks.map((t) => {
      if (t.id !== taskId) return t;
      const newProgress = {
        ...t.categoryProgress,
        [category]: Math.min(t.categoryTargets[category], t.categoryProgress[category] + points),
      };
      const cats = Object.keys(t.categoryTargets) as (keyof PhaseCategories)[];
      const totalTarget = cats.reduce((sum, c) => sum + t.categoryTargets[c], 0);
      const totalDone = cats.reduce((sum, c) => sum + Math.min(newProgress[c], t.categoryTargets[c]), 0);
      return { ...t, categoryProgress: newProgress, progressPercent: totalTarget > 0 ? Math.min(100, (totalDone / totalTarget) * 100) : 0 };
    }),
  })),

  contributeToResearch: (taskId, points) => set((s) => ({
    activeTasks: s.activeTasks.map((t) => {
      if (t.id !== taskId) return t;
      const newProgress = Math.min(t.researchTarget ?? 100, (t.researchProgress ?? 0) + points);
      const target = t.researchTarget ?? 100;
      return { ...t, researchProgress: newProgress, progressPercent: target > 0 ? Math.min(100, (newProgress / target) * 100) : 0 };
    }),
  })),

  addTaskBugs: (taskId, count) => set((s) => ({
    activeTasks: s.activeTasks.map((t) =>
      t.id === taskId ? { ...t, bugsFound: t.bugsFound + count } : t
    ),
  })),

  addTaskBug: (taskId, bug) => set((s) => ({
    activeTasks: s.activeTasks.map((t) =>
      t.id === taskId ? { ...t, bugs: [...(t.bugs ?? []), bug], bugsFound: t.bugsFound + 1 } : t
    ),
  })),

  removeTaskBug: (taskId, bugId) => set((s) => ({
    activeTasks: s.activeTasks.map((t) =>
      t.id === taskId ? { ...t, bugs: (t.bugs ?? []).filter((b) => b.id !== bugId), bugsFound: Math.max(0, t.bugsFound - 1) } : t
    ),
  })),

  toggleTaskCrunch: (taskId) => set((s) => ({
    activeTasks: s.activeTasks.map((t) =>
      t.id === taskId ? { ...t, isCrunching: !t.isCrunching } : t
    ),
  })),

  resetPatchTask: (taskId) => set((s) => ({
    activeTasks: s.activeTasks.map((t) =>
      t.id === taskId ? {
        ...t,
        categoryProgress: zeroCategoryMap(),
        progressPercent: 0,
        bugsFound: 0,
      } : t
    ),
  })),

  // ----------------------------------------------------------
  // Game lifecycle
  // ----------------------------------------------------------

  releaseGame: (taskId, activeGame) => {
    const s = get();
    if (s.activeGames.length >= s.maxActiveGames) return;
    const task = s.activeTasks.find((t) => t.id === taskId);
    const gameSize = (task?.gameSize ?? 'medium') as GameSizeXP;
    set({
      activeGames: [...s.activeGames, activeGame],
      activeTasks: s.activeTasks.filter((t) => t.id !== taskId),
      employees: s.employees.map((e) =>
        e.assignedTaskId === taskId ? { ...e, assignedTaskId: null, activity: 'idle' as const, autoAssign: true } : e
      ),
    });
    const xp = STUDIO_LEVEL_CONFIG.xpRewards.releaseGame[gameSize] ?? STUDIO_LEVEL_CONFIG.xpRewards.releaseGame.medium;
    get().grantStudioXP(xp);

    const store = get();
    const reviewEmail = generateGameReviewEmail(activeGame, store.calendar);
    store.addEmail(reviewEmail);
    store.addNotification(createEmailNotification(reviewEmail, store.calendar));
  },

  releaseDLC: (taskId) => {
    const s = get();
    const task = s.activeTasks.find((t) => t.id === taskId);
    if (!task || task.type !== 'dlc' || !task.targetGameId) return;
    set({
      activeTasks: s.activeTasks.filter((t) => t.id !== taskId),
      activeGames: s.activeGames.map((g) =>
        g.id === task.targetGameId
          ? { ...g, dlcCount: g.dlcCount + 1, dlcSalesBoost: g.dlcSalesBoost + 0.5, dlcIds: [...g.dlcIds, taskId] }
          : g
      ),
      employees: s.employees.map((e) =>
        e.assignedTaskId === taskId ? { ...e, assignedTaskId: null, activity: 'idle' as const, autoAssign: true } : e
      ),
    });
    get().grantStudioXP(STUDIO_LEVEL_CONFIG.xpRewards.releaseDLC);
  },

  retireGame: (gameId) => set((s) => ({
    activeGames: s.activeGames.filter((g) => g.id !== gameId),
  })),

  updateGame: (gameId, updates) => set((s) => ({
    activeGames: s.activeGames.map((g) =>
      g.id === gameId ? { ...g, ...updates } : g
    ),
  })),

  addCompletedGame: (summary) => set((s) => ({
    completedGames: [...s.completedGames, summary],
  })),

  // ----------------------------------------------------------
  // Servers & Racks (studio-wide)
  // ----------------------------------------------------------

  addServer: (server) => set((s) => ({
    servers: [...s.servers, server],
  })),

  removeServer: (serverId) => set((s) => ({
    servers: s.servers.filter((sv) => sv.id !== serverId),
  })),

  addRack: (rack) => set((s) => ({
    racks: [...s.racks, rack],
  })),

  addServerToRack: (rackId, server) => set((s) => {
    const updatedRacks = s.racks.map((r) =>
      r.id === rackId ? { ...r, servers: [...r.servers, server] } : r
    );
    const allRackServers = updatedRacks.flatMap((r) => r.servers);
    const dcServers = s.servers.filter((sv) => sv.type === 'datacenter');
    return {
      racks: updatedRacks,
      servers: [...dcServers, ...allRackServers],
    };
  }),

  // ----------------------------------------------------------
  // Employees & Packs
  // ----------------------------------------------------------

  openFreePack: (pack) => set({
    currentPack: pack,
    packRevealed: new Array(pack.length).fill(false),
    freePackAvailable: false,
  }),

  buyPack: (pack, cost) => set((s) => ({
    currentPack: pack,
    packRevealed: new Array(pack.length).fill(false),
    money: s.money - cost,
  })),

  revealPackCard: (index) => set((s) => {
    const revealed = [...s.packRevealed];
    revealed[index] = true;
    return { packRevealed: revealed };
  }),

  grantFreePack: () => set({ freePackAvailable: true }),

  hireEmployee: (employee) => set((s) => ({
    employees: [...s.employees, employee],
    currentPack: s.currentPack.filter((c) => c.id !== employee.id),
    packRevealed: s.currentPack
      .filter((c) => c.id !== employee.id)
      .map((c) => s.packRevealed[s.currentPack.indexOf(c)] ?? true),
    money: s.money - employee.hireCost,
  })),

  fireEmployee: (employeeId) => set((s) => ({
    employees: s.employees.filter((e) => e.id !== employeeId),
  })),

  assignEmployee: (employeeId, taskId) => set((s) => ({
    employees: s.employees.map((e) => {
      if (e.id !== employeeId) return e;

      if (taskId === 'bugfix') {
        if (!canEmployeeBugFix(e)) return e;
        return { ...e, assignedTaskId: taskId, activity: 'bugfixing' as const, autoAssign: false };
      }

      if (taskId) {
        const task = s.activeTasks.find((t) => t.id === taskId);
        if (task && !canEmployeeWorkOnTask(e, task.type)) return e;
        const activity = EMPLOYEE_TASK_ABILITIES[e.employeeType].activityWhenWorking;
        return { ...e, assignedTaskId: taskId, activity, autoAssign: false };
      }

      return { ...e, assignedTaskId: null, activity: 'idle' as const, autoAssign: true };
    }),
  })),

  setEmployeeAutoAssign: (employeeId) => set((s) => ({
    employees: s.employees.map((e) =>
      e.id === employeeId ? { ...e, assignedTaskId: null, activity: 'idle' as const, autoAssign: true } : e
    ),
  })),

  sendOnVacation: (employeeId) => set((s) => ({
    employees: s.employees.map((e) =>
      e.id === employeeId
        ? { ...e, assignedTaskId: null, activity: 'vacation' as const, autoAssign: true, onVacation: true, vacationDaysLeft: 14 }
        : e
    ),
  })),

  updateEmployees: (employees) => set({ employees }),

  // ----------------------------------------------------------
  // Office
  // ----------------------------------------------------------

  upgradeOffice: (tier) => set(() => {
    const def = OFFICE_CONFIG.tiers.find((t) => t.tier === tier);
    if (!def) return {};
    return { office: { tier: def.tier, maxSeats: def.maxSeats, monthlyOverhead: def.monthlyOverhead } };
  }),

  upgradeParallelTasks: () => set((s) => {
    if (s.maxParallelTasks >= 3) return {};
    return { maxParallelTasks: s.maxParallelTasks + 1 };
  }),

  upgradeActiveGames: () => set((s) => {
    if (s.maxActiveGames >= 3) return {};
    return { maxActiveGames: s.maxActiveGames + 1 };
  }),

  // ----------------------------------------------------------
  // Furniture
  // ----------------------------------------------------------

  buyFurniture: (item, cost) => set((s) => ({
    furniture: [...s.furniture, item],
    money: s.money - cost,
  })),

  sellFurniture: (furnitureId) => set((s) => ({
    furniture: s.furniture.filter((f) => f.id !== furnitureId),
  })),

  // ----------------------------------------------------------
  // Upgrades
  // ----------------------------------------------------------

  unlockStudioUpgrade: (upgradeId) => set((s) => ({
    unlockedStudioUpgrades: [...s.unlockedStudioUpgrades, upgradeId],
  })),

  unlockGameUpgrade: (gameId, upgradeId) => set((s) => ({
    activeGames: s.activeGames.map((g) =>
      g.id === gameId
        ? { ...g, unlockedGameUpgrades: [...g.unlockedGameUpgrades, upgradeId] }
        : g
    ),
  })),

  grantStudioXP: (amount) => set((s) => {
    const { newXP, newLevel, pointsGained } = computeLevelUp(s.studioXP, s.studioLevel, amount);
    return {
      studioXP: newXP,
      studioLevel: newLevel,
      skillPoints: s.skillPoints + pointsGained,
    };
  }),

  allocateSkillPoint: (skillId) => set((s) => {
    if (s.skillPoints <= 0) return s;
    const current = s.allocatedSkills[skillId] ?? 0;
    return {
      skillPoints: s.skillPoints - 1,
      allocatedSkills: { ...s.allocatedSkills, [skillId]: current + 1 },
    };
  }),

  // ----------------------------------------------------------
  // Engines (component-based)
  // ----------------------------------------------------------

  createEngine: (name) => set((s) => ({
    engines: [...s.engines, {
      id: `engine-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name || 'Custom Engine',
      features: [],
      totalEngineCost: 0,
    }],
  })),

  addFeatureToEngine: (engineId, featureId) => {
    const state = get();
    const engine = state.engines.find((e) => e.id === engineId);
    if (!engine) return false;
    const check = canAddFeatureToEngine(featureId, engine.features, state.unlockedFeatures);
    if (!check.allowed) return false;
    const def = getFeatureDef(featureId);
    if (!def) return false;
    if (state.money < def.engineCost) return false;
    set((s) => ({
      money: s.money - def.engineCost,
      engines: s.engines.map((e) =>
        e.id === engineId
          ? { ...e, features: [...e.features, featureId], totalEngineCost: e.totalEngineCost + def.engineCost }
          : e
      ),
      pendingMonthlyLineItems: [...s.pendingMonthlyLineItems, {
        label: `Engine: ${def.name}`,
        amount: -def.engineCost,
        category: 'engine-dev' as const,
      }],
    }));
    return true;
  },

  removeFeatureFromEngine: (engineId, featureId) => set((s) => ({
    engines: s.engines.map((e) =>
      e.id === engineId
        ? { ...e, features: e.features.filter((f) => f !== featureId) }
        : e
    ),
  })),

  // ----------------------------------------------------------
  // Research
  // ----------------------------------------------------------

  unlockFeature: (featureId) => set((s) => ({
    unlockedFeatures: s.unlockedFeatures.includes(featureId) ? s.unlockedFeatures : [...s.unlockedFeatures, featureId],
  })),

  // ----------------------------------------------------------
  // Bugs
  // ----------------------------------------------------------

  addBug: (gameId, bug) => set((s) => ({
    activeGames: s.activeGames.map((g) =>
      g.id === gameId ? { ...g, bugs: [...g.bugs, bug] } : g
    ),
  })),

  removeBug: (gameId, bugId) => set((s) => ({
    activeGames: s.activeGames.map((g) =>
      g.id === gameId ? { ...g, bugs: g.bugs.filter((b) => b.id !== bugId) } : g
    ),
  })),

  recordBugFix: (employeeId, fixPoints) => set((s) => ({
    employees: s.employees.map((e) =>
      e.id === employeeId
        ? { ...e, bugsFixed: e.bugsFixed + 1, totalBugFixPoints: e.totalBugFixPoints + fixPoints }
        : e
    ),
  })),

  // ----------------------------------------------------------
  // Fans
  // ----------------------------------------------------------

  addGameFans: (gameId, count) => set((s) => ({
    activeGames: s.activeGames.map((g) =>
      g.id === gameId ? { ...g, gameFans: g.gameFans + count } : g
    ),
  })),

  addStudioFans: (count) => set((s) => ({
    studioFans: s.studioFans + count,
  })),

  addResearchPoints: (points) => set((s) => ({
    researchPoints: s.researchPoints + points,
  })),

  // ----------------------------------------------------------
  // Email & Notifications
  // ----------------------------------------------------------

  addEmail: (email) => set((s) => {
    const updated = [email, ...s.inbox];
    if (updated.length > EMAIL_CONFIG.maxInboxSize) {
      updated.length = EMAIL_CONFIG.maxInboxSize;
    }
    return { inbox: updated };
  }),

  markEmailRead: (emailId) => set((s) => ({
    inbox: s.inbox.map((e) => e.id === emailId ? { ...e, read: true } : e),
  })),

  deleteEmail: (emailId) => set((s) => ({
    inbox: s.inbox.filter((e) => e.id !== emailId),
  })),

  markAllEmailsRead: () => set((s) => ({
    inbox: s.inbox.map((e) => e.read ? e : { ...e, read: true }),
  })),

  addNotification: (notification) => set((s) => ({
    notifications: [...s.notifications, notification],
  })),

  dismissNotification: (notificationId) => set((s) => ({
    notifications: s.notifications.map((n) =>
      n.id === notificationId ? { ...n, dismissed: true } : n
    ),
  })),

  clearDismissedNotifications: () => set((s) => ({
    notifications: s.notifications.filter((n) => !n.dismissed),
  })),

  clearAllNotifications: () => set({ notifications: [] }),

  // ----------------------------------------------------------
  // Settings
  // ----------------------------------------------------------

  setAutoVacationThreshold: (threshold) => set({ autoVacationThreshold: threshold }),

  // ----------------------------------------------------------
  // Tracking
  // ----------------------------------------------------------

  setBankrupt: () => set({
    isBankrupt: true,
    calendar: { ...createInitialCalendar(), speed: 0 },
  }),

  trackDailyRate: (moneyDelta, fansDelta, rpDelta) => set((s) => {
    const counter = s._dayTickCounter + 1;
    const accMoney = s._dayAccMoney + moneyDelta;
    const accFans = s._dayAccFans + fansDelta;
    const accRP = s._dayAccRP + rpDelta;
    if (counter >= CALENDAR_CONFIG.ticksPerDay) {
      return {
        dailyRates: {
          moneyPerDay: Math.round(accMoney),
          fansPerDay: Math.round(accFans * 10) / 10,
          rpPerDay: Math.round(accRP * 10) / 10,
        },
        _dayAccMoney: 0, _dayAccFans: 0, _dayAccRP: 0, _dayTickCounter: 0,
      };
    }
    return { _dayAccMoney: accMoney, _dayAccFans: accFans, _dayAccRP: accRP, _dayTickCounter: counter };
  }),

  updateStaffContributions: (contributions) => set({ staffContributions: contributions }),

  pushMonthlyReport: (report) => set((s) => ({
    monthlyReports: [...s.monthlyReports, report],
  })),

  pushPendingLineItem: (item) => set((s) => ({
    pendingMonthlyLineItems: [...s.pendingMonthlyLineItems, item],
  })),

  clearPendingLineItems: () => set({ pendingMonthlyLineItems: [] }),

  setState: (state) => set(state),
}));
