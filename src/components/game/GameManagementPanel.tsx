'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGameStore } from '@/lib/store/gameStore';
import { GAME_CONFIG } from '@/lib/config/gameConfig';
import type { DLC, GameSummary, GameInDev } from '@/lib/game/types';
import { Archive, PlusCircle, Rocket, TriangleAlert } from 'lucide-react';

export default function GameManagementPanel() {
  const currentGame = useGameStore((s) => s.currentGame);
  const gameInDev = useGameStore((s) => s.gameInDevelopment);
  const money = useGameStore((s) => s.money);
  const studioFans = useGameStore((s) => s.studioFans);
  const spendMoney = useGameStore((s) => s.spendMoney);
  const addDLC = useGameStore((s) => s.addDLC);
  const retireGame = useGameStore((s) => s.retireGame);
  const addCompletedGame = useGameStore((s) => s.addCompletedGame);
  const addStudioFans = useGameStore((s) => s.addStudioFans);
  const startDevelopment = useGameStore((s) => s.startDevelopment);

  const [showRetireConfirm, setShowRetireConfirm] = useState(false);
  const [showDLCDialog, setShowDLCDialog] = useState(false);
  const [showSequelDialog, setShowSequelDialog] = useState(false);
  const [dlcName, setDlcName] = useState('');
  const [sequelName, setSequelName] = useState('');

  if (!currentGame || currentGame.phase === 'retired') return null;

  const totalPlayers = currentGame.platformReleases.reduce((sum, p) => sum + p.activePlayers, 0);
  const totalSold = currentGame.platformReleases.reduce((sum, p) => sum + p.totalCopiesSold, 0);

  const hasDLCUpgrade = currentGame.unlockedGameUpgrades.includes('dlc-pipeline');
  const dlcCost = GAME_CONFIG.dlcDevCost;
  const sequelCost = Math.round(GAME_CONFIG.baseDevCost * GAME_CONFIG.sequelDevCostMultiplier);
  const canDLC = hasDLCUpgrade && money >= dlcCost;
  const canSequel = !gameInDev && money >= sequelCost;

  const handleRetire = () => {
    const fansConverted = Math.floor(currentGame.gameFans * 0.3);

    const summary: GameSummary = {
      id: currentGame.id,
      name: currentGame.name,
      genre: currentGame.genre,
      style: currentGame.style,
      reviewScore: currentGame.reviewScore,
      totalRevenue: currentGame.totalRevenue,
      totalCopiesSold: totalSold,
      peakPlayers: Math.floor(totalPlayers),
      fansConverted,
    };

    addStudioFans(fansConverted);
    addCompletedGame(summary);
    setShowRetireConfirm(false);
  };

  const handleCreateDLC = () => {
    if (!dlcName.trim() || !spendMoney(dlcCost)) return;

    const dlc: DLC = {
      id: `dlc-${Date.now()}`,
      name: dlcName,
      devCost: dlcCost,
      price: GAME_CONFIG.dlcBasePrice,
      status: 'developing',
      progressPercent: 0,
      copiesSold: 0,
    };

    addDLC(dlc);
    setDlcName('');
    setShowDLCDialog(false);
  };

  const handleStartSequel = () => {
    if (!sequelName.trim() || !spendMoney(sequelCost)) return;

    const weights = currentGame.pillarWeights;
    const baseComplexity = 100;
    const sequel: GameInDev = {
      id: `game-${Date.now()}`,
      name: sequelName,
      genre: currentGame.genre,
      style: currentGame.style,
      platforms: currentGame.platformReleases.map((pr) => pr.platform),
      pillarWeights: { ...weights },
      pillarProgress: { graphics: 0, gameplay: 0, sound: 0, polish: 0 },
      pillarTargets: {
        graphics: Math.round((weights.graphics / 100) * baseComplexity),
        gameplay: Math.round((weights.gameplay / 100) * baseComplexity),
        sound: Math.round((weights.sound / 100) * baseComplexity),
        polish: Math.round((weights.polish / 100) * baseComplexity),
      },
      progressPercent: 0,
      bugsFound: 0,
      devCostSpent: sequelCost,
      isCrunching: false,
      crunchBugPenalty: 0,
    };

    startDevelopment(sequel);
    setSequelName('');
    setShowSequelDialog(false);
  };

  return (
    <>
      <div className="border-b border-slate-700 bg-slate-800/30 px-4 py-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-slate-400">Game Actions:</span>

          {hasDLCUpgrade && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs cursor-pointer"
              disabled={!canDLC}
              onClick={() => setShowDLCDialog(true)}
            >
              <PlusCircle className="h-3 w-3 mr-1" />
              New DLC (${dlcCost.toLocaleString()})
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="text-xs cursor-pointer"
            disabled={!canSequel}
            onClick={() => setShowSequelDialog(true)}
          >
            <Rocket className="h-3 w-3 mr-1" />
            Start Sequel (${sequelCost.toLocaleString()})
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-red-400 hover:text-red-300 cursor-pointer ml-auto"
            onClick={() => setShowRetireConfirm(true)}
          >
            <Archive className="h-3 w-3 mr-1" />
            Retire Game
          </Button>
        </div>
      </div>

      {/* Retire Confirmation */}
      <Dialog open={showRetireConfirm} onOpenChange={setShowRetireConfirm}>
        <DialogContent className="border-slate-700 bg-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-yellow-400" />
              Retire {currentGame.name}?
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Retiring a game shuts down all servers and ends revenue. {Math.floor(currentGame.gameFans * 0.3)} game fans will convert to studio fans.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="cursor-pointer" onClick={() => setShowRetireConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="cursor-pointer" onClick={handleRetire}>
              Retire Game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DLC Dialog */}
      <Dialog open={showDLCDialog} onOpenChange={setShowDLCDialog}>
        <DialogContent className="border-slate-700 bg-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Create DLC for {currentGame.name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Cost: ${dlcCost.toLocaleString()} &middot; Price: ${GAME_CONFIG.dlcBasePrice}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-300">DLC Name</Label>
              <Input
                value={dlcName}
                onChange={(e) => setDlcName(e.target.value)}
                placeholder="Enter DLC name..."
                className="border-slate-600 bg-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setShowDLCDialog(false)}>
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              disabled={!dlcName.trim() || money < dlcCost}
              onClick={handleCreateDLC}
            >
              Create DLC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sequel Dialog */}
      <Dialog open={showSequelDialog} onOpenChange={setShowSequelDialog}>
        <DialogContent className="border-slate-700 bg-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Start Sequel Development</DialogTitle>
            <DialogDescription className="text-slate-400">
              Cost: ${sequelCost.toLocaleString()} &middot; Inherits {currentGame.genre} / {currentGame.style}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-300">Sequel Name</Label>
              <Input
                value={sequelName}
                onChange={(e) => setSequelName(e.target.value)}
                placeholder="Enter sequel name..."
                className="border-slate-600 bg-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setShowSequelDialog(false)}>
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              disabled={!sequelName.trim() || money < sequelCost}
              onClick={handleStartSequel}
            >
              Start Development
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
