export const GAME_CONFIG = {
  startingMoneyOptions: [5_000, 10_000, 15_000, 25_000] as const,
  defaultStartingMoney: 10_000,

  // Tick timing (calendar drives everything)
  ticksPerGameHour: 1,

  // Game development
  baseDevProgressPerTick: 0.05,   // % per tick per total Devel skill point
  crunchSpeedMultiplier: 1.5,
  crunchBugPenaltyPerTick: 0.002, // extra bug chance accumulated per tick while crunching
  baseDevCost: 5_000,             // base money cost to develop a game

  // Sales & revenue
  baseSaleRatePerTick: 0.5,       // base copies sold per tick during growth
  peakSaleRateMultiplier: 2.0,
  declineSaleRateMultiplier: 0.3,

  // Game lifecycle (in game-months)
  lifecycle: {
    growthMonths: 2,
    peakMonths: 3,
    declineMonths: 6,
  },

  // Bugs
  bugBaseRatePerTick: 0.01,       // base chance of a bug spawning per tick
  bugPlayerScaling: 0.0001,       // additional bug chance per active player
  bugFixBaseCost: 500,
  bugFixBaseHours: 24,            // in-game hours

  // Research
  researchPointsPerGameDay: 0.5,  // earned while a game is online

  // Fans
  fanConversionRate: 0.05,        // % of buyers who become fans
  studioFanSplitRate: 0.3,        // % of new fans that become studio fans (vs game fans)
  studioFanPurchaseRate: 0.8,     // % of studio fans that auto-buy your next game

  // DLC
  dlcDevCost: 3_000,
  dlcBasePrice: 9.99,
  dlcPlayerBoostPercent: 0.25,    // temporary player count boost on DLC release

  // Sequel
  sequelFanInheritRate: 0.5,      // % of game fans that carry hype to sequel
  sequelDevCostMultiplier: 1.5,   // sequels cost more to develop

  // Bankruptcy
  bankruptcyThreshold: 0,         // money <= this triggers bankruptcy
} as const;
