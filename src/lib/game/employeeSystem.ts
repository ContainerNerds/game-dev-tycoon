import type { Employee, EmployeeSkills, EmployeeTitle } from './types';
import { EMPLOYEE_CONFIG } from '@/lib/config/employeeConfig';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSkills(): EmployeeSkills {
  return {
    graphics: randomInt(EMPLOYEE_CONFIG.minSkill, EMPLOYEE_CONFIG.maxSkill),
    sound: randomInt(EMPLOYEE_CONFIG.minSkill, EMPLOYEE_CONFIG.maxSkill),
    gameplay: randomInt(EMPLOYEE_CONFIG.minSkill, EMPLOYEE_CONFIG.maxSkill),
    polish: randomInt(EMPLOYEE_CONFIG.minSkill, EMPLOYEE_CONFIG.maxSkill),
  };
}

function getTotalSkillPoints(skills: EmployeeSkills): number {
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

export function generateEmployee(): Employee {
  const skills = generateSkills();
  const totalPoints = getTotalSkillPoints(skills);
  const title = deriveTitle(skills);

  return {
    id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: generateName(),
    title,
    skills,
    assignedTaskId: null,
    activity: 'idle',
    autoAssign: true,
    isPlayer: false,
    hireCost: totalPoints * EMPLOYEE_CONFIG.hireCostPerSkillPoint,
    monthlySalary: EMPLOYEE_CONFIG.salaryBaseline + totalPoints * EMPLOYEE_CONFIG.salaryPerSkillPoint,
    stamina: EMPLOYEE_CONFIG.stamina.max,
    onVacation: false,
    vacationDaysLeft: 0,
    bugsFixed: 0,
    totalBugFixPoints: 0,
  };
}

export function generateCandidatePool(): Employee[] {
  return Array.from({ length: EMPLOYEE_CONFIG.candidatePoolSize }, () => generateEmployee());
}

export function getEmployeePillarContribution(emp: Employee): {
  graphics: number;
  gameplay: number;
  sound: number;
  polish: number;
} {
  return {
    graphics: emp.skills.graphics * 0.5,
    gameplay: emp.skills.gameplay * 0.5,
    sound: emp.skills.sound * 0.5,
    polish: emp.skills.polish * 0.5,
  };
}

export function getBugChancePerContribution(emp: Employee): number {
  const avgSkill = (emp.skills.graphics + emp.skills.sound + emp.skills.gameplay + emp.skills.polish) / 4;
  const baseChance = 0.08;
  const reduction = avgSkill * 0.01;
  return Math.max(0.01, baseChance - reduction);
}

export function getStaminaEfficiency(stamina: number): number {
  const { max, lowThreshold, lowEfficiency } = EMPLOYEE_CONFIG.stamina;
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
