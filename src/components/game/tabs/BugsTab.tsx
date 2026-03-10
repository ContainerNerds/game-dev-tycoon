'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useGameStore } from '@/lib/store/gameStore';
import BugMiniGame from '@/components/game/BugMiniGame';
import { Bug as BugIcon, Wrench, Users } from 'lucide-react';
import type { Bug } from '@/lib/game/types';

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  critical: 'bg-red-500/20 text-red-400 border-red-500/50',
};

export default function BugsTab() {
  const activeGames = useGameStore((s) => s.activeGames);
  const money = useGameStore((s) => s.money);
  const employees = useGameStore((s) => s.employees);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const removeBug = useGameStore((s) => s.removeBug);
  const assignEmployee = useGameStore((s) => s.assignEmployee);

  const [miniGameBug, setMiniGameBug] = useState<Bug | null>(null);

  const allBugs = activeGames.flatMap((g) => g.bugs);
  const bugfixTeam = employees.filter((e) => e.assignedTaskId === 'bugfix');

  const handleMiniGameSolve = () => {
    if (miniGameBug) {
      removeBug(miniGameBug.gameId, miniGameBug.id);
      setMiniGameBug(null);
    }
  };

  const handleMiniGamePay = () => {
    if (miniGameBug && spendMoney(miniGameBug.fixCost)) {
      removeBug(miniGameBug.gameId, miniGameBug.id);
    }
    setMiniGameBug(null);
  };

  const toggleBugfix = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;
    assignEmployee(empId, emp.assignedTaskId === 'bugfix' ? null : 'bugfix');
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Bug Fix Team</span>
              <Badge variant="outline" className="text-xs">{bugfixTeam.length} assigned</Badge>
            </div>
          </div>
          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees hired yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {employees.map((emp) => (
                <Button
                  key={emp.id} size="sm"
                  variant={emp.assignedTaskId === 'bugfix' ? 'default' : 'outline'}
                  className="text-xs cursor-pointer"
                  onClick={() => toggleBugfix(emp.id)}
                >
                  <Wrench className="h-3 w-3 mr-1" />{emp.name}
                  <Badge variant="outline" className="ml-1 text-xs px-1">Dev {emp.skills.devel}</Badge>
                </Button>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Employees on bug duty auto-fix bugs but stop contributing to tasks.
          </p>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Active Bugs ({allBugs.length})</h3>
        <p className="text-sm text-muted-foreground">Click &quot;Fix&quot; to attempt the mini-game</p>
      </div>

      {allBugs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60">
          <BugIcon className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg">No bugs reported!</p>
          <p className="text-sm">Your games are running smoothly... for now.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {allBugs.map((bug) => {
            const fixer = bug.assignedFixerId ? employees.find((e) => e.id === bug.assignedFixerId) : null;
            const fixPct = Math.round(bug.fixProgress * 100);
            return (
              <Card key={bug.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{bug.name}</span>
                        <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[bug.severity]}`}>{bug.severity}</Badge>
                        {fixer && (
                          <span className="text-xs text-blue-400">
                            {fixer.name} fixing ({fixPct}%)
                          </span>
                        )}
                      </div>
                      {bug.fixProgress > 0 && (
                        <Progress value={fixPct} className="h-1.5" />
                      )}
                      <div className="text-xs text-muted-foreground">
                        Fix cost: ${bug.fixCost.toLocaleString()}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="cursor-pointer shrink-0" onClick={() => setMiniGameBug(bug)}>Fix</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {miniGameBug && (
        <BugMiniGame open={true} bugName={miniGameBug.name} fixCost={miniGameBug.fixCost}
          onSolve={handleMiniGameSolve} onPayToFix={handleMiniGamePay} onClose={() => setMiniGameBug(null)} />
      )}
    </div>
  );
}
