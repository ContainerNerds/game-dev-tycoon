'use client';

import { useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus, User } from 'lucide-react';
import type { Employee, EmployeeType } from '@/lib/game/types';
import { RARITY_TIERS } from '@/lib/config/rarityConfig';
import { getEffectiveSkills } from '@/lib/game/employeeSystem';

const TYPE_BADGE: Record<EmployeeType, { label: string; color: string }> = {
  developer:     { label: 'DEV', color: 'text-blue-400 bg-blue-500/20 border-blue-500/50' },
  researcher:    { label: 'RSC', color: 'text-purple-400 bg-purple-500/20 border-purple-500/50' },
  administrator: { label: 'ADM', color: 'text-amber-400 bg-amber-500/20 border-amber-500/50' },
  hacker:        { label: 'HCK', color: 'text-red-400 bg-red-500/20 border-red-500/50' },
};

export const SKILL_META: Record<string, { label: string; color: string; barColor: string }> = {
  graphics: { label: 'GFX', color: 'text-pink-400', barColor: 'bg-pink-500' },
  sound: { label: 'SND', color: 'text-green-400', barColor: 'bg-green-500' },
  gameplay: { label: 'GME', color: 'text-blue-400', barColor: 'bg-blue-500' },
  polish: { label: 'POL', color: 'text-yellow-400', barColor: 'bg-yellow-500' },
};

function staminaColor(stamina: number): string {
  if (stamina > 60) return 'bg-green-500';
  if (stamina > 30) return 'bg-yellow-500';
  return 'bg-red-500';
}

interface EmployeeCardProps {
  employee: Employee;
  faceDown?: boolean;
  onClick?: () => void;
  onHire?: () => void;
  hireDisabled?: boolean;
  showStamina?: boolean;
  compact?: boolean;
}

export default function EmployeeCard({
  employee,
  faceDown = false,
  onClick,
  onHire,
  hireDisabled = false,
  showStamina = false,
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

  const cardWidth = compact ? 160 : 200;
  const totalIv = employee.skills.graphics + employee.skills.sound + employee.skills.gameplay + employee.skills.polish;

  return (
    <div
      ref={cardRef}
      className={`employee-card employee-card--flippable ${faceDown ? 'employee-card--face-down' : ''}`}
      data-rarity={employee.rarity}
      data-interactive={!faceDown ? 'true' : 'false'}
      onMouseMove={!faceDown ? handleMouseMove : undefined}
      onMouseLeave={!faceDown ? handleMouseLeave : undefined}
      style={{ width: cardWidth, height: compact ? 240 : 300 }}
    >
      <div className="employee-card__inner">
        {/* Front face */}
        <div className={`employee-card__front border-2 ${rarity.borderColor} ${rarity.bgColor}`}>
          {/* Card body — clickable to open detail modal */}
          <div
            className={`relative flex flex-col p-3 gap-2 h-full overflow-hidden rounded-[12px] ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-1">
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${compact ? 'text-[10px]' : ''}`}>
                  {employee.name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{employee.title}</p>
              </div>
              {employee.employeeType ? (
                <Badge className={`text-[9px] px-1.5 py-0 shrink-0 border font-bold ${TYPE_BADGE[employee.employeeType].color}`}>
                  {TYPE_BADGE[employee.employeeType].label}
                </Badge>
              ) : (
                <Badge className={`text-[9px] px-1.5 py-0 shrink-0 ${rarity.textColor} ${rarity.bgColor} border ${rarity.borderColor}`}>
                  {rarity.label}
                </Badge>
              )}
            </div>

            {/* Portrait */}
            <div className={`flex items-center justify-center rounded-md bg-card/60 border border-border/50 ${compact ? 'h-14' : 'h-20'}`}>
              <User className={`${compact ? 'h-8 w-8' : 'h-12 w-12'} text-muted-foreground/30`} />
            </div>

            {/* Skill bars (IVs) */}
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

            {/* Total IVs + salary */}
            <div className="flex items-center justify-between text-[9px] text-muted-foreground">
              <span>IV: {totalIv}/124</span>
              {!compact && <span className="font-mono">${employee.monthlySalary}/mo</span>}
            </div>

            {/* Stamina bar (team cards) */}
            {showStamina && (
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-muted-foreground">STA</span>
                <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${staminaColor(employee.stamina)}`}
                    style={{ width: `${employee.stamina}%` }} />
                </div>
                <span className="text-[9px] font-mono text-muted-foreground">{Math.round(employee.stamina)}%</span>
              </div>
            )}

            {/* Unique description */}
            {employee.description && !compact && (
              <p className="text-[9px] italic text-muted-foreground/80 leading-tight line-clamp-2">
                {employee.description}
              </p>
            )}

            {/* Hire button — stopPropagation prevents the card body onClick */}
            {onHire && (
              <div
                className="flex items-center justify-between gap-1 pt-1 border-t border-border/30 mt-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] text-muted-foreground">${employee.hireCost.toLocaleString()}</span>
                <Button
                  size="sm"
                  className="h-6 text-[10px] px-2 cursor-pointer"
                  disabled={hireDisabled}
                  onClick={onHire}
                >
                  <UserPlus className="h-3 w-3 mr-1" />Hire
                </Button>
              </div>
            )}
          </div>

          {/* Holo overlays — real divs inside __front so they share stacking context with content.
              pointer-events:none lets clicks pass through to the content below. */}
          <div className="employee-card__holo-a" />
          <div className="employee-card__holo-b" />
          <div className="employee-card__sparkles" />
        </div>

        {/* Back face */}
        <div className="employee-card__back" />
      </div>
    </div>
  );
}
