'use client';

import { useState } from 'react';
import MainMenu from '@/components/screens/MainMenu';
import GameScreen from '@/components/screens/GameScreen';

export default function Home() {
  const [inGame, setInGame] = useState(false);

  if (inGame) {
    return <GameScreen onQuit={() => setInGame(false)} />;
  }

  return <MainMenu onStartGame={() => setInGame(true)} />;
}
