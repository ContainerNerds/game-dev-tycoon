'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useGameStore } from '@/lib/store/gameStore';
import { getMonthName } from '@/lib/game/calendarSystem';

export default function MonthEndModal() {
  const monthEndPending = useGameStore((s) => s.calendar.monthEndPending);
  const report = useGameStore((s) => s.calendar.lastMonthReport);
  const dismissMonthEnd = useGameStore((s) => s.dismissMonthEnd);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const money = useGameStore((s) => s.money);

  const handleResume = () => {
    dismissMonthEnd();
    setSpeed(1);
  };

  if (!monthEndPending || !report) return null;

  const expenses = report.lineItems.filter((li) => li.amount < 0);
  const income = report.lineItems.filter((li) => li.amount > 0);

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="border-border bg-card text-foreground sm:max-w-lg [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Monthly Report — {getMonthName(report.month)} {report.year}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            End of month financial summary
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Income */}
          {income.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-2">Income</h4>
              {income.map((li, i) => (
                <div key={i} className="flex justify-between text-sm py-0.5">
                  <span className="text-muted-foreground">{li.label}</span>
                  <span className="font-mono text-green-400">
                    +${Math.abs(li.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Expenses */}
          {expenses.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-400 mb-2">Expenses</h4>
              {expenses.map((li, i) => (
                <div key={i} className="flex justify-between text-sm py-0.5">
                  <span className="text-muted-foreground">{li.label}</span>
                  <span className="font-mono text-red-400">
                    -${Math.abs(li.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {income.length === 0 && expenses.length === 0 && (
            <p className="text-sm text-muted-foreground/60 text-center py-4">
              No transactions this month.
            </p>
          )}

          <Separator />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Income</span>
              <span className="font-mono text-green-400">
                ${report.income.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Expenses</span>
              <span className="font-mono text-red-400">
                -${(report.employeeCosts + report.computeCosts + report.devOverheadCosts).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Net Cash Flow</span>
              <span className={`font-mono ${report.netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {report.netCashFlow >= 0 ? '+' : '-'}${Math.abs(report.netCashFlow).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-1">
              <span className="text-muted-foreground">Studio Balance</span>
              <span className="font-mono text-foreground">
                ${Math.floor(money).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button className="w-full cursor-pointer" onClick={handleResume}>
            Resume
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
