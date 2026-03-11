'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from '@/components/ui/context-menu';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/store/gameStore';
import { PACK_TYPES, type PackTypeId } from '@/lib/config/employeeConfig';
import { generatePack } from '@/lib/game/employeeSystem';
import { UserMinus, Users, Palmtree, Package, ShoppingCart, Bug, Zap, Plus, Volume2, VolumeX, Crown, Gem, BookOpen, BedDouble } from 'lucide-react';
import type { Employee, EmployeeActivity, EmployeeType } from '@/lib/game/types';
import EmployeeCard from '@/components/game/EmployeeCard';
import EmployeeDetailModal from '@/components/game/EmployeeDetailModal';
import UniqueCollectionModal from '@/components/game/UniqueCollectionModal';
import { playFlipSound, playEpicRevealSound, isMuted, setMuted } from '@/lib/game/sounds';

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

const EMPLOYEE_TYPE_LABELS: Record<EmployeeType, string> = {
  developer: 'Dev',
  researcher: 'Res',
  administrator: 'Admin',
  hacker: 'Hack',
};

const EMPLOYEE_TYPE_COLORS: Record<EmployeeType, string> = {
  developer: 'text-blue-400 border-blue-500/50',
  researcher: 'text-purple-400 border-purple-500/50',
  administrator: 'text-amber-400 border-amber-500/50',
  hacker: 'text-red-400 border-red-500/50',
};

const REVEAL_DELAY_MS = 400;
const EPIC_RARITIES = new Set(['legendary', 'unique']);

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
  const hireEmployee = useGameStore((s) => s.hireEmployee);
  const fireEmployee = useGameStore((s) => s.fireEmployee);
  const assignEmployee = useGameStore((s) => s.assignEmployee);
  const setEmployeeAutoAssign = useGameStore((s) => s.setEmployeeAutoAssign);
  const sendOnVacation = useGameStore((s) => s.sendOnVacation);
  const autoVacationThreshold = useGameStore((s) => s.autoVacationThreshold);
  const setAutoVacationThreshold = useGameStore((s) => s.setAutoVacationThreshold);

  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
  const [epicShakeIds, setEpicShakeIds] = useState<Set<string>>(new Set());
  const [sfxMuted, setSfxMuted] = useState(isMuted);
  const [collectionOpen, setCollectionOpen] = useState(false);

  const revealTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Schedule staggered reveals for a given pack, calling the store directly
  // so we don't depend on any React state that would cause re-render churn.
  const scheduleReveals = useCallback((pack: Employee[]) => {
    revealTimersRef.current.forEach(clearTimeout);
    revealTimersRef.current = pack.map((emp, idx) =>
      setTimeout(() => {
        playFlipSound();
        useGameStore.getState().revealPackCard(idx);

        if (EPIC_RARITIES.has(emp.rarity)) {
          setTimeout(() => {
            playEpicRevealSound();
            setEpicShakeIds((prev) => new Set(prev).add(emp.id));
            setTimeout(() => {
              setEpicShakeIds((prev) => {
                const next = new Set(prev);
                next.delete(emp.id);
                return next;
              });
            }, 700);
          }, 400);
        }
      }, REVEAL_DELAY_MS * (idx + 1))
    );
  }, []);

  // On mount: if a pack was loaded from save with unrevealed cards, reveal them
  useEffect(() => {
    const state = useGameStore.getState();
    if (state.currentPack.length > 0 && state.packRevealed.some((r) => !r)) {
      scheduleReveals(state.currentPack);
    }
    return () => {
      revealTimersRef.current.forEach(clearTimeout);
    };
  }, [scheduleReveals]);

  const hiredCount = employees.filter((e) => !e.isPlayer).length;
  const totalMonthlySalary = employees.reduce((sum, e) => sum + e.monthlySalary, 0);
  const emptySlots = Math.max(0, office.maxSeats - hiredCount);

  const handleOpenFreePack = () => {
    if (!freePackAvailable) return;
    const pack = generatePack('standard');
    openFreePack(pack);
    scheduleReveals(pack);
  };

  const handleBuyPack = (packTypeId: PackTypeId) => {
    const packDef = PACK_TYPES[packTypeId];
    if (money < packDef.cost) return;
    const pack = generatePack(packTypeId);
    buyPack(pack, packDef.cost);
    scheduleReveals(pack);
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
      <div className="flex items-center justify-between flex-wrap gap-3">
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

        <div className="flex items-center gap-1.5">
          <BedDouble className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mr-1">Auto-Vacation:</span>
          {([0, 30] as const).map((val) => (
            <Button
              key={val}
              size="sm"
              variant={autoVacationThreshold === val ? 'default' : 'outline'}
              className="h-6 px-2 text-[11px] cursor-pointer"
              onClick={() => setAutoVacationThreshold(val)}
            >
              {val === 0 ? 'Off' : `${val}%`}
            </Button>
          ))}
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
      {/* Pack Opening */}
      {/* ============================================================ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Package className="h-4 w-4" />
            Employee Packs
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 cursor-pointer text-cyan-400/70 hover:text-cyan-300"
              onClick={() => setCollectionOpen(true)}
              title="View Named Unique collection"
            >
              <BookOpen className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 cursor-pointer text-muted-foreground"
              onClick={() => { const next = !sfxMuted; setSfxMuted(next); setMuted(next); }}
              title={sfxMuted ? 'Unmute pack sounds' : 'Mute pack sounds'}
            >
              {sfxMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
          </h4>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {freePackAvailable && (
              <Button size="sm" className="text-xs cursor-pointer" onClick={handleOpenFreePack}>
                <Package className="h-3 w-3 mr-1" />
                Free Pack
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-xs cursor-pointer"
              disabled={money < PACK_TYPES.standard.cost}
              onClick={() => handleBuyPack('standard')}
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              Standard (${PACK_TYPES.standard.cost.toLocaleString()})
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs cursor-pointer border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              disabled={money < PACK_TYPES.epic.cost}
              onClick={() => handleBuyPack('epic')}
            >
              <Gem className="h-3 w-3 mr-1" />
              Epic (${PACK_TYPES.epic.cost.toLocaleString()})
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs cursor-pointer border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
              disabled={money < PACK_TYPES.legendary.cost}
              onClick={() => handleBuyPack('legendary')}
            >
              <Crown className="h-3 w-3 mr-1" />
              Legendary (${PACK_TYPES.legendary.cost.toLocaleString()})
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
              <motion.div
                key={emp.id}
                animate={epicShakeIds.has(emp.id) ? {
                  x: [0, -4, 4, -3, 3, -2, 2, -1, 1, 0],
                  rotate: [0, -1, 1, -0.5, 0.5, -0.5, 0.5, 0, 0, 0],
                } : {}}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              >
                <EmployeeCard
                  employee={emp}
                  faceDown={!packRevealed[idx]}
                  onClick={packRevealed[idx] ? () => setDetailEmployee(emp) : undefined}
                  onHire={packRevealed[idx] ? () => handleHire(emp.id) : undefined}
                  hireDisabled={hiredCount >= office.maxSeats || money < emp.hireCost}
                />
              </motion.div>
            ))}
          </div>
        )}

        {hasPackCards && allRevealed && (
          <p className="text-xs text-center text-muted-foreground">
            All cards revealed. Click a card for details. Hire who you want, then open a new pack.
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
                  <th className="text-right px-2">Dev Pts</th>
                  <th className="text-right px-2">Research</th>
                  <th className="text-right px-2">Bugs+</th>
                  <th className="text-right pl-2">Fixed</th>
                </tr>
              </thead>
              <tbody>
                {staffContributions.filter((c) => {
                  const catTotal = Object.values(c.categories).reduce((s, v) => s + (v ?? 0), 0);
                  return catTotal + (c.researchPoints ?? 0) + c.bugsFixed > 0.01;
                }).map((c) => {
                  const catTotal = Object.values(c.categories).reduce((s, v) => s + (v ?? 0), 0);
                  return (
                    <tr key={c.employeeId} className="border-b border-border/50">
                      <td className="py-1.5 pr-3 font-medium">{c.employeeName}</td>
                      <td className="text-right px-2 text-blue-400">{catTotal > 0.01 ? catTotal.toFixed(1) : '-'}</td>
                      <td className="text-right px-2 text-purple-400">{(c.researchPoints ?? 0) > 0.01 ? c.researchPoints.toFixed(1) : '-'}</td>
                      <td className="text-right px-2 text-red-400">{c.bugsIntroduced > 0.1 ? c.bugsIntroduced.toFixed(0) : '-'}</td>
                      <td className="text-right pl-2 text-emerald-400">{c.bugsFixed > 0.1 ? c.bugsFixed.toFixed(0) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {staffContributions.length > 0 && <Separator />}

      {/* ============================================================ */}
      {/* Your Team — Card Grid with Context Menu */}
      {/* ============================================================ */}
      {employees.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Your Team
          </h4>
          <div className="flex flex-wrap gap-4">
            {employees.map((emp) => (
              <ContextMenu key={emp.id}>
                <ContextMenuTrigger>
                  <div className="flex flex-col items-center gap-1.5" style={{ width: 168 }}>
                    <EmployeeCard
                      employee={emp}
                      compact
                      showStamina
                      onClick={() => setDetailEmployee(emp)}
                    />
                    <div className="w-full flex items-center justify-between px-1">
                      <div className="flex items-center gap-1">
                        {emp.employeeType && (
                          <span className={`text-[10px] font-semibold ${EMPLOYEE_TYPE_COLORS[emp.employeeType] ?? 'text-muted-foreground'}`}>
                            [{EMPLOYEE_TYPE_LABELS[emp.employeeType] ?? emp.employeeType}]
                          </span>
                        )}
                        <span className={`text-[10px] font-medium ${ACTIVITY_COLORS[emp.activity]}`}>
                          {ACTIVITY_LABELS[emp.activity]}
                          {emp.onVacation && ` (${emp.vacationDaysLeft}d)`}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {emp.isPlayer ? 'Founder' : `$${emp.monthlySalary.toLocaleString()}/mo`}
                      </span>
                    </div>
                  </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-48">
                  <ContextMenuGroup>
                    <ContextMenuLabel>{emp.name}</ContextMenuLabel>
                  </ContextMenuGroup>
                  <ContextMenuSeparator />

                  <ContextMenuCheckboxItem
                    checked={emp.autoAssign}
                    disabled={emp.onVacation}
                    onCheckedChange={() => setEmployeeAutoAssign(emp.id)}
                  >
                    <Zap className="h-3.5 w-3.5 mr-1" />
                    Auto-Assign
                  </ContextMenuCheckboxItem>

                  <ContextMenuSeparator />

                  <ContextMenuGroup>
                    <ContextMenuLabel>Assign To</ContextMenuLabel>
                    <ContextMenuItem
                      disabled={emp.onVacation}
                      onClick={() => assignEmployee(emp.id, 'bugfix')}
                    >
                      <Bug className="h-3.5 w-3.5 mr-1" />
                      Bug Fixing
                      {!emp.autoAssign && emp.assignedTaskId === 'bugfix' && (
                        <span className="ml-auto text-[10px] text-muted-foreground">&bull;</span>
                      )}
                    </ContextMenuItem>

                    {activeTasks.length > 0 && (
                      <ContextMenuSub>
                        <ContextMenuSubTrigger>
                          Tasks
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent>
                          {activeTasks.map((t) => (
                            <ContextMenuItem
                              key={t.id}
                              disabled={emp.onVacation}
                              onClick={() => assignEmployee(emp.id, t.id)}
                            >
                              {t.name}
                              {!emp.autoAssign && emp.assignedTaskId === t.id && (
                                <span className="ml-auto text-[10px] text-muted-foreground">&bull;</span>
                              )}
                            </ContextMenuItem>
                          ))}
                        </ContextMenuSubContent>
                      </ContextMenuSub>
                    )}
                  </ContextMenuGroup>

                  <ContextMenuSeparator />

                  <ContextMenuItem
                    disabled={emp.onVacation || emp.stamina >= 95}
                    onClick={() => sendOnVacation(emp.id)}
                  >
                    <Palmtree className="h-3.5 w-3.5 mr-1" />
                    Send on Vacation
                  </ContextMenuItem>

                  {!emp.isPlayer && (
                    <>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        variant="destructive"
                        onClick={() => fireEmployee(emp.id)}
                      >
                        <UserMinus className="h-3.5 w-3.5 mr-1" />
                        Fire Employee
                      </ContextMenuItem>
                    </>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            ))}

            {/* Empty slot placeholders */}
            {Array.from({ length: emptySlots }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="employee-card--empty"
                style={{ width: 160, height: 240 }}
              >
                <Plus className="h-8 w-8" />
                <span className="text-xs">Open Slot</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <EmployeeDetailModal
        employee={detailEmployee}
        open={detailEmployee !== null}
        onOpenChange={(open) => { if (!open) setDetailEmployee(null); }}
      />

      {/* Unique Collection Modal */}
      <UniqueCollectionModal
        open={collectionOpen}
        onOpenChange={setCollectionOpen}
      />
    </div>
  );
}
