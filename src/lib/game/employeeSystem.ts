import type { Employee, EmployeeSkills, EmployeeTitle, EmployeeType, TaskType, PhaseCategories } from './types';
import { EMPLOYEE_CONFIG, EMPLOYEE_TASK_ABILITIES, PACK_TYPES, type PackTypeId } from '@/lib/config/employeeConfig';
import { CATEGORY_SKILL_MAP, PRIMARY_SKILL_WEIGHT, SECONDARY_SKILL_WEIGHT } from '@/lib/config/categoryConfig';
import { type Rarity, RARITY_TIERS, RARITY_ORDER } from '@/lib/config/rarityConfig';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================================
// Effective Skill (IV + EV)
// ============================================================

export function getEffectiveSkill(iv: number, ev: number): number {
  return iv + Math.floor(ev / 4);
}

export function getEffectiveSkills(emp: Employee): EmployeeSkills {
  return {
    graphics: getEffectiveSkill(emp.skills.graphics, emp.evs.graphics),
    sound: getEffectiveSkill(emp.skills.sound, emp.evs.sound),
    gameplay: getEffectiveSkill(emp.skills.gameplay, emp.evs.gameplay),
    polish: getEffectiveSkill(emp.skills.polish, emp.evs.polish),
  };
}

// ============================================================
// Rarity Rolling
// ============================================================

export function rollRarity(customWeights?: Record<Rarity, number>): Rarity {
  const roll = Math.random();
  let cumulative = 0;
  for (const rarity of RARITY_ORDER) {
    cumulative += customWeights ? customWeights[rarity] : RARITY_TIERS[rarity].weight;
    if (roll < cumulative) return rarity;
  }
  return 'common';
}

// ============================================================
// Skill Generation
// ============================================================

function generateSkillsForRarity(rarity: Rarity): EmployeeSkills {
  const { min, max } = RARITY_TIERS[rarity].ivRange;
  return {
    graphics: randomInt(min, max),
    sound: randomInt(min, max),
    gameplay: randomInt(min, max),
    polish: randomInt(min, max),
  };
}

function getTotalIvPoints(skills: EmployeeSkills): number {
  return skills.graphics + skills.sound + skills.gameplay + skills.polish;
}

function deriveTitle(skills: EmployeeSkills): EmployeeTitle {
  const max = Math.max(skills.graphics, skills.sound, skills.gameplay, skills.polish);
  const vals = [skills.graphics, skills.sound, skills.gameplay, skills.polish];
  const hasMultipleMax = vals.filter(s => s === max).length > 1;

  if (hasMultipleMax) return 'Generalist';
  if (skills.graphics === max) return 'Artist';
  if (skills.sound === max) return 'Sound Designer';
  if (skills.gameplay === max) return 'Designer';
  if (skills.polish === max) return 'QA Tester';
  return 'Generalist';
}

function generateName(): string {
  const first = EMPLOYEE_CONFIG.firstNames[randomInt(0, EMPLOYEE_CONFIG.firstNames.length - 1)];
  const last = EMPLOYEE_CONFIG.lastNames[randomInt(0, EMPLOYEE_CONFIG.lastNames.length - 1)];
  return `${first} ${last}`;
}

function rollEmployeeType(): EmployeeType {
  const dist = EMPLOYEE_CONFIG.employeeTypeDistribution;
  const roll = Math.random();
  let cumulative = 0;
  for (const [type, weight] of Object.entries(dist)) {
    cumulative += weight;
    if (roll < cumulative) return type as EmployeeType;
  }
  return 'developer';
}

const ZERO_EVS: EmployeeSkills = { graphics: 0, sound: 0, gameplay: 0, polish: 0 };

function computeHireCost(rarity: Rarity, totalIv: number): number {
  const rarityMult = EMPLOYEE_CONFIG.hireCostRarityMultiplier[rarity] ?? 1;
  return Math.round((EMPLOYEE_CONFIG.hireCostBase + totalIv * EMPLOYEE_CONFIG.hireCostPerIvPoint) * rarityMult);
}

function computeSalary(rarity: Rarity, totalIv: number): number {
  const rarityMult = EMPLOYEE_CONFIG.salaryRarityMultiplier[rarity] ?? 1;
  return Math.round((EMPLOYEE_CONFIG.salaryBaseline + totalIv * EMPLOYEE_CONFIG.salaryPerIvPoint) * rarityMult);
}

// ============================================================
// Employee Generation
// ============================================================

export function generateEmployee(forcedRarity?: Rarity): Employee {
  const rarity = forcedRarity ?? rollRarity();

  if (rarity === 'unique') {
    return generateUniqueEmployee();
  }

  const skills = generateSkillsForRarity(rarity);
  const totalIv = getTotalIvPoints(skills);
  const title = deriveTitle(skills);
  const employeeType = rollEmployeeType();

  return {
    id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: generateName(),
    title,
    employeeType,
    rarity,
    skills,
    evs: { ...ZERO_EVS },
    assignedTaskId: null,
    activity: 'idle',
    autoAssign: true,
    isPlayer: false,
    hireCost: computeHireCost(rarity, totalIv),
    monthlySalary: computeSalary(rarity, totalIv),
    stamina: EMPLOYEE_CONFIG.stamina.max,
    onVacation: false,
    vacationDaysLeft: 0,
    bugsFixed: 0,
    totalBugFixPoints: 0,
  };
}

function generateUniqueEmployee(): Employee {
  const pool = EMPLOYEE_CONFIG.uniqueEmployees;
  const def = pool[randomInt(0, pool.length - 1)];
  const skills = generateSkillsForRarity('unique');

  if (def.guaranteedSkills) {
    for (const [key, val] of Object.entries(def.guaranteedSkills)) {
      if (val !== undefined) {
        skills[key as keyof EmployeeSkills] = val;
      }
    }
  }

  const totalIv = getTotalIvPoints(skills);

  return {
    id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: def.name,
    title: def.title,
    employeeType: def.employeeType ?? 'developer',
    rarity: 'unique',
    skills,
    evs: { ...ZERO_EVS },
    description: def.description,
    assignedTaskId: null,
    activity: 'idle',
    autoAssign: true,
    isPlayer: false,
    hireCost: computeHireCost('unique', totalIv),
    monthlySalary: computeSalary('unique', totalIv),
    stamina: EMPLOYEE_CONFIG.stamina.max,
    onVacation: false,
    vacationDaysLeft: 0,
    bugsFixed: 0,
    totalBugFixPoints: 0,
  };
}

// ============================================================
// Pack Generation (replaces candidate pool)
// ============================================================

export function generatePack(packTypeId: PackTypeId = 'standard'): Employee[] {
  const packDef = PACK_TYPES[packTypeId];
  const pack: Employee[] = [];

  for (const guaranteedRarity of packDef.guarantees) {
    pack.push(generateEmployee(guaranteedRarity));
  }

  while (pack.length < packDef.size) {
    const rarity = rollRarity(packDef.rarityWeights);
    pack.push(generateEmployee(rarity));
  }

  for (let i = pack.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pack[i], pack[j]] = [pack[j], pack[i]];
  }

  return pack;
}

// ============================================================
// Game Logic Helpers
// ============================================================

export function getEmployeePillarContribution(emp: Employee): {
  graphics: number;
  gameplay: number;
  sound: number;
  polish: number;
} {
  const eff = getEffectiveSkills(emp);
  const m = EMPLOYEE_CONFIG.pillarContributionMultiplier;
  return {
    graphics: eff.graphics * m,
    gameplay: eff.gameplay * m,
    sound: eff.sound * m,
    polish: eff.polish * m,
  };
}

export function getEmployeeCategoryContribution(emp: Employee, category: keyof PhaseCategories): number {
  const eff = getEffectiveSkills(emp);
  const mapping = CATEGORY_SKILL_MAP[category];
  const primary = eff[mapping.primary];
  const secondary = mapping.secondary ? eff[mapping.secondary] : 0;
  return primary * PRIMARY_SKILL_WEIGHT + secondary * SECONDARY_SKILL_WEIGHT;
}

export function getEmployeeResearchPower(emp: Employee): number {
  const eff = getEffectiveSkills(emp);
  return (eff.graphics + eff.sound + eff.gameplay + eff.polish) / 4;
}

export function getBugChancePerContribution(emp: Employee): number {
  const eff = getEffectiveSkills(emp);
  const avgEffective = (eff.graphics + eff.sound + eff.gameplay + eff.polish) / 4;
  return Math.max(
    EMPLOYEE_CONFIG.bugChanceFloor,
    EMPLOYEE_CONFIG.bugChanceBase - avgEffective * EMPLOYEE_CONFIG.bugChanceReductionPerEffective,
  );
}

export function getStaminaEfficiency(stamina: number): number {
  const { lowThreshold, lowEfficiency } = EMPLOYEE_CONFIG.stamina;
  if (stamina >= lowThreshold) {
    return 1.0;
  }
  const t = stamina / lowThreshold;
  return lowEfficiency + t * (1 - lowEfficiency);
}

export function canEmployeeWorkOnTask(emp: Employee, taskType: TaskType): boolean {
  const abilities = EMPLOYEE_TASK_ABILITIES[emp.employeeType];
  return abilities.canWorkOn.includes(taskType);
}

export function canEmployeeBugFix(emp: Employee): boolean {
  return EMPLOYEE_TASK_ABILITIES[emp.employeeType].canBugFix;
}

export function getActivityForTaskType(emp: Employee, taskType: TaskType): Employee['activity'] {
  if (!canEmployeeWorkOnTask(emp, taskType)) return 'idle';
  return EMPLOYEE_TASK_ABILITIES[emp.employeeType].activityWhenWorking;
}

export function drainStamina(currentStamina: number, isCrunching: boolean, drainMultiplier = 1): number {
  const drain = EMPLOYEE_CONFIG.stamina.drainPerTick * (isCrunching ? EMPLOYEE_CONFIG.stamina.crunchDrainMultiplier : 1) * drainMultiplier;
  return Math.max(0, currentStamina - drain);
}

export function processVacationDay(vacationDaysLeft: number, stamina: number, recoveryMultiplier = 1): {
  vacationDaysLeft: number;
  stamina: number;
  onVacation: boolean;
} {
  const recovery = EMPLOYEE_CONFIG.vacation.recoveryPerDay * recoveryMultiplier;
  const newStamina = Math.min(EMPLOYEE_CONFIG.stamina.max, stamina + recovery);
  const daysLeft = vacationDaysLeft - 1;
  return {
    vacationDaysLeft: Math.max(0, daysLeft),
    stamina: newStamina,
    onVacation: daysLeft > 0,
  };
}
