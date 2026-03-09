'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGameStore } from '@/lib/store/gameStore';
import { SERVER_CONFIG } from '@/lib/config/serverConfig';
import { createColocatedServer, createDatacenter, getLoadByRegion, isRegionOverloaded, getTotalCapacityByRegion, getTotalMonthlyCost } from '@/lib/game/serverSystem';
import { getUpgradeMultiplier, getServerCostMultiplier } from '@/lib/game/calculations';
import { Server, Globe } from 'lucide-react';

export default function DeliveryTab() {
  const currentGame = useGameStore((s) => s.currentGame);
  const money = useGameStore((s) => s.money);
  const studioUpgrades = useGameStore((s) => s.unlockedStudioUpgrades);
  const employees = useGameStore((s) => s.employees);
  const addServer = useGameStore((s) => s.addServer);
  const spendMoney = useGameStore((s) => s.spendMoney);

  const hasDatacenterUpgrade = studioUpgrades.includes('datacenter-unlocked');
  const serverCostMultiplier = getServerCostMultiplier(employees) *
    getUpgradeMultiplier('serverCostMultiplier', studioUpgrades, []);
  const regionCostMultiplier = getUpgradeMultiplier('regionUnlockCostMultiplier', studioUpgrades, []);

  if (!currentGame) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Globe className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg">No active game</p>
        <p className="text-sm">Release a game to manage server delivery.</p>
      </div>
    );
  }

  const loadByRegion = getLoadByRegion(currentGame);
  const capacityByRegion = getTotalCapacityByRegion(currentGame.servers);
  const totalMonthlyCost = getTotalMonthlyCost(currentGame.servers);
  const totalPlayers = currentGame.platformReleases.reduce((sum, p) => sum + p.activePlayers, 0);

  const handleBuyColocated = (regionId: string) => {
    const cost = Math.round(SERVER_CONFIG.colocated.baseCostPerMonth * SERVER_CONFIG.regions.find(r => r.id === regionId)!.costMultiplier * serverCostMultiplier);
    const server = createColocatedServer(regionId as any, serverCostMultiplier);
    if (spendMoney(cost)) {
      addServer(server);
    }
  };

  const handleBuyDatacenter = (regionId: string) => {
    const region = SERVER_CONFIG.regions.find(r => r.id === regionId)!;
    const cost = Math.round(SERVER_CONFIG.datacenter.purchaseCost * region.costMultiplier);
    const server = createDatacenter(regionId as any, serverCostMultiplier);
    if (spendMoney(cost)) {
      addServer(server);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Server Infrastructure</h3>
          <p className="text-sm text-slate-400">
            {Math.floor(totalPlayers).toLocaleString()} total players &middot; ${totalMonthlyCost.toLocaleString()}/mo
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {SERVER_CONFIG.regions.map((region) => {
          const load = loadByRegion[region.id] ?? 0;
          const capacity = capacityByRegion[region.id] ?? 0;
          const overloaded = isRegionOverloaded(load);
          const regionPlayers = Math.floor(totalPlayers * region.playerDemandWeight);
          const loadPercent = capacity > 0 ? Math.min(100, (load * 100)) : 0;
          const isUnlocked = region.unlockCost === 0 || capacity > 0;

          const coloCost = Math.round(SERVER_CONFIG.colocated.baseCostPerMonth * region.costMultiplier * serverCostMultiplier);
          const dcCost = Math.round(SERVER_CONFIG.datacenter.purchaseCost * region.costMultiplier);
          const unlockCost = Math.round(region.unlockCost * regionCostMultiplier);

          const regionServers = currentGame.servers.filter(s => s.regionId === region.id);

          return (
            <Card
              key={region.id}
              className={`border ${overloaded ? 'border-red-500 bg-red-950/20' : 'border-slate-700 bg-slate-800'}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-white">{region.name}</span>
                    {overloaded && (
                      <Badge variant="destructive" className="text-xs">OVERLOADED</Badge>
                    )}
                    {!isUnlocked && (
                      <Badge variant="outline" className="text-xs text-slate-500">Locked</Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-400">
                    {regionPlayers.toLocaleString()} players / {capacity.toLocaleString()} capacity
                  </span>
                </div>

                {isUnlocked && (
                  <Progress
                    value={loadPercent}
                    className={`h-2 mb-3 ${overloaded ? '[&>div]:bg-red-500' : ''}`}
                  />
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {isUnlocked ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs cursor-pointer"
                        disabled={money < coloCost}
                        onClick={() => handleBuyColocated(region.id)}
                      >
                        + Colocated (${coloCost}/mo)
                      </Button>
                      {hasDatacenterUpgrade && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs cursor-pointer"
                          disabled={money < dcCost}
                          onClick={() => handleBuyDatacenter(region.id)}
                        >
                          + Datacenter (${dcCost.toLocaleString()})
                        </Button>
                      )}
                      <span className="text-xs text-slate-500 ml-auto">
                        {regionServers.length} server{regionServers.length !== 1 ? 's' : ''}
                      </span>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="text-xs cursor-pointer"
                      disabled={money < unlockCost}
                      onClick={() => {
                        if (spendMoney(unlockCost)) {
                          handleBuyColocated(region.id);
                        }
                      }}
                    >
                      Unlock Region (${unlockCost.toLocaleString()})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
