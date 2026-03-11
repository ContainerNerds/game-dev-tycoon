'use client';

import type { Employee, EmployeeActivity } from '@/lib/game/types';
import { RARITY_TIERS } from '@/lib/config/rarityConfig';
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

const ACTIVITY_TEXT_COLORS: Record<EmployeeActivity, string> = {
  developing: 'text-green-500',
  researching: 'text-blue-500',
  bugfixing: 'text-red-500',
  testing: 'text-yellow-500',
  idle: 'text-muted-foreground',
  vacation: 'text-purple-400',
};

const ACTIVITY_SHORT: Record<EmployeeActivity, string> = {
  developing: 'Dev',
  researching: 'Res',
  bugfixing: 'Bug',
  testing: 'Test',
  idle: 'Idle',
  vacation: 'Vac',
};

const ACTIVITY_LABELS: Record<EmployeeActivity, string> = {
  developing: 'Developing',
  researching: 'Researching',
  bugfixing: 'Bug Fixing',
  testing: 'Testing',
  idle: 'Idle',
  vacation: 'On Vacation',
};

interface EmployeeDotProps {
  employee: Employee;
}

export default function EmployeeDot({ employee }: EmployeeDotProps) {
  const rarity = RARITY_TIERS[employee.rarity];
  const activityBg = ACTIVITY_COLORS[employee.activity];
  const activityText = ACTIVITY_TEXT_COLORS[employee.activity];
  const isVacation = employee.activity === 'vacation';
  const staminaColor =
    employee.stamina >= 60 ? 'bg-green-500' : employee.stamina >= 30 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          className="w-full h-full flex items-center justify-center cursor-default"
        >
          <div className={`relative w-full h-full flex flex-col justify-between p-1 overflow-hidden ${
            isVacation ? 'opacity-50' : ''
          }`}>
            {/* Name — rarity colored */}
            <div className={`text-[9px] font-bold leading-tight truncate ${rarity.textColor}`}>
              {employee.name}
            </div>

            {/* Activity dot + short label */}
            <div className="flex items-center gap-0.5">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activityBg}`} />
              <span className={`text-[8px] font-medium leading-none ${activityText}`}>
                {ACTIVITY_SHORT[employee.activity]}
              </span>
            </div>

            {/* Stamina bar */}
            <div className="w-full h-1 bg-muted/60 rounded-full overflow-hidden">
              <div
                className={`h-full ${staminaColor} transition-all`}
                style={{ width: `${employee.stamina}%` }}
              />
            </div>

            {isVacation && (
              <span className="absolute top-0 right-0.5 text-[8px] font-bold text-purple-400">
                zzz
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs space-y-1 min-w-[140px]">
          <div className={`font-semibold ${rarity.textColor}`}>{employee.name}</div>
          <div className="text-muted-foreground">{employee.title}</div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${activityBg}`} />
            <span>{ACTIVITY_LABELS[employee.activity]}</span>
            {isVacation && employee.vacationDaysLeft > 0 && (
              <span className="text-muted-foreground">
                ({employee.vacationDaysLeft}d left)
              </span>
            )}
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${staminaColor} transition-all`}
              style={{ width: `${employee.stamina}%` }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground">
            Stamina: {Math.round(employee.stamina)}%
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
