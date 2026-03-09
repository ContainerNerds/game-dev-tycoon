import type { GameInDev, ActiveGame, StudioState, PlatformRelease, BlogReview } from './types';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { OFFICE_CONFIG } from '@/lib/config/officeConfig';
import { PLATFORM_CONFIG } from '@/lib/config/platformConfig';
import { getComboMultiplier } from '@/lib/config/genreStyleConfig';
import {
  getDevSpeedMultiplier,
  calculateReviewScore,
  getUpgradeMultiplier,
} from './calculations';

export function calculateDevProgressPerTick(state: StudioState): number {
  if (!state.gameInDevelopment) return 0;

  const officeDef = OFFICE_CONFIG.tiers.find((t) => t.tier === state.office.tier);
  const officeBonus = officeDef?.devSpeedBonus ?? 1.0;

  const employeeSpeed = getDevSpeedMultiplier(state.employees);

  const projectBoost = getUpgradeMultiplier(
    'projectSpeedBoost',
    state.unlockedStudioUpgrades,
    []
  );

  let progress = GAME_CONFIG.baseDevProgressPerTick * employeeSpeed * officeBonus * projectBoost;

  if (state.gameInDevelopment.isCrunching) {
    progress *= GAME_CONFIG.crunchSpeedMultiplier;
  }

  return Math.max(GAME_CONFIG.baseDevProgressPerTick * 0.5, progress);
}

const BLOG_NAMES = [
  'GameSpot Weekly', 'Polygon Insider', 'IGN Daily', 'Kotaku Reviews',
  'PC Gamer', 'Eurogamer', 'Rock Paper Shotgun', 'The Verge Gaming',
  'Destructoid', 'GamesRadar+', 'VG247', 'Dualshockers',
  'GameInformer', 'TouchArcade', 'Niche Gamer', 'Siliconera',
  'Hardcore Gamer', 'Push Square', 'Nintendo Life', 'Screen Rant Gaming',
];

function getReviewSummary(score: number, gameName: string, genre: string): string {
  if (score >= 9) {
    const templates = [
      `A masterpiece that redefines the ${genre} genre.`,
      `${gameName} is an instant classic — a must-play for everyone.`,
      `Exceptional in every way. ${gameName} sets a new standard.`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
  if (score >= 7) {
    const templates = [
      `A solid ${genre} experience with a few rough edges.`,
      `${gameName} delivers where it counts, though it plays it safe.`,
      `Well-crafted and enjoyable, if not groundbreaking.`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
  if (score >= 5) {
    const templates = [
      `${gameName} has potential but fails to deliver on its promises.`,
      `An uneven experience — moments of brilliance buried in mediocrity.`,
      `Average at best. ${genre} fans may find some enjoyment here.`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
  if (score >= 3) {
    const templates = [
      `A disappointing entry that misses the mark on most fronts.`,
      `${gameName} needed more time in the oven. A lot more.`,
      `Hard to recommend even for die-hard ${genre} fans.`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
  const templates = [
    `Avoid at all costs — ${gameName} is a broken mess.`,
    `A catastrophic launch. Nothing works as intended.`,
    `One of the worst ${genre} games we've ever reviewed.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

export function generateBlogReviews(baseScore: number, gameName: string, genre: string): BlogReview[] {
  const shuffled = [...BLOG_NAMES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  const biases = [0.5, 0, -0.5]; // generous, neutral, harsh

  return selected.map((blogName, i) => {
    const variance = (Math.random() - 0.5) * 3; // +/- 1.5
    const score = Math.round(Math.min(10, Math.max(1, baseScore + biases[i] + variance)) * 10) / 10;
    return {
      blogName,
      score,
      summary: getReviewSummary(score, gameName, genre),
    };
  });
}

export function convertDevToActiveGame(
  dev: GameInDev,
  state: StudioState
): ActiveGame {
  const comboMultiplier = getComboMultiplier(dev.genre, dev.style);

  const formulaScore = calculateReviewScore(
    { genre: dev.genre, style: dev.style, pillarWeights: dev.pillarWeights },
    dev.bugsFound,
    state.unlockedStudioUpgrades,
    []
  );

  const blogReviews = generateBlogReviews(formulaScore, dev.name, dev.genre);
  const reviewScore = Math.round(
    (blogReviews.reduce((sum, r) => sum + r.score, 0) / blogReviews.length) * 10
  ) / 10;

  const platformReleases: PlatformRelease[] = dev.platforms.map((platform) => {
    const def = PLATFORM_CONFIG.platforms.find((p) => p.platform === platform)!;
    return {
      platform,
      portingCost: def.portingCost,
      audienceMultiplier: def.audienceMultiplier,
      revenueCut: def.revenueCut,
      activePlayers: 0,
      totalCopiesSold: 0,
    };
  });

  return {
    id: dev.id,
    name: dev.name,
    genre: dev.genre,
    style: dev.style,
    mode: dev.mode,
    comboMultiplier,
    phase: 'growth',
    pillarWeights: dev.pillarWeights,
    reviewScore,
    blogReviews,
    releaseMonth: state.calendar.month,
    releaseYear: state.calendar.year,
    phaseTicks: 0,
    platformReleases,
    gameFans: 0,
    regionalFans: {},
    gamePrice: PLATFORM_CONFIG.basePriceByPlatform[dev.platforms[0] ?? 'PC'],
    bugs: [],
    dlcs: [],
    servers: [],
    racks: [],
    unlockedGameUpgrades: [],
    totalRevenue: 0,
    monthlyHistory: [],
    bugRateDecay: 1.0,
    averageLatencyMs: 0,
  };
}
