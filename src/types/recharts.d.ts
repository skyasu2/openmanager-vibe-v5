// Recharts 타입 정의 (SSR 지원)
declare module 'recharts' {
  import { ComponentType, ReactNode } from 'react';

  interface BaseChartProps {
    width?: number | string;
    height?: number | string;
    children?: ReactNode;
    data?: any[];
  }

  interface ResponsiveContainerProps {
    width?: number | string;
    height?: number | string;
    children?: ReactNode;
  }

  interface PieProps {
    data?: any[];
    cx?: number | string;
    cy?: number | string;
    labelLine?: boolean;
    label?: ((entry: any) => string) | boolean;
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
    formatter?: (value: any, name?: string) => [string, string];
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
  export const Legend: any;
  export const Area: any;
  export const AreaChart: any;
  export const RadarChart: any;
  export const PolarGrid: any;
  export const PolarAngleAxis: any;
  export const PolarRadiusAxis: any;
  export const Radar: any;
  export const ComposedChart: any;
  export const ScatterChart: any;
  export const Scatter: any;
  export const Treemap: any;
  export const RadialBarChart: any;
  export const RadialBar: any;
}
