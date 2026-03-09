import type { RegionId, Server } from './types';
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

// Geographic proximity mapping: unserved regions route to nearest served region
const NEAREST_REGION_MAP: Record<string, string[]> = {
  'us-east': ['us-west'],
  'us-west': ['us-east'],
  'brazil': ['us-east', 'us-west'],
  'saudi-arabia': ['russia', 'india', 'us-east'],
  'russia': ['saudi-arabia', 'us-east', 'japan'],
  'india': ['saudi-arabia', 'japan', 'australia'],
  'china': ['japan', 'india', 'russia'],
  'japan': ['china', 'us-west', 'australia'],
  'australia': ['japan', 'india', 'us-west'],
};

export function getNearestServedRegion(regionId: string, servedRegions: Set<string>): string | null {
  const candidates = NEAREST_REGION_MAP[regionId] ?? [];
  for (const candidate of candidates) {
    if (servedRegions.has(candidate)) return candidate;
  }
  // Fallback: any served region
  for (const r of servedRegions) return r;
  return null;
}

/**
 * Calculate load per region with nearest-region routing.
 * Unserved regions route their players to the nearest served region.
 */
export function getLoadByRegion(totalPlayers: number, servers: Server[]): Record<string, number> {
  const capacityByRegion = getTotalCapacityByRegion(servers);
  const servedRegions = new Set(Object.keys(capacityByRegion).filter((r) => capacityByRegion[r] > 0));
  const effectivePlayers: Record<string, number> = {};

  for (const region of SERVER_CONFIG.regions) {
    const regionPlayers = totalPlayers * region.playerDemandWeight;
    if (servedRegions.has(region.id)) {
      effectivePlayers[region.id] = (effectivePlayers[region.id] ?? 0) + regionPlayers;
    } else {
      const nearest = getNearestServedRegion(region.id, servedRegions);
      if (nearest) {
        effectivePlayers[nearest] = (effectivePlayers[nearest] ?? 0) + regionPlayers;
      }
    }
  }

  const result: Record<string, number> = {};
  for (const region of SERVER_CONFIG.regions) {
    const cap = capacityByRegion[region.id] ?? 0;
    const players = effectivePlayers[region.id] ?? 0;
    result[region.id] = cap > 0 ? players / cap : (players > 0 ? Infinity : 0);
  }

  return result;
}

export function getRoutingInfo(servers: Server[]): Record<string, string | null> {
  const capacityByRegion = getTotalCapacityByRegion(servers);
  const servedRegions = new Set(Object.keys(capacityByRegion).filter((r) => capacityByRegion[r] > 0));
  const routing: Record<string, string | null> = {};
  for (const region of SERVER_CONFIG.regions) {
    if (servedRegions.has(region.id)) {
      routing[region.id] = null;
    } else {
      routing[region.id] = getNearestServedRegion(region.id, servedRegions);
    }
  }
  return routing;
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
