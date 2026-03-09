'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/store/gameStore';
import { processTick } from '@/lib/game/gameLoop';
import { convertDevToActiveGame } from '@/lib/game/developmentSystem';
import type { GameStore } from '@/lib/store/gameStore';
import { Wrench, X, Zap, FastForward, CheckCircle } from 'lucide-react';

export default function DevMenu() {
  const [open, setOpen] = useState(false);
  const [devSpeed, setDevSpeed] = useState(10);

  const money = useGameStore((s) => s.money);
  const gameInDev = useGameStore((s) => s.gameInDevelopment);
  const currentGame = useGameStore((s) => s.currentGame);
  const earnMoney = useGameStore((s) => s.earnMoney);

  const handleSimulateTicks = (count: number) => {
    for (let i = 0; i < count; i++) {
      const store = useGameStore.getState() as GameStore;
      if (store.calendar.monthEndPending) {
        store.dismissMonthEnd();
        store.setSpeed(1);
      }
      processTick(store);
    }
  };

  const handleFinishDev = () => {
    const store = useGameStore.getState();
    if (!store.gameInDevelopment) return;
    const dev = store.gameInDevelopment;
    // Max out all pillars
    const pillars = ['graphics', 'gameplay', 'sound', 'polish'] as const;
    for (const p of pillars) {
      const remaining = dev.pillarTargets[p] - dev.pillarProgress[p];
      if (remaining > 0) {
        store.contributePillarPoints(p, remaining);
      }
    }
    const updated = useGameStore.getState();
    if (updated.gameInDevelopment) {
      const activeGame = convertDevToActiveGame(updated.gameInDevelopment, updated);
      store.releaseGame(activeGame);
    }
  };

  const handleAddMoney = (amount: number) => {
    earnMoney(amount);
  };

  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="fixed bottom-4 right-4 z-50 cursor-pointer opacity-60 hover:opacity-100"
        onClick={() => setOpen(true)}
      >
        <Wrench className="h-4 w-4 mr-1" />
        Dev
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 border-yellow-500/50 bg-card shadow-lg">
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wrench className="h-4 w-4 text-yellow-400" />
          Developer Menu
        </CardTitle>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 cursor-pointer" onClick={() => setOpen(false)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        {/* Simulate ticks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Simulate Forward</span>
            <Badge variant="outline" className="text-xs">{devSpeed} ticks</Badge>
          </div>
          <Slider
            value={[devSpeed]}
            onValueChange={(val) => setDevSpeed(Array.isArray(val) ? val[0] : val)}
            min={1}
            max={100}
            step={1}
            className="cursor-pointer"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs cursor-pointer"
              onClick={() => handleSimulateTicks(devSpeed)}
            >
              <FastForward className="h-3 w-3 mr-1" />
              Run {devSpeed}x
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs cursor-pointer"
              onClick={() => handleSimulateTicks(720)}
              title="Simulate ~1 month (720 hours)"
            >
              +1 Month
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs cursor-pointer"
              onClick={() => handleSimulateTicks(8640)}
              title="Simulate ~1 year (8640 hours)"
            >
              +1 Year
            </Button>
          </div>
        </div>

        <Separator />

        {/* Game dev shortcuts */}
        {gameInDev && (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Development</span>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs cursor-pointer"
              onClick={handleFinishDev}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Finish &amp; Release Game Instantly
            </Button>
          </div>
        )}

        <Separator />

        {/* Money cheats */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Money</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs cursor-pointer" onClick={() => handleAddMoney(10_000)}>
              +$10k
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs cursor-pointer" onClick={() => handleAddMoney(100_000)}>
              +$100k
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs cursor-pointer" onClick={() => handleAddMoney(1_000_000)}>
              +$1M
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Balance: <span className="text-green-400 font-mono">${Math.floor(money).toLocaleString()}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
