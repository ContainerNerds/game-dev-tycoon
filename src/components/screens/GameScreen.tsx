'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import StudioHeader from '@/components/game/StudioHeader';
import DevMenu from '@/components/game/DevMenu';
import GameMenu from '@/components/game/GameMenu';
import TaskBar from '@/components/game/TaskBar';
import ActiveGamesBar from '@/components/game/ActiveGamesBar';
import StudioTab from '@/components/game/tabs/StudioTab';
import UpgradesTab from '@/components/game/tabs/UpgradesTab';
import BugsTab from '@/components/game/tabs/BugsTab';
import ResearchTab from '@/components/game/tabs/ResearchTab';
import DeliveryTab from '@/components/game/tabs/DeliveryTab';
import StaffTab from '@/components/game/tabs/StaffTab';
import OfficeTab from '@/components/game/tabs/OfficeTab';
import EnginesTab from '@/components/game/tabs/EnginesTab';
import StudioViewTab from '@/components/game/tabs/StudioViewTab';
import { useGameTick } from '@/lib/game/useGameTick';
import { useGameStore } from '@/lib/store/gameStore';
import { loadSettings } from '@/lib/store/saveLoad';
import { initSoundSystem } from '@/lib/game/sounds';
import BankruptcyScreen from '@/components/screens/BankruptcyScreen';

interface GameScreenProps {
  slotId: number;
  onQuit: () => void;
}

export default function GameScreen({ slotId, onQuit }: GameScreenProps) {
  useGameTick();
  const [menuOpen, setMenuOpen] = useState(false);

  const isBankrupt = useGameStore((s) => s.isBankrupt);
  const saveToSlot = useGameStore((s) => s.saveToSlot);
  const totalBugs = useGameStore((s) => {
    const gameBugs = s.activeGames.reduce((sum, g) => sum + g.bugs.length, 0);
    const taskBugs = s.activeTasks.reduce((sum, t) => sum + (t.bugs?.length ?? 0), 0);
    return gameBugs + taskBugs;
  });

  const handleSave = useCallback(() => {
    saveToSlot(slotId);
  }, [slotId, saveToSlot]);

  useEffect(() => { initSoundSystem(); }, []);

  // Auto-save
  useEffect(() => {
    const settings = loadSettings();
    if (!settings.autoSaveEnabled) return;
    const ms = settings.autoSaveIntervalMinutes * 60 * 1000;
    const interval = setInterval(() => {
      handleSave();
    }, ms);
    return () => clearInterval(interval);
  }, [handleSave]);

  if (isBankrupt) {
    return <BankruptcyScreen onRestart={onQuit} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <StudioHeader slotId={slotId} onMenuClick={() => setMenuOpen(true)} />
      <TaskBar />
      <ActiveGamesBar />

      <div className="flex-1 min-h-0">
        <Tabs defaultValue="studio" className="h-full flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-background px-2 sm:px-4 shrink-0 overflow-x-auto no-scrollbar">
            <TabsTrigger value="studio" className="cursor-pointer">Studio</TabsTrigger>
            <TabsTrigger value="delivery" className="cursor-pointer">Delivery</TabsTrigger>
            <TabsTrigger value="upgrades" className="cursor-pointer">Upgrades</TabsTrigger>
            <TabsTrigger value="bugs" className="cursor-pointer">
              Bugs
              {totalBugs > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px] leading-none">
                  {totalBugs}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="research" className="cursor-pointer">Research</TabsTrigger>
            <TabsTrigger value="engines" className="cursor-pointer">Engines</TabsTrigger>
            <TabsTrigger value="staff" className="cursor-pointer">Staff</TabsTrigger>
            <TabsTrigger value="office" className="cursor-pointer">Office</TabsTrigger>
            <TabsTrigger value="studioview" className="cursor-pointer">Studio View</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto min-h-0">
            <TabsContent value="studio" className="mt-0"><StudioTab /></TabsContent>
            <TabsContent value="delivery" className="mt-0"><DeliveryTab /></TabsContent>
            <TabsContent value="upgrades" className="mt-0"><UpgradesTab /></TabsContent>
            <TabsContent value="bugs" className="mt-0"><BugsTab /></TabsContent>
            <TabsContent value="research" className="mt-0"><ResearchTab /></TabsContent>
            <TabsContent value="engines" className="mt-0"><EnginesTab /></TabsContent>
            <TabsContent value="staff" className="mt-0"><StaffTab /></TabsContent>
            <TabsContent value="office" className="mt-0"><OfficeTab /></TabsContent>
            <TabsContent value="studioview" className="mt-0"><StudioViewTab /></TabsContent>
          </div>
        </Tabs>
      </div>

      <GameMenu slotId={slotId} onQuit={onQuit} open={menuOpen} onOpenChange={setMenuOpen} />
      <DevMenu />
    </div>
  );
}
