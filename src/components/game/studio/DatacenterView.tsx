'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { SERVER_CONFIG } from '@/lib/config/serverConfig';
import { createColocatedServer, createDatacenter } from '@/lib/game/serverSystem';
import { getUpgradeMultiplier, getServerCostMultiplier } from '@/lib/game/calculations';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Server, HardDrive } from 'lucide-react';
import type { RegionId, ServerRack } from '@/lib/game/types';

function formatMoney(n: number): string {
  return `$${n.toLocaleString()}`;
}

function getLoadColor(ratio: number): string {
  if (ratio < 0.5) return 'bg-sky-500';
  if (ratio < 0.75) return 'bg-emerald-500';
  if (ratio < 0.9) return 'bg-amber-500';
  return 'bg-red-500';
}

function getLoadBorder(ratio: number): string {
  if (ratio < 0.5) return 'border-sky-500/30';
  if (ratio < 0.75) return 'border-emerald-500/30';
  if (ratio < 0.9) return 'border-amber-500/30';
  return 'border-red-500/30';
}

function RackVisual({ serverCount, maxServers, regionName, rackId, regionId, srvCost, money, onAddServer }: {
  serverCount: number;
  maxServers: number;
  regionName: string;
  rackId: string;
  regionId: RegionId;
  srvCost: number;
  money: number;
  onAddServer: (rackId: string, regionId: RegionId) => void;
}) {
  const canAdd = serverCount < maxServers;

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger className="cursor-default">
          <div className="space-y-0.5 p-1.5 bg-muted/60 rounded border border-border w-[52px]">
            <div className="flex items-center justify-center mb-1">
              <HardDrive className="w-3 h-3 text-muted-foreground" />
            </div>
            <div className="grid gap-0.5">
              {Array.from({ length: maxServers }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 rounded-sm transition-colors ${
                    i < serverCount ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-muted-foreground/10'
                  }`}
                />
              ))}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs space-y-1">
          <div>Rack in {regionName}</div>
          <div>{serverCount}/{maxServers} servers</div>
          {canAdd && <div>+ Server: {formatMoney(srvCost)}/mo</div>}
        </TooltipContent>
      </Tooltip>
      {canAdd && (
        <Button
          size="sm"
          variant="outline"
          className="w-[52px] text-[9px] h-5 mt-0.5 cursor-pointer"
          disabled={money < srvCost}
          onClick={() => onAddServer(rackId, regionId)}
        >
          +Srv
        </Button>
      )}
    </TooltipProvider>
  );
}

function DatacenterVisual({ capacity, loadRatio, regionName, cost }: {
  capacity: number;
  loadRatio: number;
  regionName: string;
  cost: number;
}) {
  const color = getLoadColor(loadRatio);
  const borderColor = getLoadBorder(loadRatio);

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger className="cursor-default">
          <div className={`p-2 bg-muted/60 rounded border ${borderColor} w-[72px] space-y-1`}>
            <div className="flex items-center justify-center">
              <Server className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-[9px] text-center font-medium">Datacenter</div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${color} transition-all`}
                style={{ width: `${Math.min(100, loadRatio * 100)}%` }}
              />
            </div>
            <div className="text-[8px] text-center text-muted-foreground">
              {Math.round(loadRatio * 100)}%
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div>Datacenter — {regionName}</div>
          <div>Capacity: {capacity.toLocaleString()} players</div>
          <div>Load: {Math.round(loadRatio * 100)}%</div>
          <div>Cost: {formatMoney(cost)}/mo</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function DatacenterView() {
  const racks = useGameStore((s) => s.racks);
  const servers = useGameStore((s) => s.servers);
  const activeGames = useGameStore((s) => s.activeGames);
  const money = useGameStore((s) => s.money);
  const employees = useGameStore((s) => s.employees);
  const studioUpgrades = useGameStore((s) => s.unlockedStudioUpgrades);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const addRack = useGameStore((s) => s.addRack);
  const addServerToRack = useGameStore((s) => s.addServerToRack);
  const addServer = useGameStore((s) => s.addServer);

  const hasDatacenterUpgrade = studioUpgrades.includes('datacenter-unlocked');
  const serverCostMultiplier = getServerCostMultiplier(employees) *
    getUpgradeMultiplier('serverCostMultiplier', studioUpgrades, []);

  const getServerCost = (regionId: RegionId) =>
    Math.round(SERVER_CONFIG.colocated.baseCostPerMonth * SERVER_CONFIG.regions.find(r => r.id === regionId)!.costMultiplier * serverCostMultiplier);

  const getRackCost = (regionId: RegionId) =>
    Math.round(SERVER_CONFIG.colocated.rackLeaseCostPerMonth * SERVER_CONFIG.regions.find(r => r.id === regionId)!.costMultiplier);

  const handleAddServerToRack = (rackId: string, regionId: RegionId) => {
    const cost = getServerCost(regionId);
    const server = createColocatedServer(regionId, serverCostMultiplier);
    if (spendMoney(cost)) {
      addServerToRack(rackId, server);
    }
  };

  const handleLeaseRack = (regionId: RegionId) => {
    const cost = getRackCost(regionId);
    if (!spendMoney(cost)) return;
    const rack: ServerRack = {
      id: `rack-${regionId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      regionId,
      servers: [],
      monthlyCost: cost,
    };
    addRack(rack);
  };

  const handleBuyDatacenter = (regionId: RegionId) => {
    const region = SERVER_CONFIG.regions.find(r => r.id === regionId)!;
    const cost = Math.round(SERVER_CONFIG.datacenter.purchaseCost * region.costMultiplier);
    const server = createDatacenter(regionId, serverCostMultiplier);
    if (spendMoney(cost)) {
      addServer(server);
    }
  };

  const regionData = useMemo(() => {
    const totalPlayers = activeGames.reduce((sum, g) => {
      return sum + g.platformReleases.reduce((ps, p) => ps + p.activePlayers, 0);
    }, 0);

    return SERVER_CONFIG.regions
      .map((region) => {
        const regionRacks = racks.filter((r) => r.regionId === region.id);
        const regionDCs = servers.filter(
          (s) => s.regionId === region.id && s.type === 'datacenter',
        );

        if (regionRacks.length === 0 && regionDCs.length === 0) return null;

        const colocatedCapacity = regionRacks.reduce(
          (sum, r) => sum + r.servers.reduce((rs, s) => rs + s.capacity, 0),
          0,
        );
        const dcCapacity = regionDCs.reduce((sum, s) => sum + s.capacity, 0);
        const totalCapacity = colocatedCapacity + dcCapacity;

        const regionalFans = activeGames.reduce(
          (sum, g) => sum + (g.regionalFans[region.id as RegionId] ?? 0),
          0,
        );
        const loadRatio = totalCapacity > 0 ? Math.min(1, regionalFans / totalCapacity) : 0;

        const monthlyCost =
          regionRacks.reduce((sum, r) => sum + r.monthlyCost + r.servers.reduce((rs, s) => rs + s.monthlyCost, 0), 0) +
          regionDCs.reduce((sum, s) => sum + s.monthlyCost, 0);

        return {
          region,
          regionRacks,
          regionDCs,
          totalCapacity,
          loadRatio,
          monthlyCost,
          totalPlayers,
        };
      })
      .filter(Boolean);
  }, [racks, servers, activeGames]);

  if (regionData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Server className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p>No servers deployed yet.</p>
        <p className="text-xs mt-1">Use the Regions view to unlock a region and lease your first rack.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Datacenter Infrastructure</h3>
        <p className="text-xs text-muted-foreground">
          {regionData.length} active region{regionData.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-4">
        {regionData.map((data) => {
          if (!data) return null;
          const { region, regionRacks, regionDCs, loadRatio, monthlyCost } = data;
          const regionId = region.id as RegionId;
          const canAddRack = regionRacks.length < SERVER_CONFIG.colocated.maxRacksPerRegion;
          const rackCost = getRackCost(regionId);
          const srvCost = getServerCost(regionId);
          const dcPurchaseCost = Math.round(SERVER_CONFIG.datacenter.purchaseCost * region.costMultiplier);

          return (
            <div key={region.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{region.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    loadRatio > 0.9 ? 'bg-red-500/10 text-red-500' :
                    loadRatio > 0.75 ? 'bg-amber-500/10 text-amber-600' :
                    'bg-emerald-500/10 text-emerald-600'
                  }`}>
                    {Math.round(loadRatio * 100)}% load
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatMoney(monthlyCost)}/mo
                </span>
              </div>

              <div className="flex flex-wrap gap-2 items-start">
                {regionRacks.map((rack) => (
                  <RackVisual
                    key={rack.id}
                    serverCount={rack.servers.length}
                    maxServers={SERVER_CONFIG.colocated.serversPerRack}
                    regionName={region.name}
                    rackId={rack.id}
                    regionId={regionId}
                    srvCost={srvCost}
                    money={money}
                    onAddServer={handleAddServerToRack}
                  />
                ))}
                {regionDCs.map((dc) => (
                  <DatacenterVisual
                    key={dc.id}
                    capacity={dc.capacity}
                    loadRatio={loadRatio}
                    regionName={region.name}
                    cost={dc.monthlyCost}
                  />
                ))}

                {canAddRack && (
                  <Button
                    variant="outline"
                    className="border-dashed min-h-[60px] text-xs cursor-pointer px-3"
                    disabled={money < rackCost}
                    onClick={() => handleLeaseRack(regionId)}
                  >
                    + Rack ({formatMoney(rackCost)}/mo)
                  </Button>
                )}

                {hasDatacenterUpgrade && (
                  <Button
                    variant="outline"
                    className="border-dashed min-h-[60px] text-xs cursor-pointer px-3"
                    disabled={money < dcPurchaseCost}
                    onClick={() => handleBuyDatacenter(regionId)}
                  >
                    + DC ({formatMoney(dcPurchaseCost)})
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
