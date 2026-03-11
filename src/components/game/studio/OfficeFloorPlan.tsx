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

function CellRenderer({ cell, employee, furnitureInfo }: {
  cell: GridCell;
  employee: ReturnType<typeof useGameStore.getState>['employees'][number] | null;
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
        <DoorOpen className="w-3.5 h-3.5 text-amber-700/60" />
      </div>
    );
  }

  if (cell.type === 'desk') {
    return (
      <div className="w-full h-full bg-amber-100/50 dark:bg-amber-900/20 border border-amber-300/40 dark:border-amber-700/30 flex items-center justify-center rounded-sm">
        {employee ? (
          <EmployeeDot employee={employee} />
        ) : (
          <User className="w-3.5 h-3.5 text-muted-foreground/30" />
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
                <IconComp className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
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
        <div className="w-2 h-2 rounded bg-muted-foreground/10" />
      </div>
    );
  }

  // floor
  return <div className="w-full h-full bg-muted/30" />;
}

export default function OfficeFloorPlan() {
  const officeTier = useGameStore((s) => s.office.tier);
  const employees = useGameStore((s) => s.employees);
  const furniture = useGameStore((s) => s.furniture);

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
          gridTemplateColumns: `repeat(${layout.cols}, 36px)`,
          gridTemplateRows: `repeat(${layout.rows}, 36px)`,
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

            return (
              <div key={`${r}-${c}`} className="w-[36px] h-[36px]">
                <CellRenderer cell={cell} employee={employee} furnitureInfo={furnitureInfo} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
