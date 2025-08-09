/**
 * 📊 PerformanceDashboard Charts
 * 
 * Dynamic chart component imports for performance dashboard:
 * - Recharts components with SSR disabled
 * - Type-safe dynamic imports
 * - Optimized for Next.js 15 App Router
 */

import dynamic from 'next/dynamic';
import type {
  AreaChart as AreaChartType,
  BarChart as BarChartType,
  LineChart as LineChartType,
  PieChart as PieChartType,
  ResponsiveContainer as ResponsiveContainerType,
  XAxis as XAxisType,
  YAxis as YAxisType,
  CartesianGrid as CartesianGridType,
  Tooltip as TooltipType,
  Area as AreaType,
  Bar as BarType,
  Line as LineType,
  Cell as CellType,
  Pie as PieType,
} from 'recharts';

// 동적 import로 차트 컴포넌트들 로드
export const AreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof AreaChartType>>;

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
  {
    ssr: false,
  }
) as React.ComponentType<React.ComponentProps<typeof XAxisType>>;

export const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis as any),
  {
    ssr: false,
  }
) as React.ComponentType<React.ComponentProps<typeof YAxisType>>;

export const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof CartesianGridType>>;

export const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip as any),
  { ssr: false }
) as React.ComponentType<React.ComponentProps<typeof TooltipType>>;

export const Area = dynamic(() => import('recharts').then((mod) => mod.Area as any), {
  ssr: false,
}) as React.ComponentType<React.ComponentProps<typeof AreaType>>;

export const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar as any), {
  ssr: false,
}) as React.ComponentType<React.ComponentProps<typeof BarType>>;

export const Line = dynamic(() => import('recharts').then((mod) => mod.Line as any), {
  ssr: false,
}) as React.ComponentType<React.ComponentProps<typeof LineType>>;

export const Cell = dynamic(() => import('recharts').then((mod) => mod.Cell as any), {
  ssr: false,
}) as React.ComponentType<React.ComponentProps<typeof CellType>>;

export const Pie = dynamic(() => import('recharts').then((mod) => mod.Pie as any), {
  ssr: false,
}) as React.ComponentType<React.ComponentProps<typeof PieType>>;