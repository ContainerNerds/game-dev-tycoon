'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useGameStore } from '@/lib/store/gameStore';
import { OFFICE_CONFIG } from '@/lib/config/officeConfig';
import { getTotalMonthlyCost, getTotalCapacityByRegion } from '@/lib/game/serverSystem';
import { formatDate, getMonthName } from '@/lib/game/calendarSystem';
import InteractiveChart from '@/components/game/InteractiveChart';
import GameDetailView from '@/components/game/GameDetailView';
import {
  Building2, Server, DollarSign, Users, Gamepad2,
  TrendingUp, TrendingDown, HardDrive, Globe,
  Star, Newspaper, Quote, FileText,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const PHASE_BADGE: Record<string, string> = {
  development: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  growth: 'bg-green-500/20 text-green-400 border-green-500/50',
  peak: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  decline: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  retired: 'bg-muted text-muted-foreground border-border',
};

function scoreColor(score: number): string {
  if (score >= 8) return 'text-green-400';
  if (score >= 6) return 'text-blue-400';
  if (score >= 4) return 'text-yellow-400';
  if (score >= 2) return 'text-orange-400';
  return 'text-red-400';
}

const REPORTS_PER_PAGE = 6;

export default function StudioTab() {
  const money = useGameStore((s) => s.money);
  const totalLifetimeMoney = useGameStore((s) => s.totalLifetimeMoney);
  const studioFans = useGameStore((s) => s.studioFans);
  const researchPoints = useGameStore((s) => s.researchPoints);
  const employees = useGameStore((s) => s.employees);
  const office = useGameStore((s) => s.office);
  const calendar = useGameStore((s) => s.calendar);
  const activeGames = useGameStore((s) => s.activeGames);
  const activeTasks = useGameStore((s) => s.activeTasks);
  const completedGames = useGameStore((s) => s.completedGames);
  const servers = useGameStore((s) => s.servers);
  const racks = useGameStore((s) => s.racks);
  const monthlyReports = useGameStore((s) => s.monthlyReports);
  const dailyRates = useGameStore((s) => s.dailyRates);

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [reportPage, setReportPage] = useState(0);

  const officeDef = OFFICE_CONFIG.tiers.find((t) => t.tier === office.tier);

  const totalPlayers = activeGames.reduce(
    (sum, g) => sum + g.platformReleases.reduce((s2, p) => s2 + p.activePlayers, 0), 0
  );
  const totalSold = activeGames.reduce(
    (sum, g) => sum + g.platformReleases.reduce((s2, p) => s2 + p.totalCopiesSold, 0), 0
  );
  const serverCount = servers.length;
  const serverMonthlyCost = getTotalMonthlyCost(servers)
    + racks.reduce((sum, r) => sum + r.monthlyCost, 0);
  const totalCapacity = servers.reduce((sum, s) => sum + s.capacity, 0);
  const hasLiveServiceGames = activeGames.some((g) => g.mode === 'liveservice');
  const serverLoad = hasLiveServiceGames && totalCapacity > 0 ? (totalPlayers / totalCapacity) * 100 : 0;
  const capacityByRegion = getTotalCapacityByRegion(servers);
  const activeRegions = Object.keys(capacityByRegion).length;

  const totalMonthlySalary = employees.reduce((sum, e) => sum + e.monthlySalary, 0);
  const projectedMonthlyExpenses = totalMonthlySalary + serverMonthlyCost + office.monthlyOverhead;
  const netPerMonth = Math.round(dailyRates.moneyPerDay * 30);

  const primaryGame = activeGames[0] ?? null;
  const gameFans = activeGames.reduce((sum, g) => sum + g.gameFans, 0);
  const reviewScore = primaryGame?.reviewScore ?? 0;
  const blogReviews = primaryGame?.blogReviews ?? [];
  const monthlyHistory = primaryGame?.monthlyHistory ?? [];
  const phase = primaryGame?.phase;

  const sentiment = reviewScore >= 8 ? 'Overwhelmingly Positive' :
                    reviewScore >= 6 ? 'Mostly Positive' :
                    reviewScore >= 4 ? 'Mixed' :
                    reviewScore >= 2 ? 'Mostly Negative' : 'Overwhelmingly Negative';
  const sentimentColor = scoreColor(reviewScore);

  const allGames: { id: string; name: string; phase: string; genre: string; style: string }[] = [
    ...activeTasks.map((t) => ({ id: t.id, name: t.name, phase: 'development', genre: t.genre ?? '', style: t.style ?? '' })),
    ...activeGames.map((g) => ({ id: g.id, name: g.name, phase: g.phase, genre: g.genre, style: g.style })),
    ...completedGames.map((g) => ({ id: g.id, name: g.name, phase: 'retired', genre: g.genre, style: g.style })),
  ];

  const reversedReports = [...monthlyReports].reverse();
  const totalReportPages = Math.max(1, Math.ceil(reversedReports.length / REPORTS_PER_PAGE));
  const pagedReports = reversedReports.slice(reportPage * REPORTS_PER_PAGE, (reportPage + 1) * REPORTS_PER_PAGE);

  return (
    <div className="p-4 space-y-6">
      {/* ─── Top Stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold font-mono text-green-400">
                ${Math.floor(money).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Balance</p>
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
              <p className="text-xs text-muted-foreground">Net / Month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold font-mono text-purple-400">
                {Math.floor(studioFans).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Studio Fans</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">
                ${Math.floor(totalLifetimeMoney).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Lifetime Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Gamepad2 className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold font-mono text-foreground">
                {allGames.length}
              </p>
              <p className="text-xs text-muted-foreground">Total Games</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Studio Overview + Infrastructure ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Studio Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-mono">{formatDate(calendar)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Office</span>
              <span>{officeDef?.name ?? 'Unknown'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Employees</span>
              <span>{employees.filter(e => !e.isPlayer).length}/{office.maxSeats} + you</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Salaries</span>
              <span className="text-red-400 font-mono">${totalMonthlySalary.toLocaleString()}/mo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Office Overhead</span>
              <span className="text-red-400 font-mono">${office.monthlyOverhead.toLocaleString()}/mo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Research Points</span>
              <span className="text-blue-400">{researchPoints.toFixed(1)} RP</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4" />
              Infrastructure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Servers</span>
              <span>{serverCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Regions Active</span>
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-muted-foreground" />
                {activeRegions}/9
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Capacity</span>
              <span>{totalCapacity.toLocaleString()} players</span>
            </div>
            {hasLiveServiceGames ? (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Server Load</span>
                  <span className={serverLoad > 90 ? 'text-red-400' : serverLoad > 70 ? 'text-yellow-400' : 'text-green-400'}>
                    {serverLoad.toFixed(1)}%
                  </span>
                </div>
                <Progress value={Math.min(100, serverLoad)} className={`h-2 ${serverLoad > 90 ? '[&>div]:bg-red-500' : ''}`} />
              </div>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Server Load</span>
                <span className="text-muted-foreground/60">N/A (No Live Service Games)</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Compute Cost</span>
              <span className="text-red-400 font-mono">${serverMonthlyCost.toLocaleString()}/mo</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Charts (from Press) ─── */}
      {monthlyHistory.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Popularity Over Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Copies Sold / Month</p>
              <InteractiveChart data={monthlyHistory} dataKey="copiesSold" color="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Active Players</p>
              <InteractiveChart data={monthlyHistory} dataKey="activePlayers" color="text-green-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Press & Reviews ─── */}
      {blogReviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Launch Reviews
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {blogReviews.map((review, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{review.blogName}</span>
                    <Badge variant="outline" className={`font-mono font-bold ${scoreColor(review.score)}`}>
                      {review.score.toFixed(1)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground italic flex gap-1">
                    <Quote className="h-3 w-3 shrink-0 mt-0.5" />
                    {review.summary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── Scores & Sentiment ─── */}
      {primaryGame && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <Star className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{reviewScore.toFixed(1)}/10</p>
                <p className="text-sm text-muted-foreground">Avg. Review Score</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <Newspaper className={`h-8 w-8 ${sentimentColor}`} />
              <div>
                <p className={`text-lg font-semibold ${sentimentColor}`}>{sentiment}</p>
                <p className="text-sm text-muted-foreground">Public Sentiment</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              {phase === 'decline' ? (
                <TrendingDown className="h-8 w-8 text-red-400" />
              ) : (
                <TrendingUp className="h-8 w-8 text-green-400" />
              )}
              <div>
                <p className="text-lg font-semibold capitalize">{phase ?? 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Game Phase</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── Fan Base ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Fan Base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Game Fans</p>
              <p className="text-xl font-bold text-purple-400">{Math.floor(gameFans).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground/60">Buy DLC, hype sequels</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Studio Fans</p>
              <p className="text-xl font-bold text-blue-400">{Math.floor(studioFans).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground/60">Auto-buy new releases</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground">Active Players</p>
              <p className="text-xl font-bold text-green-400">{Math.floor(totalPlayers).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Copies Sold</p>
              <p className="text-xl font-bold">{Math.floor(totalSold).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Monthly Expenses ─── */}
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

      {/* ─── Monthly Reports (paginated) ─── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Monthly Statements
            </CardTitle>
            {reversedReports.length > REPORTS_PER_PAGE && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={reportPage === 0}
                  onClick={() => setReportPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {reportPage + 1}/{totalReportPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={reportPage >= totalReportPages - 1}
                  onClick={() => setReportPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {reversedReports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No monthly reports yet. Reports are generated at the end of each month.
            </p>
          ) : (
            <div className="space-y-3">
              {pagedReports.map((report, i) => {
                const globalIdx = reportPage * REPORTS_PER_PAGE + i;
                const totalExpenses = report.employeeCosts + report.computeCosts + report.devOverheadCosts;
                const prevReport = globalIdx < reversedReports.length - 1 ? reversedReports[globalIdx + 1] : null;
                const monthlyIncome = prevReport
                  ? Math.max(0, report.income - prevReport.income)
                  : report.income;
                const monthlyNet = monthlyIncome - totalExpenses;

                return (
                  <div key={`${report.year}-${report.month}`} className="border border-border rounded-md p-3 space-y-2">
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

      {/* ─── Games List ─── */}
      {allGames.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allGames.map((game, i) => {
                const isClickable = game.phase !== 'development';
                return (
                  <div
                    key={`${game.id}-${i}`}
                    className={`flex items-center justify-between py-2 border-b border-border last:border-0 ${isClickable ? 'cursor-pointer hover:bg-muted/50 -mx-2 px-2 rounded' : ''}`}
                    onClick={() => isClickable && setSelectedGameId(game.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{game.name}</span>
                      <span className="text-xs text-muted-foreground">{game.genre} / {game.style}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${PHASE_BADGE[game.phase] ?? ''}`}
                    >
                      {game.phase}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Past Releases ─── */}
      {completedGames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Releases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm font-medium">{game.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{game.genre} / {game.style}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-yellow-400">{game.reviewScore.toFixed(1)}/10</span>
                    <span className="text-green-400">${game.totalRevenue.toLocaleString()}</span>
                    <span className="text-muted-foreground">{game.totalCopiesSold.toLocaleString()} sold</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <GameDetailView
        gameId={selectedGameId}
        open={selectedGameId !== null}
        onClose={() => setSelectedGameId(null)}
      />
    </div>
  );
}
