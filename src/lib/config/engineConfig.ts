export const ENGINE_CONFIG = {
  baseCost: 5_000,
  costPerVersion: 3_000,
  baseDevelopmentDays: 30,
  daysPerVersion: 15,

  baseBonusPerVersion: 0.05,

  maxVersion: 10,

  engineNames: [
    'Aurora Engine', 'Nebula Core', 'Titan Framework', 'Prism Engine',
    'Forge Runtime', 'Zenith Core', 'Vortex Engine', 'Apex Framework',
    'Nova Engine', 'Eclipse Core',
  ],
} as const;
