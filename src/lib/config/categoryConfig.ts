import type { PhaseCategories } from '@/lib/game/types';
import type { SkillType } from '@/lib/game/types';

// ============================================================
// Category → Employee Skill Mapping
// ============================================================

export interface CategorySkillMapping {
  primary: SkillType;
  secondary?: SkillType;
}

export const CATEGORY_SKILL_MAP: Record<keyof PhaseCategories, CategorySkillMapping> = {
  engine:      { primary: 'gameplay', secondary: 'polish' },
  gameplay:    { primary: 'gameplay' },
  storyQuests: { primary: 'gameplay', secondary: 'polish' },
  dialogues:   { primary: 'sound',    secondary: 'polish' },
  levelDesign: { primary: 'graphics', secondary: 'gameplay' },
  ai:          { primary: 'gameplay', secondary: 'polish' },
  worldDesign: { primary: 'graphics', secondary: 'gameplay' },
  graphics:    { primary: 'graphics' },
  sound:       { primary: 'sound' },
};

export const PRIMARY_SKILL_WEIGHT = 0.7;
export const SECONDARY_SKILL_WEIGHT = 0.3;

// ============================================================
// Category Development Rate
// ============================================================

export const CATEGORY_DEV_CONFIG = {
  rateConstant: 0.06,
  tickScale: 6,
  researchRateConstant: 0.10,
  researchTickScale: 6,
} as const;

// ============================================================
// All 9 development categories
// ============================================================

export const ALL_CATEGORIES: (keyof PhaseCategories)[] = [
  'engine', 'gameplay', 'storyQuests',
  'dialogues', 'levelDesign', 'ai',
  'worldDesign', 'graphics', 'sound',
];
