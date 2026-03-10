import type { Employee, EmployeeSkills, EmployeeTitle } from './types';
import { EMPLOYEE_CONFIG } from '@/lib/config/employeeConfig';
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

export function rollRarity(): Rarity {
  const roll = Math.random();
  let cumulative = 0;
  for (const rarity of RARITY_ORDER) {
    cumulative += RARITY_TIERS[rarity].weight;
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

  return {
    id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: generateName(),
    title,
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

export function generatePack(): Employee[] {
  return Array.from({ length: EMPLOYEE_CONFIG.packSize }, () => generateEmployee());
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

export function drainStamina(currentStamina: number, isCrunching: boolean): number {
  const drain = EMPLOYEE_CONFIG.stamina.drainPerTick * (isCrunching ? EMPLOYEE_CONFIG.stamina.crunchDrainMultiplier : 1);
  return Math.max(0, currentStamina - drain);
}

export function processVacationDay(vacationDaysLeft: number, stamina: number): {
  vacationDaysLeft: number;
  stamina: number;
  onVacation: boolean;
} {
  const newStamina = Math.min(EMPLOYEE_CONFIG.stamina.max, stamina + EMPLOYEE_CONFIG.vacation.recoveryPerDay);
  const daysLeft = vacationDaysLeft - 1;
  return {
    vacationDaysLeft: Math.max(0, daysLeft),
    stamina: newStamina,
    onVacation: daysLeft > 0,
  };
}
