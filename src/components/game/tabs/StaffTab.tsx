'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGameStore } from '@/lib/store/gameStore';
import { EMPLOYEE_CONFIG } from '@/lib/config/employeeConfig';
import { generateCandidatePool } from '@/lib/game/employeeSystem';
import { UserPlus, UserMinus, RefreshCw, Users } from 'lucide-react';

const SKILL_COLORS: Record<string, string> = {
  devel: 'bg-green-500/20 text-green-400',
  infra: 'bg-blue-500/20 text-blue-400',
  project: 'bg-purple-500/20 text-purple-400',
  management: 'bg-yellow-500/20 text-yellow-400',
};

const SKILL_LABELS: Record<string, string> = {
  devel: 'Dev',
  infra: 'Infra',
  project: 'PM',
  management: 'Mgmt',
};

export default function StaffTab() {
  const employees = useGameStore((s) => s.employees);
  const candidatePool = useGameStore((s) => s.candidatePool);
  const office = useGameStore((s) => s.office);
  const money = useGameStore((s) => s.money);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const setCandidatePool = useGameStore((s) => s.setCandidatePool);
  const hireEmployee = useGameStore((s) => s.hireEmployee);
  const fireEmployee = useGameStore((s) => s.fireEmployee);

  const handleRefreshPool = () => {
    if (spendMoney(EMPLOYEE_CONFIG.refreshPoolCost)) {
      setCandidatePool(generateCandidatePool());
    }
  };

  const handleHire = (employeeId: string) => {
    const emp = candidatePool.find((c) => c.id === employeeId);
    if (!emp) return;
    if (employees.length >= office.maxSeats) return;
    if (money < emp.hireCost) return;
    hireEmployee(emp);
  };

  const totalMonthlySalary = employees.reduce((sum, e) => sum + e.monthlySalary, 0);

  return (
    <div className="p-4 space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-slate-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">
              Staff ({employees.length}/{office.maxSeats})
            </h3>
            <p className="text-sm text-slate-400">
              Monthly salaries: ${totalMonthlySalary.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {office.maxSeats === 0 && (
        <Card className="border-yellow-500/50 bg-yellow-950/20">
          <CardContent className="p-4 text-sm text-yellow-400">
            You need to upgrade your office before you can hire employees.
            Visit the Office tab to get a desk.
          </CardContent>
        </Card>
      )}

      {/* Current employees */}
      {employees.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Your Team
          </h4>
          <div className="grid gap-2">
            {employees.map((emp) => (
              <Card key={emp.id} className="border-slate-700 bg-slate-800">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{emp.name}</span>
                        <span className="text-xs text-muted-foreground">{emp.title}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {(Object.entries(emp.skills) as [string, number][]).map(([skill, level]) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className={`text-xs px-1.5 ${SKILL_COLORS[skill]}`}
                          >
                            {SKILL_LABELS[skill]} {level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      ${emp.monthlySalary.toLocaleString()}/mo
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300 cursor-pointer"
                      onClick={() => fireEmployee(emp.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Separator className="bg-slate-700" />

      {/* Candidate pool */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Candidates
          </h4>
          <Button
            size="sm"
            variant="outline"
            className="text-xs cursor-pointer"
            disabled={money < EMPLOYEE_CONFIG.refreshPoolCost}
            onClick={handleRefreshPool}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh (${EMPLOYEE_CONFIG.refreshPoolCost})
          </Button>
        </div>

        {candidatePool.length === 0 ? (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardContent className="p-6 text-center text-slate-500">
              <p>No candidates available. Refresh the pool to find talent.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {candidatePool.map((candidate) => {
              const canHire = employees.length < office.maxSeats && money >= candidate.hireCost;
              return (
                <Card key={candidate.id} className="border-slate-700 bg-slate-800">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{candidate.name}</span>
                        <span className="text-xs text-muted-foreground">{candidate.title}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {(Object.entries(candidate.skills) as [string, number][]).map(([skill, level]) => (
                          <Badge
                            key={skill}
                            variant="outline"
                            className={`text-xs px-1.5 ${SKILL_COLORS[skill]}`}
                          >
                            {SKILL_LABELS[skill]} {level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs text-slate-400">
                        <div>Hire: ${candidate.hireCost.toLocaleString()}</div>
                        <div>${candidate.monthlySalary.toLocaleString()}/mo</div>
                      </div>
                      <Button
                        size="sm"
                        className="cursor-pointer"
                        disabled={!canHire}
                        onClick={() => handleHire(candidate.id)}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
