'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useGameStore } from '@/lib/store/gameStore';
import { ALL_GENRES, ALL_TOPICS, getComboMultiplier } from '@/lib/config/genreStyleConfig';
import { GAME_SIZE_CONFIG, ALL_GAME_SIZES, ALL_GAME_RATINGS } from '@/lib/config/gameSizeConfig';
import { getEngineDevPointsAdded, getEngineTotalBenefit, getFeatureDef } from '@/lib/config/engineFeaturesConfig';
import { randomGameName } from '@/lib/config/nameConfig';
import {
  zeroCategoryMap,
  DEV_CATEGORY_LABELS,
  PHASE_CATEGORIES,
} from '@/lib/game/types';
import type {
  Genre, Topic, GameMode, GameSize, GameRating,
  PhaseCategories, StudioTask, DevPhase, TaskType,
} from '@/lib/game/types';
import { Shuffle, ChevronLeft, ChevronRight, Cpu } from 'lucide-react';

interface GameCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  showTaskTypeSelector?: boolean;
}

const STEPS = ['Basics', 'Engine', 'Dev Focus', 'Summary'] as const;
type Step = (typeof STEPS)[number];

const DEFAULT_STAGE_WEIGHTS: Record<DevPhase, Record<string, number>> = {
  1: { engine: 33, gameplay: 34, storyQuests: 33 },
  2: { dialogues: 33, levelDesign: 34, ai: 33 },
  3: { worldDesign: 33, graphics: 34, sound: 33 },
};

export default function GameCreationModal({ open, onOpenChange, onCreated, showTaskTypeSelector }: GameCreationModalProps) {
  const engines = useGameStore((s) => s.engines);
  const money = useGameStore((s) => s.money);
  const activeGames = useGameStore((s) => s.activeGames);
  const addTask = useGameStore((s) => s.addTask);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const calendar = useGameStore((s) => s.calendar);

  const [step, setStep] = useState<number>(0);
  const [taskType, setTaskType] = useState<TaskType>('game');

  // Basics
  const [gameName, setGameName] = useState(randomGameName);
  const [genre, setGenre] = useState<Genre>('RPG');
  const [topic, setTopic] = useState<Topic>('Fantasy');
  const [gameMode, setGameMode] = useState<GameMode>('standard');
  const [gameSize, setGameSize] = useState<GameSize>('small');
  const [gameRating, setGameRating] = useState<GameRating>('E');
  const [targetGameId, setTargetGameId] = useState('');

  // Engine
  const [selectedEngineId, setSelectedEngineId] = useState<string>('none');

  // Stage weights (9 categories across 3 stages)
  const [stageWeights, setStageWeights] = useState<PhaseCategories>({
    engine: 33, gameplay: 34, storyQuests: 33,
    dialogues: 33, levelDesign: 34, ai: 33,
    worldDesign: 33, graphics: 34, sound: 33,
  });

  const currentSizeDef = GAME_SIZE_CONFIG[gameSize];
  const comboMultiplier = getComboMultiplier(genre, topic);
  const selectedEngine = selectedEngineId !== 'none' ? engines.find((e) => e.id === selectedEngineId) : null;

  const enginePointsAdded = useMemo(() => {
    if (!selectedEngine) return zeroCategoryMap();
    return getEngineDevPointsAdded(selectedEngine.features);
  }, [selectedEngine]);

  const categoryTargets = useMemo(() => {
    const baseComplexity = taskType === 'game' ? currentSizeDef.baseComplexity : taskType === 'dlc' ? 60 : 30;
    const targets = zeroCategoryMap();
    for (const phase of [1, 2, 3] as DevPhase[]) {
      const cats = PHASE_CATEGORIES[phase];
      for (const cat of cats) {
        const weight = stageWeights[cat] / 100;
        targets[cat] = Math.round(baseComplexity * weight) + enginePointsAdded[cat];
      }
    }
    return targets;
  }, [taskType, currentSizeDef.baseComplexity, stageWeights, enginePointsAdded]);

  const totalPoints = useMemo(() => {
    return Object.values(categoryTargets).reduce((s, v) => s + v, 0);
  }, [categoryTargets]);

  const handleStageSliderChange = (phase: DevPhase, category: keyof PhaseCategories, newValue: number) => {
    const cats = PHASE_CATEGORIES[phase];
    const others = cats.filter((c) => c !== category);
    const remaining = 100 - newValue;
    const oldOthersTotal = others.reduce((sum, k) => sum + stageWeights[k], 0);

    const newWeights = { ...stageWeights, [category]: newValue };
    if (oldOthersTotal > 0) {
      for (const k of others) newWeights[k] = Math.round((stageWeights[k] / oldOthersTotal) * remaining);
      const stageTotal = cats.reduce((sum, c) => sum + newWeights[c], 0);
      if (stageTotal !== 100) newWeights[others[0]] += 100 - stageTotal;
    } else {
      const each = Math.floor(remaining / others.length);
      for (const k of others) newWeights[k] = each;
      newWeights[others[0]] += remaining - each * others.length;
    }
    setStageWeights(newWeights);
  };

  const canAfford = taskType !== 'game' || money >= currentSizeDef.cost;

  const handleCreate = () => {
    const baseComplexity = taskType === 'game' ? currentSizeDef.baseComplexity : taskType === 'dlc' ? 60 : 30;
    const devDaysTarget = taskType === 'game'
      ? Math.round((currentSizeDef.devMonthsMin + currentSizeDef.devMonthsMax) / 2 * 30)
      : taskType === 'dlc' ? 60 : 30;

    if (taskType === 'game' && !spendMoney(currentSizeDef.cost)) return;

    const task: StudioTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: taskType,
      name: gameName,
      targetGameId: taskType !== 'game' ? (targetGameId || null) : null,
      categoryProgress: zeroCategoryMap(),
      categoryTargets: { ...categoryTargets },
      progressPercent: 0,
      bugsFound: 0,
      assignedEmployeeIds: [],
      isCrunching: false,
      startMonth: calendar.month,
      startYear: calendar.year,
      ...(taskType === 'game' ? {
        genre, style: topic, topic, mode: gameMode, platforms: ['PC'] as const,
        stageWeights: { ...stageWeights },
        devCostSpent: currentSizeDef.cost,
        engineId: selectedEngineId !== 'none' ? selectedEngineId : undefined,
        gameSize, gameRating,
        currentPhase: 1 as const,
        developmentDaysTarget: devDaysTarget,
        developmentDaysElapsed: 0,
        ticksInCurrentPhase: 0,
      } : {}),
    };
    addTask(task);
    onCreated();
    setGameName(randomGameName());
    setStep(0);
  };

  const currentStep = STEPS[step];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showTaskTypeSelector ? 'New Task' : 'Design Your Game'}
          </DialogTitle>
          <DialogDescription>
            Step {step + 1} of {STEPS.length}: {currentStep}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-1 mb-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              className={`flex-1 h-1.5 rounded-full cursor-pointer transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        {/* Task type selector (in-game only) */}
        {showTaskTypeSelector && step === 0 && (
          <div className="flex gap-2 mb-3">
            {(['game', 'dlc', 'patch'] as TaskType[]).map((t) => (
              <Button key={t} size="sm" variant={taskType === t ? 'default' : 'outline'}
                className="flex-1 text-xs cursor-pointer capitalize" onClick={() => setTaskType(t)}>
                {t}
              </Button>
            ))}
          </div>
        )}

        {/* Step 1: Basics */}
        {currentStep === 'Basics' && (
          <div className="space-y-4">
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
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Size</Label>
                    <Select value={gameSize} onValueChange={(v) => setGameSize((v ?? 'small') as GameSize)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALL_GAME_SIZES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {GAME_SIZE_CONFIG[s].label} (${GAME_SIZE_CONFIG[s].cost.toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rating</Label>
                    <div className="flex gap-1">
                      {ALL_GAME_RATINGS.map((r) => (
                        <Button key={r} size="sm" variant={gameRating === r ? 'default' : 'outline'}
                          className="flex-1 h-8 text-xs cursor-pointer" onClick={() => setGameRating(r)}>
                          {r}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Genre</Label>
                    <Select value={genre} onValueChange={(v) => setGenre((v ?? 'RPG') as Genre)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{ALL_GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Topic</Label>
                    <Select value={topic} onValueChange={(v) => setTopic((v ?? 'Fantasy') as Topic)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{ALL_TOPICS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
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
                    {genre} + {topic} ({comboMultiplier}x) &middot; {currentSizeDef.devMonthsMin}&ndash;{currentSizeDef.devMonthsMax} months
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Engine Selection */}
        {currentStep === 'Engine' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Select Engine</Label>
              <Select value={selectedEngineId} onValueChange={(v) => setSelectedEngineId(v ?? 'none')}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Engine</SelectItem>
                  {engines.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.features.length} features)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEngine && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium">{selectedEngine.name}</span>
                  <Badge variant="outline" className="text-xs">
                    Benefit: {getEngineTotalBenefit(selectedEngine.features)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedEngine.features.map((fid) => {
                    const def = getFeatureDef(fid);
                    return def ? (
                      <Badge key={fid} variant="outline" className="text-[10px]">
                        {def.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
                {Object.entries(enginePointsAdded).some(([, v]) => v > 0) && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Additional dev points from engine:</p>
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      {(Object.entries(enginePointsAdded) as [keyof PhaseCategories, number][])
                        .filter(([, v]) => v > 0)
                        .map(([cat, pts]) => (
                          <span key={cat} className="text-amber-400">
                            {DEV_CATEGORY_LABELS[cat]}: +{pts}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!selectedEngine && (
              <p className="text-xs text-muted-foreground">
                No engine selected. Build engines in the Engines tab to add features that improve game quality.
              </p>
            )}
          </div>
        )}

        {/* Step 3: Development Focus (9 sliders, 3 per stage) */}
        {currentStep === 'Dev Focus' && (
          <div className="space-y-4">
            {([1, 2, 3] as DevPhase[]).map((phase) => {
              const cats = PHASE_CATEGORIES[phase];
              return (
                <div key={phase} className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Stage {phase} (must total 100%)
                  </Label>
                  {cats.map((cat) => (
                    <div key={cat} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{DEV_CATEGORY_LABELS[cat]}</span>
                        <span className="font-mono">
                          {stageWeights[cat]}%
                          <span className="text-muted-foreground ml-1">
                            ({categoryTargets[cat]} pts)
                          </span>
                        </span>
                      </div>
                      <Slider
                        value={[stageWeights[cat]]}
                        onValueChange={(val) => handleStageSliderChange(phase, cat, Array.isArray(val) ? val[0] : val)}
                        min={0} max={100} step={5}
                        className="cursor-pointer"
                      />
                    </div>
                  ))}
                  {phase < 3 && <Separator className="mt-2" />}
                </div>
              );
            })}
            <p className="text-xs text-center text-muted-foreground">
              Total: {totalPoints} development points
            </p>
          </div>
        )}

        {/* Step 4: Summary */}
        {currentStep === 'Summary' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-muted-foreground">Name</div>
              <div className="font-medium">{gameName}</div>
              {taskType === 'game' && (
                <>
                  <div className="text-muted-foreground">Genre</div>
                  <div>{genre} + {topic} ({comboMultiplier}x)</div>
                  <div className="text-muted-foreground">Size</div>
                  <div>{currentSizeDef.label} (${currentSizeDef.cost.toLocaleString()})</div>
                  <div className="text-muted-foreground">Rating</div>
                  <div>{gameRating}</div>
                  <div className="text-muted-foreground">Mode</div>
                  <div className="capitalize">{gameMode}</div>
                </>
              )}
              <div className="text-muted-foreground">Engine</div>
              <div>{selectedEngine ? selectedEngine.name : 'None'}</div>
              <div className="text-muted-foreground">Total Dev Points</div>
              <div className="font-mono">{totalPoints}</div>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Category Breakdown</p>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {(Object.entries(categoryTargets) as [keyof PhaseCategories, number][]).map(([cat, pts]) => (
                  <div key={cat} className="flex justify-between">
                    <span className="text-muted-foreground">{DEV_CATEGORY_LABELS[cat]}</span>
                    <span className="font-mono">{pts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 0 && (
            <Button variant="outline" className="cursor-pointer" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />Back
            </Button>
          )}
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {step < STEPS.length - 1 ? (
            <Button className="cursor-pointer" onClick={() => setStep(step + 1)} disabled={!gameName.trim()}>
              Next<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button className="cursor-pointer" disabled={!gameName.trim() || !canAfford} onClick={handleCreate}>
              {taskType === 'game' ? `Start ($${currentSizeDef.cost.toLocaleString()})` : 'Start'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
