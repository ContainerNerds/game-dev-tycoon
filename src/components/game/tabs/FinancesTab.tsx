'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGameStore } from '@/lib/store/gameStore';
import { getMonthName } from '@/lib/game/calendarSystem';
import { DollarSign, TrendingUp, TrendingDown, FileText } from 'lucide-react';

export default function FinancesTab() {
  const money = useGameStore((s) => s.money);
  const employees = useGameStore((s) => s.employees);
  const office = useGameStore((s) => s.office);
  const currentGame = useGameStore((s) => s.currentGame);
  const monthlyReports = useGameStore((s) => s.monthlyReports);
  const dailyRates = useGameStore((s) => s.dailyRates);

  const totalMonthlySalary = employees.reduce((sum, e) => sum + e.monthlySalary, 0);
  const serverMonthlyCost = currentGame
    ? currentGame.servers.reduce((sum, s) => sum + s.monthlyCost, 0)
    + (currentGame.racks?.reduce((sum, r) => sum + r.monthlyCost, 0) ?? 0)
    : 0;
  const projectedMonthlyExpenses = totalMonthlySalary + serverMonthlyCost + office.monthlyOverhead;
  const netPerMonth = Math.round(dailyRates.moneyPerDay * 30);

  const lastReport = monthlyReports.length > 0 ? monthlyReports[monthlyReports.length - 1] : null;

  return (
    <div className="p-4 space-y-6">
      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold font-mono text-green-400">
                ${Math.floor(money).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Current Balance</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            {netPerMonth >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-400" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-400" />
            )}
            <div>
              <p className={`text-2xl font-bold font-mono ${netPerMonth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {netPerMonth >= 0 ? '+' : ''}${Math.floor(netPerMonth).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Est. Net / Month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-2xl font-bold font-mono text-red-400">
                -${projectedMonthlyExpenses.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Projected Monthly Costs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projected Costs Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Current Monthly Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {employees.filter(e => e.monthlySalary > 0).map((emp) => (
            <div key={emp.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">Salary: {emp.name}</span>
              <span className="font-mono text-red-400">-${emp.monthlySalary.toLocaleString()}</span>
            </div>
          ))}
          {office.monthlyOverhead > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Office overhead</span>
              <span className="font-mono text-red-400">-${office.monthlyOverhead.toLocaleString()}</span>
            </div>
          )}
          {serverMonthlyCost > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Server infrastructure</span>
              <span className="font-mono text-red-400">-${serverMonthlyCost.toLocaleString()}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span className="font-mono text-red-400">-${projectedMonthlyExpenses.toLocaleString()}/mo</span>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Report History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Monthly Statements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyReports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No monthly reports yet. Reports are generated at the end of each month.
            </p>
          ) : (
            <div className="space-y-3">
              {[...monthlyReports].reverse().map((report, i, arr) => {
                const totalExpenses = report.employeeCosts + report.computeCosts + report.devOverheadCosts;
                // Calculate monthly income delta from previous report
                const prevReport = i < arr.length - 1 ? arr[i + 1] : null;
                const monthlyIncome = prevReport
                  ? Math.max(0, report.income - prevReport.income)
                  : report.income;
                const monthlyNet = monthlyIncome - totalExpenses;

                return (
                  <div key={i} className="border border-border rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">
                        {getMonthName(report.month)} {report.year}
                      </span>
                      <Badge
                        variant="outline"
                        className={`font-mono text-xs ${monthlyNet >= 0 ? 'text-green-400 border-green-500/50' : 'text-red-400 border-red-500/50'}`}
                      >
                        Net: {monthlyNet >= 0 ? '+' : ''}${Math.floor(monthlyNet).toLocaleString()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Income</span>
                        <span className="font-mono text-green-400">+${Math.floor(monthlyIncome).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expenses</span>
                        <span className="font-mono text-red-400">-${Math.floor(totalExpenses).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">  Employees</span>
                        <span className="font-mono text-muted-foreground">-${Math.floor(report.employeeCosts).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">  Compute</span>
                        <span className="font-mono text-muted-foreground">-${Math.floor(report.computeCosts).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">  Overhead</span>
                        <span className="font-mono text-muted-foreground">-${Math.floor(report.devOverheadCosts).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
