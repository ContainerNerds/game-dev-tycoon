'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useGameStore } from '@/lib/store/gameStore';
import { loadSettings, saveSettings, type GameSettings } from '@/lib/store/saveLoad';
import { setNotificationSoundMuted } from '@/lib/game/sounds';
import type { GameNotification } from '@/lib/game/types';
import { Bell, BellOff, Volume2, VolumeX, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatNotificationTime(ts: { year: number; month: number; day: number }): string {
  return `Y${ts.year} M${ts.month} D${ts.day}`;
}

interface NotificationTrayProps {
  /** When provided, clicking a notification with emailId will switch to this tab */
  onNavigateToInbox?: () => void;
}

export default function NotificationTray({ onNavigateToInbox }: NotificationTrayProps) {
  const [open, setOpen] = useState(false);
  const [toastsMuted, setToastsMutedState] = useState(false);
  const [soundMuted, setSoundMutedState] = useState(false);

  const notifications = useGameStore((s) => s.notifications);
  const dismissNotification = useGameStore((s) => s.dismissNotification);

  const undismissed = notifications.filter((n) => !n.dismissed);
  const unreadCount = undismissed.length;

  useEffect(() => {
    const s = loadSettings();
    setToastsMutedState(s.notificationsToastsMuted ?? false);
    setSoundMutedState(s.notificationsSoundMuted ?? false);
  }, []);

  useEffect(() => {
    if (open) {
      const s = loadSettings();
      setToastsMutedState(s.notificationsToastsMuted ?? false);
      setSoundMutedState(s.notificationsSoundMuted ?? false);
    }
  }, [open]);

  const handleToggleToastsMuted = () => {
    const next = !toastsMuted;
    setToastsMutedState(next);
    const s = loadSettings();
    saveSettings({ ...s, notificationsToastsMuted: next } as GameSettings);
  };

  const handleToggleSoundMuted = () => {
    const next = !soundMuted;
    setSoundMutedState(next);
    setNotificationSoundMuted(next);
  };

  const handleNotificationClick = (n: GameNotification) => {
    dismissNotification(n.id);
    if (n.emailId && onNavigateToInbox) {
      onNavigateToInbox();
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0 cursor-pointer relative shrink-0"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-80 p-0">
        <div className="p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Notifications</span>
          </div>
          <Separator className="mb-2" />
          <div className="flex flex-col gap-1 mb-2">
            <button
              type="button"
              onClick={handleToggleToastsMuted}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer w-full text-left',
                toastsMuted ? 'bg-muted/50 text-muted-foreground' : 'hover:bg-muted'
              )}
            >
              {toastsMuted ? (
                <BellOff className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Bell className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{toastsMuted ? 'Toasts muted' : 'Toasts on'}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {toastsMuted ? 'Click to enable' : 'Click to mute'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleToggleSoundMuted}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer w-full text-left',
                soundMuted ? 'bg-muted/50 text-muted-foreground' : 'hover:bg-muted'
              )}
            >
              {soundMuted ? (
                <VolumeX className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{soundMuted ? 'Sound muted' : 'Sound on'}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {soundMuted ? 'Click to enable' : 'Click to mute'}
              </span>
            </button>
          </div>
          <Separator className="mb-2" />
        </div>
        <ScrollArea className="h-[min(220px,50vh)]">
          <div className="flex flex-col gap-0.5 p-2 pt-0">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No notifications
              </div>
            ) : (
              [...notifications].reverse().map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'flex flex-col gap-0.5 rounded-md px-2 py-2 text-left text-xs transition-colors cursor-pointer w-full',
                    n.dismissed ? 'opacity-60' : 'hover:bg-muted'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn(
                      'font-medium truncate',
                      n.dismissed && 'text-muted-foreground'
                    )}>
                      {n.title}
                    </span>
                    {n.emailId && (
                      <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-muted-foreground line-clamp-2">{n.message}</p>
                  <span className="text-[10px] text-muted-foreground/80">
                    {formatNotificationTime(n.timestamp)}
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
