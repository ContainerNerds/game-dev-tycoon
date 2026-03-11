'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGameStore } from '@/lib/store/gameStore';
import { SKILL_TREE, getSkillNode, prereqsMet, getSpecNodes } from '@/lib/config/skillTreeConfig';
import { STUDIO_LEVEL_CONFIG } from '@/lib/config/studioLevelConfig';
import type { Specialization, SkillNode } from '@/lib/game/types';
import { Lock, Unlock, Check, Star, Zap, Briefcase, Cpu } from 'lucide-react';

const SPEC_META: Record<Specialization, { label: string; color: string; bg: string; border: string; icon: typeof Star }> = {
  production: { label: 'Production', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Zap },
  business: { label: 'Business', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Briefcase },
  technology: { label: 'Technology', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', icon: Cpu },
};

const SPECS: Specialization[] = ['production', 'business', 'technology'];

export default function SkillTreeTab() {
  const studioLevel = useGameStore((s) => s.studioLevel);
  const studioXP = useGameStore((s) => s.studioXP);
  const skillPoints = useGameStore((s) => s.skillPoints);
  const allocated = useGameStore((s) => s.allocatedSkills);
  const allocateSkillPoint = useGameStore((s) => s.allocateSkillPoint);

  const [activeSpec, setActiveSpec] = useState<Specialization>('production');

  const xpNeeded = studioLevel < STUDIO_LEVEL_CONFIG.maxLevel
    ? STUDIO_LEVEL_CONFIG.xpPerLevel[studioLevel + 1]
    : 0;
  const xpPercent = xpNeeded > 0 ? Math.min(100, (studioXP / xpNeeded) * 100) : 100;
  const isMaxLevel = studioLevel >= STUDIO_LEVEL_CONFIG.maxLevel;

  const totalAllocated = Object.values(allocated).reduce((s, v) => s + v, 0);

  const handleAllocate = (nodeId: string) => {
    const node = getSkillNode(nodeId);
    if (!node) return;
    const current = allocated[nodeId] ?? 0;
    if (current >= node.maxRanks) return;
    if (skillPoints < node.pointsPerRank) return;
    if (!prereqsMet(nodeId, allocated)) return;
    for (let i = 0; i < node.pointsPerRank; i++) {
      allocateSkillPoint(nodeId);
    }
  };

  const specNodes = getSpecNodes(activeSpec);
  const tiers = [1, 2, 3, 4] as const;
  const meta = SPEC_META[activeSpec];

  return (
    <div className="p-4 space-y-4">
      {/* XP / Level Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <span className="text-lg font-bold">Level {studioLevel}</span>
          {isMaxLevel && <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/50">MAX</Badge>}
        </div>
        {!isMaxLevel && (
          <div className="flex-1 min-w-[200px] max-w-xs space-y-0.5">
            <Progress value={xpPercent} className="h-2" />
            <p className="text-[10px] text-muted-foreground text-right">
              {Math.floor(studioXP)} / {xpNeeded} XP
            </p>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-sm font-mono px-3 py-1">
            {skillPoints} SP
          </Badge>
          <span className="text-xs text-muted-foreground">available</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {totalAllocated} / {STUDIO_LEVEL_CONFIG.maxLevel} allocated
        </span>
      </div>

      {/* Specialization Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
        {SPECS.map((spec) => {
          const m = SPEC_META[spec];
          const Icon = m.icon;
          return (
            <Button
              key={spec}
              variant={activeSpec === spec ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 text-xs gap-1.5 cursor-pointer"
              onClick={() => setActiveSpec(spec)}
            >
              <Icon className={`w-3.5 h-3.5 ${m.color}`} />
              {m.label}
            </Button>
          );
        })}
      </div>

      {/* Skill Nodes by Tier */}
      <div className="space-y-5">
        {tiers.map((tier) => {
          const tierNodes = specNodes.filter((n) => n.tier === tier);
          if (tierNodes.length === 0) return null;
          return (
            <div key={tier}>
              <div className="text-xs font-semibold text-muted-foreground/60 mb-2 uppercase tracking-wider">
                Tier {tier}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tierNodes.map((node) => (
                  <SkillCard
                    key={node.id}
                    node={node}
                    ranks={allocated[node.id] ?? 0}
                    skillPoints={skillPoints}
                    canAllocate={prereqsMet(node.id, allocated) && (allocated[node.id] ?? 0) < node.maxRanks && skillPoints >= node.pointsPerRank}
                    isFullyAllocated={(allocated[node.id] ?? 0) >= node.maxRanks}
                    prereqsMet={prereqsMet(node.id, allocated)}
                    specMeta={meta}
                    onAllocate={() => handleAllocate(node.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkillCard({
  node,
  ranks,
  skillPoints,
  canAllocate,
  isFullyAllocated,
  prereqsMet: preReqOk,
  specMeta,
  onAllocate,
}: {
  node: SkillNode;
  ranks: number;
  skillPoints: number;
  canAllocate: boolean;
  isFullyAllocated: boolean;
  prereqsMet: boolean;
  specMeta: { label: string; color: string; bg: string; border: string };
  onAllocate: () => void;
}) {
  const hasRanks = ranks > 0;

  return (
    <Card
      className={`border transition-colors ${
        isFullyAllocated
          ? `${specMeta.border} ${specMeta.bg}`
          : hasRanks
          ? `${specMeta.border} bg-card`
          : preReqOk
          ? 'border-border bg-card hover:border-foreground/30'
          : 'border-border bg-card/50 opacity-50'
      }`}
    >
      <CardHeader className="p-3 pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{node.name}</CardTitle>
          <div className="flex items-center gap-1.5">
            {node.maxRanks > 1 && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 font-mono ${
                  isFullyAllocated ? specMeta.color : 'text-muted-foreground'
                }`}
              >
                {ranks}/{node.maxRanks}
              </Badge>
            )}
            {isFullyAllocated ? (
              <Check className={`h-4 w-4 ${specMeta.color}`} />
            ) : preReqOk ? (
              <Unlock className="h-4 w-4 text-foreground/40" />
            ) : (
              <Lock className="h-4 w-4 text-muted-foreground/40" />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        <p className="text-xs text-muted-foreground">{node.description}</p>

        {/* Effect preview */}
        <div className="text-[10px] text-muted-foreground/80">
          {node.effects.map((eff, i) => {
            const current = ranks > 0 ? eff.valuePerRank[ranks - 1] : null;
            const next = ranks < node.maxRanks ? eff.valuePerRank[ranks] : null;
            return (
              <div key={i}>
                {formatEffectLabel(eff.type)}:{' '}
                {current !== null && <span className={specMeta.color}>{formatEffectValue(eff.type, current)}</span>}
                {current !== null && next !== null && ' → '}
                {next !== null && <span className="text-foreground/60">{formatEffectValue(eff.type, next)}</span>}
              </div>
            );
          })}
        </div>

        {node.pointsPerRank > 1 && !isFullyAllocated && (
          <p className="text-[10px] text-muted-foreground">Cost: {node.pointsPerRank} SP per rank</p>
        )}

        {canAllocate && (
          <Button
            size="sm"
            className="w-full text-xs h-7 cursor-pointer"
            onClick={onAllocate}
          >
            Allocate{node.pointsPerRank > 1 ? ` (${node.pointsPerRank} SP)` : ''}
          </Button>
        )}

        {!preReqOk && !isFullyAllocated && node.prerequisites.length > 0 && (
          <p className="text-[10px] text-muted-foreground/60 italic">
            Requires: {node.prerequisites.map((p) => getSkillNode(p)?.name ?? p).join(', ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const EFFECT_LABELS: Record<string, string> = {
  devSpeedMultiplier: 'Dev Speed',
  bugRateMultiplier: 'Bug Rate',
  polishMultiplier: 'Polish',
  crunchEfficiency: 'Crunch Bonus',
  devCostMultiplier: 'Dev Cost',
  graphicsMultiplier: 'Graphics',
  soundMultiplier: 'Sound',
  gameplayMultiplier: 'Gameplay',
  patchSpeedMultiplier: 'Patch Speed',
  parallelTaskSlot: 'Task Slots',
  activeGameSlot: 'Game Slots',
  saleRateMultiplier: 'Sale Rate',
  priceMultiplier: 'Price',
  growthFanMultiplier: 'Growth Fans',
  peakPlayerMultiplier: 'Peak Players',
  doubleSaleChance: 'Bundle Chance',
  declineRateMultiplier: 'Decline Rate',
  studioFanConversionMultiplier: 'Fan Conversion',
  dlcSalesMultiplier: 'DLC Sales',
  sequelLaunchBoost: 'Sequel Boost',
  peakDurationMultiplier: 'Peak Duration',
  studioFanPurchaseRate: 'Fan Purchase',
  serverCostMultiplier: 'Server Cost',
  researchRateMultiplier: 'RP Rate',
  engineCostMultiplier: 'Engine Cost',
  unlockDatacenters: 'Datacenters',
  unlockPlatform: 'Platform',
  serverCapacityMultiplier: 'Server Cap.',
  researchSpeedMultiplier: 'Research Speed',
  regionUnlockCostMultiplier: 'Region Cost',
  overloadThreshold: 'Overload Cap',
  engineTierUnlock: 'Engine Tier',
  autoFixLowBugs: 'Auto-Fix Bugs',
};

function formatEffectLabel(type: string): string {
  return EFFECT_LABELS[type] ?? type;
}

function formatEffectValue(type: string, value: number): string {
  const additive = ['parallelTaskSlot', 'activeGameSlot', 'unlockDatacenters', 'unlockPlatform', 'engineTierUnlock', 'autoFixLowBugs'];
  if (additive.includes(type)) return `+${value}`;

  if (type === 'doubleSaleChance') return `${Math.round(value * 100)}%`;
  if (type === 'overloadThreshold') return `${Math.round(value * 100)}%`;

  if (value < 1) return `-${Math.round((1 - value) * 100)}%`;
  if (value > 1) return `+${Math.round((value - 1) * 100)}%`;
  return `${Math.round(value * 100)}%`;
}
