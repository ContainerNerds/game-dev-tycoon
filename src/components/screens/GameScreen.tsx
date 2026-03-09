'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import StudioHeader from '@/components/game/StudioHeader';
import MonthEndModal from '@/components/game/MonthEndModal';
import UpgradesTab from '@/components/game/tabs/UpgradesTab';
import BugsTab from '@/components/game/tabs/BugsTab';
import ResearchTab from '@/components/game/tabs/ResearchTab';
import DeliveryTab from '@/components/game/tabs/DeliveryTab';
import PressTab from '@/components/game/tabs/PressTab';
import StaffTab from '@/components/game/tabs/StaffTab';
import OfficeTab from '@/components/game/tabs/OfficeTab';
import DevelopmentPanel from '@/components/game/DevelopmentPanel';
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

  if (isBankrupt) {
    return <BankruptcyScreen onRestart={onQuit} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      <StudioHeader />

      {/* Development progress bar when a game is in dev */}
      {gameInDev && <DevelopmentPanel />}

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="delivery" className="h-full flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-slate-700 bg-slate-900 px-4">
            <TabsTrigger value="delivery" className="cursor-pointer">Delivery</TabsTrigger>
            <TabsTrigger value="upgrades" className="cursor-pointer">Upgrades</TabsTrigger>
            <TabsTrigger value="bugs" className="cursor-pointer">Bugs</TabsTrigger>
            <TabsTrigger value="research" className="cursor-pointer">Research</TabsTrigger>
            <TabsTrigger value="press" className="cursor-pointer">Press</TabsTrigger>
            <TabsTrigger value="staff" className="cursor-pointer">Staff</TabsTrigger>
            <TabsTrigger value="office" className="cursor-pointer">Office</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="delivery" className="mt-0"><DeliveryTab /></TabsContent>
            <TabsContent value="upgrades" className="mt-0"><UpgradesTab /></TabsContent>
            <TabsContent value="bugs" className="mt-0"><BugsTab /></TabsContent>
            <TabsContent value="research" className="mt-0"><ResearchTab /></TabsContent>
            <TabsContent value="press" className="mt-0"><PressTab /></TabsContent>
            <TabsContent value="staff" className="mt-0"><StaffTab /></TabsContent>
            <TabsContent value="office" className="mt-0"><OfficeTab /></TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      <MonthEndModal />
    </div>
  );
}
