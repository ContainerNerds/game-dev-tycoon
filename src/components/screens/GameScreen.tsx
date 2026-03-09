'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StudioHeader from '@/components/game/StudioHeader';
import DevMenu from '@/components/game/DevMenu';
import GameMenu from '@/components/game/GameMenu';
import TaskBar from '@/components/game/TaskBar';
import ActiveGamesBar from '@/components/game/ActiveGamesBar';
import DashboardTab from '@/components/game/tabs/DashboardTab';
import UpgradesTab from '@/components/game/tabs/UpgradesTab';
import BugsTab from '@/components/game/tabs/BugsTab';
import ResearchTab from '@/components/game/tabs/ResearchTab';
import DeliveryTab from '@/components/game/tabs/DeliveryTab';
import PressTab from '@/components/game/tabs/PressTab';
import StaffTab from '@/components/game/tabs/StaffTab';
import OfficeTab from '@/components/game/tabs/OfficeTab';
import FinancesTab from '@/components/game/tabs/FinancesTab';
import { useGameTick } from '@/lib/game/useGameTick';
import { useGameStore } from '@/lib/store/gameStore';
import { loadSettings } from '@/lib/store/saveLoad';
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

  const handleSave = useCallback(() => {
    saveToSlot(slotId);
  }, [slotId, saveToSlot]);

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
        <Tabs defaultValue="dashboard" className="h-full flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-background px-2 sm:px-4 shrink-0 overflow-x-auto no-scrollbar">
            <TabsTrigger value="dashboard" className="cursor-pointer">Dashboard</TabsTrigger>
            <TabsTrigger value="finances" className="cursor-pointer">Finances</TabsTrigger>
            <TabsTrigger value="delivery" className="cursor-pointer">Delivery</TabsTrigger>
            <TabsTrigger value="upgrades" className="cursor-pointer">Upgrades</TabsTrigger>
            <TabsTrigger value="bugs" className="cursor-pointer">Bugs</TabsTrigger>
            <TabsTrigger value="research" className="cursor-pointer">Research</TabsTrigger>
            <TabsTrigger value="press" className="cursor-pointer">Press</TabsTrigger>
            <TabsTrigger value="staff" className="cursor-pointer">Staff</TabsTrigger>
            <TabsTrigger value="office" className="cursor-pointer">Office</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto min-h-0">
            <TabsContent value="dashboard" className="mt-0"><DashboardTab /></TabsContent>
            <TabsContent value="finances" className="mt-0"><FinancesTab /></TabsContent>
            <TabsContent value="delivery" className="mt-0"><DeliveryTab /></TabsContent>
            <TabsContent value="upgrades" className="mt-0"><UpgradesTab /></TabsContent>
            <TabsContent value="bugs" className="mt-0"><BugsTab /></TabsContent>
            <TabsContent value="research" className="mt-0"><ResearchTab /></TabsContent>
            <TabsContent value="press" className="mt-0"><PressTab /></TabsContent>
            <TabsContent value="staff" className="mt-0"><StaffTab /></TabsContent>
            <TabsContent value="office" className="mt-0"><OfficeTab /></TabsContent>
          </div>
        </Tabs>
      </div>

      <GameMenu slotId={slotId} onQuit={onQuit} open={menuOpen} onOpenChange={setMenuOpen} />
      <DevMenu />
    </div>
  );
}
