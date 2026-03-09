'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useGameStore } from '@/lib/store/gameStore';
import { SKILL_TREE } from '@/lib/config/skillTreeConfig';
import { Lock, Unlock, Check } from 'lucide-react';

const EMPTY_ARRAY: string[] = [];

export default function UpgradesTab() {
  const money = useGameStore((s) => s.money);
  const researchPoints = useGameStore((s) => s.researchPoints);
  const studioUpgrades = useGameStore((s) => s.unlockedStudioUpgrades);
  const gameUpgrades = useGameStore((s) => s.currentGame?.unlockedGameUpgrades ?? EMPTY_ARRAY);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const addResearchPoints = useGameStore((s) => s.addResearchPoints);
  const unlockStudioUpgrade = useGameStore((s) => s.unlockStudioUpgrade);
  const unlockGameUpgrade = useGameStore((s) => s.unlockGameUpgrade);

  const allUnlocked = [...studioUpgrades, ...gameUpgrades];

  const studioNodes = SKILL_TREE.filter((n) => n.category === 'studio');
  const gameNodes = SKILL_TREE.filter((n) => n.category === 'game');

  const isUnlocked = (id: string) => allUnlocked.includes(id);
  const prereqsMet = (node: typeof SKILL_TREE[0]) =>
    node.prerequisites.every((p) => allUnlocked.includes(p));
  const canAfford = (node: typeof SKILL_TREE[0]) =>
    money >= node.cost && researchPoints >= node.researchCost;

  const handleUnlock = (node: typeof SKILL_TREE[0]) => {
    if (isUnlocked(node.id) || !prereqsMet(node) || !canAfford(node)) return;
    const spent = spendMoney(node.cost);
    if (!spent) return;
    addResearchPoints(-node.researchCost);
    if (node.category === 'studio') {
      unlockStudioUpgrade(node.id);
    } else {
      unlockGameUpgrade(node.id);
    }
  };

  const renderTree = (nodes: typeof SKILL_TREE, title: string, description: string) => {
    const tiers = [1, 2, 3];
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        {tiers.map((tier) => {
          const tierNodes = nodes.filter((n) => n.tier === tier);
          if (tierNodes.length === 0) return null;
          return (
            <div key={tier}>
              <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                Tier {tier}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tierNodes.map((node) => {
                  const unlocked = isUnlocked(node.id);
                  const available = prereqsMet(node) && !unlocked;
                  const affordable = canAfford(node);

                  return (
                    <Card
                      key={node.id}
                      className={`border transition-colors ${
                        unlocked
                          ? 'border-green-600 bg-green-950/30'
                          : available
                          ? 'border-slate-600 bg-slate-800 hover:border-blue-500'
                          : 'border-slate-700 bg-slate-800/50 opacity-60'
                      }`}
                    >
                      <CardHeader className="p-3 pb-1">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{node.name}</CardTitle>
                          {unlocked ? (
                            <Check className="h-4 w-4 text-green-400" />
                          ) : available ? (
                            <Unlock className="h-4 w-4 text-blue-400" />
                          ) : (
                            <Lock className="h-4 w-4 text-slate-500" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 space-y-2">
                        <p className="text-xs text-slate-400">{node.description}</p>
                        {!unlocked && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className={money >= node.cost ? 'text-green-400' : 'text-red-400'}>
                              ${node.cost.toLocaleString()}
                            </span>
                            <span className={researchPoints >= node.researchCost ? 'text-blue-400' : 'text-red-400'}>
                              {node.researchCost} RP
                            </span>
                          </div>
                        )}
                        {available && !unlocked && (
                          <Button
                            size="sm"
                            className="w-full text-xs h-7 cursor-pointer"
                            disabled={!affordable}
                            onClick={() => handleUnlock(node)}
                          >
                            {affordable ? 'Unlock' : 'Cannot Afford'}
                          </Button>
                        )}
                        {!available && !unlocked && node.prerequisites.length > 0 && (
                          <p className="text-xs text-slate-500 italic">
                            Requires: {node.prerequisites.join(', ')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 p-4">
      {renderTree(studioNodes, 'Studio Upgrades', 'Persist across all games')}
      {renderTree(gameNodes, 'Game Upgrades', 'Apply to current game only')}
    </div>
  );
}
