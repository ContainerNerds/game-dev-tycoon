export const EMPLOYEE_CONFIG = {
  candidatePoolSize: 5,
  refreshPoolCost: 500,          // dollars to refresh the candidate pool

  // Skill generation ranges
  minSkill: 1,
  maxSkill: 5,

  // Cost formulas (based on total skill points across all 4 skills)
  hireCostPerSkillPoint: 500,    // hire cost = total skill points * this
  salaryPerSkillPoint: 100,      // monthly salary = total skill points * this
  salaryBaseline: 500,           // minimum monthly salary regardless of skills

  // Passive bonus multipliers (per total skill point in that category across all employees)
  bonuses: {
    develBugReduction: 0.03,     // -3% bug rate per Devel point
    develSpeedBoost: 0.02,       // +2% dev speed per Devel point
    infraCostReduction: 0.02,    // -2% server costs per Infra point
    infraIncidentReduction: 0.03,// -3% server incident chance per Infra point
    projectSpeedBoost: 0.02,     // +2% DLC/sequel speed per Project point
    projectCostReduction: 0.02,  // -2% development cost per Project point
    managementSalaryReduction: 0.01, // -1% employee salaries per Management point
  },

  // Name pools for random generation
  firstNames: [
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
    'Dakota', 'Skyler', 'Reese', 'Cameron', 'Drew', 'Emerson', 'Finley', 'Harper',
    'Jamie', 'Kendall', 'Logan', 'Parker', 'Rowan', 'Sage', 'Blake', 'Charlie',
    'Ellis', 'Frankie', 'Gray', 'Hayden', 'Indigo', 'Jules', 'Kit', 'Lane',
    'Micah', 'Noel', 'Oakley', 'Peyton', 'River', 'Shiloh', 'Tatum', 'Val',
  ],
  lastNames: [
    'Chen', 'Garcia', 'Kim', 'Patel', 'Nguyen', 'Singh', 'Mueller', 'Johansson',
    'Tanaka', 'Silva', 'Petrov', 'O\'Brien', 'Martinez', 'Andersson', 'Lee', 'Ali',
    'Williams', 'Brown', 'Jones', 'Davis', 'Wilson', 'Taylor', 'Clark', 'Walker',
    'Hall', 'Young', 'King', 'Wright', 'Scott', 'Adams', 'Mitchell', 'Torres',
  ],
} as const;
