import type { SkillNode, UpgradeNode } from '@/lib/game/types';

// ============================================================
// Legacy flat tree (kept for save migration only)
// ============================================================

export const LEGACY_SKILL_TREE: UpgradeNode[] = [
  { id: 'better-marketing', name: 'Better Marketing', description: '', category: 'studio', tier: 1, prerequisites: [], cost: 3_000, researchCost: 5, effects: [{ type: 'saleRateMultiplier', value: 1.15 }] },
  { id: 'efficient-ops', name: 'Efficient Operations', description: '', category: 'studio', tier: 1, prerequisites: [], cost: 2_500, researchCost: 3, effects: [{ type: 'serverCostMultiplier', value: 0.90 }] },
  { id: 'basic-qa', name: 'Basic QA Process', description: '', category: 'studio', tier: 1, prerequisites: [], cost: 2_000, researchCost: 4, effects: [{ type: 'bugRateMultiplier', value: 0.85 }] },
  { id: 'viral-launch', name: 'Viral Launch', description: '', category: 'studio', tier: 2, prerequisites: ['better-marketing'], cost: 8_000, researchCost: 10, effects: [{ type: 'peakPlayerMultiplier', value: 1.30 }] },
  { id: 'datacenter-unlocked', name: 'Data Center License', description: '', category: 'studio', tier: 2, prerequisites: ['efficient-ops'], cost: 10_000, researchCost: 15, effects: [{ type: 'unlockDatacenters', value: 1 }] },
  { id: 'console-publishing', name: 'Console Publishing', description: '', category: 'studio', tier: 2, prerequisites: ['better-marketing'], cost: 12_000, researchCost: 12, effects: [{ type: 'unlockPlatform', value: 1 }] },
  { id: 'mobile-publishing', name: 'Mobile Publishing', description: '', category: 'studio', tier: 2, prerequisites: ['better-marketing'], cost: 8_000, researchCost: 8, effects: [{ type: 'unlockPlatform', value: 1 }] },
  { id: 'global-reach', name: 'Global Reach', description: '', category: 'studio', tier: 3, prerequisites: ['viral-launch', 'datacenter-unlocked'], cost: 20_000, researchCost: 25, effects: [{ type: 'regionUnlockCostMultiplier', value: 0.60 }] },
  { id: 'studio-brand', name: 'Studio Brand Power', description: '', category: 'studio', tier: 3, prerequisites: ['viral-launch'], cost: 15_000, researchCost: 20, effects: [{ type: 'studioFanConversionMultiplier', value: 1.25 }] },
  { id: 'server-optimization', name: 'Server Optimization', description: '', category: 'studio', tier: 3, prerequisites: ['datacenter-unlocked'], cost: 12_000, researchCost: 18, effects: [{ type: 'serverCostMultiplier', value: 0.80 }] },
];

// ============================================================
// New Skill Tree — 3 specializations, ~55 nodes
// ============================================================

export const SKILL_TREE: SkillNode[] = [
  // ──────────────────────────────────────────────────────────
  // PRODUCTION — dev speed, quality, crunch, bugs, capacity
  // ──────────────────────────────────────────────────────────

  // Tier 1
  {
    id: 'prod-faster-dev',
    name: 'Faster Development',
    description: 'Increase development speed',
    specialization: 'production',
    tier: 1,
    maxRanks: 3,
    pointsPerRank: 1,
    prerequisites: [],
    effects: [{ type: 'devSpeedMultiplier', valuePerRank: [1.05, 1.10, 1.15] }],
  },
  {
    id: 'prod-qa-basics',
    name: 'QA Fundamentals',
    description: 'Reduce bug encounter rate',
    specialization: 'production',
    tier: 1,
    maxRanks: 3,
    pointsPerRank: 1,
    prerequisites: [],
    effects: [{ type: 'bugRateMultiplier', valuePerRank: [0.90, 0.80, 0.70] }],
  },
  {
    id: 'prod-polish-focus',
    name: 'Polish Focus',
    description: 'Boost polish pillar effectiveness',
    specialization: 'production',
    tier: 1,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: [],
    effects: [{ type: 'polishMultiplier', valuePerRank: [1.10, 1.20] }],
  },

  // Tier 2
  {
    id: 'prod-efficient-crunch',
    name: 'Efficient Crunch',
    description: 'Increase crunch speed bonus while reducing stamina cost',
    specialization: 'production',
    tier: 2,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['prod-faster-dev'],
    effects: [{ type: 'crunchEfficiency', valuePerRank: [1.15, 1.30] }],
  },
  {
    id: 'prod-rapid-prototype',
    name: 'Rapid Prototyping',
    description: 'Reduce development costs',
    specialization: 'production',
    tier: 2,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['prod-faster-dev'],
    effects: [{ type: 'devCostMultiplier', valuePerRank: [0.90, 0.80] }],
  },
  {
    id: 'prod-bug-prevention',
    name: 'Bug Prevention',
    description: 'Further reduce bug spawn rate',
    specialization: 'production',
    tier: 2,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['prod-qa-basics'],
    effects: [{ type: 'bugRateMultiplier', valuePerRank: [0.85, 0.70] }],
  },
  {
    id: 'prod-graphics-spec',
    name: 'Graphics Specialist',
    description: 'Boost graphics pillar effectiveness',
    specialization: 'production',
    tier: 2,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['prod-polish-focus'],
    effects: [{ type: 'graphicsMultiplier', valuePerRank: [1.10, 1.20] }],
  },
  {
    id: 'prod-sound-spec',
    name: 'Audio Engineer',
    description: 'Boost sound pillar effectiveness',
    specialization: 'production',
    tier: 2,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['prod-polish-focus'],
    effects: [{ type: 'soundMultiplier', valuePerRank: [1.10, 1.20] }],
  },

  // Tier 3
  {
    id: 'prod-parallel-tasks',
    name: 'Parallel Processing',
    description: 'Unlock additional parallel task slot',
    specialization: 'production',
    tier: 3,
    maxRanks: 2,
    pointsPerRank: 2,
    prerequisites: ['prod-efficient-crunch', 'prod-rapid-prototype'],
    effects: [{ type: 'parallelTaskSlot', valuePerRank: [1, 1] }],
  },
  {
    id: 'prod-gameplay-guru',
    name: 'Gameplay Guru',
    description: 'Boost gameplay pillar effectiveness',
    specialization: 'production',
    tier: 3,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['prod-graphics-spec'],
    effects: [{ type: 'gameplayMultiplier', valuePerRank: [1.10, 1.20] }],
  },
  {
    id: 'prod-patch-efficiency',
    name: 'Patch Efficiency',
    description: 'Patches complete faster',
    specialization: 'production',
    tier: 3,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['prod-bug-prevention'],
    effects: [{ type: 'patchSpeedMultiplier', valuePerRank: [1.20, 1.50] }],
  },

  // Tier 4
  {
    id: 'prod-mastercraft',
    name: 'Mastercraft Studio',
    description: 'Major boost to all development pillars',
    specialization: 'production',
    tier: 4,
    maxRanks: 1,
    pointsPerRank: 3,
    prerequisites: ['prod-parallel-tasks', 'prod-gameplay-guru'],
    effects: [
      { type: 'graphicsMultiplier', valuePerRank: [1.15] },
      { type: 'soundMultiplier', valuePerRank: [1.15] },
      { type: 'gameplayMultiplier', valuePerRank: [1.15] },
      { type: 'polishMultiplier', valuePerRank: [1.15] },
    ],
  },
  {
    id: 'prod-zero-defects',
    name: 'Zero Defects',
    description: 'Drastically reduce bug rates across all games',
    specialization: 'production',
    tier: 4,
    maxRanks: 1,
    pointsPerRank: 3,
    prerequisites: ['prod-patch-efficiency'],
    effects: [{ type: 'bugRateMultiplier', valuePerRank: [0.50] }],
  },

  // ──────────────────────────────────────────────────────────
  // BUSINESS — sales, fans, marketing, pricing, lifecycle
  // ──────────────────────────────────────────────────────────

  // Tier 1
  {
    id: 'biz-marketing',
    name: 'Better Marketing',
    description: 'Increase game sale rate',
    specialization: 'business',
    tier: 1,
    maxRanks: 3,
    pointsPerRank: 1,
    prerequisites: [],
    effects: [{ type: 'saleRateMultiplier', valuePerRank: [1.10, 1.20, 1.30] }],
  },
  {
    id: 'biz-pricing',
    name: 'Premium Pricing',
    description: 'Increase revenue per sale',
    specialization: 'business',
    tier: 1,
    maxRanks: 3,
    pointsPerRank: 1,
    prerequisites: [],
    effects: [{ type: 'priceMultiplier', valuePerRank: [1.10, 1.20, 1.30] }],
  },
  {
    id: 'biz-early-access',
    name: 'Early Access Program',
    description: 'Gain more fans during growth phase',
    specialization: 'business',
    tier: 1,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: [],
    effects: [{ type: 'growthFanMultiplier', valuePerRank: [1.15, 1.30] }],
  },

  // Tier 2
  {
    id: 'biz-viral-launch',
    name: 'Viral Launch',
    description: 'Increase peak player count on release',
    specialization: 'business',
    tier: 2,
    maxRanks: 3,
    pointsPerRank: 1,
    prerequisites: ['biz-marketing'],
    effects: [{ type: 'peakPlayerMultiplier', valuePerRank: [1.15, 1.30, 1.50] }],
  },
  {
    id: 'biz-bundle-deals',
    name: 'Bundle Deals',
    description: 'Chance to sell extra copies per transaction',
    specialization: 'business',
    tier: 2,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['biz-pricing'],
    effects: [{ type: 'doubleSaleChance', valuePerRank: [0.15, 0.30] }],
  },
  {
    id: 'biz-community',
    name: 'Community Manager',
    description: 'Slow player decline rate',
    specialization: 'business',
    tier: 2,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['biz-early-access'],
    effects: [{ type: 'declineRateMultiplier', valuePerRank: [0.85, 0.70] }],
  },
  {
    id: 'biz-studio-brand',
    name: 'Studio Brand',
    description: 'Increase studio fan conversion rate',
    specialization: 'business',
    tier: 2,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['biz-marketing'],
    effects: [{ type: 'studioFanConversionMultiplier', valuePerRank: [1.15, 1.30] }],
  },

  // Tier 3
  {
    id: 'biz-dlc-pipeline',
    name: 'DLC Pipeline',
    description: 'Boost DLC sales and reduce DLC dev costs',
    specialization: 'business',
    tier: 3,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['biz-community'],
    effects: [{ type: 'dlcSalesMultiplier', valuePerRank: [1.25, 1.50] }],
  },
  {
    id: 'biz-sequel-hype',
    name: 'Sequel Hype Machine',
    description: 'Launch boost for sequels from existing fan base',
    specialization: 'business',
    tier: 3,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['biz-viral-launch', 'biz-bundle-deals'],
    effects: [{ type: 'sequelLaunchBoost', valuePerRank: [1.30, 1.60] }],
  },
  {
    id: 'biz-esports',
    name: 'Esports Ready',
    description: 'Extend peak phase duration',
    specialization: 'business',
    tier: 3,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['biz-community'],
    effects: [{ type: 'peakDurationMultiplier', valuePerRank: [1.50, 2.00] }],
  },
  {
    id: 'biz-active-games',
    name: 'Portfolio Management',
    description: 'Unlock additional active game slot',
    specialization: 'business',
    tier: 3,
    maxRanks: 2,
    pointsPerRank: 2,
    prerequisites: ['biz-studio-brand'],
    effects: [{ type: 'activeGameSlot', valuePerRank: [1, 1] }],
  },
  {
    id: 'biz-fan-loyalty',
    name: 'Fan Loyalty Program',
    description: 'Studio fans are more likely to auto-buy new releases',
    specialization: 'business',
    tier: 3,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['biz-studio-brand'],
    effects: [{ type: 'studioFanPurchaseRate', valuePerRank: [1.15, 1.30] }],
  },

  // Tier 4
  {
    id: 'biz-megacorp',
    name: 'Media Megacorp',
    description: 'Massive boost to all sale and fan metrics',
    specialization: 'business',
    tier: 4,
    maxRanks: 1,
    pointsPerRank: 3,
    prerequisites: ['biz-sequel-hype', 'biz-fan-loyalty'],
    effects: [
      { type: 'saleRateMultiplier', valuePerRank: [1.25] },
      { type: 'studioFanConversionMultiplier', valuePerRank: [1.20] },
    ],
  },
  {
    id: 'biz-evergreen',
    name: 'Evergreen Titles',
    description: 'Games decline much slower, staying profitable longer',
    specialization: 'business',
    tier: 4,
    maxRanks: 1,
    pointsPerRank: 3,
    prerequisites: ['biz-esports', 'biz-dlc-pipeline'],
    effects: [{ type: 'declineRateMultiplier', valuePerRank: [0.50] }],
  },

  // ──────────────────────────────────────────────────────────
  // TECHNOLOGY — servers, research, platforms, engines
  // ──────────────────────────────────────────────────────────

  // Tier 1
  {
    id: 'tech-server-opt',
    name: 'Server Optimization',
    description: 'Reduce server infrastructure costs',
    specialization: 'technology',
    tier: 1,
    maxRanks: 3,
    pointsPerRank: 1,
    prerequisites: [],
    effects: [{ type: 'serverCostMultiplier', valuePerRank: [0.90, 0.80, 0.70] }],
  },
  {
    id: 'tech-research-boost',
    name: 'Research Methodology',
    description: 'Increase research point generation',
    specialization: 'technology',
    tier: 1,
    maxRanks: 3,
    pointsPerRank: 1,
    prerequisites: [],
    effects: [{ type: 'researchRateMultiplier', valuePerRank: [1.15, 1.30, 1.50] }],
  },
  {
    id: 'tech-engine-basics',
    name: 'Engine Fundamentals',
    description: 'Reduce engine feature costs',
    specialization: 'technology',
    tier: 1,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: [],
    effects: [{ type: 'engineCostMultiplier', valuePerRank: [0.90, 0.80] }],
  },

  // Tier 2
  {
    id: 'tech-datacenter',
    name: 'Datacenter License',
    description: 'Unlock the ability to build your own data centers',
    specialization: 'technology',
    tier: 2,
    maxRanks: 1,
    pointsPerRank: 1,
    prerequisites: ['tech-server-opt'],
    effects: [{ type: 'unlockDatacenters', valuePerRank: [1] }],
  },
  {
    id: 'tech-console',
    name: 'Console Publishing',
    description: 'Unlock Console platform for game releases',
    specialization: 'technology',
    tier: 2,
    maxRanks: 1,
    pointsPerRank: 1,
    prerequisites: ['tech-engine-basics'],
    effects: [{ type: 'unlockPlatform', valuePerRank: [1] }],
  },
  {
    id: 'tech-mobile',
    name: 'Mobile Publishing',
    description: 'Unlock Mobile platform for game releases',
    specialization: 'technology',
    tier: 2,
    maxRanks: 1,
    pointsPerRank: 1,
    prerequisites: ['tech-engine-basics'],
    effects: [{ type: 'unlockPlatform', valuePerRank: [1] }],
  },
  {
    id: 'tech-cloud-infra',
    name: 'Cloud Infrastructure',
    description: 'Increase server capacity per unit',
    specialization: 'technology',
    tier: 2,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['tech-server-opt'],
    effects: [{ type: 'serverCapacityMultiplier', valuePerRank: [1.20, 1.50] }],
  },
  {
    id: 'tech-research-lab',
    name: 'Research Lab',
    description: 'Significantly boost research speed',
    specialization: 'technology',
    tier: 2,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['tech-research-boost'],
    effects: [{ type: 'researchSpeedMultiplier', valuePerRank: [1.20, 1.40] }],
  },

  // Tier 3
  {
    id: 'tech-global-reach',
    name: 'Global Reach',
    description: 'Reduce region unlock costs',
    specialization: 'technology',
    tier: 3,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['tech-datacenter'],
    effects: [{ type: 'regionUnlockCostMultiplier', valuePerRank: [0.70, 0.50] }],
  },
  {
    id: 'tech-auto-scaling',
    name: 'Auto-Scaling',
    description: 'Reduce overload penalty when servers are near capacity',
    specialization: 'technology',
    tier: 3,
    maxRanks: 2,
    pointsPerRank: 1,
    prerequisites: ['tech-cloud-infra'],
    effects: [{ type: 'overloadThreshold', valuePerRank: [0.95, 1.00] }],
  },
  {
    id: 'tech-advanced-engines',
    name: 'Advanced Engine Tech',
    description: 'Unlock higher-tier engine features earlier',
    specialization: 'technology',
    tier: 3,
    maxRanks: 1,
    pointsPerRank: 2,
    prerequisites: ['tech-console', 'tech-mobile'],
    effects: [{ type: 'engineTierUnlock', valuePerRank: [1] }],
  },
  {
    id: 'tech-ai-testing',
    name: 'AI-Assisted Testing',
    description: 'Automatically fix low-severity bugs',
    specialization: 'technology',
    tier: 3,
    maxRanks: 1,
    pointsPerRank: 2,
    prerequisites: ['tech-research-lab'],
    effects: [{ type: 'autoFixLowBugs', valuePerRank: [1] }],
  },

  // Tier 4
  {
    id: 'tech-hyperscale',
    name: 'Hyperscale Infrastructure',
    description: 'Massive server cost reduction and capacity boost',
    specialization: 'technology',
    tier: 4,
    maxRanks: 1,
    pointsPerRank: 3,
    prerequisites: ['tech-global-reach', 'tech-auto-scaling'],
    effects: [
      { type: 'serverCostMultiplier', valuePerRank: [0.60] },
      { type: 'serverCapacityMultiplier', valuePerRank: [1.30] },
    ],
  },
  {
    id: 'tech-innovation-lab',
    name: 'Innovation Lab',
    description: 'All research completes faster and costs less',
    specialization: 'technology',
    tier: 4,
    maxRanks: 1,
    pointsPerRank: 3,
    prerequisites: ['tech-ai-testing', 'tech-advanced-engines'],
    effects: [
      { type: 'researchRateMultiplier', valuePerRank: [1.30] },
      { type: 'engineCostMultiplier', valuePerRank: [0.70] },
    ],
  },
];

/** Look up a skill node by ID */
export function getSkillNode(id: string): SkillNode | undefined {
  return SKILL_TREE.find((n) => n.id === id);
}

/** Get all nodes for a specialization */
export function getSpecNodes(spec: SkillNode['specialization']): SkillNode[] {
  return SKILL_TREE.filter((n) => n.specialization === spec);
}

/** Check whether all prerequisites are met for a given node */
export function prereqsMet(nodeId: string, allocated: Record<string, number>): boolean {
  const node = getSkillNode(nodeId);
  if (!node) return false;
  return node.prerequisites.every((prereqId) => {
    const prereqNode = getSkillNode(prereqId);
    if (!prereqNode) return false;
    return (allocated[prereqId] ?? 0) >= 1;
  });
}

/**
 * Get the current effective value of an effect type across all allocated skills.
 * Multiplicative effects are multiplied together; additive effects (like slot unlocks) are summed.
 */
export function getSkillEffectValue(
  effectType: string,
  allocated: Record<string, number>,
): number {
  const additiveTypes = new Set([
    'parallelTaskSlot', 'activeGameSlot', 'unlockDatacenters',
    'unlockPlatform', 'engineTierUnlock', 'autoFixLowBugs',
  ]);
  const isAdditive = additiveTypes.has(effectType);
  let result = isAdditive ? 0 : 1;

  for (const node of SKILL_TREE) {
    const ranks = allocated[node.id] ?? 0;
    if (ranks === 0) continue;
    for (const effect of node.effects) {
      if (effect.type !== effectType) continue;
      const val = effect.valuePerRank[ranks - 1] ?? effect.valuePerRank[effect.valuePerRank.length - 1];
      if (isAdditive) {
        result += val;
      } else {
        result *= val;
      }
    }
  }

  return result;
}
