import type { OfficeTier } from '@/lib/game/types';

// ============================================================
// Furniture Buff Types
// ============================================================

export type FurnitureBuffType =
  | 'staminaRecovery'
  | 'staminaDrain'
  | 'devSpeed'
  | 'vacationDuration'
  | 'bugFixSpeed'
  | 'researchSpeed';

export interface FurnitureBuff {
  type: FurnitureBuffType;
  value: number;
}

// ============================================================
// Furniture Definition
// ============================================================

export interface FurnitureDefinition {
  id: string;
  name: string;
  icon: string;
  purchaseCost: number;
  monthlyMaintenance: number;
  buffs: FurnitureBuff[];
  requiredTier: OfficeTier;
  maxCount: number;
  gridSize: [number, number];
  description: string;
}

export const FURNITURE_CATALOG: FurnitureDefinition[] = [
  {
    id: 'espresso-machine',
    name: 'Espresso Machine',
    icon: 'Coffee',
    purchaseCost: 2_000,
    monthlyMaintenance: 50,
    buffs: [{ type: 'staminaRecovery', value: 0.15 }],
    requiredTier: 1,
    maxCount: 1,
    gridSize: [1, 1],
    description: '+15% stamina recovery',
  },
  {
    id: 'plants',
    name: 'Office Plants',
    icon: 'Leaf',
    purchaseCost: 500,
    monthlyMaintenance: 10,
    buffs: [{ type: 'staminaDrain', value: -0.05 }],
    requiredTier: 1,
    maxCount: 3,
    gridSize: [1, 1],
    description: '-5% stamina drain',
  },
  {
    id: 'whiteboard',
    name: 'Whiteboard',
    icon: 'PenLine',
    purchaseCost: 1_500,
    monthlyMaintenance: 0,
    buffs: [{ type: 'devSpeed', value: 0.05 }],
    requiredTier: 2,
    maxCount: 2,
    gridSize: [1, 1],
    description: '+5% dev speed',
  },
  {
    id: 'ping-pong',
    name: 'Ping Pong Table',
    icon: 'Dumbbell',
    purchaseCost: 3_000,
    monthlyMaintenance: 20,
    buffs: [{ type: 'staminaRecovery', value: 0.25 }],
    requiredTier: 2,
    maxCount: 1,
    gridSize: [2, 1],
    description: '+25% stamina recovery',
  },
  {
    id: 'snack-bar',
    name: 'Snack Bar',
    icon: 'Cookie',
    purchaseCost: 1_000,
    monthlyMaintenance: 80,
    buffs: [{ type: 'staminaDrain', value: -0.10 }],
    requiredTier: 2,
    maxCount: 1,
    gridSize: [1, 1],
    description: '-10% stamina drain',
  },
  {
    id: 'standing-desks',
    name: 'Standing Desks',
    icon: 'MonitorUp',
    purchaseCost: 4_000,
    monthlyMaintenance: 0,
    buffs: [
      { type: 'devSpeed', value: 0.03 },
      { type: 'staminaDrain', value: -0.03 },
    ],
    requiredTier: 3,
    maxCount: 1,
    gridSize: [1, 1],
    description: '+3% dev speed, -3% stamina drain',
  },
  {
    id: 'server-rack-display',
    name: 'Server Rack Display',
    icon: 'Server',
    purchaseCost: 2_500,
    monthlyMaintenance: 30,
    buffs: [{ type: 'researchSpeed', value: 0.10 }],
    requiredTier: 3,
    maxCount: 1,
    gridSize: [1, 1],
    description: '+10% research speed',
  },
  {
    id: 'qa-lab',
    name: 'QA Testing Lab',
    icon: 'FlaskConical',
    purchaseCost: 5_000,
    monthlyMaintenance: 100,
    buffs: [{ type: 'bugFixSpeed', value: 0.15 }],
    requiredTier: 3,
    maxCount: 1,
    gridSize: [2, 1],
    description: '+15% bug fix speed',
  },
];

export function getFurnitureDef(id: string): FurnitureDefinition | undefined {
  return FURNITURE_CATALOG.find((f) => f.id === id);
}

// ============================================================
// Grid Cell Types
// ============================================================

export type GridCellType = 'floor' | 'wall' | 'door' | 'desk' | 'furniture-slot';

export interface GridCell {
  type: GridCellType;
  deskIndex?: number;
  furnitureSlotIndex?: number;
}

export interface OfficeLayout {
  cols: number;
  rows: number;
  cells: GridCell[][];
  deskCount: number;
  furnitureSlotCount: number;
}

// ============================================================
// Per-Tier Office Layouts
// ============================================================

function createLayout(
  cols: number,
  rows: number,
  setup: (grid: GridCell[][]) => { desks: number; furnitureSlots: number },
): OfficeLayout {
  const cells: GridCell[][] = [];
  for (let r = 0; r < rows; r++) {
    cells[r] = [];
    for (let c = 0; c < cols; c++) {
      cells[r][c] = { type: 'floor' };
    }
  }
  // Walls on perimeter
  for (let c = 0; c < cols; c++) {
    cells[0][c] = { type: 'wall' };
    cells[rows - 1][c] = { type: 'wall' };
  }
  for (let r = 0; r < rows; r++) {
    cells[r][0] = { type: 'wall' };
    cells[r][cols - 1] = { type: 'wall' };
  }
  // Door at bottom-center
  const doorCol = Math.floor(cols / 2);
  cells[rows - 1][doorCol] = { type: 'door' };

  const counts = setup(cells);
  return { cols, rows, cells, deskCount: counts.desks, furnitureSlotCount: counts.furnitureSlots };
}

const LAYOUTS: Record<OfficeTier, OfficeLayout> = {
  0: createLayout(4, 3, (g) => {
    g[1][2] = { type: 'desk', deskIndex: 0 };
    return { desks: 1, furnitureSlots: 0 };
  }),

  1: createLayout(5, 4, (g) => {
    g[1][2] = { type: 'desk', deskIndex: 0 };
    g[2][1] = { type: 'furniture-slot', furnitureSlotIndex: 0 };
    return { desks: 1, furnitureSlots: 1 };
  }),

  2: createLayout(7, 5, (g) => {
    g[1][2] = { type: 'desk', deskIndex: 0 };
    g[1][4] = { type: 'desk', deskIndex: 1 };
    g[3][2] = { type: 'desk', deskIndex: 2 };
    g[3][4] = { type: 'desk', deskIndex: 3 };
    g[2][1] = { type: 'furniture-slot', furnitureSlotIndex: 0 };
    g[2][5] = { type: 'furniture-slot', furnitureSlotIndex: 1 };
    return { desks: 4, furnitureSlots: 2 };
  }),

  3: createLayout(9, 6, (g) => {
    g[1][2] = { type: 'desk', deskIndex: 0 };
    g[1][4] = { type: 'desk', deskIndex: 1 };
    g[1][6] = { type: 'desk', deskIndex: 2 };
    g[2][2] = { type: 'desk', deskIndex: 3 };
    g[2][4] = { type: 'desk', deskIndex: 4 };
    g[2][6] = { type: 'desk', deskIndex: 5 };
    g[4][2] = { type: 'desk', deskIndex: 6 };
    g[4][4] = { type: 'desk', deskIndex: 7 };
    g[3][1] = { type: 'furniture-slot', furnitureSlotIndex: 0 };
    g[3][7] = { type: 'furniture-slot', furnitureSlotIndex: 1 };
    g[4][6] = { type: 'furniture-slot', furnitureSlotIndex: 2 };
    g[1][7] = { type: 'furniture-slot', furnitureSlotIndex: 3 };
    return { desks: 8, furnitureSlots: 4 };
  }),

  4: createLayout(12, 8, (g) => {
    // 4 rows of 4 desks
    const deskCols = [2, 4, 7, 9];
    let deskIdx = 0;
    for (const row of [1, 2, 4, 5]) {
      for (const col of deskCols) {
        g[row][col] = { type: 'desk', deskIndex: deskIdx++ };
      }
    }
    // 6 furniture slots around the edges and middle
    g[3][1] = { type: 'furniture-slot', furnitureSlotIndex: 0 };
    g[3][5] = { type: 'furniture-slot', furnitureSlotIndex: 1 };
    g[3][6] = { type: 'furniture-slot', furnitureSlotIndex: 2 };
    g[3][10] = { type: 'furniture-slot', furnitureSlotIndex: 3 };
    g[6][1] = { type: 'furniture-slot', furnitureSlotIndex: 4 };
    g[6][10] = { type: 'furniture-slot', furnitureSlotIndex: 5 };
    return { desks: 16, furnitureSlots: 6 };
  }),
};

export function getOfficeLayout(tier: OfficeTier): OfficeLayout {
  return LAYOUTS[tier];
}
