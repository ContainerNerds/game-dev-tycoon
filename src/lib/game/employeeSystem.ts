import type { Employee, EmployeeSkills, EmployeeTitle } from './types';
import { EMPLOYEE_CONFIG } from '@/lib/config/employeeConfig';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSkills(): EmployeeSkills {
  return {
    devel: randomInt(EMPLOYEE_CONFIG.minSkill, EMPLOYEE_CONFIG.maxSkill),
    infra: randomInt(EMPLOYEE_CONFIG.minSkill, EMPLOYEE_CONFIG.maxSkill),
    project: randomInt(EMPLOYEE_CONFIG.minSkill, EMPLOYEE_CONFIG.maxSkill),
    management: randomInt(EMPLOYEE_CONFIG.minSkill, EMPLOYEE_CONFIG.maxSkill),
  };
}

function getTotalSkillPoints(skills: EmployeeSkills): number {
  return skills.devel + skills.infra + skills.project + skills.management;
}

function deriveTitle(skills: EmployeeSkills): EmployeeTitle {
  const max = Math.max(skills.devel, skills.infra, skills.project, skills.management);
  const hasMultipleMax = [skills.devel, skills.infra, skills.project, skills.management].filter(s => s === max).length > 1;

  if (hasMultipleMax) return 'Generalist';
  if (skills.devel === max && max >= 4) return 'Architect';
  if (skills.devel === max) return 'Engineer';
  if (skills.infra === max) return 'DevOps';
  if (skills.project === max && max >= 4) return 'Producer';
  if (skills.project === max) return 'QA Lead';
  if (skills.management === max) return 'Producer';
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
    assignment: 'development' as const,
    isPlayer: false,
    hireCost: totalPoints * EMPLOYEE_CONFIG.hireCostPerSkillPoint,
    monthlySalary: EMPLOYEE_CONFIG.salaryBaseline + totalPoints * EMPLOYEE_CONFIG.salaryPerSkillPoint,
  };
}

export function generateCandidatePool(): Employee[] {
  return Array.from({ length: EMPLOYEE_CONFIG.candidatePoolSize }, () => generateEmployee());
}

/**
 * Contribution points an employee adds per tick to each pillar.
 * Devel skill contributes to gameplay + polish.
 * Infra contributes to polish (optimization).
 * Project contributes evenly across all.
 * Management doesn't directly contribute but reduces bugs.
 */
export function getEmployeePillarContribution(emp: Employee): {
  graphics: number;
  gameplay: number;
  sound: number;
  polish: number;
} {
  return {
    graphics: emp.skills.devel * 0.3 + emp.skills.project * 0.1,
    gameplay: emp.skills.devel * 0.5 + emp.skills.project * 0.2,
    sound: emp.skills.project * 0.2 + emp.skills.management * 0.1,
    polish: emp.skills.devel * 0.2 + emp.skills.infra * 0.3 + emp.skills.project * 0.1,
  };
}

export function getBugChancePerContribution(emp: Employee): number {
  // Higher management reduces bug chance
  const baseChance = 0.08;
  const managementReduction = emp.skills.management * 0.01;
  return Math.max(0.01, baseChance - managementReduction);
}
