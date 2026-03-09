'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGameStore } from '@/lib/store/gameStore';
import { OFFICE_CONFIG } from '@/lib/config/officeConfig';
import { Building2, Check, ArrowRight, Layers, Gamepad2 } from 'lucide-react';

const TASK_SLOT_COSTS = [0, 15_000, 40_000]; // cost for slot 1 (free), 2, 3
const GAME_SLOT_COSTS = [0, 20_000, 50_000]; // cost for slot 1 (free), 2, 3

export default function OfficeTab() {
  const office = useGameStore((s) => s.office);
  const money = useGameStore((s) => s.money);
  const employees = useGameStore((s) => s.employees);
  const maxParallelTasks = useGameStore((s) => s.maxParallelTasks);
  const maxActiveGames = useGameStore((s) => s.maxActiveGames);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const upgradeOffice = useGameStore((s) => s.upgradeOffice);
  const upgradeParallelTasks = useGameStore((s) => s.upgradeParallelTasks);
  const upgradeActiveGames = useGameStore((s) => s.upgradeActiveGames);

  const hiredCount = employees.filter((e) => !e.isPlayer).length;

  const handleUpgrade = (tier: number) => {
    const def = OFFICE_CONFIG.tiers.find((t) => t.tier === tier);
    if (!def) return;
    if (spendMoney(def.purchaseCost)) upgradeOffice(def.tier);
  };

  const handleBuyTaskSlot = () => {
    const cost = TASK_SLOT_COSTS[maxParallelTasks] ?? 0;
    if (cost > 0 && spendMoney(cost)) upgradeParallelTasks();
    else if (cost === 0) upgradeParallelTasks();
  };

  const handleBuyGameSlot = () => {
    const cost = GAME_SLOT_COSTS[maxActiveGames] ?? 0;
    if (cost > 0 && spendMoney(cost)) upgradeActiveGames();
    else if (cost === 0) upgradeActiveGames();
  };

  const nextTaskSlotCost = TASK_SLOT_COSTS[maxParallelTasks] ?? null;
  const nextGameSlotCost = GAME_SLOT_COSTS[maxActiveGames] ?? null;

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold">
            Office: {OFFICE_CONFIG.tiers.find((t) => t.tier === office.tier)?.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {hiredCount}/{office.maxSeats} hired + you
            {office.monthlyOverhead > 0 && ` · $${office.monthlyOverhead}/mo overhead`}
          </p>
        </div>
      </div>

      {/* Office tiers */}
      <div className="grid gap-4">
        {OFFICE_CONFIG.tiers.map((def) => {
          const isCurrent = def.tier === office.tier;
          const isUpgrade = def.tier > office.tier;
          const isPast = def.tier < office.tier;
          const isNextTier = def.tier === office.tier + 1;
          const canAfford = money >= def.purchaseCost;

          return (
            <Card key={def.tier} className={`border transition-colors ${
              isCurrent ? 'border-blue-500 bg-blue-950/20' : isPast ? 'border-border bg-card/40 opacity-50' : isNextTier ? 'border-border bg-card hover:border-blue-400' : 'border-border bg-card/60'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{def.name}</span>
                      {isCurrent && <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/50">Current</Badge>}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{def.maxSeats} seat{def.maxSeats !== 1 ? 's' : ''}</span>
                      {def.monthlyOverhead > 0 && <span>${def.monthlyOverhead}/mo</span>}
                      {def.devSpeedBonus > 1 && <span className="text-green-400">+{Math.round((def.devSpeedBonus - 1) * 100)}% speed</span>}
                    </div>
                  </div>
                  {isUpgrade && (
                    <div className="flex items-center gap-3">
                      {def.purchaseCost > 0 && (
                        <span className={`text-sm font-mono ${canAfford ? 'text-green-400' : 'text-red-400'}`}>${def.purchaseCost.toLocaleString()}</span>
                      )}
                      <Button size="sm" className="cursor-pointer" disabled={!isNextTier || !canAfford} onClick={() => handleUpgrade(def.tier)}>
                        {isNextTier ? 'Upgrade' : 'Locked'}<ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                  {isPast && <Check className="h-5 w-5 text-muted-foreground/60" />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator />

      {/* Studio Capacity Upgrades */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Studio Capacity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Parallel task slots */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-400" />
                <div>
                  <span className="font-semibold">Parallel Tasks</span>
                  <p className="text-xs text-muted-foreground">Work on multiple projects at once</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map((slot) => (
                  <div key={slot} className={`h-3 flex-1 rounded-full ${slot <= maxParallelTasks ? 'bg-blue-500' : 'bg-muted'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{maxParallelTasks}/3 slots</p>
              {nextTaskSlotCost !== null && maxParallelTasks < 3 && (
                <Button size="sm" variant="outline" className="w-full text-xs cursor-pointer" disabled={money < nextTaskSlotCost} onClick={handleBuyTaskSlot}>
                  +1 Task Slot (${nextTaskSlotCost.toLocaleString()})
                </Button>
              )}
              {maxParallelTasks >= 3 && <Badge className="text-xs">Max Reached</Badge>}
            </CardContent>
          </Card>

          {/* Active game slots */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-green-400" />
                <div>
                  <span className="font-semibold">Active Games</span>
                  <p className="text-xs text-muted-foreground">Have multiple games live at once</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map((slot) => (
                  <div key={slot} className={`h-3 flex-1 rounded-full ${slot <= maxActiveGames ? 'bg-green-500' : 'bg-muted'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{maxActiveGames}/3 slots</p>
              {nextGameSlotCost !== null && maxActiveGames < 3 && (
                <Button size="sm" variant="outline" className="w-full text-xs cursor-pointer" disabled={money < nextGameSlotCost} onClick={handleBuyGameSlot}>
                  +1 Game Slot (${nextGameSlotCost.toLocaleString()})
                </Button>
              )}
              {maxActiveGames >= 3 && <Badge className="text-xs">Max Reached</Badge>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
