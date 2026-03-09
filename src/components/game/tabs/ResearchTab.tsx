'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/store/gameStore';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import { FlaskConical } from 'lucide-react';

export default function ResearchTab() {
  const researchPoints = useGameStore((s) => s.researchPoints);
  const currentGame = useGameStore((s) => s.currentGame);

  const isEarning = currentGame !== null && currentGame.phase !== 'retired';
  const ratePerDay = GAME_CONFIG.researchPointsPerGameDay;

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <FlaskConical className="h-8 w-8 text-blue-400" />
        <div>
          <h3 className="text-2xl font-bold text-white">
            {researchPoints.toFixed(1)} <span className="text-lg text-blue-400">RP</span>
          </h3>
          <p className="text-sm text-slate-400">
            {isEarning
              ? `Earning ${ratePerDay} RP per game-day while your game is online`
              : 'No game online — not earning research points'}
          </p>
        </div>
      </div>

      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">How Research Works</CardTitle>
          <CardDescription className="text-slate-400">
            Research points are earned passively while you have an active game online.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <p>
            Research points are spent to unlock upgrades in the Upgrades tab.
            Each upgrade has both a money cost and a research point cost.
          </p>
          <p>
            The longer your games stay online, the more research points you accumulate.
            Plan your game lifecycles to maximize research output before retiring.
          </p>
          <div className="flex gap-2 pt-2">
            <Badge variant="outline" className="text-blue-400 border-blue-500/50">
              Rate: {ratePerDay} RP/day
            </Badge>
            <Badge variant="outline" className="text-slate-400 border-slate-500/50">
              Source: Active games
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
