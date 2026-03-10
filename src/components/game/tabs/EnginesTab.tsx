'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useGameStore } from '@/lib/store/gameStore';
import { ENGINE_CONFIG } from '@/lib/config/engineConfig';
import { Cpu, Plus, ArrowUp } from 'lucide-react';
import type { GameEngine, StudioTask } from '@/lib/game/types';

function getEngineCost(version: number): number {
  return ENGINE_CONFIG.baseCost + version * ENGINE_CONFIG.costPerVersion;
}

function getEngineDays(version: number): number {
  return ENGINE_CONFIG.baseDevelopmentDays + version * ENGINE_CONFIG.daysPerVersion;
}

function getVersionBonuses(version: number) {
  const b = version * ENGINE_CONFIG.baseBonusPerVersion;
  return { graphicsBonus: b, soundBonus: b, gameplayBonus: b, polishBonus: b };
}

export default function EnginesTab() {
  const engines = useGameStore((s) => s.engines);
  const money = useGameStore((s) => s.money);
  const activeTasks = useGameStore((s) => s.activeTasks);
  const calendar = useGameStore((s) => s.calendar);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const addEngine = useGameStore((s) => s.addEngine);
  const addTask = useGameStore((s) => s.addTask);
  const maxParallelTasks = useGameStore((s) => s.maxParallelTasks);

  const [newEngineName, setNewEngineName] = useState<string>(
    ENGINE_CONFIG.engineNames[engines.length % ENGINE_CONFIG.engineNames.length]
  );

  const canCreateTask = activeTasks.length < maxParallelTasks;

  const handleCreateEngine = () => {
    const cost = getEngineCost(1);
    const devDays = getEngineDays(1);
    if (!spendMoney(cost)) return;
    if (!canCreateTask) return;

    const engineId = `engine-${Date.now()}`;
    const bonuses = getVersionBonuses(1);

    const engine: GameEngine = {
      id: engineId,
      name: newEngineName || 'Custom Engine',
      version: 1,
      ...bonuses,
      developmentCost: cost,
      developmentDays: devDays,
      completedAt: null,
    };
    addEngine(engine);

    const complexity = devDays * 4;
    const perPillar = Math.round(complexity / 4);
    const task: StudioTask = {
      id: `task-${Date.now()}`,
      type: 'engine',
      name: `Build ${engine.name} v1`,
      targetGameId: engineId,
      pillarProgress: { graphics: 0, gameplay: 0, sound: 0, polish: 0 },
      pillarTargets: { graphics: perPillar, gameplay: perPillar, sound: perPillar, polish: perPillar },
      progressPercent: 0,
      bugsFound: 0,
      assignedEmployeeIds: [],
      startMonth: calendar.month,
      startYear: calendar.year,
      isCrunching: false,
    };
    addTask(task);
    setNewEngineName(ENGINE_CONFIG.engineNames[(engines.length + 1) % ENGINE_CONFIG.engineNames.length]);
  };

  const handleUpgradeEngine = (engine: GameEngine) => {
    if (engine.version >= ENGINE_CONFIG.maxVersion) return;
    const nextVersion = engine.version + 1;
    const cost = getEngineCost(nextVersion);
    if (!spendMoney(cost)) return;
    if (!canCreateTask) return;

    const devDays = getEngineDays(nextVersion);
    const complexity = devDays * 4;
    const perPillar = Math.round(complexity / 4);
    const task: StudioTask = {
      id: `task-${Date.now()}`,
      type: 'engine',
      name: `Upgrade ${engine.name} to v${nextVersion}`,
      targetGameId: engine.id,
      pillarProgress: { graphics: 0, gameplay: 0, sound: 0, polish: 0 },
      pillarTargets: { graphics: perPillar, gameplay: perPillar, sound: perPillar, polish: perPillar },
      progressPercent: 0,
      bugsFound: 0,
      assignedEmployeeIds: [],
      startMonth: calendar.month,
      startYear: calendar.year,
      isCrunching: false,
    };
    addTask(task);
  };

  const completedEngines = engines.filter((e) => e.completedAt !== null);
  const inProgressEngineIds = new Set(
    activeTasks.filter((t) => t.type === 'engine').map((t) => t.targetGameId)
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Cpu className="h-6 w-6 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">Game Engines</h3>
          <p className="text-sm text-muted-foreground">
            Build custom engines to boost game quality. Higher versions provide bigger bonuses.
          </p>
        </div>
      </div>

      {completedEngines.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Available Engines
          </h4>
          <div className="grid gap-2">
            {completedEngines.map((engine) => {
              const isUpgrading = inProgressEngineIds.has(engine.id);
              const canUpgrade = engine.version < ENGINE_CONFIG.maxVersion && !isUpgrading && canCreateTask;
              const upgradeCost = getEngineCost(engine.version + 1);
              return (
                <Card key={engine.id} className="border-border bg-card">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{engine.name}</span>
                        <Badge variant="outline" className="text-xs">v{engine.version}</Badge>
                        {isUpgrading && <Badge className="text-xs bg-blue-500/20 text-blue-400">Upgrading</Badge>}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="text-pink-400">Gfx +{(engine.graphicsBonus * 100).toFixed(0)}%</span>
                        <span className="text-green-400">Snd +{(engine.soundBonus * 100).toFixed(0)}%</span>
                        <span className="text-blue-400">Game +{(engine.gameplayBonus * 100).toFixed(0)}%</span>
                        <span className="text-yellow-400">Pol +{(engine.polishBonus * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    {engine.version < ENGINE_CONFIG.maxVersion && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer text-xs"
                        disabled={!canUpgrade || money < upgradeCost}
                        onClick={() => handleUpgradeEngine(engine)}
                      >
                        <ArrowUp className="h-3 w-3 mr-1" />
                        Upgrade v{engine.version + 1} (${upgradeCost.toLocaleString()})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Create New Engine
        </h4>
        <Card className="border-border bg-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                value={newEngineName}
                onChange={(e) => setNewEngineName(e.target.value)}
                placeholder="Engine name..."
                className="flex-1"
              />
              <Button
                className="cursor-pointer"
                disabled={!canCreateTask || money < getEngineCost(1) || !newEngineName.trim()}
                onClick={handleCreateEngine}
              >
                <Plus className="h-4 w-4 mr-1" />
                Build (${getEngineCost(1).toLocaleString()})
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Development time: ~{getEngineDays(1)} days. Each version adds +{(ENGINE_CONFIG.baseBonusPerVersion * 100).toFixed(0)}% to all development pillars.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
