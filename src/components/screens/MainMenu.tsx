'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGameStore } from '@/lib/store/gameStore';
import { hasSavedGame, getSaveTimestamp } from '@/lib/store/saveLoad';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { GameCreationWizard } from '@/components/game/GameCreationWizard';

interface MainMenuProps {
  onStartGame: () => void;
}

export default function MainMenu({ onStartGame }: MainMenuProps) {
  const [showWizard, setShowWizard] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [saveDate, setSaveDate] = useState<string | null>(null);
  const loadSavedGame = useGameStore((s) => s.loadSavedGame);

  useEffect(() => {
    setHasSave(hasSavedGame());
    const ts = getSaveTimestamp();
    if (ts) {
      setSaveDate(new Date(ts).toLocaleString());
    }
  }, []);

  const handleLoad = () => {
    const success = loadSavedGame();
    if (success) onStartGame();
  };

  if (showWizard) {
    return <GameCreationWizard onStart={onStartGame} onBack={() => setShowWizard(false)} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md border-border bg-card/80 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold tracking-tight text-foreground">
            Game Dev Tycoon
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Build your game development empire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full text-lg py-6 cursor-pointer"
            size="lg"
            onClick={() => setShowWizard(true)}
          >
            New Game
          </Button>
          <Button
            className="w-full text-lg py-6 cursor-pointer"
            size="lg"
            variant="secondary"
            disabled={!hasSave}
            onClick={handleLoad}
          >
            {hasSave ? 'Load Game' : 'No Save Found'}
          </Button>
          {hasSave && saveDate && (
            <p className="text-center text-sm text-muted-foreground/60">
              Last saved: {saveDate}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
