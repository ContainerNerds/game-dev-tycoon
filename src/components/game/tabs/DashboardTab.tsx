'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useGameStore } from '@/lib/store/gameStore';
import { OFFICE_CONFIG } from '@/lib/config/officeConfig';
import { getTotalMonthlyCost, getTotalCapacityByRegion } from '@/lib/game/serverSystem';
import { formatDate } from '@/lib/game/calendarSystem';
import GameDetailView from '@/components/game/GameDetailView';
import {
  Building2, Server, DollarSign, Users, Gamepad2,
  TrendingUp, HardDrive, Globe,
} from 'lucide-react';

const PHASE_BADGE: Record<string, string> = {
  development: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  growth: 'bg-green-500/20 text-green-400 border-green-500/50',
  peak: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  decline: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  retired: 'bg-muted text-muted-foreground border-border',
};

export default function DashboardTab() {
  const studioName = useGameStore((s) => s.studioName);
  const money = useGameStore((s) => s.money);
  const totalLifetimeMoney = useGameStore((s) => s.totalLifetimeMoney);
  const studioFans = useGameStore((s) => s.studioFans);
  const researchPoints = useGameStore((s) => s.researchPoints);
  const employees = useGameStore((s) => s.employees);
  const office = useGameStore((s) => s.office);
  const calendar = useGameStore((s) => s.calendar);
  const currentGame = useGameStore((s) => s.currentGame);
  const gameInDev = useGameStore((s) => s.gameInDevelopment);
  const completedGames = useGameStore((s) => s.completedGames);

  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const officeDef = OFFICE_CONFIG.tiers.find((t) => t.tier === office.tier);
  const totalPlayers = currentGame?.platformReleases.reduce((sum, p) => sum + p.activePlayers, 0) ?? 0;
  const totalSold = currentGame?.platformReleases.reduce((sum, p) => sum + p.totalCopiesSold, 0) ?? 0;
  const serverCount = currentGame?.servers.length ?? 0;
  const serverMonthlyCost = currentGame ? getTotalMonthlyCost(currentGame.servers) : 0;
  const totalCapacity = currentGame?.servers.reduce((sum, s) => sum + s.capacity, 0) ?? 0;
  const isMP = currentGame?.mode === 'multiplayer';
  const serverLoad = isMP && totalCapacity > 0 ? (totalPlayers / totalCapacity) * 100 : 0;
  const capacityByRegion = currentGame ? getTotalCapacityByRegion(currentGame.servers) : {};
  const activeRegions = Object.keys(capacityByRegion).length;

  const totalMonthlySalary = employees.reduce((sum, e) => sum + e.monthlySalary, 0);

  const allGames = [
    ...(gameInDev ? [{ id: gameInDev.id, name: gameInDev.name, phase: 'development' as const, genre: gameInDev.genre, style: gameInDev.style }] : []),
    ...(currentGame ? [{ id: currentGame.id, name: currentGame.name, phase: currentGame.phase, genre: currentGame.genre, style: currentGame.style }] : []),
    ...completedGames.map((g) => ({ id: g.id, name: g.name, phase: 'retired' as const, genre: g.genre, style: g.style })),
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Studio Overview */}
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

        {/* Infrastructure */}
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
            {isMP ? (
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
                <span className="text-muted-foreground/60">N/A (Single Player)</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Compute Cost</span>
              <span className="text-red-400 font-mono">${serverMonthlyCost.toLocaleString()}/mo</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Games List */}
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

      <GameDetailView
        gameId={selectedGameId}
        open={selectedGameId !== null}
        onClose={() => setSelectedGameId(null)}
      />
    </div>
  );
}
