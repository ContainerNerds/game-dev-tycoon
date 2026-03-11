'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useGameStore } from '@/lib/store/gameStore';
import { loadSettings } from '@/lib/store/saveLoad';
import { NOTIFICATION_CONFIG } from '@/lib/config/emailConfig';
import { playNotificationSound } from './sounds';
import type { NotificationType } from './types';

function getToastFn(variant: string) {
  switch (variant) {
    case 'destructive': return toast.error;
    case 'success': return toast.success;
    default: return toast.info;
  }
}

export function useNotificationToasts(): void {
  const notifications = useGameStore((s) => s.notifications);
  const dismissNotification = useGameStore((s) => s.dismissNotification);
  const clearDismissedNotifications = useGameStore((s) => s.clearDismissedNotifications);
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const settings = loadSettings();
    const toastsMuted = settings.notificationsToastsMuted ?? false;

    const undismissed = notifications.filter((n) => !n.dismissed);

    for (const notif of undismissed) {
      if (processedRef.current.has(notif.id)) continue;
      processedRef.current.add(notif.id);

      playNotificationSound();

      if (!toastsMuted) {
        const variant = NOTIFICATION_CONFIG.toastVariant[notif.type as NotificationType] ?? 'default';
        const toastFn = getToastFn(variant);

        toastFn(notif.title, {
          description: notif.message,
          duration: 2500,
          closeButton: true,
          onAutoClose: () => dismissNotification(notif.id),
          onDismiss: () => dismissNotification(notif.id),
        });
      }
      // When toasts muted: notification stays in tray for user to acknowledge there
    }

    // Periodically prune dismissed notifications from state
    const dismissed = notifications.filter((n) => n.dismissed);
    if (dismissed.length > 10) {
      clearDismissedNotifications();
      for (const d of dismissed) {
        processedRef.current.delete(d.id);
      }
    }
  }, [notifications, dismissNotification, clearDismissedNotifications]);
}
