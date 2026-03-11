'use client';

import type { Employee, EmployeeActivity } from '@/lib/game/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ACTIVITY_COLORS: Record<EmployeeActivity, string> = {
  developing: 'bg-green-500',
  researching: 'bg-blue-500',
  bugfixing: 'bg-red-500',
  testing: 'bg-yellow-500',
  idle: 'bg-gray-400',
  vacation: 'bg-purple-400',
};

const ACTIVITY_LABELS: Record<EmployeeActivity, string> = {
  developing: 'Developing',
  researching: 'Researching',
  bugfixing: 'Bug Fixing',
  testing: 'Testing',
  idle: 'Idle',
  vacation: 'On Vacation',
};

function StaminaBar({ stamina }: { stamina: number }) {
  const color =
    stamina >= 60 ? 'bg-green-500' : stamina >= 30 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all`}
        style={{ width: `${stamina}%` }}
      />
    </div>
  );
}

interface EmployeeDotProps {
  employee: Employee;
}

export default function EmployeeDot({ employee }: EmployeeDotProps) {
  const colorClass = ACTIVITY_COLORS[employee.activity];
  const isVacation = employee.activity === 'vacation';

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          className="w-full h-full flex items-center justify-center cursor-default"
        >
          <div className="relative">
            <div
              className={`w-5 h-5 rounded-full ${colorClass} border-2 border-background shadow-sm ${
                isVacation ? 'opacity-50' : ''
              }`}
            />
            {isVacation && (
              <span className="absolute -top-2.5 -right-2 text-[9px] font-bold text-purple-400">
                zzz
              </span>
            )}
            {employee.activity === 'developing' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs space-y-1.5 min-w-[140px]">
          <div className="font-semibold">{employee.name}</div>
          <div className="text-muted-foreground">{employee.title}</div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${colorClass}`}
            />
            <span>{ACTIVITY_LABELS[employee.activity]}</span>
            {isVacation && employee.vacationDaysLeft > 0 && (
              <span className="text-muted-foreground">
                ({employee.vacationDaysLeft}d left)
              </span>
            )}
          </div>
          <StaminaBar stamina={employee.stamina} />
          <div className="text-[10px] text-muted-foreground">
            Stamina: {Math.round(employee.stamina)}%
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
