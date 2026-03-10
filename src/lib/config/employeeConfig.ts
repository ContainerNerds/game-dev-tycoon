import type { EmployeeTitle } from '@/lib/game/types';

export interface UniqueEmployeeDef {
  name: string;
  title: EmployeeTitle;
  description: string;
  guaranteedSkills?: Partial<Record<'graphics' | 'sound' | 'gameplay' | 'polish', number>>;
}

export const EMPLOYEE_CONFIG = {
  // ----------------------------------------------------------
  // IV / EV system
  // ----------------------------------------------------------
  minSkill: 0,
  maxSkill: 31,

  evConfig: {
    maxPerSkill: 252,
    maxTotal: 510,
  },

  // ----------------------------------------------------------
  // Pack system (replaces candidate pool)
  // ----------------------------------------------------------
  packSize: 5,
  packBuyCost: 1000,
  freePacksPerMonth: 1,

  // ----------------------------------------------------------
  // Hiring costs (scaled for 0-124 IV total range)
  // ----------------------------------------------------------
  hireCostBase: 200,
  hireCostPerIvPoint: 80,
  hireCostRarityMultiplier: {
    common: 1.0,
    uncommon: 1.2,
    rare: 1.5,
    epic: 2.0,
    legendary: 3.0,
    unique: 4.0,
  } as Record<string, number>,

  salaryBaseline: 300,
  salaryPerIvPoint: 15,
  salaryRarityMultiplier: {
    common: 1.0,
    uncommon: 1.1,
    rare: 1.3,
    epic: 1.6,
    legendary: 2.0,
    unique: 2.5,
  } as Record<string, number>,

  // ----------------------------------------------------------
  // Stamina
  // ----------------------------------------------------------
  stamina: {
    max: 100,
    drainPerTick: 0.15,
    crunchDrainMultiplier: 2,
    lowThreshold: 20,
    lowEfficiency: 0.3,
  },

  vacation: {
    durationDays: 14,
    recoveryPerDay: 7.5,
  },

  // ----------------------------------------------------------
  // Skill bonuses (retuned for 0-94 effective skill range)
  // ----------------------------------------------------------
  bonuses: {
    graphicsBugReduction: 0.003,
    gameplaySpeedBoost: 0.003,
    soundQualityBoost: 0.003,
    polishBugReduction: 0.005,
  },

  pillarContributionMultiplier: 0.08,

  bugChanceBase: 0.08,
  bugChanceReductionPerEffective: 0.0008,
  bugChanceFloor: 0.01,

  // ----------------------------------------------------------
  // Unique employee pool
  // ----------------------------------------------------------
  uniqueEmployees: [
    {
      name: 'Gill Bates',
      title: 'Generalist' as EmployeeTitle,
      description: '"640K of RAM ought to be enough for anybody."',
    },
    {
      name: 'Steve Yobs',
      title: 'Designer' as EmployeeTitle,
      description: '"Design is not just what it looks like. Design is how it works."',
    },
    {
      name: 'Gavin Belson',
      title: 'Generalist' as EmployeeTitle,
      description: '"I don\'t want to live in a world where someone else makes the world a better place better than we do."',
    },
    {
      name: 'Richard Hendricks',
      title: 'Programmer' as EmployeeTitle,
      description: '"What if I told you there\'s a way to losslessly compress data?"',
    },
    {
      name: 'Erlich Bachman',
      title: 'Generalist' as EmployeeTitle,
      description: '"I\'ve been known to be a bit of a visionary."',
    },
    {
      name: 'Bertram Gilfoyle',
      title: 'Programmer' as EmployeeTitle,
      description: '"I\'m a full-stack developer. I code front-end, back-end, and also LaVeyan Satanism."',
    },
    {
      name: 'Dinesh Chugtai',
      title: 'Programmer' as EmployeeTitle,
      description: '"I\'m the best coder here, and everyone knows it."',
    },
    {
      name: 'Jian Yang',
      title: 'Programmer' as EmployeeTitle,
      description: '"It\'s a new app. It\'s like Shazam, but for food."',
    },
    {
      name: 'Peter Gregory',
      title: 'Generalist' as EmployeeTitle,
      description: '"I would like to eat something that is very difficult to prepare."',
    },
    {
      name: 'Laurie Bream',
      title: 'Generalist' as EmployeeTitle,
      description: '"The numbers speak for themselves, and I agree with them."',
    },
  ] as UniqueEmployeeDef[],

  // ----------------------------------------------------------
  // Name pools for generated employees
  // ----------------------------------------------------------
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
