import type { Employee, EmployeeSkills } from './types';
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

function generateName(): string {
  const first = EMPLOYEE_CONFIG.firstNames[randomInt(0, EMPLOYEE_CONFIG.firstNames.length - 1)];
  const last = EMPLOYEE_CONFIG.lastNames[randomInt(0, EMPLOYEE_CONFIG.lastNames.length - 1)];
  return `${first} ${last}`;
}

export function generateEmployee(): Employee {
  const skills = generateSkills();
  const totalPoints = getTotalSkillPoints(skills);

  return {
    id: `emp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: generateName(),
    skills,
    hireCost: totalPoints * EMPLOYEE_CONFIG.hireCostPerSkillPoint,
    monthlySalary: EMPLOYEE_CONFIG.salaryBaseline + totalPoints * EMPLOYEE_CONFIG.salaryPerSkillPoint,
  };
}

export function generateCandidatePool(): Employee[] {
  return Array.from({ length: EMPLOYEE_CONFIG.candidatePoolSize }, () => generateEmployee());
}
