'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { getOfficeLayout, getFurnitureDef, type GridCell } from '@/lib/config/furnitureConfig';
import { OFFICE_CONFIG } from '@/lib/config/officeConfig';
import EmployeeDot from './EmployeeDot';
import { Button } from '@/components/ui/button';
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
  Plus,
  Minus,
  Maximize2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Employee, StudioTask } from '@/lib/game/types';

const BASE_CELL = 56;
const MIN_CELL = 36;
const MAX_CELL = 80;
const ZOOM_STEP = 8;
const GRID_PADDING = 8; // p-1 = 4px each side

const ICON_MAP: Record<string, LucideIcon> = {
  Coffee, Leaf, PenLine, Dumbbell, Cookie, MonitorUp, Server, FlaskConical,
};

function getWallCornerClass(row: number, col: number, rows: number, cols: number): string {
  if (row === 0 && col === 0) return 'rounded-tl-md';
  if (row === 0 && col === cols - 1) return 'rounded-tr-md';
  if (row === rows - 1 && col === 0) return 'rounded-bl-md';
  if (row === rows - 1 && col === cols - 1) return 'rounded-br-md';
  return '';
}

function CellRenderer({ cell, employee, furnitureInfo, row, col, rows, cols }: {
  cell: GridCell;
  employee: Employee | null;
  furnitureInfo: { name: string; icon: string; description: string } | null;
  row: number;
  col: number;
  rows: number;
  cols: number;
}) {
  if (cell.type === 'wall') {
    const corner = getWallCornerClass(row, col, rows, cols);
    return (
      <div className={`w-full h-full bg-muted-foreground/30 border border-muted-foreground/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)] ${corner}`} />
    );
  }

  if (cell.type === 'door') {
    return (
      <div className="w-full h-full bg-amber-900/30 flex items-center justify-center border border-amber-900/20 shadow-[inset_0_-1px_3px_rgba(0,0,0,0.2)]">
        <DoorOpen className="w-4 h-4 text-amber-600/70" />
      </div>
    );
  }

  if (cell.type === 'desk') {
    return (
      <div className="w-full h-full bg-amber-950/25 border border-amber-700/25 flex items-center justify-center rounded-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]">
        {employee ? (
          <EmployeeDot employee={employee} />
        ) : (
          <User className="w-4 h-4 text-muted-foreground/20" />
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
              className="w-full h-full bg-sky-900/20 border border-sky-500/25 flex items-center justify-center rounded-sm cursor-default shadow-[inset_0_0_8px_rgba(56,189,248,0.08)]"
            >
              {IconComp ? (
                <IconComp className="w-5 h-5 text-sky-400" />
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
      <div className="w-full h-full border border-dashed border-muted-foreground/15 flex items-center justify-center rounded-sm">
        <Plus className="w-3 h-3 text-muted-foreground/20" />
      </div>
    );
  }

  const checkerboard = (row + col) % 2 === 0 ? 'bg-muted/20' : 'bg-muted/30';
  return <div className={`w-full h-full ${checkerboard}`} />;
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

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoomDelta, setZoomDelta] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  const autoCell = containerWidth > 0
    ? Math.floor((containerWidth - GRID_PADDING * 2 - layout.cols) / layout.cols)
    : BASE_CELL;

  const cellSize = Math.max(MIN_CELL, Math.min(MAX_CELL, autoCell + zoomDelta));
  const zoomPercent = Math.round((cellSize / BASE_CELL) * 100);

  const handleZoomIn = useCallback(() => setZoomDelta((d) => Math.min(d + ZOOM_STEP, MAX_CELL - MIN_CELL)), []);
  const handleZoomOut = useCallback(() => setZoomDelta((d) => Math.max(d - ZOOM_STEP, -(MAX_CELL - MIN_CELL))), []);
  const handleFit = useCallback(() => setZoomDelta(0), []);

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
    <div className="space-y-3" ref={containerRef}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold">{tierDef?.name ?? 'Office'}</h3>
          <p className="text-xs text-muted-foreground">
            {employees.length}/{layout.deskCount} desks occupied
            {layout.furnitureSlotCount > 0 && (
              <> &middot; {furniture.length}/{layout.furnitureSlotCount} furniture slots</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Dev</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Research</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Bugfix</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Test</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" /> Idle</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400" /> Vacation</span>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="h-6 w-6 p-0 cursor-pointer" onClick={handleZoomOut} title="Zoom out">
          <Minus className="w-3 h-3" />
        </Button>
        <span className="text-[11px] font-mono text-muted-foreground w-10 text-center">{zoomPercent}%</span>
        <Button variant="outline" size="sm" className="h-6 w-6 p-0 cursor-pointer" onClick={handleZoomIn} title="Zoom in">
          <Plus className="w-3 h-3" />
        </Button>
        <Button variant="outline" size="sm" className="h-6 px-2 text-[10px] cursor-pointer" onClick={handleFit} title="Fit to container">
          <Maximize2 className="w-3 h-3 mr-1" /> Fit
        </Button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div
          className="inline-grid gap-px bg-muted/50 rounded-lg border border-border"
          style={{
            gridTemplateColumns: `repeat(${layout.cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${layout.rows}, ${cellSize}px)`,
            padding: `${GRID_PADDING}px`,
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
                <CellRenderer
                  cell={cell}
                  employee={employee}
                  furnitureInfo={furnitureInfo}
                  row={r}
                  col={c}
                  rows={layout.rows}
                  cols={layout.cols}
                />
              );

              if (cell.type === 'desk' && employee) {
                return (
                  <div key={`${r}-${c}`} style={{ width: cellSize, height: cellSize }}>
                    <EmployeeDeskContextMenu employee={employee} activeTasks={activeTasks}>
                      {cellContent}
                    </EmployeeDeskContextMenu>
                  </div>
                );
              }

              return (
                <div key={`${r}-${c}`} style={{ width: cellSize, height: cellSize }}>
                  {cellContent}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
