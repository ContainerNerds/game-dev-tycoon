'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useGameStore } from '@/lib/store/gameStore';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { GAME_SIZE_CONFIG } from '@/lib/config/gameSizeConfig';
import { ALL_GENRES, ALL_TOPICS, getComboMultiplier } from '@/lib/config/genreStyleConfig';
import { getEngineDevPointsAdded, getEngineTotalBenefit, getFeatureDef } from '@/lib/config/engineFeaturesConfig';
import { randomStudioName, randomGameName, randomPlayerName } from '@/lib/config/nameConfig';
import {
  zeroCategoryMap,
  DEV_CATEGORY_LABELS,
  PHASE_CATEGORIES,
} from '@/lib/game/types';
import type {
  Genre, Topic, GameMode, GameSize, PhaseCategories, StudioTask, DevPhase,
} from '@/lib/game/types';
import { Shuffle, ChevronLeft, ChevronRight, Cpu } from 'lucide-react';

interface GameCreationWizardProps {
  onStart: () => void;
  onBack: () => void;
  targetSlotId?: number;
}

type WizardStep = 'studio' | 'basics' | 'engine' | 'focus' | 'summary';
const WIZARD_STEPS: WizardStep[] = ['studio', 'basics', 'engine', 'focus', 'summary'];

export function GameCreationWizard({ onStart, onBack }: GameCreationWizardProps) {
  const [step, setStep] = useState<WizardStep>('studio');
  const stepIndex = WIZARD_STEPS.indexOf(step);

  // Studio setup
  const [playerName, setPlayerName] = useState(randomPlayerName);
  const [studioName, setStudioName] = useState(randomStudioName);
  const [startingMoney, setStartingMoney] = useState<number>(GAME_CONFIG.defaultStartingMoney);

  // Game setup
  const [gameName, setGameName] = useState(randomGameName);
  const [genre, setGenre] = useState<Genre>('RPG');
  const [topic, setTopic] = useState<Topic>('Fantasy');
  const [gameMode, setGameMode] = useState<GameMode>('standard');

  // Stage weights
  const [stageWeights, setStageWeights] = useState<PhaseCategories>({
    engine: 33, gameplay: 34, storyQuests: 33,
    dialogues: 33, levelDesign: 34, ai: 33,
    worldDesign: 33, graphics: 34, sound: 33,
  });

  const newGame = useGameStore((s) => s.newGame);
  const addTask = useGameStore((s) => s.addTask);
  const setSpeed = useGameStore((s) => s.setSpeed);

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

  const handleCreate = () => {
    newGame(studioName, playerName || 'Player', startingMoney);

    const sizeDef = GAME_SIZE_CONFIG.small;
    const baseComplexity = sizeDef.baseComplexity;
    const devDaysTarget = Math.round((sizeDef.devMonthsMin + sizeDef.devMonthsMax) / 2 * 30);
    const categoryTargets = zeroCategoryMap();
    for (const phase of [1, 2, 3] as DevPhase[]) {
      for (const cat of PHASE_CATEGORIES[phase]) {
        categoryTargets[cat] = Math.round(baseComplexity * (stageWeights[cat] / 100));
      }
    }

    const cal = useGameStore.getState().calendar;
    const task: StudioTask = {
      id: `task-${Date.now()}`,
      type: 'game',
      name: gameName,
      targetGameId: null,
      categoryProgress: zeroCategoryMap(),
      categoryTargets,
      progressPercent: 0,
      bugsFound: 0,
      assignedEmployeeIds: [],
      startMonth: cal.month,
      startYear: cal.year,
      isCrunching: false,
      genre,
      style: topic,
      topic,
      mode: gameMode,
      platforms: ['PC'],
      stageWeights: { ...stageWeights },
      devCostSpent: 0,
      gameSize: 'small',
      gameRating: 'E',
      currentPhase: 1,
      developmentDaysTarget: devDaysTarget,
      developmentDaysElapsed: 0,
      ticksInCurrentPhase: 0,
    };

    addTask(task);
    setSpeed(1);
    onStart();
  };

  const isStudioValid = studioName.trim().length > 0 && playerName.trim().length > 0;
  const isGameValid = gameName.trim().length > 0;
  const comboMultiplier = getComboMultiplier(genre, topic);
  const comboColor = comboMultiplier >= 2.0 ? 'text-green-400' : comboMultiplier >= 1.5 ? 'text-blue-400' : 'text-muted-foreground';

  const categoryTargetsPreview = (() => {
    const targets = zeroCategoryMap();
    const baseComplexity = GAME_SIZE_CONFIG.small.baseComplexity;
    for (const phase of [1, 2, 3] as DevPhase[]) {
      for (const cat of PHASE_CATEGORIES[phase]) {
        targets[cat] = Math.round(baseComplexity * (stageWeights[cat] / 100));
      }
    }
    return targets;
  })();
  const totalPoints = Object.values(categoryTargetsPreview).reduce((s, v) => s + v, 0);

  const goNext = () => {
    const next = WIZARD_STEPS[stepIndex + 1];
    if (next) setStep(next);
  };
  const goBack = () => {
    if (stepIndex === 0) { onBack(); return; }
    setStep(WIZARD_STEPS[stepIndex - 1]);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-border bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">
            {step === 'studio' ? 'Create Your Studio' : 'Design Your First Game'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 'studio' ? 'Choose a name and starting budget' :
             step === 'basics' ? `${studioName}'s debut title` :
             step === 'engine' ? 'Select an engine (you have none yet for your first game)' :
             step === 'focus' ? 'Set development focus for each stage' :
             'Review and start development'}
          </CardDescription>
          <div className="flex gap-1 mt-2">
            {WIZARD_STEPS.map((s, i) => (
              <div key={s} className={`flex-1 h-1 rounded-full ${i <= stepIndex ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Step: Studio */}
          {step === 'studio' && (
            <>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Your Name</Label>
                <div className="flex gap-2">
                  <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="flex-1" />
                  <Button type="button" size="sm" variant="outline" className="shrink-0 cursor-pointer" onClick={() => setPlayerName(randomPlayerName())}>
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Studio Name</Label>
                <div className="flex gap-2">
                  <Input value={studioName} onChange={(e) => setStudioName(e.target.value)} className="flex-1" />
                  <Button type="button" size="sm" variant="outline" className="shrink-0 cursor-pointer" onClick={() => setStudioName(randomStudioName())}>
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Starting Money</Label>
                <Select value={startingMoney.toString()} onValueChange={(v) => setStartingMoney(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GAME_CONFIG.startingMoneyOptions.map((amount) => (
                      <SelectItem key={amount} value={amount.toString()}>
                        ${amount.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Step: Basics */}
          {step === 'basics' && (
            <>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Game Name</Label>
                <div className="flex gap-2">
                  <Input value={gameName} onChange={(e) => setGameName(e.target.value)} className="flex-1" />
                  <Button type="button" size="sm" variant="outline" className="shrink-0 cursor-pointer" onClick={() => setGameName(randomGameName())}>
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Genre</Label>
                  <Select value={genre} onValueChange={(v) => setGenre(v as Genre)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ALL_GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Topic</Label>
                  <Select value={topic} onValueChange={(v) => setTopic(v as Topic)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ALL_TOPICS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-center">
                <span className={`text-sm font-medium ${comboColor}`}>
                  {genre} + {topic} ({comboMultiplier}x)
                </span>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Game Mode</Label>
                <div className="flex gap-2">
                  <Button type="button" variant={gameMode === 'standard' ? 'default' : 'outline'} className="flex-1 cursor-pointer" onClick={() => setGameMode('standard')}>Standard</Button>
                  <Button type="button" variant={gameMode === 'liveservice' ? 'default' : 'outline'} className="flex-1 cursor-pointer" onClick={() => setGameMode('liveservice')}>Live Service</Button>
                </div>
              </div>
            </>
          )}

          {/* Step: Engine (first game has none) */}
          {step === 'engine' && (
            <div className="text-center py-8">
              <Cpu className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No engines available for your first game. Research features and build engines later to boost quality.
              </p>
            </div>
          )}

          {/* Step: Dev Focus */}
          {step === 'focus' && (
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
                          <span className="font-mono">{stageWeights[cat]}% ({categoryTargetsPreview[cat]} pts)</span>
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
              <p className="text-xs text-center text-muted-foreground">Total: {totalPoints} development points</p>
            </div>
          )}

          {/* Step: Summary */}
          {step === 'summary' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Studio</div>
                <div className="font-medium">{studioName}</div>
                <div className="text-muted-foreground">Game</div>
                <div className="font-medium">{gameName}</div>
                <div className="text-muted-foreground">Genre</div>
                <div>{genre} + {topic} ({comboMultiplier}x)</div>
                <div className="text-muted-foreground">Mode</div>
                <div className="capitalize">{gameMode}</div>
                <div className="text-muted-foreground">Budget</div>
                <div>${startingMoney.toLocaleString()}</div>
                <div className="text-muted-foreground">Total Dev Points</div>
                <div className="font-mono">{totalPoints}</div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-1 text-xs">
                {(Object.entries(categoryTargetsPreview) as [keyof PhaseCategories, number][]).map(([cat, pts]) => (
                  <div key={cat} className="flex justify-between">
                    <span className="text-muted-foreground">{DEV_CATEGORY_LABELS[cat]}</span>
                    <span className="font-mono">{pts}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 cursor-pointer" onClick={goBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />{step === 'studio' ? 'Back' : 'Previous'}
            </Button>
            {step !== 'summary' ? (
              <Button className="flex-1 cursor-pointer" disabled={step === 'studio' ? !isStudioValid : !isGameValid} onClick={goNext}>
                Next<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button className="flex-1 cursor-pointer" disabled={!isGameValid} onClick={handleCreate}>
                Start Development
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
