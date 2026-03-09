'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGameStore } from '@/lib/store/gameStore';
import { Bug as BugIcon } from 'lucide-react';

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  critical: 'bg-red-500/20 text-red-400 border-red-500/50',
};

export default function BugsTab() {
  const bugs = useGameStore((s) => s.currentGame?.bugs ?? []);
  const money = useGameStore((s) => s.money);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const removeBug = useGameStore((s) => s.removeBug);

  const handleFix = (bugId: string, cost: number) => {
    if (spendMoney(cost)) {
      removeBug(bugId);
    }
  };

  if (!bugs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <BugIcon className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg">No bugs reported!</p>
        <p className="text-sm">Your game is running smoothly... for now.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Active Bugs ({bugs.length})
        </h3>
        <p className="text-sm text-slate-400">
          Unresolved bugs reduce your review score
        </p>
      </div>

      <div className="grid gap-3">
        {bugs.map((bug) => {
          const progress = (bug.fixProgressHours / bug.fixTimeHours) * 100;
          return (
            <Card key={bug.id} className="border-slate-700 bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{bug.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${SEVERITY_COLORS[bug.severity]}`}
                      >
                        {bug.severity}
                      </Badge>
                    </div>
                    {bug.fixProgressHours > 0 && (
                      <Progress value={progress} className="h-1.5" />
                    )}
                    <div className="text-xs text-slate-400">
                      Fix cost: ${bug.fixCost.toLocaleString()} &middot; {bug.fixTimeHours}h to fix
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="cursor-pointer shrink-0"
                    disabled={money < bug.fixCost}
                    onClick={() => handleFix(bug.id, bug.fixCost)}
                  >
                    Fix (${bug.fixCost.toLocaleString()})
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
