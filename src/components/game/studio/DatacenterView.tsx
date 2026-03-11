'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { SERVER_CONFIG } from '@/lib/config/serverConfig';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Server, HardDrive } from 'lucide-react';
import type { RegionId } from '@/lib/game/types';

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

function RackVisual({ serverCount, maxServers, regionId }: {
  serverCount: number;
  maxServers: number;
  regionId: string;
}) {
  const slots = [];
  for (let i = 0; i < maxServers; i++) {
    const filled = i < serverCount;
    slots.push(
      <div
        key={i}
        className={`h-3 rounded-sm transition-colors ${
          filled ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-muted-foreground/10'
        }`}
      />,
    );
  }

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          className="cursor-default"
        >
          <div className="space-y-0.5 p-1.5 bg-muted/60 rounded border border-border w-[52px]">
            <div className="flex items-center justify-center mb-1">
              <HardDrive className="w-3 h-3 text-muted-foreground" />
            </div>
            <div className="grid gap-0.5">{slots}</div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div>Rack in {regionId}</div>
          <div>{serverCount}/{maxServers} servers</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function DatacenterVisual({ capacity, loadRatio, regionId, cost }: {
  capacity: number;
  loadRatio: number;
  regionId: string;
  cost: number;
}) {
  const color = getLoadColor(loadRatio);
  const borderColor = getLoadBorder(loadRatio);

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          className="cursor-default"
        >
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
          <div>Datacenter — {regionId}</div>
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
        <p className="text-xs">Purchase servers in the Delivery tab to see them here.</p>
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

              <div className="flex flex-wrap gap-2">
                {regionRacks.map((rack) => (
                  <RackVisual
                    key={rack.id}
                    serverCount={rack.servers.length}
                    maxServers={SERVER_CONFIG.colocated.serversPerRack}
                    regionId={region.name}
                  />
                ))}
                {regionDCs.map((dc) => (
                  <DatacenterVisual
                    key={dc.id}
                    capacity={dc.capacity}
                    loadRatio={loadRatio}
                    regionId={region.name}
                    cost={dc.monthlyCost}
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
