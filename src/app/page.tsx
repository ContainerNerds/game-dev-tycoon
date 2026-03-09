'use client';

import { useState } from 'react';
import MainMenu from '@/components/screens/MainMenu';
import GameScreen from '@/components/screens/GameScreen';

export default function Home() {
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);

  if (activeSlotId !== null) {
    return <GameScreen slotId={activeSlotId} onQuit={() => setActiveSlotId(null)} />;
  }

  return <MainMenu onStartGame={(slotId) => setActiveSlotId(slotId)} />;
}
