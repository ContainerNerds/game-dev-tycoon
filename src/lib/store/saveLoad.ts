import type { StudioState, BugSeverity } from '@/lib/game/types';
import { formatDate } from '@/lib/game/calendarSystem';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { getStartingUnlockedFeatures } from '@/lib/config/engineFeaturesConfig';
import { computeLevelUp } from '@/lib/config/studioLevelConfig';

const SAVE_VERSION = 11;
const SLOT_KEY_PREFIX = 'game-dev-tycoon-slot-';
const SETTINGS_KEY = 'game-dev-tycoon-settings';

export interface SaveMeta {
  studioName: string;
  ceoName: string;
  balance: number;
  yearMonth: string;
  gamesCompleted: number;
  activeGameNames: string[];
}

interface SaveEnvelope {
  version: number;
  timestamp: number;
  slotId: number;
  meta: SaveMeta;
  state: StudioState;
}

export interface GameSettings {
  autoSaveEnabled: boolean;
  autoSaveIntervalMinutes: number;
  sfxVolume: number;
  sfxMuted: boolean;
  /** When true, toasts are not shown (notifications still stored in tray) */
  notificationsToastsMuted: boolean;
  /** When true, notification sound is not played */
  notificationsSoundMuted: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
  autoSaveEnabled: true,
  autoSaveIntervalMinutes: 5,
  sfxVolume: 0.5,
  sfxMuted: false,
  notificationsToastsMuted: false,
  notificationsSoundMuted: false,
};

function buildMeta(state: StudioState): SaveMeta {
  return {
    studioName: state.studioName,
    ceoName: state.playerName,
    balance: Math.floor(state.money),
    yearMonth: formatDate(state.calendar),
    gamesCompleted: state.completedGames.length,
    activeGameNames: state.activeGames.map((g) => g.name),
  };
}

export function saveToSlot(slotId: number, state: StudioState): void {
  try {
    const envelope: SaveEnvelope = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      slotId,
      meta: buildMeta(state),
      state,
    };
    localStorage.setItem(`${SLOT_KEY_PREFIX}${slotId}`, JSON.stringify(envelope));
  } catch (e) {
    console.error(`Failed to save to slot ${slotId}:`, e);
  }
}

function migrateState(state: StudioState, fromVersion: number): StudioState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = state as any;

  if (fromVersion < 3) {
    // v2 → v3: autoAssign moved from StudioTask to Employee
    raw.employees = raw.employees.map((e: any) => ({
      ...e,
      autoAssign: e.autoAssign ?? true,
    }));
    raw.candidatePool = raw.candidatePool.map((e: any) => ({
      ...e,
      autoAssign: e.autoAssign ?? true,
    }));
    raw.activeTasks = raw.activeTasks.map(({ autoAssign: _removed, ...rest }: any) => rest);
  }

  if (fromVersion < 4) {
    // v3 → v4: Bug.fixTarget, Employee.bugsFixed + totalBugFixPoints
    const migrateBugs = (bugs: any[]) =>
      bugs.map((b: any) => ({
        ...b,
        fixTarget: b.fixTarget ?? GAME_CONFIG.bugFixTargets[b.severity as BugSeverity] ?? 50,
        fixProgress: b.fixProgress ?? 0,
      }));

    raw.activeGames = raw.activeGames.map((g: any) => ({
      ...g,
      bugs: migrateBugs(g.bugs ?? []),
    }));
    raw.activeTasks = raw.activeTasks.map((t: any) => ({
      ...t,
      bugs: t.bugs ? migrateBugs(t.bugs) : undefined,
    }));
    raw.employees = raw.employees.map((e: any) => ({
      ...e,
      bugsFixed: e.bugsFixed ?? 0,
      totalBugFixPoints: e.totalBugFixPoints ?? 0,
    }));
    raw.candidatePool = (raw.candidatePool ?? []).map((e: any) => ({
      ...e,
      bugsFixed: e.bugsFixed ?? 0,
      totalBugFixPoints: e.totalBugFixPoints ?? 0,
    }));
  }

  if (fromVersion < 5) {
    // v4 → v5: Rarity system, IV/EV, pack-based hiring
    const migrateEmployee = (e: any) => {
      const oldTotal = (e.skills?.graphics ?? 3) + (e.skills?.sound ?? 3) +
        (e.skills?.gameplay ?? 3) + (e.skills?.polish ?? 3);
      const scaleSkill = (v: number) => Math.round(((v - 1) / 4) * 31);
      let rarity: string = 'common';
      if (oldTotal >= 16) rarity = 'legendary';
      else if (oldTotal >= 14) rarity = 'epic';
      else if (oldTotal >= 11) rarity = 'rare';
      else if (oldTotal >= 8) rarity = 'uncommon';

      return {
        ...e,
        rarity: e.rarity ?? rarity,
        skills: e.skills ? {
          graphics: scaleSkill(e.skills.graphics ?? 3),
          sound: scaleSkill(e.skills.sound ?? 3),
          gameplay: scaleSkill(e.skills.gameplay ?? 3),
          polish: scaleSkill(e.skills.polish ?? 3),
        } : { graphics: 15, sound: 10, gameplay: 15, polish: 10 },
        evs: e.evs ?? { graphics: 0, sound: 0, gameplay: 0, polish: 0 },
      };
    };

    raw.employees = (raw.employees ?? []).map(migrateEmployee);

    // Migrate candidatePool → currentPack
    const oldPool = (raw.candidatePool ?? []).map(migrateEmployee);
    raw.currentPack = raw.currentPack ?? oldPool;
    raw.packRevealed = raw.packRevealed ?? new Array(raw.currentPack.length).fill(true);
    raw.freePackAvailable = raw.freePackAvailable ?? false;
    delete raw.candidatePool;
    delete raw.lastCandidateRefreshDay;
  }

  if (fromVersion < 6) {
    // v5 → v6: Engine overhaul, 9-category dev, employee types

    // Migrate engines from version-based to feature-based
    raw.engines = (raw.engines ?? []).map((e: any) => ({
      id: e.id,
      name: e.name,
      features: [],
      totalEngineCost: e.developmentCost ?? 0,
    }));

    // Add unlockedFeatures
    raw.unlockedFeatures = raw.unlockedFeatures ?? getStartingUnlockedFeatures();

    // Migrate tasks from pillar-based to category-based
    raw.activeTasks = (raw.activeTasks ?? []).map((t: any) => {
      const pillarProgress = t.pillarProgress ?? { graphics: 0, gameplay: 0, sound: 0, polish: 0 };
      const pillarTargets = t.pillarTargets ?? { graphics: 25, gameplay: 25, sound: 25, polish: 25 };

      const catProgress = t.categoryProgress ?? {
        engine: pillarProgress.gameplay * 0.33,
        gameplay: pillarProgress.gameplay * 0.34,
        storyQuests: pillarProgress.gameplay * 0.33,
        dialogues: pillarProgress.sound * 0.33,
        levelDesign: pillarProgress.graphics * 0.34,
        ai: pillarProgress.polish * 0.33,
        worldDesign: pillarProgress.graphics * 0.33,
        graphics: pillarProgress.graphics * 0.34,
        sound: pillarProgress.sound * 0.67,
      };
      const catTargets = t.categoryTargets ?? {
        engine: Math.round(pillarTargets.gameplay * 0.33),
        gameplay: Math.round(pillarTargets.gameplay * 0.34),
        storyQuests: Math.round(pillarTargets.gameplay * 0.33),
        dialogues: Math.round(pillarTargets.sound * 0.33),
        levelDesign: Math.round(pillarTargets.graphics * 0.34),
        ai: Math.round(pillarTargets.polish * 0.33),
        worldDesign: Math.round(pillarTargets.graphics * 0.33),
        graphics: Math.round(pillarTargets.graphics * 0.34),
        sound: Math.round(pillarTargets.sound * 0.67),
      };

      // Migrate pillarWeights to stageWeights
      const stageWeights = t.stageWeights ?? t.phaseWeights ?? {
        engine: 33, gameplay: 34, storyQuests: 33,
        dialogues: 33, levelDesign: 34, ai: 33,
        worldDesign: 33, graphics: 34, sound: 33,
      };

      delete t.pillarProgress;
      delete t.pillarTargets;
      delete t.pillarWeights;
      delete t.phaseProgress;
      delete t.phaseWeights;
      return {
        ...t,
        categoryProgress: catProgress,
        categoryTargets: catTargets,
        stageWeights,
        currentPhase: t.currentPhase ?? 1,
      };
    });

    // Migrate employees: add employeeType
    raw.employees = (raw.employees ?? []).map((e: any) => ({
      ...e,
      employeeType: e.employeeType ?? 'developer',
    }));
    raw.currentPack = (raw.currentPack ?? []).map((e: any) => ({
      ...e,
      employeeType: e.employeeType ?? 'developer',
    }));

    // Migrate active games: pillarWeights → stageWeights, add engineBenefitScore
    raw.activeGames = (raw.activeGames ?? []).map((g: any) => {
      const stageWeights = g.stageWeights ?? {
        engine: 33, gameplay: 34, storyQuests: 33,
        dialogues: 33, levelDesign: 34, ai: 33,
        worldDesign: 33, graphics: 34, sound: 33,
      };
      delete g.pillarWeights;
      return {
        ...g,
        stageWeights,
        engineBenefitScore: g.engineBenefitScore ?? 0,
      };
    });

    // Migrate staff contributions
    raw.staffContributions = (raw.staffContributions ?? []).map((c: any) => ({
      employeeId: c.employeeId,
      employeeName: c.employeeName,
      taskId: c.taskId,
      taskName: c.taskName,
      categories: c.categories ?? {},
      researchPoints: c.researchPoints ?? 0,
      bugsIntroduced: c.bugsIntroduced ?? 0,
      bugsFixed: c.bugsFixed ?? 0,
    }));
  }

  if (fromVersion < 7) {
    // v6 → v7: Add furniture array
    raw.furniture = raw.furniture ?? [];
  }

  if (fromVersion < 8) {
    // v7 → v8: Studio XP/level system and new skill tree
    raw.studioXP = raw.studioXP ?? 0;
    raw.studioLevel = raw.studioLevel ?? 0;
    raw.skillPoints = raw.skillPoints ?? 0;
    raw.allocatedSkills = raw.allocatedSkills ?? {};

    // Map old unlockedStudioUpgrades to new skill tree allocations
    const upgradeToSkillMap: Record<string, string> = {
      'better-marketing': 'biz-marketing',
      'efficient-ops': 'tech-server-opt',
      'basic-qa': 'prod-qa-basics',
      'viral-launch': 'biz-viral-launch',
      'datacenter-unlocked': 'tech-datacenter',
      'console-publishing': 'tech-console',
      'mobile-publishing': 'tech-mobile',
      'global-reach': 'tech-global-reach',
      'studio-brand': 'biz-studio-brand',
      'server-optimization': 'tech-server-opt',
    };

    const oldUpgrades: string[] = raw.unlockedStudioUpgrades ?? [];
    for (const oldId of oldUpgrades) {
      const newId = upgradeToSkillMap[oldId];
      if (newId && !raw.allocatedSkills[newId]) {
        raw.allocatedSkills[newId] = 1;
      }
    }

    // Grant retroactive XP based on completed games
    const completedCount = (raw.completedGames ?? []).length;
    const activeCount = (raw.activeGames ?? []).length;
    const retroactiveXP = completedCount * 200 + activeCount * 100;
    if (retroactiveXP > 0) {
      raw.studioXP = retroactiveXP;
      // Compute levels from retroactive XP
      const result = computeLevelUp(0, 0, retroactiveXP);
      raw.studioXP = result.newXP;
      raw.studioLevel = result.newLevel;
      raw.skillPoints = (raw.skillPoints ?? 0) + result.pointsGained;
    }
  }

  if (fromVersion < 9) {
    // v8 → v9: Email & notification system
    raw.inbox = raw.inbox ?? [];
    raw.notifications = raw.notifications ?? [];
  }

  if (fromVersion < 10) {
    // v9 → v10: Auto-vacation setting
    raw.autoVacationThreshold = raw.autoVacationThreshold ?? 0;
  }

  if (fromVersion < 11) {
    // v10 → v11: Categorized monthly report line items + pending line items
    raw.pendingMonthlyLineItems = raw.pendingMonthlyLineItems ?? [];

    const inferCategory = (label: string, amount: number): string => {
      if (label.startsWith('Salary:')) return 'employees';
      if (label.startsWith('Server (') || label.startsWith('Rack lease')) return 'servers';
      if (label.startsWith('Revenue:')) return 'revenue';
      if (label.startsWith('Game Dev:')) return 'game-dev';
      if (label.startsWith('Engine:')) return 'engine-dev';
      if (amount > 0) return 'revenue';
      return 'overhead';
    };

    raw.monthlyReports = (raw.monthlyReports ?? []).map((r: any) => ({
      ...r,
      gameDevCosts: r.gameDevCosts ?? 0,
      engineDevCosts: r.engineDevCosts ?? 0,
      lineItems: (r.lineItems ?? []).map((item: any) => ({
        ...item,
        category: item.category ?? inferCategory(item.label, item.amount),
      })),
    }));
  }

  return state;
}

export function loadFromSlot(slotId: number): StudioState | null {
  try {
    const raw = localStorage.getItem(`${SLOT_KEY_PREFIX}${slotId}`);
    if (!raw) return null;
    const envelope: SaveEnvelope = JSON.parse(raw);
    if (envelope.version > SAVE_VERSION) {
      console.warn(`Save version too new in slot ${slotId}`);
      return null;
    }
    if (envelope.version < SAVE_VERSION) {
      envelope.state = migrateState(envelope.state, envelope.version);
    }
    return envelope.state;
  } catch (e) {
    console.error(`Failed to load slot ${slotId}:`, e);
    return null;
  }
}

export function getSlotMeta(slotId: number): { meta: SaveMeta; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(`${SLOT_KEY_PREFIX}${slotId}`);
    if (!raw) return null;
    const envelope: SaveEnvelope = JSON.parse(raw);
    if (envelope.version > SAVE_VERSION) return null;
    return { meta: envelope.meta, timestamp: envelope.timestamp };
  } catch {
    return null;
  }
}

export function deleteSlot(slotId: number): void {
  try {
    localStorage.removeItem(`${SLOT_KEY_PREFIX}${slotId}`);
  } catch (e) {
    console.error(`Failed to delete slot ${slotId}:`, e);
  }
}

export function getAllSlotsMeta(): (({ meta: SaveMeta; timestamp: number; slotId: number }) | null)[] {
  return [0, 1, 2].map((slotId) => {
    const data = getSlotMeta(slotId);
    return data ? { ...data, slotId } : null;
  });
}

// Legacy migration: move old single save to slot 0
export function migrateLegacySave(): void {
  try {
    const old = localStorage.getItem('game-dev-tycoon-save');
    if (old && !localStorage.getItem(`${SLOT_KEY_PREFIX}0`)) {
      const parsed = JSON.parse(old);
      if (parsed?.state) {
        const envelope: SaveEnvelope = {
          version: SAVE_VERSION,
          timestamp: parsed.timestamp ?? Date.now(),
          slotId: 0,
          meta: buildMeta(parsed.state),
          state: parsed.state,
        };
        localStorage.setItem(`${SLOT_KEY_PREFIX}0`, JSON.stringify(envelope));
        localStorage.removeItem('game-dev-tycoon-save');
      }
    }
  } catch { /* ignore */ }
}

// Settings
export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}
