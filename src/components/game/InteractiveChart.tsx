'use client';

import { useState } from 'react';
import type { MonthlySnapshot } from '@/lib/game/types';
import { getMonthName } from '@/lib/game/calendarSystem';

function formatValue(val: number, prefix: string = ''): string {
  if (val >= 1_000_000) return `${prefix}${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${prefix}${(val / 1_000).toFixed(1)}k`;
  return `${prefix}${Math.floor(val).toLocaleString()}`;
}

interface InteractiveChartProps {
  data: MonthlySnapshot[];
  dataKey: 'copiesSold' | 'activePlayers' | 'revenue';
  color?: string;
  prefix?: string;
  height?: number;
}

export default function InteractiveChart({
  data,
  dataKey,
  color = 'text-blue-400',
  prefix = '',
  height: chartHeight = 90,
}: InteractiveChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length < 2) return null;
  const values = data.map((d) => d[dataKey]);
  const max = Math.max(...values, 1);
  const width = 400;
  const height = chartHeight;
  const padding = 8;

  const getX = (i: number) => padding + (i / (values.length - 1)) * (width - padding * 2);
  const getY = (v: number) => height - padding - (v / max) * (height - padding * 2 - 10);

  const points = values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className={`w-full`} style={{ height: `${chartHeight / 4}rem` }}>
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" className={color} />

        {values.map((v, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(v)}
            r={hoverIndex === i ? 5 : 3}
            className={`${hoverIndex === i ? 'fill-foreground' : `fill-current ${color}`} transition-all cursor-pointer`}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
          />
        ))}

        <text x={padding} y={12} className="fill-muted-foreground text-[9px]">
          {formatValue(max, prefix)}
        </text>
        <text x={padding} y={height - 2} className="fill-muted-foreground text-[9px]">
          0
        </text>
      </svg>

      {hoverIndex !== null && (
        <div
          className="absolute top-0 bg-popover border border-border rounded px-2 py-1 text-xs shadow-lg pointer-events-none z-10"
          style={{
            left: `${(getX(hoverIndex) / width) * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold">{formatValue(values[hoverIndex], prefix)}</div>
          <div className="text-muted-foreground">
            {getMonthName(data[hoverIndex].month)} {data[hoverIndex].year}
          </div>
        </div>
      )}
    </div>
  );
}
