// Recharts 타입 정의 (SSR 지원)
declare module 'recharts' {
  import type { ComponentType, ReactNode } from 'react';;

  interface BaseChartProps {
    width?: number | string;
    height?: number | string;
    children?: ReactNode;
    data?: unknown[];
  }

  interface ResponsiveContainerProps {
    width?: number | string;
    height?: number | string;
    children?: ReactNode;
  }

  interface PieProps {
    data?: unknown[];
    cx?: number | string;
    cy?: number | string;
    labelLine?: boolean;
    label?: ((entry: unknown) => string) | boolean;
    outerRadius?: number;
    fill?: string;
    dataKey?: string;
    children?: ReactNode;
  }

  interface BarProps {
    dataKey?: string;
    fill?: string;
  }

  interface LineProps {
    type?: string;
    dataKey?: string;
    stroke?: string;
    strokeWidth?: number;
    name?: string;
  }

  interface CellProps {
    key?: string;
    fill?: string;
  }

  interface XAxisProps {
    dataKey?: string;
  }

  interface YAxisProps {}

  interface CartesianGridProps {
    strokeDasharray?: string;
  }

  interface TooltipProps {
    formatter?: (value: unknown, name?: string) => [string, string];
  }

  export const ResponsiveContainer: ComponentType<ResponsiveContainerProps>;
  export const BarChart: ComponentType<BaseChartProps>;
  export const Bar: ComponentType<BarProps>;
  export const LineChart: ComponentType<BaseChartProps>;
  export const Line: ComponentType<LineProps>;
  export const PieChart: ComponentType<BaseChartProps>;
  export const Pie: ComponentType<PieProps>;
  export const Cell: ComponentType<CellProps>;
  export const XAxis: ComponentType<XAxisProps>;
  export const YAxis: ComponentType<YAxisProps>;
  export const CartesianGrid: ComponentType<CartesianGridProps>;
  export const Tooltip: ComponentType<TooltipProps>;
  export const Legend: ComponentType<any>;
  export const Area: ComponentType<any>;
  export const AreaChart: ComponentType<BaseChartProps>;
  export const RadarChart: ComponentType<BaseChartProps>;
  export const PolarGrid: ComponentType<any>;
  export const PolarAngleAxis: ComponentType<any>;
  export const PolarRadiusAxis: ComponentType<any>;
  export const Radar: ComponentType<any>;
  export const ComposedChart: ComponentType<BaseChartProps>;
  export const ScatterChart: ComponentType<BaseChartProps>;
  export const Scatter: ComponentType<any>;
  export const Treemap: ComponentType<BaseChartProps>;
  export const RadialBarChart: ComponentType<BaseChartProps>;
  export const RadialBar: ComponentType<any>;
}
