'use client';

import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/store/gameStore';
import ReleaseModal from '@/components/game/ReleaseModal';
import GameCreationModal from '@/components/game/GameCreationModal';
import { DEV_CATEGORY_LABELS, PHASE_CATEGORIES } from '@/lib/game/types';
import type { PhaseCategories, StudioTask, TaskType } from '@/lib/game/types';
import { Zap, Plus, Rocket, X, FlaskConical } from 'lucide-react';

const TASK_TYPE_COLORS: Record<TaskType, string> = {
  game: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  dlc: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  patch: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  engine: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  research: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
};

function TaskRow({ task, onRelease }: { task: StudioTask; onRelease: (task: StudioTask) => void }) {
  const store = useGameStore;
  const activeGames = store((s) => s.activeGames);
  const maxActiveGames = store((s) => s.maxActiveGames);
  const employees = store((s) => s.employees);
  const servers = store((s) => s.servers);

  const isComplete = task.progressPercent >= 100;
  const assignedCount = employees.filter((e) => e.assignedTaskId === task.id).length;
  const isResearch = task.type === 'research';

  const canReleaseGame = isComplete && task.type === 'game' && activeGames.length < maxActiveGames;
  const canReleaseDLC = isComplete && task.type === 'dlc' && task.targetGameId;
  const needsServers = task.mode === 'liveservice' && servers.length === 0;

  const handleReleaseDLC = () => { store.getState().releaseDLC(task.id); };
  const handleCancel = () => { store.getState().removeTask(task.id); };
  const handleToggleCrunch = () => { store.getState().toggleTaskCrunch(task.id); };

  // Determine which categories to show (based on current phase or all)
  const phase = task.currentPhase;
  const activeCategories = phase ? PHASE_CATEGORIES[phase] : (Object.keys(task.categoryTargets) as (keyof PhaseCategories)[]);
  const hasNonZeroTargets = activeCategories.some((cat) => task.categoryTargets[cat] > 0);

  return (
    <div className="border-b border-border bg-card/50 px-3 sm:px-4 py-1.5 sm:py-2 shrink-0">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <Badge variant="outline" className={`text-xs ${TASK_TYPE_COLORS[task.type]}`}>
              {isResearch ? <><FlaskConical className="h-3 w-3 mr-0.5" />RES</> : task.type.toUpperCase()}
            </Badge>
            <span className="text-xs sm:text-sm font-medium truncate">{task.name}</span>
            {phase && !isResearch && (
              <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-500/50 hidden sm:flex">
                Stage {phase}/3
              </Badge>
            )}
            {task.isCrunching && (
              <Badge variant="outline" className="text-xs text-orange-400 border-orange-500/50 hidden sm:flex">
                <Zap className="h-3 w-3 mr-0.5" />Crunch
              </Badge>
            )}
            <span className="text-xs text-muted-foreground ml-auto shrink-0">
              {assignedCount} staff &middot; {Math.floor(task.progressPercent)}%
            </span>
          </div>
          <Progress value={task.progressPercent} className="h-1.5 mb-1" />

          {/* Category breakdown for non-research tasks */}
          {!isResearch && hasNonZeroTargets && (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              {activeCategories.filter((cat) => task.categoryTargets[cat] > 0).map((cat) => {
                const current = task.categoryProgress[cat];
                const target = task.categoryTargets[cat];
                const done = current >= target;
                return (
                  <span key={cat} className={`text-[10px] sm:text-xs font-mono ${done ? 'text-green-400' : 'text-muted-foreground'}`}>
                    {DEV_CATEGORY_LABELS[cat]}: {Math.floor(current)}/{target}
                  </span>
                );
              })}
            </div>
          )}

          {/* Research progress bar */}
          {isResearch && (
            <div className="text-[10px] sm:text-xs text-muted-foreground font-mono">
              Progress: {Math.floor(task.researchProgress ?? 0)}/{task.researchTarget ?? 100}
            </div>
          )}
        </div>

        <div className="flex gap-1 sm:gap-1.5 shrink-0">
          {!isResearch && (
            <Button size="sm" variant={task.isCrunching ? 'destructive' : 'outline'} className="text-xs h-6 w-6 sm:h-7 sm:w-auto sm:px-2 p-0 cursor-pointer" onClick={handleToggleCrunch}>
              <Zap className="h-3 w-3" />
            </Button>
          )}
          {task.type === 'game' && (
            <Button
              size="sm" className="text-xs h-6 sm:h-7 cursor-pointer px-2"
              disabled={!canReleaseGame || needsServers}
              onClick={() => onRelease(task)}
              title={needsServers ? 'Live Service games need servers' : ''}
            >
              <Rocket className="h-3 w-3 sm:mr-1" /><span className="hidden sm:inline">Release</span>
            </Button>
          )}
          {task.type === 'dlc' && canReleaseDLC && (
            <Button size="sm" className="text-xs h-6 sm:h-7 cursor-pointer px-2" onClick={handleReleaseDLC}>
              <Rocket className="h-3 w-3 sm:mr-1" /><span className="hidden sm:inline">Release DLC</span>
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-xs h-6 w-6 sm:h-7 sm:w-auto p-0 text-red-400 cursor-pointer" onClick={handleCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TaskBar() {
  const activeTasks = useGameStore((s) => s.activeTasks);
  const maxParallelTasks = useGameStore((s) => s.maxParallelTasks);

  const [showNewTask, setShowNewTask] = useState(false);
  const [releaseTask, setReleaseTask] = useState<StudioTask | null>(null);

  const canAddTask = activeTasks.length < maxParallelTasks;

  return (
    <>
      {activeTasks.map((task) => (
        <TaskRow key={task.id} task={task} onRelease={setReleaseTask} />
      ))}

      <ReleaseModal task={releaseTask} open={releaseTask !== null} onClose={() => setReleaseTask(null)} />

      {canAddTask && (
        <div className="border-b border-border bg-card/30 px-4 py-1.5 shrink-0">
          <Button size="sm" variant="outline" className="text-xs cursor-pointer" onClick={() => setShowNewTask(true)}>
            <Plus className="h-3 w-3 mr-1" />
            New Task ({activeTasks.length}/{maxParallelTasks})
          </Button>
        </div>
      )}

      <GameCreationModal
        open={showNewTask}
        onOpenChange={setShowNewTask}
        onCreated={() => setShowNewTask(false)}
        showTaskTypeSelector
      />
    </>
  );
}
