export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'unique';

export interface RarityTier {
  label: string;
  sortOrder: number;
  weight: number;
  borderColor: string;
  textColor: string;
  bgColor: string;
  glowColor: string;
  ivRange: { min: number; max: number };
}

export const RARITY_TIERS: Record<Rarity, RarityTier> = {
  common: {
    label: 'Common',
    sortOrder: 0,
    weight: 0.50,
    borderColor: 'border-zinc-500',
    textColor: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    glowColor: 'rgba(161,161,170,0.3)',
    ivRange: { min: 0, max: 10 },
  },
  uncommon: {
    label: 'Uncommon',
    sortOrder: 1,
    weight: 0.25,
    borderColor: 'border-green-500',
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/10',
    glowColor: 'rgba(34,197,94,0.4)',
    ivRange: { min: 5, max: 15 },
  },
  rare: {
    label: 'Rare',
    sortOrder: 2,
    weight: 0.15,
    borderColor: 'border-blue-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    glowColor: 'rgba(59,130,246,0.4)',
    ivRange: { min: 10, max: 22 },
  },
  epic: {
    label: 'Epic',
    sortOrder: 3,
    weight: 0.07,
    borderColor: 'border-purple-500',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    glowColor: 'rgba(168,85,247,0.5)',
    ivRange: { min: 16, max: 27 },
  },
  legendary: {
    label: 'Legendary',
    sortOrder: 4,
    weight: 0.025,
    borderColor: 'border-amber-500',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    glowColor: 'rgba(245,158,11,0.5)',
    ivRange: { min: 22, max: 31 },
  },
  unique: {
    label: 'Unique',
    sortOrder: 5,
    weight: 0.005,
    borderColor: 'border-cyan-400',
    textColor: 'text-cyan-300',
    bgColor: 'bg-cyan-500/10',
    glowColor: 'rgba(34,211,238,0.6)',
    ivRange: { min: 22, max: 31 },
  },
} as const;

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'unique'];
