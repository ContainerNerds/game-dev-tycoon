'use client';

import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useGameStore } from '@/lib/store/gameStore';
import { convertTaskToActiveGame } from '@/lib/game/developmentSystem';
import { ALL_GENRES, ALL_STYLES, getComboMultiplier } from '@/lib/config/genreStyleConfig';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { randomGameName } from '@/lib/config/nameConfig';
import type { Genre, Style, GameMode, PillarWeights, StudioTask, TaskType } from '@/lib/game/types';
import {
  Zap, Paintbrush, Gamepad2, Volume2, Sparkles, Plus, Shuffle, Rocket,
  Archive, X,
} from 'lucide-react';

const PILLAR_CONFIG = [
  { key: 'graphics' as const, label: 'Gfx', icon: Paintbrush, color: 'text-pink-400' },
  { key: 'gameplay' as const, label: 'Game', icon: Gamepad2, color: 'text-blue-400' },
  { key: 'sound' as const, label: 'Snd', icon: Volume2, color: 'text-green-400' },
  { key: 'polish' as const, label: 'Pol', icon: Sparkles, color: 'text-yellow-400' },
];

const TASK_TYPE_COLORS: Record<TaskType, string> = {
  game: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  dlc: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  patch: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
};

function TaskRow({ task }: { task: StudioTask }) {
  const store = useGameStore;
  const activeGames = store((s) => s.activeGames);
  const maxActiveGames = store((s) => s.maxActiveGames);
  const employees = store((s) => s.employees);
  const servers = store((s) => s.servers);

  const isComplete = task.progressPercent >= 100;
  const assignedCount = employees.filter((e) => e.assignedTaskId === task.id).length;

  const canRelease = isComplete && task.type === 'game' && activeGames.length < maxActiveGames;
  const needsServers = task.mode === 'liveservice' && servers.length === 0;

  const handleRelease = () => {
    if (task.type === 'game') {
      const state = store.getState();
      const activeGame = convertTaskToActiveGame(task, state);
      state.releaseGame(task.id, activeGame);
    }
  };

  const handleCancel = () => {
    store.getState().removeTask(task.id);
  };

  const handleToggleCrunch = () => {
    store.getState().toggleTaskCrunch(task.id);
  };

  return (
    <div className="border-b border-border bg-card/50 px-4 py-2 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`text-xs ${TASK_TYPE_COLORS[task.type]}`}>
              {task.type.toUpperCase()}
            </Badge>
            <span className="text-sm font-medium truncate">{task.name}</span>
            {task.isCrunching && (
              <Badge variant="outline" className="text-xs text-orange-400 border-orange-500/50">
                <Zap className="h-3 w-3 mr-0.5" />Crunch
              </Badge>
            )}
            <span className="text-xs text-muted-foreground ml-auto shrink-0">
              {assignedCount} staff &middot; {Math.floor(task.progressPercent)}%
            </span>
          </div>
          <Progress value={task.progressPercent} className="h-1.5 mb-1" />
          <div className="grid grid-cols-4 gap-2">
            {PILLAR_CONFIG.map(({ key, label, icon: Icon, color }) => {
              const current = task.pillarProgress[key];
              const target = task.pillarTargets[key];
              const pct = target > 0 ? Math.min(100, (current / target) * 100) : 100;
              return (
                <div key={key} className="flex items-center gap-1 text-xs">
                  <Icon className={`h-3 w-3 ${current >= target ? 'text-green-400' : color}`} />
                  <span className="font-mono text-muted-foreground">{Math.floor(current)}/{target}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-1.5 shrink-0">
          <Button size="sm" variant={task.isCrunching ? 'destructive' : 'outline'} className="text-xs h-7 cursor-pointer" onClick={handleToggleCrunch}>
            <Zap className="h-3 w-3" />
          </Button>
          {task.type === 'game' && (
            <Button
              size="sm" className="text-xs h-7 cursor-pointer"
              disabled={!canRelease || needsServers}
              onClick={handleRelease}
              title={needsServers ? 'Live Service games need servers' : ''}
            >
              <Rocket className="h-3 w-3 mr-1" />Release
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-xs h-7 text-red-400 cursor-pointer" onClick={handleCancel}>
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
  const activeGames = useGameStore((s) => s.activeGames);
  const addTask = useGameStore((s) => s.addTask);

  const [showNewTask, setShowNewTask] = useState(false);
  const [taskType, setTaskType] = useState<TaskType>('game');
  const [gameName, setGameName] = useState(randomGameName);
  const [genre, setGenre] = useState<Genre>('RPG');
  const [style, setStyle] = useState<Style>('Fantasy');
  const [gameMode, setGameMode] = useState<GameMode>('standard');
  const [targetGameId, setTargetGameId] = useState('');
  const [pillars, setPillars] = useState<PillarWeights>({ graphics: 25, gameplay: 25, sound: 25, polish: 25 });

  const canAddTask = activeTasks.length < maxParallelTasks;

  const handlePillarChange = (key: keyof PillarWeights, newValue: number) => {
    const others = Object.keys(pillars).filter((k) => k !== key) as (keyof PillarWeights)[];
    const remaining = 100 - newValue;
    const oldOthersTotal = others.reduce((sum, k) => sum + pillars[k], 0);
    const newPillars = { ...pillars, [key]: newValue };
    if (oldOthersTotal > 0) {
      for (const k of others) newPillars[k] = Math.round((pillars[k] / oldOthersTotal) * remaining);
      const total = Object.values(newPillars).reduce((a, b) => a + b, 0);
      if (total !== 100) newPillars[others[0]] += 100 - total;
    } else {
      const each = Math.floor(remaining / others.length);
      for (const k of others) newPillars[k] = each;
      newPillars[others[0]] += remaining - each * others.length;
    }
    setPillars(newPillars);
  };

  const handleCreate = () => {
    const baseComplexity = taskType === 'game' ? 100 : taskType === 'dlc' ? 60 : 30;
    const task: StudioTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: taskType,
      name: gameName,
      targetGameId: taskType !== 'game' ? (targetGameId || null) : null,
      pillarProgress: { graphics: 0, gameplay: 0, sound: 0, polish: 0 },
      pillarTargets: {
        graphics: Math.round((pillars.graphics / 100) * baseComplexity),
        gameplay: Math.round((pillars.gameplay / 100) * baseComplexity),
        sound: Math.round((pillars.sound / 100) * baseComplexity),
        polish: Math.round((pillars.polish / 100) * baseComplexity),
      },
      progressPercent: 0,
      bugsFound: 0,
      assignedEmployeeIds: [],
      autoAssign: true,
      isCrunching: false,
      ...(taskType === 'game' ? {
        genre, style, mode: gameMode, platforms: ['PC'] as const,
        pillarWeights: { ...pillars }, devCostSpent: 0,
      } : {}),
    };
    addTask(task);
    setShowNewTask(false);
    setGameName(randomGameName());
  };

  const comboMultiplier = taskType === 'game' ? getComboMultiplier(genre, style) : 0;

  return (
    <>
      {activeTasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}

      {canAddTask && (
        <div className="border-b border-border bg-card/30 px-4 py-1.5 shrink-0">
          <Button size="sm" variant="outline" className="text-xs cursor-pointer" onClick={() => setShowNewTask(true)}>
            <Plus className="h-3 w-3 mr-1" />
            New Task ({activeTasks.length}/{maxParallelTasks})
          </Button>
        </div>
      )}

      <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>Start a new game, DLC, or patch cycle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              {(['game', 'dlc', 'patch'] as TaskType[]).map((t) => (
                <Button key={t} size="sm" variant={taskType === t ? 'default' : 'outline'}
                  className="flex-1 text-xs cursor-pointer capitalize" onClick={() => setTaskType(t)}>
                  {t}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <div className="flex gap-2">
                <Input value={gameName} onChange={(e) => setGameName(e.target.value)} className="flex-1 h-8 text-sm" />
                <Button size="sm" variant="outline" className="h-8 w-8 p-0 cursor-pointer" onClick={() => setGameName(randomGameName())}>
                  <Shuffle className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {taskType !== 'game' && activeGames.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Target Game</Label>
                <Select value={targetGameId} onValueChange={(v) => setTargetGameId(v ?? '')}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select game..." /></SelectTrigger>
                  <SelectContent>
                    {activeGames.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {taskType === 'game' && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Genre</Label>
                    <Select value={genre} onValueChange={(v) => setGenre(v as Genre)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{ALL_GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Style</Label>
                    <Select value={style} onValueChange={(v) => setStyle(v as Style)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{ALL_STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Mode</Label>
                    <div className="flex gap-1">
                      <Button size="sm" variant={gameMode === 'standard' ? 'default' : 'outline'} className="flex-1 h-8 text-xs cursor-pointer" onClick={() => setGameMode('standard')}>Std</Button>
                      <Button size="sm" variant={gameMode === 'liveservice' ? 'default' : 'outline'} className="flex-1 h-8 text-xs cursor-pointer" onClick={() => setGameMode('liveservice')}>Live</Button>
                    </div>
                  </div>
                </div>
                {comboMultiplier > 0 && (
                  <p className={`text-xs text-center ${comboMultiplier >= 2 ? 'text-green-400' : comboMultiplier >= 1.5 ? 'text-blue-400' : 'text-muted-foreground'}`}>
                    {genre} + {style} ({comboMultiplier}x)
                  </p>
                )}
              </>
            )}

            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(pillars) as (keyof PillarWeights)[]).map((key) => (
                <div key={key} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{key}</span>
                    <span className="font-mono">{pillars[key]}%</span>
                  </div>
                  <Slider value={[pillars[key]]} onValueChange={(val) => handlePillarChange(key, Array.isArray(val) ? val[0] : val)} min={0} max={100} step={5} className="cursor-pointer" />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setShowNewTask(false)}>Cancel</Button>
            <Button className="cursor-pointer" disabled={!gameName.trim()} onClick={handleCreate}>Start</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
