'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StudioHeader from '@/components/game/StudioHeader';
import MonthEndModal from '@/components/game/MonthEndModal';
import DevMenu from '@/components/game/DevMenu';
import DashboardTab from '@/components/game/tabs/DashboardTab';
import UpgradesTab from '@/components/game/tabs/UpgradesTab';
import BugsTab from '@/components/game/tabs/BugsTab';
import ResearchTab from '@/components/game/tabs/ResearchTab';
import DeliveryTab from '@/components/game/tabs/DeliveryTab';
import PressTab from '@/components/game/tabs/PressTab';
import StaffTab from '@/components/game/tabs/StaffTab';
import OfficeTab from '@/components/game/tabs/OfficeTab';
import DevelopmentPanel from '@/components/game/DevelopmentPanel';
import GameManagementPanel from '@/components/game/GameManagementPanel';
import { useGameTick } from '@/lib/game/useGameTick';
import { useGameStore } from '@/lib/store/gameStore';
import BankruptcyScreen from '@/components/screens/BankruptcyScreen';

interface GameScreenProps {
  onQuit: () => void;
}

export default function GameScreen({ onQuit }: GameScreenProps) {
  useGameTick();

  const isBankrupt = useGameStore((s) => s.isBankrupt);
  const gameInDev = useGameStore((s) => s.gameInDevelopment);
  const currentGame = useGameStore((s) => s.currentGame);

  if (isBankrupt) {
    return <BankruptcyScreen onRestart={onQuit} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <StudioHeader />

      {gameInDev && <DevelopmentPanel />}
      {currentGame && currentGame.phase !== 'retired' && <GameManagementPanel />}

      <div className="flex-1 min-h-0">
        <Tabs defaultValue="dashboard" className="h-full flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-background px-4 shrink-0">
            <TabsTrigger value="dashboard" className="cursor-pointer">Dashboard</TabsTrigger>
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

      <MonthEndModal />
      <DevMenu />
    </div>
  );
}
