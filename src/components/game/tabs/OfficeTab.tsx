'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/store/gameStore';
import { OFFICE_CONFIG } from '@/lib/config/officeConfig';
import { Building2, Check, ArrowRight } from 'lucide-react';

export default function OfficeTab() {
  const office = useGameStore((s) => s.office);
  const money = useGameStore((s) => s.money);
  const employees = useGameStore((s) => s.employees);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const upgradeOffice = useGameStore((s) => s.upgradeOffice);

  const handleUpgrade = (tier: number) => {
    const def = OFFICE_CONFIG.tiers.find((t) => t.tier === tier);
    if (!def) return;
    if (spendMoney(def.purchaseCost)) {
      upgradeOffice(def.tier);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Office: {OFFICE_CONFIG.tiers.find((t) => t.tier === office.tier)?.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {employees.length}/{office.maxSeats} seats filled
            {office.monthlyOverhead > 0 && ` · $${office.monthlyOverhead}/mo overhead`}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {OFFICE_CONFIG.tiers.map((def) => {
          const isCurrent = def.tier === office.tier;
          const isUpgrade = def.tier > office.tier;
          const isPast = def.tier < office.tier;
          const isNextTier = def.tier === office.tier + 1;
          const canAfford = money >= def.purchaseCost;

          return (
            <Card
              key={def.tier}
              className={`border transition-colors ${
                isCurrent
                  ? 'border-blue-500 bg-blue-950/20'
                  : isPast
                  ? 'border-border bg-card/40 opacity-50'
                  : isNextTier
                  ? 'border-border bg-card hover:border-blue-400'
                  : 'border-border bg-card/60'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{def.name}</span>
                      {isCurrent && (
                        <Badge className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/50">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{def.maxSeats} seat{def.maxSeats !== 1 ? 's' : ''}</span>
                      {def.monthlyOverhead > 0 && (
                        <span>${def.monthlyOverhead}/mo overhead</span>
                      )}
                      {def.devSpeedBonus > 1 && (
                        <span className="text-green-400">
                          +{Math.round((def.devSpeedBonus - 1) * 100)}% dev speed
                        </span>
                      )}
                    </div>
                  </div>

                  {isUpgrade && (
                    <div className="flex items-center gap-3">
                      {def.purchaseCost > 0 && (
                        <span className={`text-sm font-mono ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                          ${def.purchaseCost.toLocaleString()}
                        </span>
                      )}
                      <Button
                        size="sm"
                        className="cursor-pointer"
                        disabled={!isNextTier || !canAfford}
                        onClick={() => handleUpgrade(def.tier)}
                      >
                        {isNextTier ? 'Upgrade' : 'Locked'}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}

                  {isPast && (
                    <Check className="h-5 w-5 text-muted-foreground/60" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
