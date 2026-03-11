'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGameStore } from '@/lib/store/gameStore';
import { EMAIL_TYPE_META } from '@/lib/config/emailConfig';
import type { GameEmail, EmailType } from '@/lib/game/types';
import {
  Mail,
  MailOpen,
  Star,
  Heart,
  Flame,
  UserMinus,
  Palmtree,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCheck,
  Trash2,
  ArrowLeft,
  Filter,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star,
  heart: Heart,
  flame: Flame,
  'user-minus': UserMinus,
  'palm-tree': Palmtree,
  'bar-chart-3': BarChart3,
  'trending-up': TrendingUp,
  'alert-triangle': AlertTriangle,
  mail: Mail,
};

function EmailIcon({ type, className }: { type: EmailType; className?: string }) {
  const meta = EMAIL_TYPE_META[type];
  const Icon = ICON_MAP[meta.icon] ?? Mail;
  return <Icon className={`${meta.color} ${className ?? ''}`} />;
}

type FilterValue = 'all' | 'unread' | EmailType;

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'game-review', label: 'Reviews' },
  { value: 'fan-mail', label: 'Fan Mail' },
  { value: 'hate-mail', label: 'Hate Mail' },
  { value: 'monthly-report', label: 'Reports' },
  { value: 'investment-opportunity', label: 'Investment' },
  { value: 'server-alert', label: 'Alerts' },
  { value: 'employee-quit', label: 'Resignations' },
  { value: 'employee-vacation', label: 'Vacation' },
];

function formatTimestamp(ts: { year: number; month: number; day: number }): string {
  return `Y${ts.year} M${ts.month} D${ts.day}`;
}

function EmailDetail({
  email,
  onBack,
  onDelete,
}: {
  email: GameEmail;
  onBack: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 pb-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { onDelete(email.id); onBack(); }}
            className="text-destructive hover:text-destructive cursor-pointer"
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <EmailIcon type={email.type} className="h-6 w-6 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-foreground leading-tight">{email.subject}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>From: {email.sender}</span>
              <span>·</span>
              <span>{formatTimestamp(email.timestamp)}</span>
              <Badge variant="outline" className={`text-xs ${EMAIL_TYPE_META[email.type].color}`}>
                {EMAIL_TYPE_META[email.type].label}
              </Badge>
            </div>
          </div>
        </div>
        <Separator />
        <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {email.body}
        </div>
      </div>
    </div>
  );
}

function EmailRow({
  email,
  isSelected,
  onClick,
}: {
  email: GameEmail;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors cursor-pointer rounded-md ${
        isSelected
          ? 'bg-accent'
          : email.read
            ? 'hover:bg-muted/50'
            : 'bg-muted/30 hover:bg-muted/60'
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {email.read ? (
          <MailOpen className="h-4 w-4 text-muted-foreground/50" />
        ) : (
          <EmailIcon type={email.type} className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm truncate ${email.read ? 'text-muted-foreground' : 'font-semibold text-foreground'}`}>
            {email.subject}
          </span>
          {!email.read && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-primary" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span className="truncate">{email.sender}</span>
          <span>·</span>
          <span className="shrink-0">{formatTimestamp(email.timestamp)}</span>
        </div>
      </div>
    </button>
  );
}

export default function InboxTab() {
  const inbox = useGameStore((s) => s.inbox);
  const markEmailRead = useGameStore((s) => s.markEmailRead);
  const deleteEmail = useGameStore((s) => s.deleteEmail);
  const markAllEmailsRead = useGameStore((s) => s.markAllEmailsRead);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>('all');

  const unreadCount = inbox.filter((e) => !e.read).length;

  const filteredEmails = inbox.filter((email) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !email.read;
    return email.type === filter;
  });

  const selectedEmail = selectedId ? inbox.find((e) => e.id === selectedId) : null;

  const handleSelect = useCallback(
    (email: GameEmail) => {
      setSelectedId(email.id);
      if (!email.read) markEmailRead(email.id);
    },
    [markEmailRead],
  );

  const handleBack = useCallback(() => setSelectedId(null), []);

  if (inbox.length === 0) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Mail className="h-8 w-8 text-muted-foreground" />
          <div>
            <h3 className="text-2xl font-bold text-foreground">Inbox</h3>
            <p className="text-sm text-muted-foreground">No emails yet. Keep playing and they&apos;ll start rolling in!</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedEmail) {
    return (
      <div className="p-4">
        <EmailDetail email={selectedEmail} onBack={handleBack} onDelete={deleteEmail} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-6 w-6 text-foreground" />
          <h3 className="text-xl font-bold text-foreground">
            Inbox
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </h3>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllEmailsRead} className="cursor-pointer text-xs">
            <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={filter === opt.value ? 'default' : 'outline'}
            size="sm"
            className="text-xs h-7 cursor-pointer"
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Email list */}
      <Card className="border-border bg-card">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm text-muted-foreground font-normal">
            {filteredEmails.length} email{filteredEmails.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-22rem)]">
            <div className="divide-y divide-border">
              {filteredEmails.map((email) => (
                <EmailRow
                  key={email.id}
                  email={email}
                  isSelected={selectedId === email.id}
                  onClick={() => handleSelect(email)}
                />
              ))}
            </div>
            {filteredEmails.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No emails match this filter.
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
