import { create } from 'zustand';
import type {
  StudioState,
  ActiveGame,
  GameInDev,
  Employee,
  GameSummary,
  CalendarState,
  OfficeState,
  GameSpeed,
  MonthlyReport,
  Genre,
  Style,
  Platform,
  PillarWeights,
  Bug,
  Server,
  RegionId,
  ServerType,
  OfficeTier,
  DLC,
} from '@/lib/game/types';
import { CALENDAR_CONFIG } from '@/lib/config/calendarConfig';
import { OFFICE_CONFIG } from '@/lib/config/officeConfig';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { saveGame, loadGame, hasSavedGame } from './saveLoad';

// ============================================================
// Initial State Factory
// ============================================================

function createInitialCalendar(): CalendarState {
  return {
    year: CALENDAR_CONFIG.startYear,
    month: CALENDAR_CONFIG.startMonth,
    day: CALENDAR_CONFIG.startDay,
    hour: CALENDAR_CONFIG.startHour,
    speed: 0,
    monthEndPending: false,
    lastMonthReport: null,
  };
}

function createInitialOffice(): OfficeState {
  const tier0 = OFFICE_CONFIG.tiers[0];
  return {
    tier: tier0.tier,
    maxSeats: tier0.maxSeats,
    monthlyOverhead: tier0.monthlyOverhead,
  };
}

export function createInitialState(studioName: string, startingMoney: number): StudioState {
  return {
    studioName,
    money: startingMoney,
    totalLifetimeMoney: startingMoney,
    studioFans: 0,
    researchPoints: 0,
    unlockedStudioUpgrades: [],
    currentGame: null,
    gameInDevelopment: null,
    completedGames: [],
    employees: [],
    candidatePool: [],
    office: createInitialOffice(),
    calendar: createInitialCalendar(),
    isBankrupt: false,
  };
}

// ============================================================
// Store Actions Interface
// ============================================================

interface GameActions {
  // Game lifecycle
  newGame: (studioName: string, startingMoney: number) => void;
  loadSavedGame: () => boolean;
  save: () => void;

  // Calendar
  setSpeed: (speed: GameSpeed) => void;
  advanceTick: () => void;
  dismissMonthEnd: () => void;
  setMonthEndReport: (report: MonthlyReport) => void;

  // Money
  spendMoney: (amount: number) => boolean;
  earnMoney: (amount: number) => void;

  // Game development
  startDevelopment: (game: GameInDev) => void;
  updateDevProgress: (progressDelta: number) => void;
  contributePillarPoints: (pillar: keyof import('@/lib/game/types').PillarProgress, points: number) => void;
  addDevBugs: (count: number) => void;
  toggleCrunch: () => void;
  releaseGame: (activeGame: ActiveGame) => void;
  retireGame: () => void;

  // Servers
  addServer: (server: Server) => void;
  removeServer: (serverId: string) => void;

  // Employees
  setCandidatePool: (pool: Employee[]) => void;
  hireEmployee: (employee: Employee) => void;
  fireEmployee: (employeeId: string) => void;
  toggleEmployeeAssignment: (employeeId: string) => void;

  // Office
  upgradeOffice: (tier: OfficeTier) => void;

  // Upgrades
  unlockStudioUpgrade: (upgradeId: string) => void;
  unlockGameUpgrade: (upgradeId: string) => void;

  // Bugs
  addBug: (bug: Bug) => void;
  removeBug: (bugId: string) => void;
  updateBugProgress: (bugId: string, hoursWorked: number) => void;

  // DLC
  addDLC: (dlc: DLC) => void;
  updateDLCProgress: (dlcId: string, progressDelta: number) => void;
  releaseDLC: (dlcId: string) => void;

  // Fans
  addGameFans: (count: number) => void;
  addStudioFans: (count: number) => void;
  addResearchPoints: (points: number) => void;

  // Game state updates (called by game loop)
  updateCurrentGame: (updates: Partial<ActiveGame>) => void;
  addCompletedGame: (summary: GameSummary) => void;
  setBankrupt: () => void;

  // Full state replacement (for load)
  setState: (state: StudioState) => void;
}

// ============================================================
// Store
// ============================================================

export type GameStore = StudioState & GameActions;

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state (will be overwritten by newGame or loadSavedGame)
  ...createInitialState('', 0),

  // ----------------------------------------------------------
  // Game lifecycle
  // ----------------------------------------------------------

  newGame: (studioName, startingMoney) => {
    set(createInitialState(studioName, startingMoney));
  },

  loadSavedGame: () => {
    const saved = loadGame();
    if (saved) {
      set(saved);
      return true;
    }
    return false;
  },

  save: () => {
    const state = get();
    const stateOnly: StudioState = {
      studioName: state.studioName,
      money: state.money,
      totalLifetimeMoney: state.totalLifetimeMoney,
      studioFans: state.studioFans,
      researchPoints: state.researchPoints,
      unlockedStudioUpgrades: state.unlockedStudioUpgrades,
      currentGame: state.currentGame,
      gameInDevelopment: state.gameInDevelopment,
      completedGames: state.completedGames,
      employees: state.employees,
      candidatePool: state.candidatePool,
      office: state.office,
      calendar: state.calendar,
      isBankrupt: state.isBankrupt,
    };
    saveGame(stateOnly);
  },

  // ----------------------------------------------------------
  // Calendar
  // ----------------------------------------------------------

  setSpeed: (speed) => set((s) => ({ calendar: { ...s.calendar, speed } })),

  advanceTick: () => set((s) => {
    const cal = { ...s.calendar };
    cal.hour += CALENDAR_CONFIG.hoursPerTick;

    if (cal.hour >= CALENDAR_CONFIG.hoursPerDay) {
      cal.hour = 0;
      cal.day += 1;

      const daysInCurrentMonth = CALENDAR_CONFIG.daysInMonth[cal.month];
      if (cal.day > daysInCurrentMonth) {
        cal.day = 1;
        cal.monthEndPending = true;
        cal.speed = 0; // auto-pause at month end
        cal.month += 1;

        if (cal.month > 12) {
          cal.month = 1;
          cal.year += 1;
        }
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
  // Game development
  // ----------------------------------------------------------

  startDevelopment: (game) => set({ gameInDevelopment: game }),

  updateDevProgress: (progressDelta) => set((s) => {
    if (!s.gameInDevelopment) return {};
    const newProgress = Math.min(100, s.gameInDevelopment.progressPercent + progressDelta);
    return {
      gameInDevelopment: { ...s.gameInDevelopment, progressPercent: newProgress },
    };
  }),

  contributePillarPoints: (pillar, points) => set((s) => {
    if (!s.gameInDevelopment) return {};
    const dev = s.gameInDevelopment;
    const newProgress = { ...dev.pillarProgress, [pillar]: dev.pillarProgress[pillar] + points };

    // Recalculate overall % from pillar completion
    const targets = dev.pillarTargets;
    const totalTarget = targets.graphics + targets.gameplay + targets.sound + targets.polish;
    const totalDone = Math.min(newProgress.graphics, targets.graphics)
      + Math.min(newProgress.gameplay, targets.gameplay)
      + Math.min(newProgress.sound, targets.sound)
      + Math.min(newProgress.polish, targets.polish);
    const pct = totalTarget > 0 ? (totalDone / totalTarget) * 100 : 0;

    return {
      gameInDevelopment: {
        ...dev,
        pillarProgress: newProgress,
        progressPercent: Math.min(100, pct),
      },
    };
  }),

  addDevBugs: (count) => set((s) => {
    if (!s.gameInDevelopment) return {};
    return {
      gameInDevelopment: {
        ...s.gameInDevelopment,
        bugsFound: s.gameInDevelopment.bugsFound + count,
      },
    };
  }),

  toggleCrunch: () => set((s) => {
    if (!s.gameInDevelopment) return {};
    return {
      gameInDevelopment: {
        ...s.gameInDevelopment,
        isCrunching: !s.gameInDevelopment.isCrunching,
      },
    };
  }),

  releaseGame: (activeGame) => set({
    currentGame: activeGame,
    gameInDevelopment: null,
  }),

  retireGame: () => set((s) => {
    if (!s.currentGame) return {};
    return {
      currentGame: { ...s.currentGame, phase: 'retired' as const },
    };
  }),

  // ----------------------------------------------------------
  // Servers
  // ----------------------------------------------------------

  addServer: (server) => set((s) => {
    if (!s.currentGame) return {};
    return {
      currentGame: {
        ...s.currentGame,
        servers: [...s.currentGame.servers, server],
      },
    };
  }),

  removeServer: (serverId) => set((s) => {
    if (!s.currentGame) return {};
    return {
      currentGame: {
        ...s.currentGame,
        servers: s.currentGame.servers.filter((sv) => sv.id !== serverId),
      },
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

  toggleEmployeeAssignment: (employeeId) => set((s) => ({
    employees: s.employees.map((e) =>
      e.id === employeeId
        ? { ...e, assignment: e.assignment === 'development' ? 'bugfix' as const : 'development' as const }
        : e
    ),
  })),

  // ----------------------------------------------------------
  // Office
  // ----------------------------------------------------------

  upgradeOffice: (tier) => set(() => {
    const def = OFFICE_CONFIG.tiers.find((t) => t.tier === tier);
    if (!def) return {};
    return {
      office: {
        tier: def.tier,
        maxSeats: def.maxSeats,
        monthlyOverhead: def.monthlyOverhead,
      },
    };
  }),

  // ----------------------------------------------------------
  // Upgrades
  // ----------------------------------------------------------

  unlockStudioUpgrade: (upgradeId) => set((s) => ({
    unlockedStudioUpgrades: [...s.unlockedStudioUpgrades, upgradeId],
  })),

  unlockGameUpgrade: (upgradeId) => set((s) => {
    if (!s.currentGame) return {};
    return {
      currentGame: {
        ...s.currentGame,
        unlockedGameUpgrades: [...s.currentGame.unlockedGameUpgrades, upgradeId],
      },
    };
  }),

  // ----------------------------------------------------------
  // Bugs
  // ----------------------------------------------------------

  addBug: (bug) => set((s) => {
    if (!s.currentGame) return {};
    return {
      currentGame: {
        ...s.currentGame,
        bugs: [...s.currentGame.bugs, bug],
      },
    };
  }),

  removeBug: (bugId) => set((s) => {
    if (!s.currentGame) return {};
    return {
      currentGame: {
        ...s.currentGame,
        bugs: s.currentGame.bugs.filter((b) => b.id !== bugId),
      },
    };
  }),

  updateBugProgress: (bugId, hoursWorked) => set((s) => {
    if (!s.currentGame) return {};
    return {
      currentGame: {
        ...s.currentGame,
        bugs: s.currentGame.bugs.map((b) =>
          b.id === bugId
            ? { ...b, fixProgressHours: b.fixProgressHours + hoursWorked }
            : b
        ),
      },
    };
  }),

  // ----------------------------------------------------------
  // DLC
  // ----------------------------------------------------------

  addDLC: (dlc) => set((s) => {
    if (!s.currentGame) return {};
    return {
      currentGame: {
        ...s.currentGame,
        dlcs: [...s.currentGame.dlcs, dlc],
      },
    };
  }),

  updateDLCProgress: (dlcId, progressDelta) => set((s) => {
    if (!s.currentGame) return {};
    return {
      currentGame: {
        ...s.currentGame,
        dlcs: s.currentGame.dlcs.map((d) =>
          d.id === dlcId
            ? { ...d, progressPercent: Math.min(100, d.progressPercent + progressDelta) }
            : d
        ),
      },
    };
  }),

  releaseDLC: (dlcId) => set((s) => {
    if (!s.currentGame) return {};
    return {
      currentGame: {
        ...s.currentGame,
        dlcs: s.currentGame.dlcs.map((d) =>
          d.id === dlcId ? { ...d, status: 'released' as const } : d
        ),
      },
    };
  }),

  // ----------------------------------------------------------
  // Fans & Research
  // ----------------------------------------------------------

  addGameFans: (count) => set((s) => {
    if (!s.currentGame) return {};
    return {
      currentGame: { ...s.currentGame, gameFans: s.currentGame.gameFans + count },
    };
  }),

  addStudioFans: (count) => set((s) => ({
    studioFans: s.studioFans + count,
  })),

  addResearchPoints: (points) => set((s) => ({
    researchPoints: s.researchPoints + points,
  })),

  // ----------------------------------------------------------
  // Game state updates
  // ----------------------------------------------------------

  updateCurrentGame: (updates) => set((s) => {
    if (!s.currentGame) return {};
    return { currentGame: { ...s.currentGame, ...updates } };
  }),

  addCompletedGame: (summary) => set((s) => ({
    completedGames: [...s.completedGames, summary],
    currentGame: null,
  })),

  setBankrupt: () => set({
    isBankrupt: true,
    calendar: { ...createInitialCalendar(), speed: 0 },
  }),

  // ----------------------------------------------------------
  // Full state replacement
  // ----------------------------------------------------------

  setState: (state) => set(state),
}));
