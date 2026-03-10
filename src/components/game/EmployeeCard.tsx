'use client';

import { useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus, User } from 'lucide-react';
import type { Employee } from '@/lib/game/types';
import { RARITY_TIERS } from '@/lib/config/rarityConfig';
import { getEffectiveSkills } from '@/lib/game/employeeSystem';

const SKILL_META: Record<string, { label: string; color: string; barColor: string }> = {
  graphics: { label: 'GFX', color: 'text-pink-400', barColor: 'bg-pink-500' },
  sound: { label: 'SND', color: 'text-green-400', barColor: 'bg-green-500' },
  gameplay: { label: 'GME', color: 'text-blue-400', barColor: 'bg-blue-500' },
  polish: { label: 'POL', color: 'text-yellow-400', barColor: 'bg-yellow-500' },
};

interface EmployeeCardProps {
  employee: Employee;
  faceDown?: boolean;
  onFlip?: () => void;
  onHire?: () => void;
  hireDisabled?: boolean;
  compact?: boolean;
}

export default function EmployeeCard({
  employee,
  faceDown = false,
  onFlip,
  onHire,
  hireDisabled = false,
  compact = false,
}: EmployeeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rarity = RARITY_TIERS[employee.rarity];
  const effectiveSkills = getEffectiveSkills(employee);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    card.style.setProperty('--mx', mx.toFixed(3));
    card.style.setProperty('--my', my.toFixed(3));
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--mx', '0.5');
    card.style.setProperty('--my', '0.5');
  }, []);

  if (faceDown) {
    return (
      <div
        className="employee-card employee-card--flippable employee-card--face-down"
        data-rarity={employee.rarity}
        data-interactive="false"
        onClick={onFlip}
        style={{ width: compact ? 160 : 200, height: compact ? 240 : 300 }}
      >
        <div className="employee-card__inner">
          <div className="employee-card__front" />
          <div className="employee-card__back" />
        </div>
      </div>
    );
  }

  const totalIv = employee.skills.graphics + employee.skills.sound + employee.skills.gameplay + employee.skills.polish;

  return (
    <div
      ref={cardRef}
      className={`employee-card border-2 ${rarity.borderColor} ${rarity.bgColor}`}
      data-rarity={employee.rarity}
      data-interactive="true"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ width: compact ? 160 : 200 }}
    >
      {/* Sparkle layer for legendary/unique */}
      <div className="employee-card__sparkles" />

      <div className="relative z-[1] flex flex-col p-3 gap-2">
        {/* Header: Name + Rarity */}
        <div className="flex items-center justify-between gap-1">
          <div className="min-w-0">
            <p className={`text-xs font-bold truncate ${compact ? 'text-[10px]' : ''}`}>
              {employee.name}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">{employee.title}</p>
          </div>
          <Badge className={`text-[9px] px-1.5 py-0 shrink-0 ${rarity.textColor} ${rarity.bgColor} border ${rarity.borderColor}`}>
            {rarity.label}
          </Badge>
        </div>

        {/* Portrait area */}
        <div className={`flex items-center justify-center rounded-md bg-card/60 border border-border/50 ${compact ? 'h-14' : 'h-20'}`}>
          <User className={`${compact ? 'h-8 w-8' : 'h-12 w-12'} text-muted-foreground/30`} />
        </div>

        {/* Skill bars */}
        <div className="space-y-1">
          {(Object.keys(SKILL_META) as (keyof typeof SKILL_META)[]).map((skill) => {
            const iv = employee.skills[skill as keyof typeof employee.skills];
            const eff = effectiveSkills[skill as keyof typeof effectiveSkills];
            const meta = SKILL_META[skill];
            const pct = (iv / 31) * 100;
            const evPct = eff > iv ? ((eff - iv) / 31) * 100 : 0;
            return (
              <div key={skill} className="flex items-center gap-1.5">
                <span className={`text-[9px] font-mono w-6 ${meta.color}`}>{meta.label}</span>
                <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden relative">
                  <div className={`absolute inset-y-0 left-0 ${meta.barColor} rounded-full`} style={{ width: `${Math.min(100, pct)}%` }} />
                  {evPct > 0 && (
                    <div className={`absolute inset-y-0 ${meta.barColor} opacity-40 rounded-full`} style={{ left: `${pct}%`, width: `${Math.min(100 - pct, evPct)}%` }} />
                  )}
                </div>
                <span className="text-[9px] font-mono text-muted-foreground w-5 text-right">{iv}</span>
              </div>
            );
          })}
        </div>

        {/* Total IVs */}
        <div className="flex items-center justify-between text-[9px] text-muted-foreground">
          <span>Total IV: {totalIv}/124</span>
          {!compact && <span className="font-mono">${employee.monthlySalary}/mo</span>}
        </div>

        {/* Unique description */}
        {employee.description && !compact && (
          <p className="text-[9px] italic text-muted-foreground/80 leading-tight line-clamp-2">
            {employee.description}
          </p>
        )}

        {/* Hire button (only in pack view) */}
        {onHire && (
          <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/30">
            <span className="text-[10px] text-muted-foreground">${employee.hireCost.toLocaleString()}</span>
            <Button
              size="sm"
              className="h-6 text-[10px] px-2 cursor-pointer"
              disabled={hireDisabled}
              onClick={(e) => { e.stopPropagation(); onHire(); }}
            >
              <UserPlus className="h-3 w-3 mr-1" />Hire
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
