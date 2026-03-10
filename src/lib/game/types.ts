// ============================================================
// Enums & Literal Types
// ============================================================

export type Genre = 'RPG' | 'Action' | 'Strategy' | 'Simulation' | 'Adventure' | 'Puzzle' | 'Sports';

export type Style = 'Fantasy' | 'SciFi' | 'Horror' | 'Historical' | 'Modern' | 'Cyberpunk' | 'PostApocalyptic' | 'Cartoon';

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

export type SkillType = 'devel' | 'infra' | 'project' | 'management';

export type EmployeeTitle =
  | 'CEO'
  | 'Engineer'
  | 'Architect'
  | 'Artist'
  | 'Sound Designer'
  | 'Producer'
  | 'QA Lead'
  | 'DevOps'
  | 'Generalist';

export type GameSpeed = 0 | 1 | 2;

export type GameLifecyclePhase = 'growth' | 'peak' | 'decline' | 'retired';

export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';

export type UpgradeCategory = 'studio' | 'game';

export type OfficeTier = 0 | 1 | 2 | 3 | 4;

export type ServerType = 'colocated' | 'datacenter';

export type GameMode = 'standard' | 'liveservice';

export type TaskType = 'game' | 'dlc' | 'patch';

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
  devel: number;      // 1–5
  infra: number;
  project: number;
  management: number;
}

export interface Employee {
  id: string;
  name: string;
  title: EmployeeTitle;
  skills: EmployeeSkills;
  assignedTaskId: string | null;  // null = unassigned, 'bugfix' = bug duty, or a task ID
  isPlayer: boolean;
  hireCost: number;
  monthlySalary: number;
}

// ============================================================
// Studio Task (unified: game dev, DLC, patch)
// ============================================================

export interface StudioTask {
  id: string;
  type: TaskType;
  name: string;
  targetGameId: string | null;
  pillarProgress: PillarProgress;
  pillarTargets: PillarTargets;
  progressPercent: number;
  bugsFound: number;
  assignedEmployeeIds: string[];
  autoAssign: boolean;
  isCrunching: boolean;
  startMonth: number;
  startYear: number;
  // Game task fields
  genre?: Genre;
  style?: Style;
  mode?: GameMode;
  platforms?: Platform[];
  pillarWeights?: PillarWeights;
  devCostSpent?: number;
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
  graphics: number;
  gameplay: number;
  sound: number;
  polish: number;
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
  fixProgress: number;          // 0–1, auto-fix progress by bugfix employees
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
  pillarWeights: PillarWeights;
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

  activeGames: ActiveGame[];
  activeTasks: StudioTask[];
  completedGames: GameSummary[];
  maxParallelTasks: number;       // starts at 1, max 3
  maxActiveGames: number;         // starts at 1, max 3

  // Studio-wide infrastructure
  servers: Server[];
  racks: ServerRack[];

  employees: Employee[];
  candidatePool: Employee[];

  office: OfficeState;
  calendar: CalendarState;

  dailyRates: DailyRates;
  staffContributions: StaffContribution[];
  monthlyReports: MonthlyReport[];
  lastCandidateRefreshDay: number;

  _dayAccMoney: number;
  _dayAccFans: number;
  _dayAccRP: number;
  _dayTickCounter: number;

  isBankrupt: boolean;
}
