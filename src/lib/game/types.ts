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

export type GameSpeed = 0 | 1 | 2 | 4;

export type GameLifecyclePhase = 'development' | 'growth' | 'peak' | 'decline' | 'retired';

export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';

export type UpgradeCategory = 'studio' | 'game';

export type OfficeTier = 0 | 1 | 2 | 3 | 4;

export type ServerType = 'colocated' | 'datacenter';

export type GameMode = 'singleplayer' | 'multiplayer';

// ============================================================
// Development Pillars
// ============================================================

export interface PillarWeights {
  graphics: number;   // 0–100, all four must sum to 100
  gameplay: number;
  sound: number;
  polish: number;
}

export interface PillarProgress {
  graphics: number;   // current accumulated points
  gameplay: number;
  sound: number;
  polish: number;
}

export interface PillarTargets {
  graphics: number;   // points needed to complete
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

export type EmployeeAssignment = 'development' | 'bugfix';

export interface Employee {
  id: string;
  name: string;
  title: EmployeeTitle;
  skills: EmployeeSkills;
  assignment: EmployeeAssignment;
  isPlayer: boolean;            // true for the player character
  hireCost: number;
  monthlySalary: number;
}

// ============================================================
// Rate Tracking (per-day deltas for HUD)
// ============================================================

export interface DailyRates {
  moneyPerDay: number;
  fansPerDay: number;
  rpPerDay: number;
}

export interface StaffContribution {
  employeeId: string;
  employeeName: string;
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
  severity: BugSeverity;
  name: string;
  fixCost: number;
  fixTimeHours: number;       // in-game hours to fix
  fixProgressHours: number;   // hours of fix work completed
  spawnedAt: number;          // calendar tick when spawned
}

// ============================================================
// Servers
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
// DLC
// ============================================================

export interface DLC {
  id: string;
  name: string;
  devCost: number;
  price: number;
  status: 'developing' | 'released';
  progressPercent: number;
  copiesSold: number;
}

export interface LivePatch {
  id: string;
  name: string;
  pillarProgress: PillarProgress;
  pillarTargets: PillarTargets;
  progressPercent: number;
  status: 'developing' | 'released';
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
  prerequisites: string[];     // ids of required upgrades
  cost: number;                // money cost
  researchCost: number;        // research points cost
  effects: UpgradeEffect[];
}

export interface UpgradeEffect {
  type: string;                // e.g. 'serverCostMultiplier', 'bugRateMultiplier', etc.
  value: number;               // multiplier or flat value
}

// ============================================================
// Platform Release Info
// ============================================================

export interface PlatformRelease {
  platform: Platform;
  portingCost: number;
  audienceMultiplier: number;
  revenueCut: number;          // 0–1, fraction taken by platform
  activePlayers: number;
  totalCopiesSold: number;
}

// ============================================================
// Active Game (released or in development)
// ============================================================

export interface GameInDev {
  id: string;
  name: string;
  genre: Genre;
  style: Style;
  mode: GameMode;
  platforms: Platform[];
  pillarWeights: PillarWeights;
  pillarProgress: PillarProgress;
  pillarTargets: PillarTargets;
  progressPercent: number;
  bugsFound: number;
  devCostSpent: number;
  isCrunching: boolean;
  crunchBugPenalty: number;
}

export interface BlogReview {
  blogName: string;
  score: number;          // 1.0–10.0
  summary: string;
}

export interface MonthlySnapshot {
  month: number;
  year: number;
  copiesSold: number;
  activePlayers: number;
  revenue: number;
}

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
  dlcs: DLC[];
  patches: LivePatch[];
  isLiveService: boolean;      // true if actively patching — slows decline
  servers: Server[];
  racks: ServerRack[];
  unlockedGameUpgrades: string[];
  totalRevenue: number;
  monthlyHistory: MonthlySnapshot[];
  bugRateDecay: number;
  averageLatencyMs: number;
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
  month: number;        // 1–12
  day: number;          // 1–N
  hour: number;         // 0–23
  speed: GameSpeed;
  monthEndPending: boolean;
  lastMonthReport: MonthlyReport | null;
}

// ============================================================
// Monthly Report
// ============================================================

export interface MonthlyReportLineItem {
  label: string;
  amount: number;       // positive = income, negative = expense
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

  currentGame: ActiveGame | null;
  gameInDevelopment: GameInDev | null;
  completedGames: GameSummary[];

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
