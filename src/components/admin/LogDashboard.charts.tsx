/**
 * 📊 LogDashboard Chart Components
 * 
 * Dynamic imports for Recharts components with SSR optimization:
 * - All chart components loaded dynamically to reduce initial bundle
 * - Type-safe wrappers for Recharts components
 * - Optimized for Next.js SSR/CSR compatibility
 */

import dynamic from 'next/dynamic';
import type {
  BarChart as BarChartType,
  LineChart as LineChartType,
  PieChart as PieChartType,
  ResponsiveContainer as ResponsiveContainerType,
  XAxis as XAxisType,
  YAxis as YAxisType,
  CartesianGrid as CartesianGridType,
  Tooltip as TooltipType,
  Bar as BarType,
  Line as LineType,
  Cell as CellType,
  Pie as PieType,
} from 'recharts';

// Dynamic imports for all chart components
export const BarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof BarChartType>>;

export const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof LineChartType>>;

export const PieChart = dynamic(
  () => import('recharts').then((mod) => mod.PieChart as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof PieChartType>>;

export const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof ResponsiveContainerType>>;

export const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof XAxisType>>;

export const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof YAxisType>>;

export const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof CartesianGridType>>;

export const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof TooltipType>>;

export const Bar = dynamic(
  () => import('recharts').then((mod) => mod.Bar as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof BarType>>;

export const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof LineType>>;

export const Cell = dynamic(
  () => import('recharts').then((mod) => mod.Cell as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof CellType>>;

export const Pie = dynamic(
  () => import('recharts').then((mod) => mod.Pie as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof PieType>>;

// Custom tooltip component for better styling
export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number | string;
  }>;
  label?: string;
}

export const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};