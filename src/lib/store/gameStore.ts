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
  Bug,
  Server,
  OfficeTier,
  StudioTask,
  PillarProgress,
  ServerRack,
  StaffContribution,
  GameEngine,
} from '@/lib/game/types';
import { CALENDAR_CONFIG } from '@/lib/config/calendarConfig';
import { OFFICE_CONFIG } from '@/lib/config/officeConfig';
import { saveToSlot, loadFromSlot } from './saveLoad';

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
    skills: { graphics: 2, sound: 1, gameplay: 2, polish: 1 },
    assignedTaskId: null,
    activity: 'idle',
    isPlayer: true,
    hireCost: 0,
    monthlySalary: 0,
    stamina: 100,
    onVacation: false,
    vacationDaysLeft: 0,
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
    activeGames: [],
    activeTasks: [],
    completedGames: [],
    maxParallelTasks: 1,
    maxActiveGames: 1,
    servers: [],
    racks: [],
    employees: [player],
    candidatePool: [],
    engines: [],
    office: createInitialOffice(),
    calendar: createInitialCalendar(),
    dailyRates: { moneyPerDay: 0, fansPerDay: 0, rpPerDay: 0 },
    staffContributions: [],
    monthlyReports: [],
    lastCandidateRefreshDay: 0,
    _dayAccMoney: 0,
    _dayAccFans: 0,
    _dayAccRP: 0,
    _dayTickCounter: 0,
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

  // Tasks (unified: game dev, DLC, patch)
  addTask: (task: StudioTask) => void;
  removeTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<StudioTask>) => void;
  contributeToTask: (taskId: string, pillar: keyof PillarProgress, points: number) => void;
  addTaskBugs: (taskId: string, count: number) => void;
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

  // Employees
  setCandidatePool: (pool: Employee[]) => void;
  hireEmployee: (employee: Employee) => void;
  fireEmployee: (employeeId: string) => void;
  assignEmployee: (employeeId: string, taskId: string | null) => void;
  sendOnVacation: (employeeId: string) => void;
  updateEmployees: (employees: Employee[]) => void;

  // Office
  upgradeOffice: (tier: OfficeTier) => void;
  upgradeParallelTasks: () => void;
  upgradeActiveGames: () => void;

  // Upgrades
  unlockStudioUpgrade: (upgradeId: string) => void;
  unlockGameUpgrade: (gameId: string, upgradeId: string) => void;

  // Engines
  addEngine: (engine: GameEngine) => void;
  updateEngine: (engineId: string, updates: Partial<GameEngine>) => void;

  // Bugs
  addBug: (gameId: string, bug: Bug) => void;
  removeBug: (gameId: string, bugId: string) => void;

  // Fans
  addGameFans: (gameId: string, count: number) => void;
  addStudioFans: (count: number) => void;
  addResearchPoints: (points: number) => void;

  // Tracking
  setBankrupt: () => void;
  trackDailyRate: (moneyDelta: number, fansDelta: number, rpDelta: number) => void;
  pushMonthlyReport: (report: MonthlyReport) => void;
  refreshCandidatePool: () => void;
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
      activeGames: state.activeGames,
      activeTasks: state.activeTasks,
      completedGames: state.completedGames,
      maxParallelTasks: state.maxParallelTasks,
      maxActiveGames: state.maxActiveGames,
      servers: state.servers,
      racks: state.racks,
      employees: state.employees,
      candidatePool: state.candidatePool,
      engines: state.engines,
      office: state.office,
      calendar: state.calendar,
      dailyRates: state.dailyRates,
      staffContributions: state.staffContributions,
      monthlyReports: state.monthlyReports,
      lastCandidateRefreshDay: state.lastCandidateRefreshDay,
      _dayAccMoney: 0, _dayAccFans: 0, _dayAccRP: 0, _dayTickCounter: 0,
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
    return { activeTasks: [...s.activeTasks, task] };
  }),

  removeTask: (taskId) => set((s) => ({
    activeTasks: s.activeTasks.filter((t) => t.id !== taskId),
    employees: s.employees.map((e) =>
      e.assignedTaskId === taskId ? { ...e, assignedTaskId: null, activity: 'idle' as const } : e
    ),
  })),

  updateTask: (taskId, updates) => set((s) => ({
    activeTasks: s.activeTasks.map((t) => t.id === taskId ? { ...t, ...updates } : t),
  })),

  contributeToTask: (taskId, pillar, points) => set((s) => ({
    activeTasks: s.activeTasks.map((t) => {
      if (t.id !== taskId) return t;
      const newProgress = {
        ...t.pillarProgress,
        [pillar]: Math.min(t.pillarTargets[pillar], t.pillarProgress[pillar] + points),
      };
      const targets = t.pillarTargets;
      const totalTarget = targets.graphics + targets.gameplay + targets.sound + targets.polish;
      const totalDone = Math.min(newProgress.graphics, targets.graphics)
        + Math.min(newProgress.gameplay, targets.gameplay)
        + Math.min(newProgress.sound, targets.sound)
        + Math.min(newProgress.polish, targets.polish);
      return { ...t, pillarProgress: newProgress, progressPercent: totalTarget > 0 ? Math.min(100, (totalDone / totalTarget) * 100) : 0 };
    }),
  })),

  addTaskBugs: (taskId, count) => set((s) => ({
    activeTasks: s.activeTasks.map((t) =>
      t.id === taskId ? { ...t, bugsFound: t.bugsFound + count } : t
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
        pillarProgress: { graphics: 0, gameplay: 0, sound: 0, polish: 0 },
        progressPercent: 0,
        bugsFound: 0,
      } : t
    ),
  })),

  // ----------------------------------------------------------
  // Game lifecycle
  // ----------------------------------------------------------

  releaseGame: (taskId, activeGame) => set((s) => {
    if (s.activeGames.length >= s.maxActiveGames) return {};
    return {
      activeGames: [...s.activeGames, activeGame],
      activeTasks: s.activeTasks.filter((t) => t.id !== taskId),
      employees: s.employees.map((e) =>
        e.assignedTaskId === taskId ? { ...e, assignedTaskId: null } : e
      ),
    };
  }),

  releaseDLC: (taskId) => set((s) => {
    const task = s.activeTasks.find((t) => t.id === taskId);
    if (!task || task.type !== 'dlc' || !task.targetGameId) return {};
    return {
      activeTasks: s.activeTasks.filter((t) => t.id !== taskId),
      activeGames: s.activeGames.map((g) =>
        g.id === task.targetGameId
          ? { ...g, dlcCount: g.dlcCount + 1, dlcSalesBoost: g.dlcSalesBoost + 0.5, dlcIds: [...g.dlcIds, taskId] }
          : g
      ),
      employees: s.employees.map((e) =>
        e.assignedTaskId === taskId ? { ...e, assignedTaskId: null } : e
      ),
    };
  }),

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
  // Employees
  // ----------------------------------------------------------

  setCandidatePool: (pool) => set({ candidatePool: pool }),

  hireEmployee: (employee) => set((s) => ({
    employees: [...s.employees, employee],
    candidatePool: s.candidatePool.filter((c) => c.id !== employee.id),
    money: s.money - employee.hireCost,
  })),

  fireEmployee: (employeeId) => set((s) => ({
    employees: s.employees.filter((e) => e.id !== employeeId),
  })),

  assignEmployee: (employeeId, taskId) => set((s) => ({
    employees: s.employees.map((e) => {
      if (e.id !== employeeId) return e;
      let activity: Employee['activity'] = 'idle';
      if (taskId === 'bugfix') activity = 'bugfixing';
      else if (taskId) activity = 'developing';
      return { ...e, assignedTaskId: taskId, activity };
    }),
  })),

  sendOnVacation: (employeeId) => set((s) => ({
    employees: s.employees.map((e) =>
      e.id === employeeId
        ? { ...e, assignedTaskId: null, activity: 'vacation' as const, onVacation: true, vacationDaysLeft: 14 }
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

  // ----------------------------------------------------------
  // Engines
  // ----------------------------------------------------------

  addEngine: (engine) => set((s) => ({
    engines: [...s.engines, engine],
  })),

  updateEngine: (engineId, updates) => set((s) => ({
    engines: s.engines.map((e) => e.id === engineId ? { ...e, ...updates } : e),
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

  refreshCandidatePool: () => set((s) => ({
    lastCandidateRefreshDay: s.calendar.day + (s.calendar.month - 1) * 30 + (s.calendar.year - 1) * 360,
  })),

  setState: (state) => set(state),
}));
