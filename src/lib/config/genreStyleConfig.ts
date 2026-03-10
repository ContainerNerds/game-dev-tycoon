import type { Genre, Style, Topic } from '@/lib/game/types';

interface GenreStyleEntry {
  genre: Genre;
  style: Style;
  saleMultiplier: number;       // hidden multiplier on sale rate (1x–3x)
  idealPillars: {               // ideal pillar weight distribution for best review score
    graphics: number;
    gameplay: number;
    sound: number;
    polish: number;
  };
}

export const GENRE_STYLE_COMBOS: GenreStyleEntry[] = [
  // RPG
  { genre: 'RPG', style: 'Fantasy',         saleMultiplier: 2.0, idealPillars: { graphics: 20, gameplay: 40, sound: 15, polish: 25 } },
  { genre: 'RPG', style: 'SciFi',           saleMultiplier: 1.5, idealPillars: { graphics: 25, gameplay: 35, sound: 20, polish: 20 } },
  { genre: 'RPG', style: 'Horror',          saleMultiplier: 1.2, idealPillars: { graphics: 20, gameplay: 30, sound: 30, polish: 20 } },
  { genre: 'RPG', style: 'Cyberpunk',       saleMultiplier: 1.8, idealPillars: { graphics: 30, gameplay: 30, sound: 20, polish: 20 } },
  { genre: 'RPG', style: 'Historical',      saleMultiplier: 1.0, idealPillars: { graphics: 20, gameplay: 35, sound: 15, polish: 30 } },
  { genre: 'RPG', style: 'PostApocalyptic', saleMultiplier: 1.4, idealPillars: { graphics: 25, gameplay: 35, sound: 20, polish: 20 } },

  // Action
  { genre: 'Action', style: 'SciFi',           saleMultiplier: 1.8, idealPillars: { graphics: 30, gameplay: 35, sound: 20, polish: 15 } },
  { genre: 'Action', style: 'Modern',          saleMultiplier: 1.5, idealPillars: { graphics: 25, gameplay: 40, sound: 15, polish: 20 } },
  { genre: 'Action', style: 'Fantasy',         saleMultiplier: 1.6, idealPillars: { graphics: 25, gameplay: 40, sound: 15, polish: 20 } },
  { genre: 'Action', style: 'Cyberpunk',       saleMultiplier: 2.0, idealPillars: { graphics: 35, gameplay: 30, sound: 20, polish: 15 } },
  { genre: 'Action', style: 'PostApocalyptic', saleMultiplier: 1.7, idealPillars: { graphics: 25, gameplay: 35, sound: 20, polish: 20 } },
  { genre: 'Action', style: 'Horror',          saleMultiplier: 1.3, idealPillars: { graphics: 20, gameplay: 30, sound: 30, polish: 20 } },

  // Strategy
  { genre: 'Strategy', style: 'Historical', saleMultiplier: 2.0, idealPillars: { graphics: 15, gameplay: 50, sound: 10, polish: 25 } },
  { genre: 'Strategy', style: 'SciFi',      saleMultiplier: 1.8, idealPillars: { graphics: 20, gameplay: 45, sound: 15, polish: 20 } },
  { genre: 'Strategy', style: 'Fantasy',    saleMultiplier: 1.6, idealPillars: { graphics: 20, gameplay: 45, sound: 10, polish: 25 } },
  { genre: 'Strategy', style: 'Modern',     saleMultiplier: 1.3, idealPillars: { graphics: 15, gameplay: 50, sound: 10, polish: 25 } },

  // Simulation
  { genre: 'Simulation', style: 'Modern',     saleMultiplier: 1.8, idealPillars: { graphics: 20, gameplay: 40, sound: 10, polish: 30 } },
  { genre: 'Simulation', style: 'SciFi',      saleMultiplier: 1.5, idealPillars: { graphics: 25, gameplay: 40, sound: 15, polish: 20 } },
  { genre: 'Simulation', style: 'Historical', saleMultiplier: 1.4, idealPillars: { graphics: 15, gameplay: 45, sound: 10, polish: 30 } },
  { genre: 'Simulation', style: 'Cartoon',    saleMultiplier: 1.2, idealPillars: { graphics: 30, gameplay: 35, sound: 15, polish: 20 } },

  // Adventure
  { genre: 'Adventure', style: 'Fantasy',         saleMultiplier: 2.0, idealPillars: { graphics: 25, gameplay: 30, sound: 20, polish: 25 } },
  { genre: 'Adventure', style: 'Horror',          saleMultiplier: 1.7, idealPillars: { graphics: 20, gameplay: 25, sound: 35, polish: 20 } },
  { genre: 'Adventure', style: 'SciFi',           saleMultiplier: 1.5, idealPillars: { graphics: 25, gameplay: 30, sound: 25, polish: 20 } },
  { genre: 'Adventure', style: 'PostApocalyptic', saleMultiplier: 1.4, idealPillars: { graphics: 25, gameplay: 30, sound: 20, polish: 25 } },
  { genre: 'Adventure', style: 'Cartoon',         saleMultiplier: 1.3, idealPillars: { graphics: 35, gameplay: 30, sound: 15, polish: 20 } },

  // Puzzle
  { genre: 'Puzzle', style: 'Cartoon',  saleMultiplier: 1.8, idealPillars: { graphics: 25, gameplay: 45, sound: 10, polish: 20 } },
  { genre: 'Puzzle', style: 'Modern',   saleMultiplier: 1.5, idealPillars: { graphics: 20, gameplay: 50, sound: 10, polish: 20 } },
  { genre: 'Puzzle', style: 'SciFi',    saleMultiplier: 1.3, idealPillars: { graphics: 25, gameplay: 40, sound: 15, polish: 20 } },
  { genre: 'Puzzle', style: 'Fantasy',  saleMultiplier: 1.2, idealPillars: { graphics: 25, gameplay: 40, sound: 15, polish: 20 } },

  // Sports
  { genre: 'Sports', style: 'Modern',  saleMultiplier: 2.0, idealPillars: { graphics: 30, gameplay: 35, sound: 15, polish: 20 } },
  { genre: 'Sports', style: 'Cartoon', saleMultiplier: 1.5, idealPillars: { graphics: 30, gameplay: 35, sound: 10, polish: 25 } },
  { genre: 'Sports', style: 'SciFi',   saleMultiplier: 1.2, idealPillars: { graphics: 30, gameplay: 35, sound: 15, polish: 20 } },
];

export const ALL_GENRES: Genre[] = ['RPG', 'Action', 'Strategy', 'Simulation', 'Adventure', 'Puzzle', 'Sports'];
export const ALL_STYLES: Style[] = ['Fantasy', 'SciFi', 'Horror', 'Historical', 'Modern', 'Cyberpunk', 'PostApocalyptic', 'Cartoon'];
export const ALL_TOPICS: Topic[] = ALL_STYLES;

export function getComboMultiplier(genre: Genre, style: Style): number {
  const entry = GENRE_STYLE_COMBOS.find(c => c.genre === genre && c.style === style);
  return entry?.saleMultiplier ?? 1.0;
}

export function getIdealPillars(genre: Genre, style: Style): { graphics: number; gameplay: number; sound: number; polish: number } | null {
  const entry = GENRE_STYLE_COMBOS.find(c => c.genre === genre && c.style === style);
  return entry?.idealPillars ?? null;
}
