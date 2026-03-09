'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGameStore } from '@/lib/store/gameStore';
import { SERVER_CONFIG } from '@/lib/config/serverConfig';
import { createColocatedServer, createDatacenter, getLoadByRegion, isRegionOverloaded, getTotalCapacityByRegion, getTotalMonthlyCost } from '@/lib/game/serverSystem';
import { getUpgradeMultiplier, getServerCostMultiplier } from '@/lib/game/calculations';
import type { RegionId, ServerRack } from '@/lib/game/types';
import { Server, Globe, HardDrive, Wifi } from 'lucide-react';

export default function DeliveryTab() {
  const currentGame = useGameStore((s) => s.currentGame);
  const money = useGameStore((s) => s.money);
  const studioUpgrades = useGameStore((s) => s.unlockedStudioUpgrades);
  const employees = useGameStore((s) => s.employees);
  const addRack = useGameStore((s) => s.addRack);
  const addServerToRack = useGameStore((s) => s.addServerToRack);
  const addServer = useGameStore((s) => s.addServer);
  const spendMoney = useGameStore((s) => s.spendMoney);

  const hasDatacenterUpgrade = studioUpgrades.includes('datacenter-unlocked');
  const serverCostMultiplier = getServerCostMultiplier(employees) *
    getUpgradeMultiplier('serverCostMultiplier', studioUpgrades, []);
  const regionCostMultiplier = getUpgradeMultiplier('regionUnlockCostMultiplier', studioUpgrades, []);

  if (!currentGame) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/60">
        <Globe className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg">No active game</p>
        <p className="text-sm">Release a game to manage server delivery.</p>
      </div>
    );
  }

  const isMP = currentGame.mode === 'multiplayer';
  const loadByRegion = getLoadByRegion(currentGame);
  const totalMonthlyCost = getTotalMonthlyCost(currentGame.servers);
  const totalPlayers = currentGame.platformReleases.reduce((sum, p) => sum + p.activePlayers, 0);
  const racks = currentGame.racks ?? [];

  const handleLeaseRack = (regionId: RegionId) => {
    const region = SERVER_CONFIG.regions.find(r => r.id === regionId)!;
    const cost = Math.round(SERVER_CONFIG.colocated.rackLeaseCostPerMonth * region.costMultiplier);
    const rack: ServerRack = {
      id: `rack-${regionId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      regionId,
      servers: [],
      monthlyCost: cost,
    };
    addRack(rack);
  };

  const handleAddServerToRack = (rackId: string, regionId: RegionId) => {
    const server = createColocatedServer(regionId, serverCostMultiplier);
    const region = SERVER_CONFIG.regions.find(r => r.id === regionId)!;
    const serverCost = Math.round(SERVER_CONFIG.colocated.baseCostPerMonth * region.costMultiplier * serverCostMultiplier);
    if (spendMoney(serverCost)) {
      addServerToRack(rackId, server);
    }
  };

  const handleBuyDatacenter = (regionId: RegionId) => {
    const region = SERVER_CONFIG.regions.find(r => r.id === regionId)!;
    const cost = Math.round(SERVER_CONFIG.datacenter.purchaseCost * region.costMultiplier);
    const server = createDatacenter(regionId, serverCostMultiplier);
    if (spendMoney(cost)) {
      addServer(server);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Server Infrastructure</h3>
          <p className="text-sm text-muted-foreground">
            {Math.floor(totalPlayers).toLocaleString()} total players &middot; ${totalMonthlyCost.toLocaleString()}/mo
            {isMP && currentGame.averageLatencyMs > 0 && (
              <> &middot; <Wifi className="inline h-3 w-3" /> {currentGame.averageLatencyMs}ms avg</>
            )}
          </p>
        </div>
        {!isMP && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            Single Player — servers optional
          </Badge>
        )}
      </div>

      <div className="grid gap-4">
        {SERVER_CONFIG.regions.map((region) => {
          const load = loadByRegion[region.id] ?? 0;
          const overloaded = isRegionOverloaded(load);
          const regionPlayers = Math.floor(totalPlayers * region.playerDemandWeight);
          const regionRacks = racks.filter(r => r.regionId === region.id);
          const regionDCs = currentGame.servers.filter(s => s.regionId === region.id && s.type === 'datacenter');
          const totalCapacity = regionRacks.reduce((sum, r) => sum + r.servers.reduce((s2, sv) => s2 + sv.capacity, 0), 0) +
            regionDCs.reduce((sum, dc) => sum + dc.capacity, 0);
          const loadPercent = totalCapacity > 0 ? Math.min(100, (regionPlayers / totalCapacity) * 100) : 0;
          const isUnlocked = region.unlockCost === 0 || totalCapacity > 0 || regionRacks.length > 0;
          const unlockCost = Math.round(region.unlockCost * regionCostMultiplier);
          const canAddRack = regionRacks.length < SERVER_CONFIG.colocated.maxRacksPerRegion;
          const regionalFans = currentGame.regionalFans[region.id as RegionId] ?? 0;

          return (
            <Card key={region.id} className={overloaded && isMP ? 'border-red-500' : ''}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{region.name}</span>
                    {overloaded && isMP && (
                      <Badge variant="destructive" className="text-xs">OVERLOADED</Badge>
                    )}
                    {!isUnlocked && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">Locked</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <div>{regionPlayers.toLocaleString()} players / {totalCapacity.toLocaleString()} cap</div>
                    {regionalFans > 0 && <div>{Math.floor(regionalFans).toLocaleString()} fans</div>}
                  </div>
                </div>

                {isUnlocked && totalCapacity > 0 && (
                  <Progress value={loadPercent} className={`h-2 ${overloaded ? '[&>div]:bg-red-500' : ''}`} />
                )}

                {isUnlocked ? (
                  <div className="space-y-2">
                    {/* Racks */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {regionRacks.map((rack) => (
                        <div key={rack.id} className="border border-border rounded-md p-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">
                              <HardDrive className="inline h-3 w-3 mr-1" />
                              Rack
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {rack.servers.length}/{SERVER_CONFIG.colocated.serversPerRack}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {Array.from({ length: SERVER_CONFIG.colocated.serversPerRack }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-2 w-3 rounded-sm ${
                                  i < rack.servers.length ? 'bg-green-500' : 'bg-muted'
                                }`}
                              />
                            ))}
                          </div>
                          {rack.servers.length < SERVER_CONFIG.colocated.serversPerRack && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs h-6 cursor-pointer"
                              onClick={() => handleAddServerToRack(rack.id, region.id as RegionId)}
                            >
                              + Server
                            </Button>
                          )}
                        </div>
                      ))}

                      {canAddRack && (
                        <Button
                          variant="outline"
                          className="border-dashed h-full min-h-[60px] text-xs cursor-pointer"
                          onClick={() => handleLeaseRack(region.id as RegionId)}
                        >
                          + Lease Rack
                        </Button>
                      )}
                    </div>

                    {/* Datacenter */}
                    {hasDatacenterUpgrade && (
                      <div className="flex items-center gap-2 pt-1">
                        {regionDCs.map((dc) => (
                          <Badge key={dc.id} variant="outline" className="text-xs">
                            DC ({dc.capacity.toLocaleString()} cap)
                          </Badge>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs cursor-pointer"
                          disabled={money < Math.round(SERVER_CONFIG.datacenter.purchaseCost * region.costMultiplier)}
                          onClick={() => handleBuyDatacenter(region.id as RegionId)}
                        >
                          + Datacenter (${Math.round(SERVER_CONFIG.datacenter.purchaseCost * region.costMultiplier).toLocaleString()})
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="text-xs cursor-pointer"
                    disabled={money < unlockCost}
                    onClick={() => {
                      if (spendMoney(unlockCost)) {
                        handleLeaseRack(region.id as RegionId);
                      }
                    }}
                  >
                    Unlock Region (${unlockCost.toLocaleString()})
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
