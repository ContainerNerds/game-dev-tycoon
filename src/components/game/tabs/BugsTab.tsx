'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useGameStore } from '@/lib/store/gameStore';
import BugMiniGame from '@/components/game/BugMiniGame';
import { Bug as BugIcon, Wrench, Users, ChevronDown, ChevronRight } from 'lucide-react';
import type { Bug } from '@/lib/game/types';
import { getEffectiveSkills } from '@/lib/game/employeeSystem';

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  critical: 'bg-red-500/20 text-red-400 border-red-500/50',
};

const PAGE_SIZE = 25;

type TaggedBug = Bug & { _source: 'game' | 'task'; _taskName?: string };

function BugCard({ bug, employees, onFix }: {
  bug: TaggedBug;
  employees: { id: string; name: string }[];
  onFix: (bug: Bug, source: 'game' | 'task') => void;
}) {
  const fixer = bug.assignedFixerId ? employees.find((e) => e.id === bug.assignedFixerId) : null;
  const fixPct = bug.fixTarget > 0 ? Math.min(100, (bug.fixProgress / bug.fixTarget) * 100) : 0;

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">{bug.name}</span>
              <Badge variant="outline" className={`text-xs ${SEVERITY_COLORS[bug.severity]}`}>{bug.severity}</Badge>
              {bug._source === 'task' && bug._taskName && (
                <Badge variant="outline" className="text-xs bg-cyan-500/20 text-cyan-400 border-cyan-500/50">{bug._taskName}</Badge>
              )}
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
          <Button size="sm" variant="outline" className="cursor-pointer shrink-0" onClick={() => onFix(bug, bug._source)}>Fix</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PaginatedBugList({ bugs, employees, onFix }: {
  bugs: TaggedBug[];
  employees: { id: string; name: string }[];
  onFix: (bug: Bug, source: 'game' | 'task') => void;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(bugs.length / PAGE_SIZE));
  const safePageIndex = Math.min(page, totalPages - 1);
  const pageBugs = bugs.slice(safePageIndex * PAGE_SIZE, (safePageIndex + 1) * PAGE_SIZE);

  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        {pageBugs.map((bug) => (
          <BugCard key={bug.id} bug={bug} employees={employees} onFix={onFix} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            size="sm" variant="outline" className="cursor-pointer text-xs"
            disabled={safePageIndex === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Prev
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {safePageIndex + 1} of {totalPages}
          </span>
          <Button
            size="sm" variant="outline" className="cursor-pointer text-xs"
            disabled={safePageIndex >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, count, defaultOpen, children }: {
  title: string;
  count: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        className="flex items-center gap-2 w-full text-left cursor-pointer group"
        onClick={() => setOpen((o) => !o)}
      >
        {open
          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
          : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
          {title} ({count.toLocaleString()})
        </h4>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

export default function BugsTab() {
  const activeGames = useGameStore((s) => s.activeGames);
  const activeTasks = useGameStore((s) => s.activeTasks);
  const employees = useGameStore((s) => s.employees);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const removeBug = useGameStore((s) => s.removeBug);
  const removeTaskBug = useGameStore((s) => s.removeTaskBug);
  const assignEmployee = useGameStore((s) => s.assignEmployee);

  const [miniGameBug, setMiniGameBug] = useState<Bug | null>(null);
  const [miniGameSource, setMiniGameSource] = useState<'game' | 'task'>('game');

  const { activeFixes, unassignedTaskBugs, unassignedGameBugs, totalBugs } = useMemo(() => {
    const taskBugsAll: TaggedBug[] = activeTasks.flatMap((t) =>
      (t.bugs ?? []).map((b) => ({ ...b, _source: 'task' as const, _taskName: t.name }))
    );
    const gameBugsAll: TaggedBug[] = activeGames.flatMap((g) =>
      g.bugs.map((b) => ({ ...b, _source: 'game' as const }))
    );

    const active: TaggedBug[] = [];
    const unTask: TaggedBug[] = [];
    const unGame: TaggedBug[] = [];

    for (const b of taskBugsAll) {
      if (b.assignedFixerId) active.push(b);
      else unTask.push(b);
    }
    for (const b of gameBugsAll) {
      if (b.assignedFixerId) active.push(b);
      else unGame.push(b);
    }

    return {
      activeFixes: active,
      unassignedTaskBugs: unTask,
      unassignedGameBugs: unGame,
      totalBugs: taskBugsAll.length + gameBugsAll.length,
    };
  }, [activeTasks, activeGames]);

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

  const empLookup = employees;

  return (
    <div className="p-4 space-y-6">
      {/* Bug Fix Team */}
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
              {employees.map((emp) => {
                const effPolish = getEffectiveSkills(emp).polish;
                return (
                  <Button
                    key={emp.id} size="sm"
                    variant={emp.assignedTaskId === 'bugfix' ? 'default' : 'outline'}
                    className="text-xs cursor-pointer"
                    onClick={() => toggleBugfix(emp.id)}
                  >
                    <Wrench className="h-3 w-3 mr-1" />{emp.name}
                    <span className="ml-1 text-yellow-400 font-mono">POL {effPolish}</span>
                  </Button>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Employees on bug duty auto-fix bugs but stop contributing to tasks.
          </p>
        </CardContent>
      </Card>

      {/* Active Fixes — bugs currently being worked on */}
      {activeFixes.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-400" />
              <h3 className="text-lg font-semibold">Active Fixes ({activeFixes.length})</h3>
            </div>
            <div className="grid gap-2">
              {activeFixes.map((bug) => (
                <BugCard key={bug.id} bug={bug} employees={empLookup} onFix={handleFixBug} />
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Queued Bugs ({(unassignedTaskBugs.length + unassignedGameBugs.length).toLocaleString()})</h3>
        <p className="text-sm text-muted-foreground">Click &quot;Fix&quot; to attempt the mini-game</p>
      </div>

      {totalBugs === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60">
          <BugIcon className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg">No bugs reported!</p>
          <p className="text-sm">Your games are running smoothly... for now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {unassignedTaskBugs.length > 0 && (
            <CollapsibleSection title="Pre-Release Bugs" count={unassignedTaskBugs.length} defaultOpen={unassignedTaskBugs.length <= 50}>
              <PaginatedBugList bugs={unassignedTaskBugs} employees={empLookup} onFix={handleFixBug} />
            </CollapsibleSection>
          )}

          {unassignedGameBugs.length > 0 && (
            <CollapsibleSection title="Released Game Bugs" count={unassignedGameBugs.length} defaultOpen={unassignedGameBugs.length <= 50}>
              <PaginatedBugList bugs={unassignedGameBugs} employees={empLookup} onFix={handleFixBug} />
            </CollapsibleSection>
          )}
        </div>
      )}

      {miniGameBug && (
        <BugMiniGame open={true} bugName={miniGameBug.name} fixCost={miniGameBug.fixCost}
          onSolve={handleMiniGameSolve} onPayToFix={handleMiniGamePay} onClose={() => setMiniGameBug(null)} />
      )}
    </div>
  );
}
