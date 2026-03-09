'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/store/gameStore';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { ALL_GENRES, ALL_STYLES, getComboMultiplier } from '@/lib/config/genreStyleConfig';
import { randomGameName } from '@/lib/config/nameConfig';
import type { Genre, Style, PillarWeights, GameInDev, GameMode } from '@/lib/game/types';
import { Shuffle, Rocket } from 'lucide-react';

export default function NewProjectPanel() {
  const currentGame = useGameStore((s) => s.currentGame);
  const gameInDev = useGameStore((s) => s.gameInDevelopment);
  const startDevelopment = useGameStore((s) => s.startDevelopment);

  const [expanded, setExpanded] = useState(false);
  const [gameName, setGameName] = useState(randomGameName);
  const [genre, setGenre] = useState<Genre>('RPG');
  const [style, setStyle] = useState<Style>('Fantasy');
  const [gameMode, setGameMode] = useState<GameMode>('singleplayer');
  const [pillars, setPillars] = useState<PillarWeights>({
    graphics: 25, gameplay: 25, sound: 25, polish: 25,
  });

  if (gameInDev) return null;
  const hasLiveGame = currentGame && currentGame.phase !== 'retired';

  const handlePillarChange = (key: keyof PillarWeights, newValue: number) => {
    const others = Object.keys(pillars).filter((k) => k !== key) as (keyof PillarWeights)[];
    const remaining = 100 - newValue;
    const oldOthersTotal = others.reduce((sum, k) => sum + pillars[k], 0);
    const newPillars = { ...pillars, [key]: newValue };
    if (oldOthersTotal > 0) {
      for (const k of others) {
        newPillars[k] = Math.round((pillars[k] / oldOthersTotal) * remaining);
      }
      const total = Object.values(newPillars).reduce((a, b) => a + b, 0);
      if (total !== 100) newPillars[others[0]] += 100 - total;
    } else {
      const each = Math.floor(remaining / others.length);
      for (const k of others) newPillars[k] = each;
      newPillars[others[0]] += remaining - each * others.length;
    }
    setPillars(newPillars);
  };

  const handleStart = () => {
    const baseComplexity = 100;
    const game: GameInDev = {
      id: `game-${Date.now()}`,
      name: gameName,
      genre,
      style,
      mode: gameMode,
      platforms: ['PC'],
      pillarWeights: pillars,
      pillarProgress: { graphics: 0, gameplay: 0, sound: 0, polish: 0 },
      pillarTargets: {
        graphics: Math.round((pillars.graphics / 100) * baseComplexity),
        gameplay: Math.round((pillars.gameplay / 100) * baseComplexity),
        sound: Math.round((pillars.sound / 100) * baseComplexity),
        polish: Math.round((pillars.polish / 100) * baseComplexity),
      },
      progressPercent: 0,
      bugsFound: 0,
      devCostSpent: 0,
      isCrunching: false,
      crunchBugPenalty: 0,
    };
    startDevelopment(game);
    setExpanded(false);
  };

  const comboMultiplier = getComboMultiplier(genre, style);
  const comboLabel = comboMultiplier >= 2.0 ? 'Great combo!' : comboMultiplier >= 1.5 ? 'Good combo' : comboMultiplier >= 1.0 ? 'Average' : 'Poor';
  const comboColor = comboMultiplier >= 2.0 ? 'text-green-400' : comboMultiplier >= 1.5 ? 'text-blue-400' : 'text-muted-foreground' ;

  if (!expanded) {
    return (
      <div className="border-b border-border bg-card/30 px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          <Rocket className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {hasLiveGame ? 'Start a new project alongside your live game' : 'No active project'}
          </span>
          <Button
            size="sm"
            className="text-xs cursor-pointer"
            onClick={() => setExpanded(true)}
          >
            New Game Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border bg-card/50 px-4 py-3 shrink-0">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">New Game Project</CardTitle>
          <CardDescription>Design your next game</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Game Name</Label>
              <div className="flex gap-1">
                <Input
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="Game name..."
                  className="text-sm h-8"
                />
                <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0 cursor-pointer" onClick={() => setGameName(randomGameName())}>
                  <Shuffle className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Genre</Label>
              <Select value={genre} onValueChange={(v) => setGenre(v as Genre)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Style</Label>
              <Select value={style} onValueChange={(v) => setStyle(v as Style)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Mode</Label>
              <div className="flex gap-1">
                <Button size="sm" variant={gameMode === 'singleplayer' ? 'default' : 'outline'} className="flex-1 h-8 text-xs cursor-pointer" onClick={() => setGameMode('singleplayer')}>SP</Button>
                <Button size="sm" variant={gameMode === 'multiplayer' ? 'default' : 'outline'} className="flex-1 h-8 text-xs cursor-pointer" onClick={() => setGameMode('multiplayer')}>MP</Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className={`text-xs font-medium ${comboColor}`}>
              {genre} + {style}: {comboLabel} ({comboMultiplier}x)
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {(Object.keys(pillars) as (keyof PillarWeights)[]).map((key) => (
              <div key={key} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="capitalize text-muted-foreground">{key}</span>
                  <span className="font-mono">{pillars[key]}%</span>
                </div>
                <Slider
                  value={[pillars[key]]}
                  onValueChange={(val) => handlePillarChange(key, Array.isArray(val) ? val[0] : val)}
                  min={0} max={100} step={5}
                  className="cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs cursor-pointer" onClick={() => setExpanded(false)}>Cancel</Button>
            <Button size="sm" className="text-xs cursor-pointer" disabled={!gameName.trim()} onClick={handleStart}>
              Start Development
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
