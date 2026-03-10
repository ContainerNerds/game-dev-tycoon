export const EMPLOYEE_CONFIG = {
  candidatePoolSize: 5,
  refreshPoolCost: 500,

  minSkill: 1,
  maxSkill: 5,

  hireCostPerSkillPoint: 500,
  salaryPerSkillPoint: 100,
  salaryBaseline: 500,

  stamina: {
    max: 100,
    drainPerTick: 0.15,              // ~0.6 per day at 4 ticks/day → burnout in ~40 days
    crunchDrainMultiplier: 2,
    lowThreshold: 20,
    lowEfficiency: 0.3,              // 30% efficiency at 0 stamina
  },

  vacation: {
    durationDays: 14,
    recoveryPerDay: 7.5,             // 100% in 14 days (rounded)
  },

  bonuses: {
    graphicsBugReduction: 0.02,
    gameplaySpeedBoost: 0.02,
    soundQualityBoost: 0.02,
    polishBugReduction: 0.03,
  },

  firstNames: [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
    'Dakota', 'Skyler', 'Reese', 'Cameron', 'Drew', 'Emerson', 'Finley', 'Harper',
    'Jamie', 'Kendall', 'Logan', 'Parker', 'Rowan', 'Sage', 'Blake', 'Charlie',
    'Ellis', 'Frankie', 'Gray', 'Hayden', 'Indigo', 'Jules', 'Kit', 'Lane',
    'Micah', 'Noel', 'Oakley', 'Peyton', 'River', 'Shiloh', 'Tatum', 'Val',
  ],
  lastNames: [
    'Chen', 'Garcia', 'Kim', 'Patel', 'Nguyen', 'Singh', 'Mueller', 'Johansson',
    'Tanaka', 'Silva', 'Petrov', "O'Brien", 'Martinez', 'Andersson', 'Lee', 'Ali',
    'Williams', 'Brown', 'Jones', 'Davis', 'Wilson', 'Taylor', 'Clark', 'Walker',
    'Hall', 'Young', 'King', 'Wright', 'Scott', 'Adams', 'Mitchell', 'Torres',
  ],
} as const;
