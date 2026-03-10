'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Bug, DollarSign, Zap, Heart } from 'lucide-react';
import type { Employee } from '@/lib/game/types';
import { RARITY_TIERS } from '@/lib/config/rarityConfig';
import { getEffectiveSkills } from '@/lib/game/employeeSystem';
import { SKILL_META } from './EmployeeCard';
import { EMPLOYEE_CONFIG } from '@/lib/config/employeeConfig';

interface EmployeeDetailModalProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StatBar({ label, value, max, color, barColor }: {
  label: string; value: number; max: number; color: string; barColor: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-mono w-8 ${color}`}>{label}</span>
      <div className="flex-1 h-2 bg-muted/60 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-10 text-right">{value}/{max}</span>
    </div>
  );
}

export default function EmployeeDetailModal({ employee, open, onOpenChange }: EmployeeDetailModalProps) {
  if (!employee) return null;

  const rarity = RARITY_TIERS[employee.rarity];
  const effectiveSkills = getEffectiveSkills(employee);
  const totalIv = employee.skills.graphics + employee.skills.sound + employee.skills.gameplay + employee.skills.polish;
  const totalEv = employee.evs.graphics + employee.evs.sound + employee.evs.gameplay + employee.evs.polish;
  const totalEffective = effectiveSkills.graphics + effectiveSkills.sound + effectiveSkills.gameplay + effectiveSkills.polish;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{employee.name}</span>
            <Badge className={`text-[10px] px-2 py-0 ${rarity.textColor} ${rarity.bgColor} border ${rarity.borderColor}`}>
              {rarity.label}
            </Badge>
            {employee.isPlayer && (
              <Badge className="text-[10px] bg-yellow-500/20 text-yellow-400 border-yellow-500/50">You</Badge>
            )}
          </DialogTitle>
          <DialogDescription>{employee.title} {employee.isPlayer ? '(Founder)' : `· $${employee.monthlySalary.toLocaleString()}/mo`}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-4">
          {/* Left: Portrait */}
          <div className={`shrink-0 w-24 h-28 rounded-lg border-2 ${rarity.borderColor} ${rarity.bgColor} flex items-center justify-center`}>
            <User className="h-14 w-14 text-muted-foreground/30" />
          </div>

          {/* Right: Quick info */}
          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                <span>Hire cost: ${employee.hireCost.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Heart className="h-3 w-3" />
                <span>Stamina: {Math.round(employee.stamina)}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Bug className="h-3 w-3" />
                <span>Bugs fixed: {employee.bugsFixed}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Zap className="h-3 w-3" />
                <span>Fix points: {Math.round(employee.totalBugFixPoints)}</span>
              </div>
            </div>

            {employee.description && (
              <p className="text-xs italic text-muted-foreground/80 leading-tight">
                {employee.description}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* IVs */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              IVs (Innate Talent)
            </h4>
            <span className="text-[10px] font-mono text-muted-foreground">Total: {totalIv}/124</span>
          </div>
          {(Object.keys(SKILL_META) as string[]).map((skill) => {
            const meta = SKILL_META[skill];
            const iv = employee.skills[skill as keyof typeof employee.skills];
            return (
              <StatBar key={skill} label={meta.label} value={iv} max={31} color={meta.color} barColor={meta.barColor} />
            );
          })}
        </div>

        <Separator />

        {/* EVs */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              EVs (Training)
            </h4>
            <span className="text-[10px] font-mono text-muted-foreground">Total: {totalEv}/{EMPLOYEE_CONFIG.evConfig.maxTotal}</span>
          </div>
          {(Object.keys(SKILL_META) as string[]).map((skill) => {
            const meta = SKILL_META[skill];
            const ev = employee.evs[skill as keyof typeof employee.evs];
            return (
              <StatBar key={skill} label={meta.label} value={ev} max={EMPLOYEE_CONFIG.evConfig.maxPerSkill} color={meta.color} barColor={meta.barColor} />
            );
          })}
        </div>

        <Separator />

        {/* Effective Stats */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Effective Stats (IV + EV/4)
            </h4>
            <span className="text-[10px] font-mono text-muted-foreground">Total: {totalEffective}</span>
          </div>
          {(Object.keys(SKILL_META) as string[]).map((skill) => {
            const meta = SKILL_META[skill];
            const eff = effectiveSkills[skill as keyof typeof effectiveSkills];
            return (
              <StatBar key={skill} label={meta.label} value={eff} max={94} color={meta.color} barColor={meta.barColor} />
            );
          })}
        </div>

        <Separator />

        {/* Future perks placeholder */}
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Perks</h4>
          <p className="text-xs text-muted-foreground/50 italic">No perks yet. Coming soon...</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
