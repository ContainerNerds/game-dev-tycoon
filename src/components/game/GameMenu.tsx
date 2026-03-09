'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useGameStore } from '@/lib/store/gameStore';
import { loadSettings, saveSettings, type GameSettings } from '@/lib/store/saveLoad';
import { Menu, Save, Settings, LogOut } from 'lucide-react';

interface GameMenuProps {
  slotId: number;
  onQuit: () => void;
}

export default function GameMenu({ slotId, onQuit }: GameMenuProps) {
  const [open, setOpen] = useState(false);
  const [settings, setSettingsState] = useState<GameSettings>(loadSettings);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const saveToSlotAction = useGameStore((s) => s.saveToSlot);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const speed = useGameStore((s) => s.calendar.speed);
  const prevSpeedRef = useState(speed)[0];

  // Escape key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Pause on open, restore on close
  useEffect(() => {
    if (open) {
      setSpeed(0);
    }
  }, [open, setSpeed]);

  const handleSave = () => {
    saveToSlotAction(slotId);
  };

  const handleSettingChange = (key: keyof GameSettings, value: boolean | number) => {
    const updated = { ...settings, [key]: value };
    setSettingsState(updated);
    saveSettings(updated);
  };

  const handleExit = () => {
    handleSave();
    onQuit();
  };

  return (
    <>
      {/* Trigger button in header area */}
      <Button
        size="sm"
        variant="ghost"
        className="fixed top-2 right-32 z-40 h-7 w-7 p-0 cursor-pointer opacity-60 hover:opacity-100"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Game Menu</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Button className="w-full cursor-pointer justify-start" variant="outline" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" /> Save Game
            </Button>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">Settings</span>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Auto-Save</Label>
                <Button
                  size="sm"
                  variant={settings.autoSaveEnabled ? 'default' : 'outline'}
                  className="text-xs cursor-pointer"
                  onClick={() => handleSettingChange('autoSaveEnabled', !settings.autoSaveEnabled)}
                >
                  {settings.autoSaveEnabled ? 'On' : 'Off'}
                </Button>
              </div>

              {settings.autoSaveEnabled && (
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Interval</Label>
                  <Select
                    value={String(settings.autoSaveIntervalMinutes)}
                    onValueChange={(v) => handleSettingChange('autoSaveIntervalMinutes', Number(v))}
                  >
                    <SelectTrigger className="w-24 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 min</SelectItem>
                      <SelectItem value="2">2 min</SelectItem>
                      <SelectItem value="5">5 min</SelectItem>
                      <SelectItem value="10">10 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator />

            <Button className="w-full cursor-pointer justify-start text-red-400 hover:text-red-300" variant="ghost"
              onClick={() => setShowExitConfirm(true)}>
              <LogOut className="h-4 w-4 mr-2" /> Exit to Main Menu
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Exit to Main Menu?</DialogTitle>
            <DialogDescription>Your game will be saved automatically before exiting.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="cursor-pointer" onClick={() => setShowExitConfirm(false)}>Cancel</Button>
            <Button variant="destructive" className="cursor-pointer" onClick={handleExit}>Save &amp; Exit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
