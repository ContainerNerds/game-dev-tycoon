'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/store/gameStore';
import { getAllSlotsMeta, deleteSlot, migrateLegacySave, type SaveMeta } from '@/lib/store/saveLoad';
import { GameCreationWizard } from '@/components/game/GameCreationWizard';
import { Gamepad2, Trash2, Plus } from 'lucide-react';

interface MainMenuProps {
  onStartGame: (slotId: number) => void;
}

export default function MainMenu({ onStartGame }: MainMenuProps) {
  const [showWizard, setShowWizard] = useState<number | null>(null);
  const [slots, setSlots] = useState<ReturnType<typeof getAllSlotsMeta>>([null, null, null]);
  const loadSlot = useGameStore((s) => s.loadSlot);

  useEffect(() => {
    migrateLegacySave();
    setSlots(getAllSlotsMeta());
  }, []);

  const handleLoad = (slotId: number) => {
    const success = loadSlot(slotId);
    if (success) onStartGame(slotId);
  };

  const handleDelete = (slotId: number) => {
    deleteSlot(slotId);
    setSlots(getAllSlotsMeta());
  };

  if (showWizard !== null) {
    return (
      <GameCreationWizard
        onStart={() => onStartGame(showWizard)}
        onBack={() => setShowWizard(null)}
        targetSlotId={showWizard}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-2xl px-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Game Dev Tycoon</h1>
          <p className="text-muted-foreground">Build your game development empire</p>
        </div>

        <div className="grid gap-4">
          {[0, 1, 2].map((slotId) => {
            const slot = slots[slotId];
            if (!slot) {
              return (
                <Card key={slotId} className="border-dashed">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="text-muted-foreground">
                      <p className="font-medium">Slot {slotId + 1} — Empty</p>
                      <p className="text-sm">Start a new studio</p>
                    </div>
                    <Button className="cursor-pointer" onClick={() => setShowWizard(slotId)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Game
                    </Button>
                  </CardContent>
                </Card>
              );
            }

            const { meta, timestamp } = slot;
            return (
              <Card key={slotId} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 cursor-pointer" onClick={() => handleLoad(slotId)}>
                      <div className="flex items-center gap-3">
                        <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                        <span className="font-bold text-lg">{meta.studioName}</span>
                        <Badge variant="outline" className="text-xs">Slot {slotId + 1}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                        <span>CEO: {meta.ceoName}</span>
                        <span>Date: {meta.yearMonth}</span>
                        <span className="text-green-400 font-mono">${meta.balance.toLocaleString()}</span>
                        <span>{meta.gamesCompleted} games completed</span>
                      </div>
                      {meta.activeGameNames.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {meta.activeGameNames.map((name, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{name}</Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground/60">
                        Saved {new Date(timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="default" className="cursor-pointer" onClick={() => handleLoad(slotId)}>
                        Load
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); handleDelete(slotId); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
