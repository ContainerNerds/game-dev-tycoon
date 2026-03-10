'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Percent } from 'lucide-react';
import { EMPLOYEE_CONFIG, PACK_TYPES, type UniqueEmployeeDef } from '@/lib/config/employeeConfig';
import { RARITY_TIERS } from '@/lib/config/rarityConfig';
import { SKILL_META } from './EmployeeCard';

interface UniqueCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PreviewCard({ def }: { def: UniqueEmployeeDef }) {
  const rarity = RARITY_TIERS.unique;
  const ivRange = rarity.ivRange;
  const midIv = Math.round((ivRange.min + ivRange.max) / 2);

  return (
    <div
      className={`relative rounded-xl border-2 ${rarity.borderColor} ${rarity.bgColor} p-3 flex flex-col gap-2`}
      style={{ width: 180 }}
    >
      <div className="employee-card__holo-a" />
      <div className="employee-card__holo-b" />

      <div className="flex items-center justify-between gap-1">
        <div className="min-w-0">
          <p className="text-xs font-bold truncate">{def.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{def.title}</p>
        </div>
        <Badge className={`text-[9px] px-1.5 py-0 shrink-0 ${rarity.textColor} ${rarity.bgColor} border ${rarity.borderColor}`}>
          Unique
        </Badge>
      </div>

      <div className="flex items-center justify-center rounded-md bg-card/60 border border-border/50 h-14">
        <User className="h-8 w-8 text-muted-foreground/30" />
      </div>

      <div className="space-y-1">
        {(Object.keys(SKILL_META) as string[]).map((skill) => {
          const meta = SKILL_META[skill];
          const guaranteed = def.guaranteedSkills?.[skill as keyof typeof def.guaranteedSkills];
          const iv = guaranteed ?? midIv;
          const pct = (iv / 31) * 100;
          return (
            <div key={skill} className="flex items-center gap-1.5">
              <span className={`text-[9px] font-mono w-6 ${meta.color}`}>{meta.label}</span>
              <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                <div className={`h-full ${meta.barColor} rounded-full`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[9px] font-mono text-muted-foreground w-5 text-right">
                {guaranteed != null ? iv : `${ivRange.min}-${ivRange.max}`}
              </span>
            </div>
          );
        })}
      </div>

      {def.description && (
        <p className="text-[9px] italic text-muted-foreground/80 leading-tight line-clamp-2">
          {def.description}
        </p>
      )}
    </div>
  );
}

export default function UniqueCollectionModal({ open, onOpenChange }: UniqueCollectionModalProps) {
  const dropRates = useMemo(() => {
    const packEntries = Object.values(PACK_TYPES);
    const uniqueCount = EMPLOYEE_CONFIG.uniqueEmployees.length;

    return packEntries.map((pack) => {
      const perCard = pack.rarityWeights.unique * 100;
      const noneInPack = Math.pow(1 - pack.rarityWeights.unique, pack.size);
      const atLeastOne = (1 - noneInPack) * 100;
      const specificChar = atLeastOne / uniqueCount;

      return {
        label: pack.label,
        cost: pack.cost,
        perCard: perCard.toFixed(1),
        atLeastOne: atLeastOne.toFixed(1),
        specificChar: specificChar.toFixed(2),
      };
    });
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Named Unique Collection</span>
            <Badge className={`text-[10px] px-2 py-0 ${RARITY_TIERS.unique.textColor} ${RARITY_TIERS.unique.bgColor} border ${RARITY_TIERS.unique.borderColor}`}>
              {EMPLOYEE_CONFIG.uniqueEmployees.length} Characters
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Named Unique employees are the rarest hires. Each one has a unique identity, quote, and Legendary-tier IVs ({RARITY_TIERS.unique.ivRange.min}–{RARITY_TIERS.unique.ivRange.max} per skill).
          </DialogDescription>
        </DialogHeader>

        {/* Drop rates table */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Percent className="h-3.5 w-3.5" />
            Drop Chances
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1.5 pr-3">Pack</th>
                  <th className="text-right px-2">Cost</th>
                  <th className="text-right px-2">Per Card</th>
                  <th className="text-right px-2">Any Unique in Pack</th>
                  <th className="text-right pl-2">Specific Character</th>
                </tr>
              </thead>
              <tbody>
                {dropRates.map((r) => (
                  <tr key={r.label} className="border-b border-border/50">
                    <td className="py-1.5 pr-3 font-medium">{r.label}</td>
                    <td className="text-right px-2 text-muted-foreground">${r.cost.toLocaleString()}</td>
                    <td className="text-right px-2 text-cyan-400">{r.perCard}%</td>
                    <td className="text-right px-2 text-cyan-400">{r.atLeastOne}%</td>
                    <td className="text-right pl-2 text-cyan-300/70">{r.specificChar}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Separator />

        {/* Character gallery */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            All Named Uniques
          </h4>
          <div className="flex flex-wrap gap-3 justify-center">
            {EMPLOYEE_CONFIG.uniqueEmployees.map((def) => (
              <PreviewCard key={def.name} def={def} />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
