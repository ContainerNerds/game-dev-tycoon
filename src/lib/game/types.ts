import type { Rarity } from '@/lib/config/rarityConfig';

// ============================================================
// Enums & Literal Types
// ============================================================

export type Genre = 'RPG' | 'Action' | 'Strategy' | 'Simulation' | 'Adventure' | 'Puzzle' | 'Sports';

export type Topic = 'Fantasy' | 'SciFi' | 'Horror' | 'Historical' | 'Modern' | 'Cyberpunk' | 'PostApocalyptic' | 'Cartoon';

/** @deprecated Use Topic instead */
export type Style = Topic;

export type GameSize = 'small' | 'medium' | 'large' | 'mmorpg';

export type GameRating = 'E' | 'T' | 'M';

export type Platform = 'PC' | 'Console' | 'Mobile';

export type RegionId =
  | 'us-east'
  | 'us-west'
  | 'brazil'
  | 'saudi-arabia'
  | 'russia'
  | 'india'
  | 'china'
  | 'japan'
  | 'australia';

export type SkillType = 'graphics' | 'sound' | 'gameplay' | 'polish';

export type EmployeeTitle =
  | 'CEO'
  | 'Programmer'
  | 'Artist'
  | 'Sound Designer'
  | 'Designer'
  | 'QA Tester'
  | 'Generalist';

export type EmployeeActivity = 'idle' | 'developing' | 'researching' | 'bugfixing' | 'testing' | 'vacation';

export type GameSpeed = 0 | 1 | 2;

export type GameLifecyclePhase = 'growth' | 'peak' | 'decline' | 'retired';

export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';

export type UpgradeCategory = 'studio' | 'game';

export type OfficeTier = 0 | 1 | 2 | 3 | 4;

export type ServerType = 'colocated' | 'datacenter';

export type GameMode = 'standard' | 'liveservice';

export type TaskType = 'game' | 'dlc' | 'patch' | 'engine' | 'research';

export type EmployeeType = 'developer' | 'administrator' | 'researcher' | 'hacker';

// ============================================================
// Game Engines (component-based)
// ============================================================

export interface GameEngine {
  id: string;
  name: string;
  features: string[];
  totalEngineCost: number;
}

/** @deprecated Kept for save migration only */
export interface LegacyGameEngine {
  id: string;
  name: string;
  version: number;
  graphicsBonus: number;
  soundBonus: number;
  gameplayBonus: number;
  polishBonus: number;
  developmentCost: number;
  developmentDays: number;
  completedAt: { year: number; month: number; day: number } | null;
}

// ============================================================
// Development Pillars
// ============================================================

export interface PillarWeights {
  graphics: number;
  gameplay: number;
  sound: number;
  polish: number;
}

export interface PillarProgress {
  graphics: number;
  gameplay: number;
  sound: number;
  polish: number;
}

export interface PillarTargets {
  graphics: number;
  gameplay: number;
  sound: number;
  polish: number;
}

// ============================================================
// Employee
// ============================================================

export interface EmployeeSkills {
  graphics: number;   // 0–31 (IVs: innate talent)
  sound: number;
  gameplay: number;
  polish: number;
}

export interface Employee {
  id: string;
  name: string;
  title: EmployeeTitle;
  employeeType: EmployeeType;
  rarity: Rarity;
  skills: EmployeeSkills;         // IVs (0–31 per skill)
  evs: EmployeeSkills;            // EVs (0–252 per skill, 510 total cap)
  description?: string;           // flavor text for Unique employees
  perkId?: string;                // placeholder for future perk system
  assignedTaskId: string | null;  // null = unassigned, 'bugfix' = bug duty, or a task ID
  activity: EmployeeActivity;
  autoAssign: boolean;            // true = auto-assigned to first active task
  isPlayer: boolean;
  hireCost: number;
  monthlySalary: number;
  stamina: number;                // 0–100
  onVacation: boolean;
  vacationDaysLeft: number;
  bugsFixed: number;              // lifetime count of bugs resolved
  totalBugFixPoints: number;      // lifetime cumulative fix contribution points
}

// ============================================================
// Development Phases (9 categories across 3 phases)
// ============================================================

export type DevPhase = 1 | 2 | 3;

export interface PhaseCategories {
  // Phase 1
  engine: number;
  gameplay: number;
  storyQuests: number;
  // Phase 2
  dialogues: number;
  levelDesign: number;
  ai: number;
  // Phase 3
  worldDesign: number;
  graphics: number;
  sound: number;
}

export const PHASE_CATEGORIES: Record<DevPhase, (keyof PhaseCategories)[]> = {
  1: ['engine', 'gameplay', 'storyQuests'],
  2: ['dialogues', 'levelDesign', 'ai'],
  3: ['worldDesign', 'graphics', 'sound'],
};

export const DEV_CATEGORY_LABELS: Record<keyof PhaseCategories, string> = {
  engine: 'Engine',
  gameplay: 'Gameplay',
  storyQuests: 'Story/Quests',
  dialogues: 'Dialogues',
  levelDesign: 'Level Design',
  ai: 'AI',
  worldDesign: 'World Design',
  graphics: 'Graphics',
  sound: 'Sound',
};

export function zeroCategoryMap(): PhaseCategories {
  return {
    engine: 0, gameplay: 0, storyQuests: 0,
    dialogues: 0, levelDesign: 0, ai: 0,
    worldDesign: 0, graphics: 0, sound: 0,
  };
}

// ============================================================
// Category-based progress tracking (replaces old pillar system)
// ============================================================

export type CategoryProgress = PhaseCategories;
export type CategoryTargets = PhaseCategories;

// ============================================================
// Studio Task (unified: game dev, DLC, patch, engine, research)
// ============================================================

export interface StudioTask {
  id: string;
  type: TaskType;
  name: string;
  targetGameId: string | null;
  categoryProgress: CategoryProgress;
  categoryTargets: CategoryTargets;
  progressPercent: number;
  bugsFound: number;
  assignedEmployeeIds: string[];
  isCrunching: boolean;
  startMonth: number;
  startYear: number;
  // Game task fields
  genre?: Genre;
  style?: Style;
  topic?: Topic;
  mode?: GameMode;
  platforms?: Platform[];
  stageWeights?: PhaseCategories;
  devCostSpent?: number;
  engineId?: string;
  gameSize?: GameSize;
  gameRating?: GameRating;
  // Phase development
  currentPhase?: DevPhase;
  developmentDaysTarget?: number;
  developmentDaysElapsed?: number;
  ticksInCurrentPhase?: number;
  // Pre-release bugs found during development
  bugs?: Bug[];
  // Research task fields
  targetFeatureId?: string;
  researchProgress?: number;
  researchTarget?: number;
}

// ============================================================
// Rate Tracking
// ============================================================

export interface DailyRates {
  moneyPerDay: number;
  fansPerDay: number;
  rpPerDay: number;
}

export interface StaffContribution {
  employeeId: string;
  employeeName: string;
  taskId: string;
  taskName: string;
  categories: Partial<Record<keyof PhaseCategories, number>>;
  researchPoints: number;
  bugsIntroduced: number;
  bugsFixed: number;
}

// ============================================================
// Bugs
// ============================================================

export interface Bug {
  id: string;
  gameId: string;
  severity: BugSeverity;
  name: string;
  fixCost: number;
  fixTarget: number;              // total fix effort required (severity-driven)
  fixProgress: number;            // accumulated fix work (0 → fixTarget)
  assignedFixerId: string | null;
  spawnedAt: number;
}

// ============================================================
// Servers (studio-wide)
// ============================================================

export interface Server {
  id: string;
  regionId: RegionId;
  type: ServerType;
  capacity: number;
  monthlyCost: number;
}

export interface ServerRack {
  id: string;
  regionId: RegionId;
  servers: Server[];
  monthlyCost: number;
}

// ============================================================
// Skill Tree
// ============================================================

export interface UpgradeNode {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  tier: number;
  prerequisites: string[];
  cost: number;
  researchCost: number;
  effects: UpgradeEffect[];
}

export interface UpgradeEffect {
  type: string;
  value: number;
}

// ============================================================
// Platform Release Info
// ============================================================

export interface PlatformRelease {
  platform: Platform;
  portingCost: number;
  audienceMultiplier: number;
  revenueCut: number;
  activePlayers: number;
  totalCopiesSold: number;
}

// ============================================================
// Blog Reviews
// ============================================================

export interface BlogReview {
  blogName: string;
  score: number;
  summary: string;
}

export interface MonthlySnapshot {
  month: number;
  year: number;
  copiesSold: number;
  activePlayers: number;
  revenue: number;
}

// ============================================================
// Active Game (released, live)
// ============================================================

export interface ActiveGame {
  id: string;
  name: string;
  genre: Genre;
  style: Style;
  mode: GameMode;
  comboMultiplier: number;
  phase: GameLifecyclePhase;
  stageWeights: PhaseCategories;
  engineId?: string;
  engineBenefitScore: number;
  reviewScore: number;
  blogReviews: BlogReview[];
  releaseMonth: number;
  releaseYear: number;
  phaseTicks: number;
  platformReleases: PlatformRelease[];
  gameFans: number;
  regionalFans: Partial<Record<RegionId, number>>;
  gamePrice: number;
  bugs: Bug[];
  dlcIds: string[];
  dlcCount: number;
  dlcSalesBoost: number;            // temporary multiplier from DLC releases, decays over time
  isLiveService: boolean;
  unlockedGameUpgrades: string[];
  totalRevenue: number;
  monthlyHistory: MonthlySnapshot[];
  bugRateDecay: number;
  averageLatencyMs: number;
  devCostTotal: number;
}

export interface GameSummary {
  id: string;
  name: string;
  genre: Genre;
  style: Style;
  mode: GameMode;
  reviewScore: number;
  blogReviews: BlogReview[];
  totalRevenue: number;
  totalCopiesSold: number;
  peakPlayers: number;
  fansConverted: number;
  monthlyHistory: MonthlySnapshot[];
  releaseMonth: number;
  releaseYear: number;
}

// ============================================================
// Furniture
// ============================================================

export interface OwnedFurniture {
  id: string;
  definitionId: string;
  purchasedAt: { year: number; month: number };
}

// ============================================================
// Office
// ============================================================

export interface OfficeState {
  tier: OfficeTier;
  maxSeats: number;
  monthlyOverhead: number;
}

// ============================================================
// Calendar
// ============================================================

export interface CalendarState {
  year: number;
  month: number;
  day: number;
  tickInDay: number;   // 0–3 (4 ticks per day)
  speed: GameSpeed;
  monthEndPending: boolean;
  lastMonthReport: MonthlyReport | null;
}

// ============================================================
// Monthly Report
// ============================================================

export interface MonthlyReportLineItem {
  label: string;
  amount: number;
}

export interface MonthlyReport {
  month: number;
  year: number;
  income: number;
  employeeCosts: number;
  computeCosts: number;
  devOverheadCosts: number;
  netCashFlow: number;
  lineItems: MonthlyReportLineItem[];
}

// ============================================================
// Full Studio State
// ============================================================

export interface StudioState {
  studioName: string;
  playerName: string;
  money: number;
  totalLifetimeMoney: number;
  studioFans: number;
  researchPoints: number;
  unlockedStudioUpgrades: string[];
  unlockedFeatures: string[];

  activeGames: ActiveGame[];
  activeTasks: StudioTask[];
  completedGames: GameSummary[];
  maxParallelTasks: number;       // starts at 1, max 3
  maxActiveGames: number;         // starts at 1, max 3

  // Studio-wide infrastructure
  servers: Server[];
  racks: ServerRack[];

  employees: Employee[];
  currentPack: Employee[];
  packRevealed: boolean[];
  freePackAvailable: boolean;
  engines: GameEngine[];

  furniture: OwnedFurniture[];
  office: OfficeState;
  calendar: CalendarState;

  dailyRates: DailyRates;
  staffContributions: StaffContribution[];
  monthlyReports: MonthlyReport[];

  _dayAccMoney: number;
  _dayAccFans: number;
  _dayAccRP: number;
  _dayTickCounter: number;

  isBankrupt: boolean;
}
