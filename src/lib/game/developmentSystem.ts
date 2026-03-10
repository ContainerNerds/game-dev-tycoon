import type { StudioTask, ActiveGame, StudioState, PlatformRelease, BlogReview } from './types';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { PLATFORM_CONFIG } from '@/lib/config/platformConfig';
import { getComboMultiplier } from '@/lib/config/genreStyleConfig';
import { calculateReviewScore } from './calculations';

const BLOG_NAMES = [
  'GameSpot Weekly', 'Polygon Insider', 'IGN Daily', 'Kotaku Reviews',
  'PC Gamer', 'Eurogamer', 'Rock Paper Shotgun', 'The Verge Gaming',
  'Destructoid', 'GamesRadar+', 'VG247', 'Dualshockers',
  'GameInformer', 'TouchArcade', 'Niche Gamer', 'Siliconera',
  'Hardcore Gamer', 'Push Square', 'Nintendo Life', 'Screen Rant Gaming',
];

function getReviewSummary(score: number, gameName: string, genre: string): string {
  if (score >= 9) {
    const t = [`A masterpiece that redefines the ${genre} genre.`, `${gameName} is an instant classic.`, `Exceptional in every way.`];
    return t[Math.floor(Math.random() * t.length)];
  }
  if (score >= 7) {
    const t = [`A solid ${genre} experience with a few rough edges.`, `${gameName} delivers where it counts.`, `Well-crafted and enjoyable.`];
    return t[Math.floor(Math.random() * t.length)];
  }
  if (score >= 5) {
    const t = [`${gameName} has potential but fails to deliver.`, `An uneven experience.`, `Average at best.`];
    return t[Math.floor(Math.random() * t.length)];
  }
  if (score >= 3) {
    const t = [`A disappointing entry.`, `${gameName} needed more time.`, `Hard to recommend.`];
    return t[Math.floor(Math.random() * t.length)];
  }
  const t = [`Avoid at all costs.`, `A catastrophic launch.`, `One of the worst ${genre} games.`];
  return t[Math.floor(Math.random() * t.length)];
}

export function generateBlogReviews(baseScore: number, gameName: string, genre: string): BlogReview[] {
  const shuffled = [...BLOG_NAMES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);
  const biases = [0.5, 0, -0.5];
  return selected.map((blogName, i) => {
    const variance = (Math.random() - 0.5) * 3;
    const score = Math.round(Math.min(10, Math.max(1, baseScore + biases[i] + variance)) * 10) / 10;
    return { blogName, score, summary: getReviewSummary(score, gameName, genre) };
  });
}

/**
 * Determine game price based on review score and development cost.
 */
export function determineGamePrice(reviewScore: number, devCost: number): number {
  if (reviewScore >= 8 && devCost >= 10000) return 59.99;
  if (reviewScore >= 6 && devCost >= 5000) return 39.99;
  return 19.99;
}

export function convertTaskToActiveGame(task: StudioTask, state: StudioState): ActiveGame {
  const genre = task.genre!;
  const style = task.style!;
  const mode = task.mode ?? 'standard';
  const platforms = task.platforms ?? ['PC'];
  const pillarWeights = task.pillarWeights ?? { graphics: 25, gameplay: 25, sound: 25, polish: 25 };

  const comboMultiplier = getComboMultiplier(genre, style);
  const formulaScore = calculateReviewScore(
    { genre, style, pillarWeights },
    task.bugsFound,
    state.unlockedStudioUpgrades,
    []
  );
  const blogReviews = generateBlogReviews(formulaScore, task.name, genre);
  const reviewScore = Math.round(
    (blogReviews.reduce((sum, r) => sum + r.score, 0) / blogReviews.length) * 10
  ) / 10;

  const devCost = task.devCostSpent ?? 0;
  const gamePrice = determineGamePrice(reviewScore, devCost);

  const platformReleases: PlatformRelease[] = platforms.map((platform) => {
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
    id: task.id,
    name: task.name,
    genre,
    style,
    mode,
    comboMultiplier,
    phase: 'growth',
    pillarWeights,
    reviewScore,
    blogReviews,
    releaseMonth: state.calendar.month,
    releaseYear: state.calendar.year,
    phaseTicks: 0,
    platformReleases,
    gameFans: 0,
    regionalFans: {},
    gamePrice,
    bugs: (task.bugs ?? []).map((b) => ({ ...b, gameId: task.id, fixProgress: 0, assignedFixerId: null })),
    dlcIds: [],
    dlcCount: 0,
    dlcSalesBoost: 0,
    isLiveService: mode === 'liveservice',
    unlockedGameUpgrades: [],
    totalRevenue: 0,
    monthlyHistory: [],
    bugRateDecay: 1.0,
    averageLatencyMs: 0,
    devCostTotal: devCost,
  };
}
