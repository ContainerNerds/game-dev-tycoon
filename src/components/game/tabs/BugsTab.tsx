'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const EMPTY_BUGS: Bug[] = [];

export default function BugsTab() {
  const bugs = useGameStore((s) => s.currentGame?.bugs ?? EMPTY_BUGS);
  const money = useGameStore((s) => s.money);
  const employees = useGameStore((s) => s.employees);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const removeBug = useGameStore((s) => s.removeBug);
  const toggleEmployeeAssignment = useGameStore((s) => s.toggleEmployeeAssignment);

  const [miniGameBug, setMiniGameBug] = useState<Bug | null>(null);

  const bugfixTeam = employees.filter((e) => e.assignment === 'bugfix');
  const devTeam = employees.filter((e) => e.assignment === 'development');

  const handleMiniGameSolve = () => {
    if (miniGameBug) {
      removeBug(miniGameBug.id);
      setMiniGameBug(null);
    }
  };

  const handleMiniGamePay = () => {
    if (miniGameBug && spendMoney(miniGameBug.fixCost)) {
      removeBug(miniGameBug.id);
    }
    setMiniGameBug(null);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Bug fix team */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Bug Fix Team</span>
              <Badge variant="outline" className="text-xs">
                {bugfixTeam.length} assigned
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              Dev team: {devTeam.length} | Bug team: {bugfixTeam.length}
            </span>
          </div>
          {employees.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees hired yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {employees.map((emp) => (
                <Button
                  key={emp.id}
                  size="sm"
                  variant={emp.assignment === 'bugfix' ? 'default' : 'outline'}
                  className="text-xs cursor-pointer"
                  onClick={() => toggleEmployeeAssignment(emp.id)}
                  title={`${emp.name} — click to toggle assignment`}
                >
                  <Wrench className="h-3 w-3 mr-1" />
                  {emp.name}
                  <Badge variant="outline" className="ml-1 text-xs px-1">
                    Dev {emp.skills.devel}
                  </Badge>
                </Button>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Employees on bug duty auto-fix bugs but stop contributing to game development.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Bug list */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Active Bugs ({bugs.length})
        </h3>
        <p className="text-sm text-muted-foreground">
          Click &quot;Fix&quot; to attempt the mini-game
        </p>
      </div>

      {bugs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/60">
          <BugIcon className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg">No bugs reported!</p>
          <p className="text-sm">Your game is running smoothly... for now.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {bugs.map((bug) => (
            <Card key={bug.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{bug.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${SEVERITY_COLORS[bug.severity]}`}
                      >
                        {bug.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Fix cost: ${bug.fixCost.toLocaleString()} &middot; {bug.fixTimeHours}h to fix
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer shrink-0"
                    onClick={() => setMiniGameBug(bug)}
                  >
                    Fix
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mini-game dialog */}
      {miniGameBug && (
        <BugMiniGame
          open={true}
          bugName={miniGameBug.name}
          fixCost={miniGameBug.fixCost}
          onSolve={handleMiniGameSolve}
          onPayToFix={handleMiniGamePay}
          onClose={() => setMiniGameBug(null)}
        />
      )}
    </div>
  );
}
