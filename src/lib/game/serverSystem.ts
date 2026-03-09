import type { ActiveGame, RegionId, Server } from './types';
import { SERVER_CONFIG } from '@/lib/config/serverConfig';

export function getRegionDefinition(regionId: RegionId) {
  return SERVER_CONFIG.regions.find((r) => r.id === regionId)!;
}

export function getTotalCapacityByRegion(servers: Server[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const server of servers) {
    result[server.regionId] = (result[server.regionId] ?? 0) + server.capacity;
  }
  return result;
}

export function getTotalMonthlyCost(servers: Server[]): number {
  return servers.reduce((sum, s) => sum + s.monthlyCost, 0);
}

export function getLoadByRegion(game: ActiveGame): Record<string, number> {
  const capacityByRegion = getTotalCapacityByRegion(game.servers);
  const result: Record<string, number> = {};

  const totalPlayers = game.platformReleases.reduce((sum, p) => sum + p.activePlayers, 0);

  for (const region of SERVER_CONFIG.regions) {
    const regionCapacity = capacityByRegion[region.id] ?? 0;
    const regionPlayers = totalPlayers * region.playerDemandWeight;

    if (regionCapacity === 0) {
      result[region.id] = regionPlayers > 0 ? Infinity : 0;
    } else {
      result[region.id] = regionPlayers / regionCapacity;
    }
  }

  return result;
}

export function isRegionOverloaded(load: number): boolean {
  return load > SERVER_CONFIG.overloadThreshold;
}

export function calculatePlayerLossFromOverload(
  totalPlayers: number,
  overloadedRegions: string[]
): number {
  if (overloadedRegions.length === 0) return 0;

  let totalDemandWeight = 0;
  for (const regionId of overloadedRegions) {
    const region = SERVER_CONFIG.regions.find((r) => r.id === regionId);
    if (region) totalDemandWeight += region.playerDemandWeight;
  }

  return totalPlayers * totalDemandWeight * SERVER_CONFIG.overloadPlayerLossRate;
}

export function createColocatedServer(regionId: RegionId, costMultiplier: number = 1): Server {
  const region = getRegionDefinition(regionId);
  return {
    id: `colo-${regionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    regionId,
    type: 'colocated',
    capacity: SERVER_CONFIG.colocated.baseCapacity,
    monthlyCost: Math.round(SERVER_CONFIG.colocated.baseCostPerMonth * region.costMultiplier * costMultiplier),
  };
}

export function createDatacenter(regionId: RegionId, costMultiplier: number = 1): Server {
  const region = getRegionDefinition(regionId);
  return {
    id: `dc-${regionId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    regionId,
    type: 'datacenter',
    capacity: SERVER_CONFIG.datacenter.baseCapacity,
    monthlyCost: Math.round(SERVER_CONFIG.datacenter.maintenancePerMonth * region.costMultiplier * costMultiplier),
  };
}
