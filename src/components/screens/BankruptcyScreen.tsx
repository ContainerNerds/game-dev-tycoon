'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useGameStore } from '@/lib/store/gameStore';
import { deleteSave } from '@/lib/store/saveLoad';
import { Skull } from 'lucide-react';

interface BankruptcyScreenProps {
  onRestart: () => void;
}

export default function BankruptcyScreen({ onRestart }: BankruptcyScreenProps) {
  const studioName = useGameStore((s) => s.studioName);
  const completedGames = useGameStore((s) => s.completedGames);
  const totalLifetimeMoney = useGameStore((s) => s.totalLifetimeMoney);

  const handleRestart = () => {
    deleteSave();
    onRestart();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-950 via-slate-900 to-slate-900">
      <Card className="w-full max-w-md border-red-800 bg-slate-800/80 backdrop-blur">
        <CardHeader className="text-center">
          <Skull className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-red-400">Bankrupt!</CardTitle>
          <CardDescription className="text-slate-400">
            {studioName} has run out of money.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex justify-between">
              <span>Games Released</span>
              <span>{completedGames.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Lifetime Revenue</span>
              <span className="text-green-400">${Math.floor(totalLifetimeMoney).toLocaleString()}</span>
            </div>
          </div>

          <Button
            className="w-full text-lg py-6 cursor-pointer"
            variant="destructive"
            onClick={handleRestart}
          >
            Start Over
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
