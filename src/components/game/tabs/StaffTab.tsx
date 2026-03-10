'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGameStore } from '@/lib/store/gameStore';
import { EMPLOYEE_CONFIG } from '@/lib/config/employeeConfig';
import { RARITY_TIERS } from '@/lib/config/rarityConfig';
import { generatePack, getEffectiveSkills } from '@/lib/game/employeeSystem';
import { UserMinus, Users, Palmtree, Package, ShoppingCart } from 'lucide-react';
import type { EmployeeActivity } from '@/lib/game/types';
import EmployeeCard from '@/components/game/EmployeeCard';

const ACTIVITY_COLORS: Record<EmployeeActivity, string> = {
  idle: 'text-muted-foreground',
  developing: 'text-blue-400',
  researching: 'text-purple-400',
  bugfixing: 'text-orange-400',
  testing: 'text-cyan-400',
  vacation: 'text-green-400',
};

const ACTIVITY_LABELS: Record<EmployeeActivity, string> = {
  idle: 'Idle',
  developing: 'Developing',
  researching: 'Researching',
  bugfixing: 'Bug Fixing',
  testing: 'Testing',
  vacation: 'On Vacation',
};

function staminaColor(stamina: number): string {
  if (stamina > 60) return 'bg-green-500';
  if (stamina > 30) return 'bg-yellow-500';
  return 'bg-red-500';
}

const SKILL_BAR_META = [
  { key: 'graphics' as const, label: 'GFX', color: 'text-pink-400', bar: 'bg-pink-500' },
  { key: 'sound' as const, label: 'SND', color: 'text-green-400', bar: 'bg-green-500' },
  { key: 'gameplay' as const, label: 'GME', color: 'text-blue-400', bar: 'bg-blue-500' },
  { key: 'polish' as const, label: 'POL', color: 'text-yellow-400', bar: 'bg-yellow-500' },
];

export default function StaffTab() {
  const employees = useGameStore((s) => s.employees);
  const currentPack = useGameStore((s) => s.currentPack);
  const packRevealed = useGameStore((s) => s.packRevealed);
  const freePackAvailable = useGameStore((s) => s.freePackAvailable);
  const staffContributions = useGameStore((s) => s.staffContributions);
  const office = useGameStore((s) => s.office);
  const money = useGameStore((s) => s.money);
  const activeTasks = useGameStore((s) => s.activeTasks);
  const openFreePack = useGameStore((s) => s.openFreePack);
  const buyPack = useGameStore((s) => s.buyPack);
  const revealPackCard = useGameStore((s) => s.revealPackCard);
  const hireEmployee = useGameStore((s) => s.hireEmployee);
  const fireEmployee = useGameStore((s) => s.fireEmployee);
  const assignEmployee = useGameStore((s) => s.assignEmployee);
  const setEmployeeAutoAssign = useGameStore((s) => s.setEmployeeAutoAssign);
  const sendOnVacation = useGameStore((s) => s.sendOnVacation);

  const hiredCount = employees.filter((e) => !e.isPlayer).length;
  const totalMonthlySalary = employees.reduce((sum, e) => sum + e.monthlySalary, 0);

  const handleOpenFreePack = () => {
    if (!freePackAvailable) return;
    openFreePack(generatePack());
  };

  const handleBuyPack = () => {
    if (money < EMPLOYEE_CONFIG.packBuyCost) return;
    buyPack(generatePack());
  };

  const handleHire = (employeeId: string) => {
    const emp = currentPack.find((c) => c.id === employeeId);
    if (!emp) return;
    if (hiredCount >= office.maxSeats) return;
    if (money < emp.hireCost) return;
    hireEmployee(emp);
  };

  const allRevealed = packRevealed.length > 0 && packRevealed.every(Boolean);
  const hasPackCards = currentPack.length > 0;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Staff ({hiredCount}/{office.maxSeats} hired + you)
            </h3>
            <p className="text-sm text-muted-foreground">
              Monthly salaries: ${totalMonthlySalary.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {office.maxSeats === 0 && (
        <Card className="border-yellow-500/50 bg-yellow-950/20">
          <CardContent className="p-4 text-sm text-yellow-400">
            You need to upgrade your office before you can hire employees.
            Visit the Office tab to get a desk.
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* Pack Opening Section */}
      {/* ============================================================ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Package className="h-4 w-4" />
            Employee Packs
          </h4>
          <div className="flex items-center gap-2">
            {freePackAvailable && (
              <Button size="sm" className="text-xs cursor-pointer" onClick={handleOpenFreePack}>
                <Package className="h-3 w-3 mr-1" />
                Open Free Pack
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-xs cursor-pointer"
              disabled={money < EMPLOYEE_CONFIG.packBuyCost}
              onClick={handleBuyPack}
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              Buy Pack (${EMPLOYEE_CONFIG.packBuyCost.toLocaleString()})
            </Button>
          </div>
        </div>

        {!hasPackCards && !freePackAvailable && (
          <Card className="border-border bg-card/50">
            <CardContent className="p-6 text-center text-muted-foreground/60">
              <p>No pack available. Buy a pack or wait for your free monthly pack.</p>
            </CardContent>
          </Card>
        )}

        {!hasPackCards && freePackAvailable && (
          <Card className="border-border bg-card/50">
            <CardContent className="p-6 text-center text-muted-foreground/60">
              <p>You have a free pack available! Open it to find new talent.</p>
            </CardContent>
          </Card>
        )}

        {hasPackCards && (
          <div className="flex flex-wrap gap-3 justify-center">
            {currentPack.map((emp, idx) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                faceDown={!packRevealed[idx]}
                onFlip={() => revealPackCard(idx)}
                onHire={packRevealed[idx] ? () => handleHire(emp.id) : undefined}
                hireDisabled={hiredCount >= office.maxSeats || money < emp.hireCost}
              />
            ))}
          </div>
        )}

        {hasPackCards && allRevealed && (
          <p className="text-xs text-center text-muted-foreground">
            All cards revealed. Hire who you want, then open a new pack to replace these.
          </p>
        )}
      </div>

      <Separator />

      {/* ============================================================ */}
      {/* Contributions Table */}
      {/* ============================================================ */}
      {staffContributions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Contributions (recent)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1.5 pr-3">Employee</th>
                  <th className="text-right px-2">Gfx</th>
                  <th className="text-right px-2">Game</th>
                  <th className="text-right px-2">Snd</th>
                  <th className="text-right px-2">Pol</th>
                  <th className="text-right px-2">Bugs+</th>
                  <th className="text-right pl-2">Fixed</th>
                </tr>
              </thead>
              <tbody>
                {staffContributions.filter((c) => c.graphics + c.gameplay + c.sound + c.polish + c.bugsFixed > 0.01).map((c) => (
                  <tr key={c.employeeId} className="border-b border-border/50">
                    <td className="py-1.5 pr-3 font-medium">{c.employeeName}</td>
                    <td className="text-right px-2 text-pink-400">{c.graphics.toFixed(1)}</td>
                    <td className="text-right px-2 text-blue-400">{c.gameplay.toFixed(1)}</td>
                    <td className="text-right px-2 text-green-400">{c.sound.toFixed(1)}</td>
                    <td className="text-right px-2 text-yellow-400">{c.polish.toFixed(1)}</td>
                    <td className="text-right px-2 text-red-400">{c.bugsIntroduced > 0.1 ? c.bugsIntroduced.toFixed(0) : '-'}</td>
                    <td className="text-right pl-2 text-emerald-400">{c.bugsFixed > 0.1 ? c.bugsFixed.toFixed(0) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {staffContributions.length > 0 && <Separator />}

      {/* ============================================================ */}
      {/* Your Team */}
      {/* ============================================================ */}
      {employees.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Your Team
          </h4>
          <div className="grid gap-2">
            {employees.map((emp) => {
              const rarity = RARITY_TIERS[emp.rarity];
              const effSkills = getEffectiveSkills(emp);
              return (
                <Card key={emp.id} className={`border-2 ${rarity.borderColor} ${rarity.bgColor}`}>
                  <CardContent className="p-3 space-y-2">
                    {/* Row 1: Name, rarity, activity, salary, fire */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">{emp.name}</span>
                        <span className="text-xs text-muted-foreground">{emp.title}</span>
                        <Badge className={`text-[9px] px-1.5 py-0 ${rarity.textColor} ${rarity.bgColor} border ${rarity.borderColor}`}>
                          {rarity.label}
                        </Badge>
                        {emp.isPlayer && (
                          <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/50">You</Badge>
                        )}
                        <span className={`text-xs font-medium ${ACTIVITY_COLORS[emp.activity]}`}>
                          {ACTIVITY_LABELS[emp.activity]}
                          {emp.onVacation && ` (${emp.vacationDaysLeft}d)`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {emp.isPlayer ? 'Founder' : `$${emp.monthlySalary.toLocaleString()}/mo`}
                        </span>
                        {!emp.isPlayer && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-300 cursor-pointer"
                            onClick={() => fireEmployee(emp.id)}>
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Skill bars + stamina */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 grid grid-cols-4 gap-x-3 gap-y-0.5">
                        {SKILL_BAR_META.map(({ key, label, color, bar }) => {
                          const iv = emp.skills[key];
                          const eff = effSkills[key];
                          const pct = (iv / 31) * 100;
                          const evPct = eff > iv ? ((eff - iv) / 31) * 100 : 0;
                          return (
                            <div key={key} className="flex items-center gap-1">
                              <span className={`text-[9px] font-mono w-6 ${color}`}>{label}</span>
                              <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden relative">
                                <div className={`absolute inset-y-0 left-0 ${bar} rounded-full`} style={{ width: `${pct}%` }} />
                                {evPct > 0 && (
                                  <div className={`absolute inset-y-0 ${bar} opacity-40 rounded-full`} style={{ left: `${pct}%`, width: `${Math.min(100 - pct, evPct)}%` }} />
                                )}
                              </div>
                              <span className="text-[9px] font-mono text-muted-foreground w-4 text-right">{iv}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-muted-foreground">Stamina</span>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${staminaColor(emp.stamina)}`}
                            style={{ width: `${emp.stamina}%` }} />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground w-8">{Math.round(emp.stamina)}%</span>
                      </div>
                    </div>

                    {/* Row 3: Assignment buttons */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button size="sm" variant={emp.autoAssign ? 'default' : 'ghost'}
                        className="h-6 text-xs px-2 cursor-pointer"
                        disabled={emp.onVacation}
                        onClick={() => setEmployeeAutoAssign(emp.id)}>
                        Auto
                      </Button>
                      <Button size="sm" variant={!emp.autoAssign && emp.assignedTaskId === 'bugfix' ? 'default' : 'ghost'}
                        className="h-6 text-xs px-2 cursor-pointer"
                        disabled={emp.onVacation}
                        onClick={() => assignEmployee(emp.id, 'bugfix')}>
                        Bugs
                      </Button>
                      {activeTasks.map((t) => (
                        <Button key={t.id} size="sm" variant={!emp.autoAssign && emp.assignedTaskId === t.id ? 'default' : 'ghost'}
                          className="h-6 text-xs px-2 cursor-pointer truncate max-w-[80px]"
                          disabled={emp.onVacation}
                          onClick={() => assignEmployee(emp.id, t.id)}
                          title={t.name}>
                          {t.name}
                        </Button>
                      ))}
                      <Button size="sm" variant={emp.onVacation ? 'default' : 'ghost'}
                        className="h-6 text-xs px-2 cursor-pointer"
                        disabled={emp.onVacation || emp.stamina >= 95}
                        onClick={() => sendOnVacation(emp.id)}
                        title="Send on 2-week vacation to recover stamina">
                        <Palmtree className="h-3 w-3 mr-1" />Vacation
                      </Button>
                    </div>

                    {/* Unique description */}
                    {emp.description && (
                      <p className="text-[10px] italic text-muted-foreground/70 leading-tight">
                        {emp.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
