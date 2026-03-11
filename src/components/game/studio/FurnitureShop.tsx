'use client';

import { useGameStore } from '@/lib/store/gameStore';
import { FURNITURE_CATALOG, getFurnitureDef, getOfficeLayout } from '@/lib/config/furnitureConfig';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Coffee,
  Leaf,
  PenLine,
  Dumbbell,
  Cookie,
  MonitorUp,
  Server,
  FlaskConical,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Coffee,
  Leaf,
  PenLine,
  Dumbbell,
  Cookie,
  MonitorUp,
  Server,
  FlaskConical,
};

function formatMoney(n: number): string {
  return `$${n.toLocaleString()}`;
}

export default function FurnitureShop() {
  const money = useGameStore((s) => s.money);
  const officeTier = useGameStore((s) => s.office.tier);
  const furniture = useGameStore((s) => s.furniture);
  const calendar = useGameStore((s) => s.calendar);
  const buyFurniture = useGameStore((s) => s.buyFurniture);
  const sellFurniture = useGameStore((s) => s.sellFurniture);

  const layout = getOfficeLayout(officeTier);
  const slotsUsed = furniture.length;
  const slotsTotal = layout.furnitureSlotCount;

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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Furniture Shop</h3>
        <p className="text-xs text-muted-foreground">
          {slotsUsed}/{slotsTotal} slots used &middot; Balance: {formatMoney(Math.floor(money))}
        </p>
      </div>

      {/* Owned furniture */}
      {furniture.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Owned</h4>
          <div className="grid gap-1.5">
            {furniture.map((owned) => {
              const def = getFurnitureDef(owned.definitionId);
              if (!def) return null;
              const IconComp = ICON_MAP[def.icon];
              return (
                <div
                  key={owned.id}
                  className="flex items-center gap-2 px-2 py-1.5 bg-muted/50 rounded text-xs"
                >
                  {IconComp && <IconComp className="w-3.5 h-3.5 text-sky-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{def.name}</span>
                    {def.monthlyMaintenance > 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({formatMoney(def.monthlyMaintenance)}/mo)
                      </span>
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

      {/* Catalog */}
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
                    {IconComp ? (
                      <IconComp className="w-4 h-4 text-sky-500" />
                    ) : (
                      <div className="w-4 h-4 rounded bg-sky-400/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{def.name}</span>
                      {maxed && <Badge variant="secondary" className="text-[9px] px-1 py-0">Max</Badge>}
                      {tierLocked && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          Tier {def.requiredTier}+
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{def.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{formatMoney(def.purchaseCost)}</span>
                      {def.monthlyMaintenance > 0 && (
                        <span>+{formatMoney(def.monthlyMaintenance)}/mo</span>
                      )}
                      {def.maxCount > 1 && (
                        <span>({ownedCount}/{def.maxCount})</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0 cursor-pointer"
                    disabled={disabled}
                    onClick={() => handleBuy(def.id)}
                  >
                    Buy
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
