'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGameStore } from '@/lib/store/gameStore';
import {
  ENGINE_FEATURES,
  ENGINE_NAMES,
  getFeatureDef,
  getFeaturesByCategory,
  canResearchFeature,
  canAddFeatureToEngine,
  getEngineTotalBenefit,
  type EngineFeatureCategory,
} from '@/lib/config/engineFeaturesConfig';
import { DEV_CATEGORY_LABELS, zeroCategoryMap, PHASE_CATEGORIES } from '@/lib/game/types';
import type { GameEngine, StudioTask, DevPhase } from '@/lib/game/types';
import { Cpu, Plus, FlaskConical, Wrench, Check, Lock, X, ChevronDown, ChevronUp } from 'lucide-react';

function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const CATEGORY_COLORS: Record<EngineFeatureCategory, string> = {
  engine: 'text-cyan-400',
  gameplay: 'text-blue-400',
  storyQuests: 'text-purple-400',
  dialogues: 'text-amber-400',
  levelDesign: 'text-emerald-400',
  ai: 'text-red-400',
  worldDesign: 'text-lime-400',
  graphics: 'text-pink-400',
  sound: 'text-green-400',
};

function FeatureResearchList() {
  const unlockedFeatures = useGameStore((s) => s.unlockedFeatures);
  const money = useGameStore((s) => s.money);
  const researchPoints = useGameStore((s) => s.researchPoints);
  const activeTasks = useGameStore((s) => s.activeTasks);
  const maxParallelTasks = useGameStore((s) => s.maxParallelTasks);
  const calendar = useGameStore((s) => s.calendar);
  const addTask = useGameStore((s) => s.addTask);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const addResearchPoints = useGameStore((s) => s.addResearchPoints);
  const [expandedPhase, setExpandedPhase] = useState<DevPhase | null>(1);

  const canCreateTask = activeTasks.length < maxParallelTasks;
  const activeResearchIds = new Set(
    activeTasks.filter((t) => t.type === 'research').map((t) => t.targetFeatureId)
  );

  const handleStartResearch = (featureId: string) => {
    const def = getFeatureDef(featureId);
    if (!def) return;
    if (!canCreateTask) return;
    if (def.researchCost.money > 0 && !spendMoney(def.researchCost.money)) return;
    if (def.researchCost.rp > 0) {
      if (researchPoints < def.researchCost.rp) return;
      addResearchPoints(-def.researchCost.rp);
    }

    const researchTarget = 50 + def.researchCost.rp * 2;
    const task: StudioTask = {
      id: generateTaskId(),
      type: 'research',
      name: `Research: ${def.name}`,
      targetGameId: null,
      categoryProgress: zeroCategoryMap(),
      categoryTargets: zeroCategoryMap(),
      progressPercent: 0,
      bugsFound: 0,
      assignedEmployeeIds: [],
      isCrunching: false,
      startMonth: calendar.month,
      startYear: calendar.year,
      targetFeatureId: featureId,
      researchProgress: 0,
      researchTarget,
    };
    addTask(task);
  };

  return (
    <div className="space-y-3">
      {([1, 2, 3] as DevPhase[]).map((phase) => {
        const categories = PHASE_CATEGORIES[phase];
        const isExpanded = expandedPhase === phase;
        return (
          <div key={phase}>
            <button
              className="flex items-center gap-2 w-full text-left py-1.5 px-1 hover:bg-muted/30 rounded cursor-pointer"
              onClick={() => setExpandedPhase(isExpanded ? null : phase)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="text-sm font-semibold text-muted-foreground">Stage {phase}</span>
            </button>
            {isExpanded && categories.map((cat) => {
              const features = getFeaturesByCategory(cat);
              if (features.length === 0) return null;
              return (
                <div key={cat} className="ml-4 mb-3">
                  <p className={`text-xs font-semibold mb-1 ${CATEGORY_COLORS[cat]}`}>
                    {DEV_CATEGORY_LABELS[cat]}
                  </p>
                  <div className="space-y-1">
                    {features.map((feat) => {
                      const isUnlocked = unlockedFeatures.includes(feat.id);
                      const isResearching = activeResearchIds.has(feat.id);
                      const canResearch = canResearchFeature(feat.id, unlockedFeatures);
                      const canAfford = money >= feat.researchCost.money && researchPoints >= feat.researchCost.rp;
                      return (
                        <div key={feat.id} className="flex items-center justify-between gap-2 py-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isUnlocked ? (
                              <Check className="h-3 w-3 text-green-400 shrink-0" />
                            ) : (
                              <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                            )}
                            <span className={`text-xs truncate ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {feat.name}
                            </span>
                            {feat.benefitScore > 0 && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">+{feat.benefitScore}</Badge>
                            )}
                          </div>
                          {!isUnlocked && !isResearching && canResearch && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-[10px] h-5 px-1.5 cursor-pointer shrink-0"
                              disabled={!canCreateTask || !canAfford}
                              onClick={() => handleStartResearch(feat.id)}
                            >
                              <FlaskConical className="h-3 w-3 mr-0.5" />
                              {feat.researchCost.rp > 0 && `${feat.researchCost.rp} RP`}
                              {feat.researchCost.rp > 0 && feat.researchCost.money > 0 && ' + '}
                              {feat.researchCost.money > 0 && `$${(feat.researchCost.money / 1000).toFixed(0)}K`}
                            </Button>
                          )}
                          {isResearching && (
                            <Badge className="text-[10px] bg-blue-500/20 text-blue-400 shrink-0">Researching</Badge>
                          )}
                          {isUnlocked && (
                            <span className="text-[10px] text-green-400 shrink-0">Unlocked</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function EngineManager({ engine }: { engine: GameEngine }) {
  const unlockedFeatures = useGameStore((s) => s.unlockedFeatures);
  const money = useGameStore((s) => s.money);
  const addFeature = useGameStore((s) => s.addFeatureToEngine);
  const removeFeature = useGameStore((s) => s.removeFeatureFromEngine);
  const [showAdd, setShowAdd] = useState(false);

  const featureDefs = engine.features.map(getFeatureDef).filter(Boolean);
  const totalBenefit = getEngineTotalBenefit(engine.features);

  const availableFeatures = ENGINE_FEATURES.filter((f) => {
    if (engine.features.includes(f.id)) return false;
    if (!unlockedFeatures.includes(f.id)) return false;
    const check = canAddFeatureToEngine(f.id, engine.features, unlockedFeatures);
    return check.allowed;
  });

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-foreground">{engine.name}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {engine.features.length} features | Benefit: {totalBenefit} | Cost: ${engine.totalEngineCost.toLocaleString()}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-6 cursor-pointer"
            onClick={() => setShowAdd(!showAdd)}
          >
            {showAdd ? <X className="h-3 w-3 mr-0.5" /> : <Plus className="h-3 w-3 mr-0.5" />}
            {showAdd ? 'Close' : 'Add Feature'}
          </Button>
        </div>

        {featureDefs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {featureDefs.map((feat) => feat && (
              <Badge
                key={feat.id}
                variant="outline"
                className={`text-[10px] cursor-pointer hover:bg-destructive/20 ${CATEGORY_COLORS[feat.category]}`}
                onClick={() => removeFeature(engine.id, feat.id)}
                title={`Remove ${feat.name}`}
              >
                {feat.name} <X className="h-2.5 w-2.5 ml-0.5" />
              </Badge>
            ))}
          </div>
        )}

        {featureDefs.length === 0 && !showAdd && (
          <p className="text-xs text-muted-foreground italic">No features added yet.</p>
        )}

        {showAdd && (
          <div className="border-t border-border pt-2 space-y-1 max-h-48 overflow-y-auto">
            {availableFeatures.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No more features available to add.</p>
            ) : (
              availableFeatures.map((feat) => (
                <div key={feat.id} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs ${CATEGORY_COLORS[feat.category]}`}>{DEV_CATEGORY_LABELS[feat.category]}</span>
                    <span className="text-xs text-foreground">{feat.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">+{feat.benefitScore}</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] h-5 px-1.5 cursor-pointer"
                    disabled={money < feat.engineCost}
                    onClick={() => addFeature(engine.id, feat.id)}
                  >
                    <Wrench className="h-3 w-3 mr-0.5" />
                    ${(feat.engineCost / 1000).toFixed(0)}K
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EnginesTab() {
  const engines = useGameStore((s) => s.engines);
  const createEngine = useGameStore((s) => s.createEngine);

  const [newEngineName, setNewEngineName] = useState<string>(
    ENGINE_NAMES[engines.length % ENGINE_NAMES.length]
  );

  const handleCreateEngine = () => {
    createEngine(newEngineName);
    setNewEngineName(ENGINE_NAMES[(engines.length + 1) % ENGINE_NAMES.length]);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Cpu className="h-6 w-6 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">Engines & Research</h3>
          <p className="text-sm text-muted-foreground">
            Research features, build engines, and add features to improve your games.
          </p>
        </div>
      </div>

      <Tabs defaultValue="engines" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="engines" className="cursor-pointer">Engines</TabsTrigger>
          <TabsTrigger value="research" className="cursor-pointer">Research</TabsTrigger>
        </TabsList>

        <TabsContent value="engines" className="space-y-4 mt-4">
          {engines.length > 0 && (
            <div className="space-y-2">
              {engines.map((engine) => (
                <EngineManager key={engine.id} engine={engine} />
              ))}
            </div>
          )}

          <Separator />

          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Create New Engine</h4>
              <div className="flex gap-2">
                <Input
                  value={newEngineName}
                  onChange={(e) => setNewEngineName(e.target.value)}
                  placeholder="Engine name..."
                  className="flex-1"
                />
                <Button
                  className="cursor-pointer"
                  disabled={!newEngineName.trim()}
                  onClick={handleCreateEngine}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Create an empty engine, then add researched features to it. Select it when creating games.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research" className="mt-4">
          <FeatureResearchList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
