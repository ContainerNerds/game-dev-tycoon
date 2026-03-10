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
  const activeTasks = useGameStore((s) => s.activeTasks);
  const money = useGameStore((s) => s.money);
  const employees = useGameStore((s) => s.employees);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const removeBug = useGameStore((s) => s.removeBug);
  const removeTaskBug = useGameStore((s) => s.removeTaskBug);
  const assignEmployee = useGameStore((s) => s.assignEmployee);

  const [miniGameBug, setMiniGameBug] = useState<Bug | null>(null);
  const [miniGameSource, setMiniGameSource] = useState<'game' | 'task'>('game');

  const gameBugs = activeGames.flatMap((g) => g.bugs);
  const taskBugs = activeTasks.flatMap((t) => (t.bugs ?? []).map((b) => ({ ...b, _taskId: t.id, _taskName: t.name })));
  const allBugs = [...taskBugs, ...gameBugs];
  const bugfixTeam = employees.filter((e) => e.assignedTaskId === 'bugfix');

  const handleMiniGameSolve = () => {
    if (miniGameBug) {
      if (miniGameSource === 'task') {
        removeTaskBug(miniGameBug.gameId, miniGameBug.id);
      } else {
        removeBug(miniGameBug.gameId, miniGameBug.id);
      }
      setMiniGameBug(null);
    }
  };

  const handleMiniGamePay = () => {
    if (miniGameBug && spendMoney(miniGameBug.fixCost)) {
      if (miniGameSource === 'task') {
        removeTaskBug(miniGameBug.gameId, miniGameBug.id);
      } else {
        removeBug(miniGameBug.gameId, miniGameBug.id);
      }
    }
    setMiniGameBug(null);
  };

  const handleFixBug = (bug: Bug, source: 'game' | 'task') => {
    setMiniGameBug(bug);
    setMiniGameSource(source);
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
                  <Badge variant="outline" className="ml-1 text-xs px-1">Pol {emp.skills.polish}</Badge>
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

      {taskBugs.length > 0 && (
        <>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pre-Release Bugs ({taskBugs.length})</h4>
          <div className="grid gap-2">
            {taskBugs.map((bug) => {
              const fixer = bug.assignedFixerId ? employees.find((e) => e.id === bug.assignedFixerId) : null;
              const fixPct = bug.fixTarget > 0 ? Math.min(100, (bug.fixProgress / bug.fixTarget) * 100) : 0;
              return (
                <Card key={bug.id}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{bug.name}</span>
                          <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[bug.severity]}`}>{bug.severity}</Badge>
                          <Badge variant="outline" className="text-xs bg-cyan-500/20 text-cyan-400 border-cyan-500/50">{bug._taskName}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={fixPct} className="h-1.5 flex-1" />
                          <span className="text-xs font-mono text-muted-foreground shrink-0">
                            {Math.floor(bug.fixProgress)}/{bug.fixTarget}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Fix cost: ${bug.fixCost.toLocaleString()}</span>
                          {fixer && (
                            <span className="flex items-center gap-1 text-blue-400">
                              <Wrench className="h-3 w-3" />{fixer.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="cursor-pointer shrink-0" onClick={() => handleFixBug(bug, 'task')}>Fix</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Separator />
        </>
      )}

      {gameBugs.length === 0 && taskBugs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60">
          <BugIcon className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg">No bugs reported!</p>
          <p className="text-sm">Your games are running smoothly... for now.</p>
        </div>
      ) : gameBugs.length > 0 ? (
        <div className="grid gap-2">
          {gameBugs.map((bug) => {
            const fixer = bug.assignedFixerId ? employees.find((e) => e.id === bug.assignedFixerId) : null;
            const fixPct = bug.fixTarget > 0 ? Math.min(100, (bug.fixProgress / bug.fixTarget) * 100) : 0;
            return (
              <Card key={bug.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{bug.name}</span>
                        <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[bug.severity]}`}>{bug.severity}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={fixPct} className="h-1.5 flex-1" />
                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          {Math.floor(bug.fixProgress)}/{bug.fixTarget}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Fix cost: ${bug.fixCost.toLocaleString()}</span>
                        {fixer && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <Wrench className="h-3 w-3" />{fixer.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="cursor-pointer shrink-0" onClick={() => handleFixBug(bug, 'game')}>Fix</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}

      {miniGameBug && (
        <BugMiniGame open={true} bugName={miniGameBug.name} fixCost={miniGameBug.fixCost}
          onSolve={handleMiniGameSolve} onPayToFix={handleMiniGamePay} onClose={() => setMiniGameBug(null)} />
      )}
    </div>
  );
}
