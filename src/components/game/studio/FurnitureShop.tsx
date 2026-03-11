'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { FURNITURE_CATALOG, getFurnitureDef, getOfficeLayout } from '@/lib/config/furnitureConfig';
import { OFFICE_CONFIG } from '@/lib/config/officeConfig';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Coffee, Leaf, PenLine, Dumbbell, Cookie,
  MonitorUp, Server, FlaskConical, Trash2,
  Building2, Check, ArrowRight, Layers, Gamepad2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Coffee, Leaf, PenLine, Dumbbell, Cookie, MonitorUp, Server, FlaskConical,
};

const TASK_SLOT_COSTS = [0, 15_000, 40_000];
const GAME_SLOT_COSTS = [0, 20_000, 50_000];

type ShopTab = 'furniture' | 'property' | 'capacity';

function formatMoney(n: number): string {
  return `$${n.toLocaleString()}`;
}

export default function FurnitureShop() {
  const [tab, setTab] = useState<ShopTab>('furniture');

  const money = useGameStore((s) => s.money);
  const office = useGameStore((s) => s.office);
  const officeTier = office.tier;
  const furniture = useGameStore((s) => s.furniture);
  const calendar = useGameStore((s) => s.calendar);
  const employees = useGameStore((s) => s.employees);
  const maxParallelTasks = useGameStore((s) => s.maxParallelTasks);
  const maxActiveGames = useGameStore((s) => s.maxActiveGames);
  const buyFurniture = useGameStore((s) => s.buyFurniture);
  const sellFurniture = useGameStore((s) => s.sellFurniture);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const upgradeOffice = useGameStore((s) => s.upgradeOffice);
  const upgradeParallelTasks = useGameStore((s) => s.upgradeParallelTasks);
  const upgradeActiveGames = useGameStore((s) => s.upgradeActiveGames);

  const layout = getOfficeLayout(officeTier);
  const slotsUsed = furniture.length;
  const slotsTotal = layout.furnitureSlotCount;
  const hiredCount = employees.filter((e) => !e.isPlayer).length;

  function handleBuy(defId: string) {
    const def = getFurnitureDef(defId);
    if (!def) return;
    if (money < def.purchaseCost) return;
    if (slotsUsed >= slotsTotal) return;
    const ownedCount = furniture.filter((f) => f.definitionId === defId).length;
    if (ownedCount >= def.maxCount) return;
    if (officeTier < def.requiredTier) return;
    buyFurniture(
      {
        id: `furn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        definitionId: defId,
        purchasedAt: { year: calendar.year, month: calendar.month },
      },
      def.purchaseCost,
    );
  }

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

  const tabs: { id: ShopTab; label: string }[] = [
    { id: 'furniture', label: 'Furniture' },
    { id: 'property', label: 'Property' },
    { id: 'capacity', label: 'Capacity' },
  ];

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-0.5 bg-muted/50 rounded-lg p-0.5">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            className={`flex-1 text-xs py-1.5 rounded-md transition-colors cursor-pointer ${
              tab === id
                ? 'bg-background text-foreground shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── Furniture Tab ─── */}
      {tab === 'furniture' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">Furniture Shop</h3>
            <p className="text-xs text-muted-foreground">
              {slotsUsed}/{slotsTotal} slots &middot; {formatMoney(Math.floor(money))}
            </p>
          </div>

          {furniture.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Owned</h4>
              <div className="grid gap-1.5">
                {furniture.map((owned) => {
                  const def = getFurnitureDef(owned.definitionId);
                  if (!def) return null;
                  const IconComp = ICON_MAP[def.icon];
                  return (
                    <div key={owned.id} className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded text-xs">
                      {IconComp && <IconComp className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{def.name}</span>
                        {def.monthlyMaintenance > 0 && (
                          <span className="text-muted-foreground ml-1">({formatMoney(def.monthlyMaintenance)}/mo)</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-destructive hover:text-destructive cursor-pointer"
                        onClick={() => sellFurniture(owned.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Catalog</h4>
            <div className="grid gap-2">
              {FURNITURE_CATALOG.map((def) => {
                const IconComp = ICON_MAP[def.icon];
                const ownedCount = furniture.filter((f) => f.definitionId === def.id).length;
                const maxed = ownedCount >= def.maxCount;
                const tierLocked = officeTier < def.requiredTier;
                const noSlots = slotsUsed >= slotsTotal;
                const cantAfford = money < def.purchaseCost;
                const disabled = maxed || tierLocked || noSlots || cantAfford;

                return (
                  <Card key={def.id} className="p-2.5 gap-0">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {IconComp ? <IconComp className="w-4 h-4 text-sky-500" /> : <div className="w-4 h-4 rounded bg-sky-400/40" />}
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold">{def.name}</span>
                          {maxed && <Badge variant="secondary" className="text-[9px] px-1 py-0">Max</Badge>}
                          {tierLocked && <Badge variant="outline" className="text-[9px] px-1 py-0">Tier {def.requiredTier}+</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{def.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{formatMoney(def.purchaseCost)}</span>
                          {def.monthlyMaintenance > 0 && <span>+{formatMoney(def.monthlyMaintenance)}/mo</span>}
                          {def.maxCount > 1 && <span>({ownedCount}/{def.maxCount})</span>}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs shrink-0 cursor-pointer" disabled={disabled} onClick={() => handleBuy(def.id)}>
                        Buy
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Property Tab ─── */}
      {tab === 'property' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold">
                {OFFICE_CONFIG.tiers.find((t) => t.tier === officeTier)?.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {hiredCount}/{office.maxSeats} hired + you
                {office.monthlyOverhead > 0 && ` · ${formatMoney(office.monthlyOverhead)}/mo`}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            {OFFICE_CONFIG.tiers.map((def) => {
              const isCurrent = def.tier === officeTier;
              const isUpgrade = def.tier > officeTier;
              const isPast = def.tier < officeTier;
              const isNextTier = def.tier === officeTier + 1;
              const canAfford = money >= def.purchaseCost;

              return (
                <div
                  key={def.tier}
                  className={`border rounded-md p-2.5 text-xs transition-colors ${
                    isCurrent ? 'border-blue-500 bg-blue-950/20' :
                    isPast ? 'border-border opacity-40' :
                    isNextTier ? 'border-border hover:border-blue-400' :
                    'border-border opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{def.name}</span>
                        {isCurrent && <Badge className="text-[9px] px-1 py-0 bg-blue-500/20 text-blue-400 border-blue-500/50">Current</Badge>}
                      </div>
                      <div className="flex gap-3 text-muted-foreground">
                        <span>{def.maxSeats} seat{def.maxSeats !== 1 ? 's' : ''}</span>
                        {def.monthlyOverhead > 0 && <span>{formatMoney(def.monthlyOverhead)}/mo</span>}
                        {def.devSpeedBonus > 1 && <span className="text-green-400">+{Math.round((def.devSpeedBonus - 1) * 100)}%</span>}
                      </div>
                    </div>
                    {isUpgrade && (
                      <div className="flex items-center gap-2">
                        {def.purchaseCost > 0 && (
                          <span className={`font-mono ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                            {formatMoney(def.purchaseCost)}
                          </span>
                        )}
                        <Button
                          size="sm"
                          className="h-6 text-[10px] cursor-pointer"
                          disabled={!isNextTier || !canAfford}
                          onClick={() => handleUpgrade(def.tier)}
                        >
                          {isNextTier ? 'Upgrade' : 'Locked'}
                        </Button>
                      </div>
                    )}
                    {isPast && <Check className="h-4 w-4 text-muted-foreground/60" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Capacity Tab ─── */}
      {tab === 'capacity' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Studio Capacity</h3>

          <Card className="p-3 gap-0 space-y-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              <div>
                <span className="text-xs font-semibold">Parallel Tasks</span>
                <p className="text-[10px] text-muted-foreground">Work on multiple projects</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((slot) => (
                <div key={slot} className={`h-2.5 flex-1 rounded-full ${slot <= maxParallelTasks ? 'bg-blue-500' : 'bg-muted'}`} />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">{maxParallelTasks}/3 slots</p>
            {nextTaskSlotCost !== null && maxParallelTasks < 3 ? (
              <Button size="sm" variant="outline" className="w-full text-xs h-7 cursor-pointer" disabled={money < nextTaskSlotCost} onClick={handleBuyTaskSlot}>
                +1 Slot ({formatMoney(nextTaskSlotCost)})
              </Button>
            ) : maxParallelTasks >= 3 ? (
              <Badge className="text-[10px]">Max Reached</Badge>
            ) : null}
          </Card>

          <Card className="p-3 gap-0 space-y-2">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-green-400" />
              <div>
                <span className="text-xs font-semibold">Active Games</span>
                <p className="text-[10px] text-muted-foreground">Have multiple games live</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((slot) => (
                <div key={slot} className={`h-2.5 flex-1 rounded-full ${slot <= maxActiveGames ? 'bg-green-500' : 'bg-muted'}`} />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">{maxActiveGames}/3 slots</p>
            {nextGameSlotCost !== null && maxActiveGames < 3 ? (
              <Button size="sm" variant="outline" className="w-full text-xs h-7 cursor-pointer" disabled={money < nextGameSlotCost} onClick={handleBuyGameSlot}>
                +1 Slot ({formatMoney(nextGameSlotCost)})
              </Button>
            ) : maxActiveGames >= 3 ? (
              <Badge className="text-[10px]">Max Reached</Badge>
            ) : null}
          </Card>
        </div>
      )}
    </div>
  );
}
