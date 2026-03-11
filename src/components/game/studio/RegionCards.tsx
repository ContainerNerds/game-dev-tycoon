'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/lib/store/gameStore';
import { SERVER_CONFIG } from '@/lib/config/serverConfig';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Lock, Signal } from 'lucide-react';
import type { RegionId } from '@/lib/game/types';

function formatMoney(n: number): string {
  return `$${n.toLocaleString()}`;
}

const LATENCY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Low', color: 'text-emerald-500' },
  2: { label: 'Med', color: 'text-amber-500' },
  3: { label: 'High', color: 'text-red-500' },
};

export default function RegionCards() {
  const racks = useGameStore((s) => s.racks);
  const servers = useGameStore((s) => s.servers);
  const activeGames = useGameStore((s) => s.activeGames);

  const regionStats = useMemo(() => {
    return SERVER_CONFIG.regions.map((region) => {
      const regionRacks = racks.filter((r) => r.regionId === region.id);
      const regionDCs = servers.filter(
        (s) => s.regionId === region.id && s.type === 'datacenter',
      );

      const isUnlocked = region.unlockCost === 0 || regionRacks.length > 0 || regionDCs.length > 0;

      const rackCount = regionRacks.length;
      const maxRacks = SERVER_CONFIG.colocated.maxRacksPerRegion;

      const colocatedCapacity = regionRacks.reduce(
        (sum, r) => sum + r.servers.reduce((rs, s) => rs + s.capacity, 0),
        0,
      );
      const dcCapacity = regionDCs.reduce((sum, s) => sum + s.capacity, 0);
      const totalCapacity = colocatedCapacity + dcCapacity;

      const regionalPlayers = activeGames.reduce(
        (sum, g) => sum + (g.regionalFans[region.id as RegionId] ?? 0),
        0,
      );
      const loadRatio = totalCapacity > 0 ? Math.min(1, regionalPlayers / totalCapacity) : 0;

      const monthlyCost =
        regionRacks.reduce(
          (sum, r) => sum + r.monthlyCost + r.servers.reduce((rs, s) => rs + s.monthlyCost, 0),
          0,
        ) + regionDCs.reduce((sum, s) => sum + s.monthlyCost, 0);

      return {
        region,
        isUnlocked,
        rackCount,
        maxRacks,
        dcCount: regionDCs.length,
        totalCapacity,
        regionalPlayers,
        loadRatio,
        monthlyCost,
      };
    });
  }, [racks, servers, activeGames]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Server Regions</h3>
        <p className="text-xs text-muted-foreground">
          {regionStats.filter((r) => r.isUnlocked).length}/9 regions active
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {regionStats.map(({
          region,
          isUnlocked,
          rackCount,
          maxRacks,
          dcCount,
          totalCapacity,
          regionalPlayers,
          loadRatio,
          monthlyCost,
        }) => {
          const latency = LATENCY_LABELS[region.latencyTier];

          return (
            <Card
              key={region.id}
              className={`p-3 gap-0 space-y-2 ${
                !isUnlocked ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {isUnlocked ? (
                    <Globe className="w-3.5 h-3.5 text-sky-500" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-semibold">{region.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Signal className={`w-3 h-3 ${latency.color}`} />
                  <span className={`text-[9px] ${latency.color}`}>{latency.label}</span>
                </div>
              </div>

              {isUnlocked ? (
                <>
                  {/* Rack indicator */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: maxRacks }, (_, i) => (
                        <div
                          key={i}
                          className={`w-3 h-4 rounded-sm ${
                            i < rackCount
                              ? 'bg-emerald-500 dark:bg-emerald-400'
                              : 'bg-muted-foreground/15'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {rackCount}/{maxRacks} racks
                    </span>
                    {dcCount > 0 && (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-auto">
                        {dcCount} DC
                      </Badge>
                    )}
                  </div>

                  {/* Load bar */}
                  <div className="space-y-0.5">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all rounded-full ${
                          loadRatio > 0.9
                            ? 'bg-red-500'
                            : loadRatio > 0.75
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(1, loadRatio * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground">
                      <span>
                        {Math.floor(regionalPlayers).toLocaleString()}/{totalCapacity.toLocaleString()} players
                      </span>
                      <span>{Math.round(loadRatio * 100)}%</span>
                    </div>
                  </div>

                  {/* Cost */}
                  {monthlyCost > 0 && (
                    <div className="text-[10px] text-muted-foreground">
                      {formatMoney(monthlyCost)}/mo
                    </div>
                  )}
                </>
              ) : (
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <div>Unlock cost: {formatMoney(region.unlockCost)}</div>
                  <div>Demand weight: {Math.round(region.playerDemandWeight * 100)}%</div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
