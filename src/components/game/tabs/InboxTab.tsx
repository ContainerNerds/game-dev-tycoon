'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useGameStore } from '@/lib/store/gameStore';
import { EMAIL_TYPE_META } from '@/lib/config/emailConfig';
import type { GameEmail, EmailType } from '@/lib/game/types';
import {
  Mail,
  Inbox,
  Star,
  Heart,
  Flame,
  UserMinus,
  Palmtree,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Trash2,
  Search,
  MailOpen,
  CheckCheck,
} from 'lucide-react';

// ============================================================
// Icon mapping for email types
// ============================================================

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
  return <Icon className={cn(meta.color, className)} />;
}

function formatTimestamp(ts: { year: number; month: number; day: number }): string {
  return `Y${ts.year} M${ts.month} D${ts.day}`;
}

// ============================================================
// Nav item definitions for left sidebar
// ============================================================

interface NavItem {
  id: 'all' | EmailType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'all', label: 'All Mail', icon: Inbox },
  { id: 'game-review', label: 'Reviews', icon: Star },
  { id: 'fan-mail', label: 'Fan Mail', icon: Heart },
  { id: 'hate-mail', label: 'Hate Mail', icon: Flame },
  { id: 'monthly-report', label: 'Reports', icon: BarChart3 },
  { id: 'server-alert', label: 'Alerts', icon: AlertTriangle },
  { id: 'investment-opportunity', label: 'Investment', icon: TrendingUp },
  { id: 'employee-quit', label: 'Resignations', icon: UserMinus },
  { id: 'employee-vacation', label: 'Vacation', icon: Palmtree },
  { id: 'general', label: 'General', icon: Mail },
];

// ============================================================
// CategoryNav — left sidebar
// ============================================================

function CategoryNav({
  activeCategory,
  onSelect,
  counts,
}: {
  activeCategory: string;
  onSelect: (id: string) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="flex flex-col gap-1 p-2">
      {NAV_ITEMS.map((item) => {
        const count = counts[item.id] ?? 0;
        if (item.id !== 'all' && count === 0) return null;
        const isActive = activeCategory === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {count > 0 && (
              <span className={cn(
                'ml-auto text-xs tabular-nums',
                isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// MailList — middle panel email list
// ============================================================

function MailListItem({
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
      className={cn(
        'flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent cursor-pointer w-full',
        isSelected && 'bg-muted'
      )}
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <div className={cn('font-semibold', email.read && 'font-normal text-muted-foreground')}>
              {email.sender}
            </div>
            {!email.read && (
              <span className="flex h-2 w-2 rounded-full bg-blue-600" />
            )}
          </div>
          <div className={cn(
            'ml-auto text-xs',
            isSelected ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {formatTimestamp(email.timestamp)}
          </div>
        </div>
        <div className="text-xs font-medium">{email.subject}</div>
      </div>
      <div className="line-clamp-2 text-xs text-muted-foreground">
        {email.body.substring(0, 300)}
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant={email.type === 'server-alert' || email.type === 'hate-mail' ? 'destructive' : 'secondary'}
          className="text-xs"
        >
          {EMAIL_TYPE_META[email.type].label}
        </Badge>
        {email.priority === 'urgent' && (
          <Badge variant="destructive" className="text-xs">Urgent</Badge>
        )}
        {email.priority === 'high' && (
          <Badge variant="outline" className="text-xs">Important</Badge>
        )}
      </div>
    </button>
  );
}

function MailList({
  items,
  selectedId,
  onSelect,
}: {
  items: GameEmail[];
  selectedId: string | null;
  onSelect: (email: GameEmail) => void;
}) {
  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No messages found.
          </div>
        )}
        {items.map((email) => (
          <MailListItem
            key={email.id}
            email={email}
            isSelected={selectedId === email.id}
            onClick={() => onSelect(email)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// MailDisplay — right panel detail view
// ============================================================

function MailDisplay({
  email,
  onDelete,
  onToggleRead,
}: {
  email: GameEmail | null;
  onDelete: (id: string) => void;
  onToggleRead: (id: string, read: boolean) => void;
}) {
  if (!email) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
        <div className="text-center">
          <Mail className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p>No message selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
              onClick={() => onToggleRead(email.id, !email.read)}
            >
              {email.read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
            </TooltipTrigger>
            <TooltipContent>{email.read ? 'Mark as unread' : 'Mark as read'}</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Tooltip>
            <TooltipTrigger
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              onClick={() => onDelete(email.id)}
            >
              <Trash2 className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <Separator />
      <div className="flex flex-1 flex-col">
        <div className="flex items-start p-4">
          <div className="flex items-start gap-4 text-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
              <EmailIcon type={email.type} className="h-5 w-5" />
            </div>
            <div className="grid gap-1">
              <div className="font-semibold">{email.sender}</div>
              <div className="line-clamp-1 text-xs">{email.subject}</div>
              <div className="line-clamp-1 text-xs">
                <Badge variant="outline" className={cn('text-xs', EMAIL_TYPE_META[email.type].color)}>
                  {EMAIL_TYPE_META[email.type].label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {formatTimestamp(email.timestamp)}
          </div>
        </div>
        <Separator />
        <div className="flex-1 whitespace-pre-wrap p-4 text-sm">
          {email.body}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// InboxTab — main component
// ============================================================

export default function InboxTab() {
  const inbox = useGameStore((s) => s.inbox);
  const markEmailRead = useGameStore((s) => s.markEmailRead);
  const deleteEmail = useGameStore((s) => s.deleteEmail);
  const markAllEmailsRead = useGameStore((s) => s.markAllEmailsRead);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: inbox.length };
    for (const email of inbox) {
      counts[email.type] = (counts[email.type] ?? 0) + 1;
    }
    return counts;
  }, [inbox]);

  const filteredByCategory = useMemo(() => {
    if (category === 'all') return inbox;
    return inbox.filter((e) => e.type === category);
  }, [inbox, category]);

  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return filteredByCategory;
    const q = searchQuery.toLowerCase();
    return filteredByCategory.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.sender.toLowerCase().includes(q) ||
        e.body.toLowerCase().includes(q)
    );
  }, [filteredByCategory, searchQuery]);

  const selectedEmail = selectedId ? inbox.find((e) => e.id === selectedId) ?? null : null;

  const handleSelect = useCallback(
    (email: GameEmail) => {
      setSelectedId(email.id);
      if (!email.read) markEmailRead(email.id);
    },
    [markEmailRead],
  );

  const handleToggleRead = useCallback(
    (emailId: string, read: boolean) => {
      if (read) {
        markEmailRead(emailId);
      }
      // Mark unread not currently in store — just mark read for now
    },
    [markEmailRead],
  );

  const handleDelete = useCallback(
    (emailId: string) => {
      if (selectedId === emailId) setSelectedId(null);
      deleteEmail(emailId);
    },
    [selectedId, deleteEmail],
  );

  const unreadCount = inbox.filter((e) => !e.read).length;

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full items-stretch">
      {/* Left panel — category nav */}
      <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
        <div className="flex h-[52px] items-center px-4">
          <h2 className="text-lg font-bold">Mail</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <CategoryNav
            activeCategory={category}
            onSelect={setCategory}
            counts={categoryCounts}
          />
        </ScrollArea>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Middle panel — email list */}
      <ResizablePanel defaultSize={35} minSize={25}>
        <Tabs defaultValue="all">
          <div className="flex items-center px-4 py-2">
            <h2 className="text-xl font-bold">Inbox</h2>
            <TabsList className="ml-auto">
              <TabsTrigger value="all" className="cursor-pointer">All mail</TabsTrigger>
              <TabsTrigger value="unread" className="cursor-pointer">Unread</TabsTrigger>
            </TabsList>
          </div>
          <Separator />
          <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {unreadCount > 0 && (
                <Tooltip>
                  <TooltipTrigger
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                    onClick={markAllEmailsRead}
                  >
                    <CheckCheck className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>Mark all as read</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          <TabsContent value="all" className="m-0">
            <MailList items={searchFiltered} selectedId={selectedId} onSelect={handleSelect} />
          </TabsContent>
          <TabsContent value="unread" className="m-0">
            <MailList
              items={searchFiltered.filter((e) => !e.read)}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </TabsContent>
        </Tabs>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right panel — email detail */}
      <ResizablePanel defaultSize={45} minSize={30}>
        <MailDisplay
          email={selectedEmail}
          onDelete={handleDelete}
          onToggleRead={handleToggleRead}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
