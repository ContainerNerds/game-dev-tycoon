'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useGameStore } from '@/lib/store/gameStore';
import { EMPLOYEE_CONFIG } from '@/lib/config/employeeConfig';
import { generateCandidatePool } from '@/lib/game/employeeSystem';
import { UserPlus, UserMinus, RefreshCw, Users, Palmtree } from 'lucide-react';
import type { EmployeeActivity } from '@/lib/game/types';

const SKILL_COLORS: Record<string, string> = {
  graphics: 'bg-pink-500/20 text-pink-400',
  sound: 'bg-green-500/20 text-green-400',
  gameplay: 'bg-blue-500/20 text-blue-400',
  polish: 'bg-yellow-500/20 text-yellow-400',
};

const SKILL_LABELS: Record<string, string> = {
  graphics: 'Gfx',
  sound: 'Snd',
  gameplay: 'Game',
  polish: 'Pol',
};

const ACTIVITY_COLORS: Record<EmployeeActivity, string> = {
  idle: 'text-muted-foreground',
  developing: 'text-blue-400',
  researching: 'text-purple-400',
  bugfixing: 'text-orange-400',
  testing: 'text-cyan-400',
  vacation: 'text-green-400',
};

const ACTIVITY_LABELS: Record<EmployeeActivity, string> = {
  idle: 'Idle',
  developing: 'Developing',
  researching: 'Researching',
  bugfixing: 'Bug Fixing',
  testing: 'Testing',
  vacation: 'On Vacation',
};

function staminaColor(stamina: number): string {
  if (stamina > 60) return 'bg-green-500';
  if (stamina > 30) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function StaffTab() {
  const employees = useGameStore((s) => s.employees);
  const candidatePool = useGameStore((s) => s.candidatePool);
  const staffContributions = useGameStore((s) => s.staffContributions);
  const office = useGameStore((s) => s.office);
  const money = useGameStore((s) => s.money);
  const calendar = useGameStore((s) => s.calendar);
  const lastRefresh = useGameStore((s) => s.lastCandidateRefreshDay);
  const activeTasks = useGameStore((s) => s.activeTasks);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const setCandidatePool = useGameStore((s) => s.setCandidatePool);
  const hireEmployee = useGameStore((s) => s.hireEmployee);
  const fireEmployee = useGameStore((s) => s.fireEmployee);
  const assignEmployee = useGameStore((s) => s.assignEmployee);
  const sendOnVacation = useGameStore((s) => s.sendOnVacation);

  const currentDay = calendar.day + (calendar.month - 1) * 30 + (calendar.year - 1) * 360;
  const daysUntilRefresh = Math.max(0, 7 - (currentDay - lastRefresh) % 7);

  const handleRefreshPool = () => {
    if (spendMoney(EMPLOYEE_CONFIG.refreshPoolCost)) {
      setCandidatePool(generateCandidatePool());
    }
  };

  const handleHire = (employeeId: string) => {
    const emp = candidatePool.find((c) => c.id === employeeId);
    if (!emp) return;
    const hiredCount = employees.filter((e) => !e.isPlayer).length;
    if (hiredCount >= office.maxSeats) return;
    if (money < emp.hireCost) return;
    hireEmployee(emp);
  };

  const totalMonthlySalary = employees.reduce((sum, e) => sum + e.monthlySalary, 0);
  const hiredCount = employees.filter((e) => !e.isPlayer).length;

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Staff ({hiredCount}/{office.maxSeats} hired + you)
            </h3>
            <p className="text-sm text-muted-foreground">
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

      {staffContributions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Contributions (recent)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1.5 pr-3">Employee</th>
                  <th className="text-right px-2">Gfx</th>
                  <th className="text-right px-2">Game</th>
                  <th className="text-right px-2">Snd</th>
                  <th className="text-right px-2">Pol</th>
                  <th className="text-right px-2">Bugs+</th>
                  <th className="text-right pl-2">Fixed</th>
                </tr>
              </thead>
              <tbody>
                {staffContributions.filter((c) => c.graphics + c.gameplay + c.sound + c.polish + c.bugsFixed > 0.01).map((c) => (
                  <tr key={c.employeeId} className="border-b border-border/50">
                    <td className="py-1.5 pr-3 font-medium">{c.employeeName}</td>
                    <td className="text-right px-2 text-pink-400">{c.graphics.toFixed(1)}</td>
                    <td className="text-right px-2 text-blue-400">{c.gameplay.toFixed(1)}</td>
                    <td className="text-right px-2 text-green-400">{c.sound.toFixed(1)}</td>
                    <td className="text-right px-2 text-yellow-400">{c.polish.toFixed(1)}</td>
                    <td className="text-right px-2 text-red-400">{c.bugsIntroduced > 0.1 ? c.bugsIntroduced.toFixed(0) : '-'}</td>
                    <td className="text-right pl-2 text-emerald-400">{c.bugsFixed > 0.1 ? c.bugsFixed.toFixed(0) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Separator />

      {employees.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Your Team
          </h4>
          <div className="grid gap-2">
            {employees.map((emp) => (
              <Card key={emp.id} className="border-border bg-card">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{emp.name}</span>
                      <span className="text-xs text-muted-foreground">{emp.title}</span>
                      {emp.isPlayer && (
                        <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/50">You</Badge>
                      )}
                      <span className={`text-xs font-medium ${ACTIVITY_COLORS[emp.activity]}`}>
                        {ACTIVITY_LABELS[emp.activity]}
                        {emp.onVacation && ` (${emp.vacationDaysLeft}d)`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground shrink-0">
                        {emp.isPlayer ? 'Founder' : `$${emp.monthlySalary.toLocaleString()}/mo`}
                      </span>
                      {!emp.isPlayer && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 cursor-pointer shrink-0"
                          onClick={() => fireEmployee(emp.id)}>
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {(Object.entries(emp.skills) as [string, number][]).map(([skill, level]) => (
                        <Badge key={skill} variant="outline" className={`text-xs px-1.5 ${SKILL_COLORS[skill]}`}>
                          {SKILL_LABELS[skill]} {level}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-xs text-muted-foreground">Stamina</span>
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${staminaColor(emp.stamina)}`}
                          style={{ width: `${emp.stamina}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-8">{Math.round(emp.stamina)}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    <Button size="sm" variant={emp.assignedTaskId === null && !emp.onVacation ? 'default' : 'ghost'}
                      className="h-6 text-xs px-2 cursor-pointer"
                      disabled={emp.onVacation}
                      onClick={() => assignEmployee(emp.id, null)}>
                      Idle
                    </Button>
                    <Button size="sm" variant={emp.assignedTaskId === 'bugfix' ? 'default' : 'ghost'}
                      className="h-6 text-xs px-2 cursor-pointer"
                      disabled={emp.onVacation}
                      onClick={() => assignEmployee(emp.id, 'bugfix')}>
                      Bugs
                    </Button>
                    {activeTasks.map((t) => (
                      <Button key={t.id} size="sm" variant={emp.assignedTaskId === t.id ? 'default' : 'ghost'}
                        className="h-6 text-xs px-2 cursor-pointer truncate max-w-[80px]"
                        disabled={emp.onVacation}
                        onClick={() => assignEmployee(emp.id, t.id)}
                        title={t.name}>
                        {t.name}
                      </Button>
                    ))}
                    <Button size="sm" variant={emp.onVacation ? 'default' : 'ghost'}
                      className="h-6 text-xs px-2 cursor-pointer"
                      disabled={emp.onVacation || emp.stamina >= 95}
                      onClick={() => sendOnVacation(emp.id)}
                      title="Send on 2-week vacation to recover stamina">
                      <Palmtree className="h-3 w-3 mr-1" />Vacation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Candidates
            </h4>
            <span className="text-xs text-muted-foreground">
              Auto-refresh in {daysUntilRefresh} day{daysUntilRefresh !== 1 ? 's' : ''}
            </span>
          </div>
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
          <Card className="border-border bg-card/50">
            <CardContent className="p-6 text-center text-muted-foreground/60">
              <p>No candidates available. Refresh the pool to find talent.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {candidatePool.map((candidate) => {
              const canHire = hiredCount < office.maxSeats && money >= candidate.hireCost;
              return (
                <Card key={candidate.id} className="border-border bg-card">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{candidate.name}</span>
                        <span className="text-xs text-muted-foreground">{candidate.title}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        {(Object.entries(candidate.skills) as [string, number][]).map(([skill, level]) => (
                          <Badge key={skill} variant="outline" className={`text-xs px-1.5 ${SKILL_COLORS[skill]}`}>
                            {SKILL_LABELS[skill]} {level}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs text-muted-foreground">
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
