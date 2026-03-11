'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { getOfficeLayout, getFurnitureDef, type GridCell } from '@/lib/config/furnitureConfig';
import { OFFICE_CONFIG } from '@/lib/config/officeConfig';
import EmployeeDot from './EmployeeDot';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import {
  Coffee,
  Leaf,
  PenLine,
  Dumbbell,
  Cookie,
  MonitorUp,
  Server,
  FlaskConical,
  DoorOpen,
  User,
  Zap,
  Bug,
  Palmtree,
  UserMinus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Employee, StudioTask } from '@/lib/game/types';

const CELL_SIZE = 56;

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

function CellRenderer({ cell, employee, furnitureInfo }: {
  cell: GridCell;
  employee: Employee | null;
  furnitureInfo: { name: string; icon: string; description: string } | null;
}) {
  if (cell.type === 'wall') {
    return (
      <div className="w-full h-full bg-muted-foreground/20 border border-muted-foreground/10" />
    );
  }

  if (cell.type === 'door') {
    return (
      <div className="w-full h-full bg-amber-900/30 flex items-center justify-center border border-amber-900/20">
        <DoorOpen className="w-4 h-4 text-amber-700/60" />
      </div>
    );
  }

  if (cell.type === 'desk') {
    return (
      <div className="w-full h-full bg-amber-100/50 dark:bg-amber-900/20 border border-amber-300/40 dark:border-amber-700/30 flex items-center justify-center rounded-sm">
        {employee ? (
          <EmployeeDot employee={employee} />
        ) : (
          <User className="w-4 h-4 text-muted-foreground/30" />
        )}
      </div>
    );
  }

  if (cell.type === 'furniture-slot') {
    if (furnitureInfo) {
      const IconComp = ICON_MAP[furnitureInfo.icon];
      return (
        <TooltipProvider delay={200}>
          <Tooltip>
            <TooltipTrigger
              className="w-full h-full bg-sky-100/50 dark:bg-sky-900/20 border border-sky-300/40 dark:border-sky-700/30 flex items-center justify-center rounded-sm cursor-default"
            >
              {IconComp ? (
                <IconComp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              ) : (
                <div className="w-3 h-3 rounded bg-sky-400/60" />
              )}
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <div className="font-semibold">{furnitureInfo.name}</div>
              <div className="text-muted-foreground">{furnitureInfo.description}</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <div className="w-full h-full border border-dashed border-muted-foreground/20 flex items-center justify-center rounded-sm">
        <div className="w-2.5 h-2.5 rounded bg-muted-foreground/10" />
      </div>
    );
  }

  // floor
  return <div className="w-full h-full bg-muted/30" />;
}

function EmployeeDeskContextMenu({ employee, activeTasks, children }: {
  employee: Employee;
  activeTasks: StudioTask[];
  children: React.ReactNode;
}) {
  const assignEmployee = useGameStore((s) => s.assignEmployee);
  const setEmployeeAutoAssign = useGameStore((s) => s.setEmployeeAutoAssign);
  const sendOnVacation = useGameStore((s) => s.sendOnVacation);
  const fireEmployee = useGameStore((s) => s.fireEmployee);

  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full h-full">
        {children}
      </ContextMenuTrigger>

      <ContextMenuContent className="w-48">
        <ContextMenuGroup>
          <ContextMenuLabel>{employee.name}</ContextMenuLabel>
        </ContextMenuGroup>
        <ContextMenuSeparator />

        <ContextMenuCheckboxItem
          checked={employee.autoAssign}
          disabled={employee.onVacation}
          onCheckedChange={() => setEmployeeAutoAssign(employee.id)}
        >
          <Zap className="h-3.5 w-3.5 mr-1" />
          Auto-Assign
        </ContextMenuCheckboxItem>

        <ContextMenuSeparator />

        <ContextMenuGroup>
          <ContextMenuLabel>Assign To</ContextMenuLabel>
          <ContextMenuItem
            disabled={employee.onVacation}
            onClick={() => assignEmployee(employee.id, 'bugfix')}
          >
            <Bug className="h-3.5 w-3.5 mr-1" />
            Bug Fixing
            {!employee.autoAssign && employee.assignedTaskId === 'bugfix' && (
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
                    disabled={employee.onVacation}
                    onClick={() => assignEmployee(employee.id, t.id)}
                  >
                    {t.name}
                    {!employee.autoAssign && employee.assignedTaskId === t.id && (
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
          disabled={employee.onVacation || employee.stamina >= 95}
          onClick={() => sendOnVacation(employee.id)}
        >
          <Palmtree className="h-3.5 w-3.5 mr-1" />
          Send on Vacation
        </ContextMenuItem>

        {!employee.isPlayer && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onClick={() => fireEmployee(employee.id)}
            >
              <UserMinus className="h-3.5 w-3.5 mr-1" />
              Fire Employee
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default function OfficeFloorPlan() {
  const officeTier = useGameStore((s) => s.office.tier);
  const employees = useGameStore((s) => s.employees);
  const furniture = useGameStore((s) => s.furniture);
  const activeTasks = useGameStore((s) => s.activeTasks);

  const layout = useMemo(() => getOfficeLayout(officeTier), [officeTier]);
  const tierDef = OFFICE_CONFIG.tiers.find((t) => t.tier === officeTier);

  const furnitureSlotMap = useMemo(() => {
    const map: Record<number, { name: string; icon: string; description: string }> = {};
    let slotIdx = 0;
    for (const owned of furniture) {
      const def = getFurnitureDef(owned.definitionId);
      if (!def) continue;
      map[slotIdx] = { name: def.name, icon: def.icon, description: def.description };
      slotIdx++;
    }
    return map;
  }, [furniture]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{tierDef?.name ?? 'Office'}</h3>
          <p className="text-xs text-muted-foreground">
            {employees.length}/{layout.deskCount} desks occupied
            {layout.furnitureSlotCount > 0 && (
              <> &middot; {furniture.length}/{layout.furnitureSlotCount} furniture slots</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Dev</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Research</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Bugfix</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Test</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> Idle</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" /> Vacation</span>
        </div>
      </div>

      <div
        className="inline-grid gap-px bg-muted/50 rounded-lg p-1 border border-border"
        style={{
          gridTemplateColumns: `repeat(${layout.cols}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${layout.rows}, ${CELL_SIZE}px)`,
        }}
      >
        {layout.cells.flatMap((row, r) =>
          row.map((cell, c) => {
            const employee =
              cell.type === 'desk' && cell.deskIndex !== undefined && cell.deskIndex < employees.length
                ? employees[cell.deskIndex]
                : null;

            const furnitureInfo =
              cell.type === 'furniture-slot' && cell.furnitureSlotIndex !== undefined
                ? furnitureSlotMap[cell.furnitureSlotIndex] ?? null
                : null;

            const cellContent = (
              <CellRenderer cell={cell} employee={employee} furnitureInfo={furnitureInfo} />
            );

            if (cell.type === 'desk' && employee) {
              return (
                <div key={`${r}-${c}`} style={{ width: CELL_SIZE, height: CELL_SIZE }}>
                  <EmployeeDeskContextMenu employee={employee} activeTasks={activeTasks}>
                    {cellContent}
                  </EmployeeDeskContextMenu>
                </div>
              );
            }

            return (
              <div key={`${r}-${c}`} style={{ width: CELL_SIZE, height: CELL_SIZE }}>
                {cellContent}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
