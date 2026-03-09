'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGameStore } from '@/lib/store/gameStore';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { ALL_GENRES, ALL_STYLES, getComboMultiplier } from '@/lib/config/genreStyleConfig';
import { randomStudioName, randomGameName } from '@/lib/config/nameConfig';
import type { Genre, Style, Platform, PillarWeights, GameInDev, GameMode } from '@/lib/game/types';
import { Shuffle } from 'lucide-react';

interface GameCreationWizardProps {
  onStart: () => void;
  onBack: () => void;
}

export function GameCreationWizard({ onStart, onBack }: GameCreationWizardProps) {
  const [step, setStep] = useState<'studio' | 'game'>('studio');

  // Studio setup
  const [studioName, setStudioName] = useState(randomStudioName);
  const [startingMoney, setStartingMoney] = useState<number>(GAME_CONFIG.defaultStartingMoney);

  // Game setup
  const [gameName, setGameName] = useState(randomGameName);
  const [genre, setGenre] = useState<Genre>('RPG');
  const [style, setStyle] = useState<Style>('Fantasy');
  const [pillars, setPillars] = useState<PillarWeights>({
    graphics: 25,
    gameplay: 25,
    sound: 25,
    polish: 25,
  });
  const [gameMode, setGameMode] = useState<GameMode>('singleplayer');

  const newGame = useGameStore((s) => s.newGame);
  const startDevelopment = useGameStore((s) => s.startDevelopment);
  const setSpeed = useGameStore((s) => s.setSpeed);

  const handlePillarChange = (key: keyof PillarWeights, newValue: number) => {
    const others = Object.keys(pillars).filter((k) => k !== key) as (keyof PillarWeights)[];
    const remaining = 100 - newValue;
    const oldOthersTotal = others.reduce((sum, k) => sum + pillars[k], 0);

    const newPillars = { ...pillars, [key]: newValue };

    if (oldOthersTotal > 0) {
      for (const k of others) {
        newPillars[k] = Math.round((pillars[k] / oldOthersTotal) * remaining);
      }
      // Fix rounding errors
      const total = Object.values(newPillars).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        newPillars[others[0]] += 100 - total;
      }
    } else {
      const each = Math.floor(remaining / others.length);
      for (const k of others) newPillars[k] = each;
      newPillars[others[0]] += remaining - each * others.length;
    }

    setPillars(newPillars);
  };

  const handleCreate = () => {
    newGame(studioName, startingMoney);

    // Base complexity determines total points needed
    const baseComplexity = 100;
    const pillarTargets = {
      graphics: Math.round((pillars.graphics / 100) * baseComplexity),
      gameplay: Math.round((pillars.gameplay / 100) * baseComplexity),
      sound: Math.round((pillars.sound / 100) * baseComplexity),
      polish: Math.round((pillars.polish / 100) * baseComplexity),
    };

    const gameInDev: GameInDev = {
      id: `game-${Date.now()}`,
      name: gameName,
      genre,
      style,
      mode: gameMode,
      platforms: ['PC'],
      pillarWeights: pillars,
      pillarProgress: { graphics: 0, gameplay: 0, sound: 0, polish: 0 },
      pillarTargets,
      progressPercent: 0,
      bugsFound: 0,
      devCostSpent: 0,
      isCrunching: false,
      crunchBugPenalty: 0,
    };

    startDevelopment(gameInDev);
    setSpeed(1);
    onStart();
  };

  const isStudioValid = studioName.trim().length > 0;
  const isGameValid = gameName.trim().length > 0;

  const comboMultiplier = getComboMultiplier(genre, style);
  const comboLabel = comboMultiplier >= 2.0 ? 'Great combo!' : comboMultiplier >= 1.5 ? 'Good combo' : comboMultiplier >= 1.0 ? 'Average combo' : 'Poor combo';
  const comboColor = comboMultiplier >= 2.0 ? 'text-green-400' : comboMultiplier >= 1.5 ? 'text-blue-400' : comboMultiplier >= 1.0 ? 'text-muted-foreground' : 'text-red-400';

  if (step === 'studio') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Create Your Studio</CardTitle>
            <CardDescription className="text-muted-foreground">
              Choose a name and starting budget for your studio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="studioName" className="text-muted-foreground">Studio Name</Label>
              <div className="flex gap-2">
                <Input
                  id="studioName"
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="Enter studio name..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 cursor-pointer"
                  onClick={() => setStudioName(randomStudioName())}
                  title="Randomize"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Starting Money</Label>
              <Select
                value={startingMoney.toString()}
                onValueChange={(v) => setStartingMoney(Number(v))}
              >
                <SelectTrigger className="border-border bg-muted text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GAME_CONFIG.startingMoneyOptions.map((amount) => (
                    <SelectItem key={amount} value={amount.toString()}>
                      ${amount.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 cursor-pointer" onClick={onBack}>
                Back
              </Button>
              <Button
                className="flex-1 cursor-pointer"
                disabled={!isStudioValid}
                onClick={() => setStep('game')}
              >
                Next: Design Your Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-border bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">Design Your First Game</CardTitle>
          <CardDescription className="text-muted-foreground">
            {studioName}&apos;s debut title
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="gameName" className="text-muted-foreground">Game Name</Label>
            <div className="flex gap-2">
              <Input
                id="gameName"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Enter game name..."
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 cursor-pointer"
                onClick={() => setGameName(randomGameName())}
                title="Randomize"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Genre</Label>
              <Select value={genre} onValueChange={(v) => setGenre(v as Genre)}>
                <SelectTrigger className="border-border bg-muted text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_GENRES.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Style</Label>
              <Select value={style} onValueChange={(v) => setStyle(v as Style)}>
                <SelectTrigger className="border-border bg-muted text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STYLES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-center">
            <span className={`text-sm font-medium ${comboColor}`}>
              {genre} + {style}: {comboLabel} ({comboMultiplier}x)
            </span>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Game Mode</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={gameMode === 'singleplayer' ? 'default' : 'outline'}
                className="flex-1 cursor-pointer"
                onClick={() => setGameMode('singleplayer')}
              >
                Single Player
              </Button>
              <Button
                type="button"
                variant={gameMode === 'multiplayer' ? 'default' : 'outline'}
                className="flex-1 cursor-pointer"
                onClick={() => setGameMode('multiplayer')}
              >
                Multiplayer
              </Button>
            </div>
            {gameMode === 'multiplayer' && (
              <p className="text-xs text-muted-foreground">
                Multiplayer games require servers. You&apos;ll need at least 1 server before release.
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-muted-foreground">Development Focus (must total 100%)</Label>
            {(Object.keys(pillars) as (keyof PillarWeights)[]).map((key) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{key}</span>
                  <span className="text-foreground font-mono">{pillars[key]}%</span>
                </div>
                <Slider
                  value={[pillars[key]]}
                  onValueChange={(val) => handlePillarChange(key, Array.isArray(val) ? val[0] : val)}
                  min={0}
                  max={100}
                  step={5}
                  className="cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setStep('studio')}>
              Back
            </Button>
            <Button
              className="flex-1 cursor-pointer"
              disabled={!isGameValid}
              onClick={handleCreate}
            >
              Start Development
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
