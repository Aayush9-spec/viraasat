'use client';

import { useId } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartPoint } from '../studio-analytics';

export const formatINR = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
export const formatNumber = (value: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value);
const compactNumber = (value: number) => new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export function StudioChart({ data, label, caption, kind = 'area', color = 'var(--chart-revenue)', money = false, compact = false, empty = 'No data for this period' }: {
  data: ChartPoint[]; label: string; caption: string; kind?: 'area' | 'bar' | 'horizontal';
  color?: string; money?: boolean; compact?: boolean; empty?: string;
}) {
  const gradientId = `chart-${useId().replace(/:/g, '')}`;
  const formatValue = money ? formatINR : formatNumber;
  const horizontal = kind === 'horizontal';
  const height = compact ? 96 : horizontal ? Math.max(200, Math.min(data.length * 46, 450)) : 260;
  const series = data.filter(point => Number.isFinite(point.value));
  const axes = [
    <CartesianGrid key="grid" stroke="currentColor" strokeOpacity={0.12} strokeDasharray="3 5" vertical={false} />,
    <XAxis key="x" type={horizontal ? 'number' : 'category'} dataKey={horizontal ? undefined : 'label'} hide={compact}
      tickLine={false} axisLine={false} minTickGap={24} fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }}
      tickFormatter={horizontal ? value => `${money ? '₹' : ''}${compactNumber(Number(value))}` : undefined} />,
    <YAxis key="y" type={horizontal ? 'category' : 'number'} dataKey={horizontal ? 'label' : undefined} hide={compact}
      width={horizontal ? 118 : money ? 56 : 36} tickLine={false} axisLine={false} fontSize={11}
      tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={money}
      tickFormatter={value => horizontal ? String(value).length > 18 ? `${String(value).slice(0, 17)}…` : String(value) : `${money ? '₹' : ''}${compactNumber(Number(value))}`} />,
    <Tooltip key="tooltip" formatter={(value: number) => [formatValue(value), label]} labelFormatter={value => String(value)}
      contentStyle={{ background: 'hsl(var(--card))', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12, maxWidth: 280 }}
      cursor={kind === 'area' ? { stroke: color, strokeDasharray: '3 3' } : { fill: color, fillOpacity: 0.06 }} />,
  ];
  return <figure aria-label={label} className="min-w-0">
    <div style={{ height }} className="w-full min-w-0">
      {series.length ? <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        {kind === 'area' ? <AreaChart data={series} margin={{ top: 10, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.25} /><stop offset="100%" stopColor={color} stopOpacity={0.015} /></linearGradient></defs>
          {axes}<Area name={label} type="linear" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} isAnimationActive={false} dot={series.length === 1} activeDot={{ r: 4 }} />
        </AreaChart> : <BarChart data={series} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 10, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
          {axes}<Bar name={label} dataKey="value" fill={color} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={compact ? 20 : 34} isAnimationActive={false} />
        </BarChart>}
      </ResponsiveContainer> : <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 text-center text-xs leading-relaxed text-muted-foreground">{empty}</div>}
    </div>
    <figcaption className="mt-3 text-xs leading-relaxed text-muted-foreground">{caption}</figcaption>
    {series.length > 0 && <details className={compact ? 'sr-only focus-within:not-sr-only' : 'mt-2 text-xs text-muted-foreground'}>
      <summary className="inline-flex min-h-11 cursor-pointer items-center underline underline-offset-4">View chart data<span className="sr-only">: {label}</span></summary>
      <div tabIndex={0} role="region" aria-label={`${label} data`} className="max-h-60 overflow-auto"><table className="w-full text-left"><caption className="sr-only">{label}</caption><thead><tr><th scope="col" className="p-2">Period / category</th><th scope="col" className="p-2 text-right">{label}</th></tr></thead><tbody>{series.map((point, index) => <tr key={`${point.label}-${index}`} className="border-t"><th scope="row" className="p-2 font-normal">{point.label}</th><td className="p-2 text-right font-mono">{formatValue(point.value)}</td></tr>)}</tbody></table></div>
    </details>}
  </figure>;
}
