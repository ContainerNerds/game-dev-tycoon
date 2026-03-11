'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { MonthlyReport, ReportCategory, MonthlyReportLineItem } from '@/lib/game/types';
import { getMonthName } from '@/lib/game/calendarSystem';

const CATEGORY_META: Record<ReportCategory, { label: string; order: number }> = {
  revenue:      { label: 'Revenue',               order: 0 },
  employees:    { label: 'Employees',             order: 1 },
  servers:      { label: 'Server Infrastructure', order: 2 },
  overhead:     { label: 'Office / Overhead',     order: 3 },
  'game-dev':   { label: 'Game Development',      order: 4 },
  'engine-dev': { label: 'Engine Development',    order: 5 },
};

function formatMoney(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs >= 1_000_000
    ? `$${(abs / 1_000_000).toFixed(1)}M`
    : `$${Math.floor(abs).toLocaleString()}`;
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}

function CategorySection({
  category,
  items,
  subtotal,
}: {
  category: ReportCategory;
  items: MonthlyReportLineItem[];
  subtotal: number;
}) {
  const [open, setOpen] = useState(false);
  const meta = CATEGORY_META[category];
  const isPositive = subtotal >= 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 py-1.5 text-sm hover:bg-muted/50 rounded -mx-1 px-1 cursor-pointer transition-colors"
      >
        {open
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        }
        <span className="font-medium">{meta.label}</span>
        <span className="text-xs text-muted-foreground ml-1">({items.length})</span>
        <span className={`ml-auto font-mono text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {formatMoney(subtotal)}
        </span>
      </button>
      {open && (
        <div className="ml-6 space-y-0.5 pb-1">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs py-0.5">
              <span className="text-muted-foreground">{item.label}</span>
              <span className={`font-mono ${item.amount >= 0 ? 'text-green-400' : 'text-red-400/70'}`}>
                {formatMoney(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface MonthlyReportViewProps {
  report: MonthlyReport;
  showHeader?: boolean;
  compact?: boolean;
}

export default function MonthlyReportView({ report, showHeader = true, compact = false }: MonthlyReportViewProps) {
  const grouped = new Map<ReportCategory, MonthlyReportLineItem[]>();
  for (const item of report.lineItems) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }

  const sortedCategories = [...grouped.entries()].sort(
    (a, b) => CATEGORY_META[a[0]].order - CATEGORY_META[b[0]].order,
  );

  const totalNet = report.netCashFlow;

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">
            {getMonthName(report.month)} {report.year}
          </span>
          <span className={`font-mono text-sm font-semibold ${totalNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Net: {formatMoney(totalNet)}
          </span>
        </div>
      )}

      {sortedCategories.map(([category, items]) => {
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        return (
          <CategorySection
            key={category}
            category={category}
            items={items}
            subtotal={subtotal}
          />
        );
      })}

      <Separator />
      <div className="flex justify-between text-sm font-semibold pt-1">
        <span>Total Net</span>
        <span className={`font-mono ${totalNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {formatMoney(totalNet)}
        </span>
      </div>
    </div>
  );
}
