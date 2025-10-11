import { 
  TooltipProps as RechartsTooltipProps,
  BarProps,
  LineProps,
  PieProps,
  YAxisProps,
  XAxisProps
} from 'recharts';
import * as React from 'react';

/**
 * Recharts TypeScript 5.7.2 strict mode 호환성을 위한 안전한 타입 래퍼들
 * 
 * 문제: Recharts 2.15.4의 내장 타입이 TypeScript 5.7 strict 모드와 완전히 호환되지 않음
 * 해결: 실제 Recharts 타입을 확장하여 타입 안전성과 런타임 호환성 모두 확보
 */

// 📊 안전한 Tooltip Props 타입 - 실제 Recharts TooltipProps 확장
export interface SafeTooltipProps<TValue = string | number, TName = string | number> {
  active?: boolean;
  payload?: Array<{
    value: TValue;
    name?: TName;
    color?: string;
    dataKey?: string | number;
    payload?: Record<string, unknown>;
    stroke?: string;
    fill?: string;
  }>;
  label?: string | number;
  separator?: string;
  cursor?: boolean | object;
  wrapperStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  itemStyle?: React.CSSProperties;
  formatter?: (value: TValue, name: TName) => React.ReactNode;
  labelFormatter?: (label: string | number) => React.ReactNode;
}

// 📈 안전한 Line Props 타입 - 실제 Recharts LineProps 기반
export interface SafeLineProps extends Partial<LineProps> {
  type?: 'basis' | 'basisClosed' | 'basisOpen' | 'linear' | 'linearClosed' | 'natural' | 'monotoneX' | 'monotoneY' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter';
  dataKey: string;  // Recharts는 string만 허용
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  dot?: boolean | React.SVGProps<SVGElement> | React.ReactElement;
  activeDot?: boolean | React.SVGProps<SVGElement> | React.ReactElement;
  yAxisId?: string | number;
  connectNulls?: boolean;
  strokeDasharray?: string | number;
}

// 📊 안전한 Bar Props 타입 - 실제 Recharts BarProps와 완전 호환
export interface SafeBarProps {
  dataKey: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  yAxisId?: string | number;
  xAxisId?: string | number;
  stackId?: string | number;
  maxBarSize?: number;
  minPointSize?: number;
  background?: boolean | React.SVGProps<SVGRectElement>;
  shape?: React.ReactElement | ((props: unknown) => React.ReactElement);
  name?: string;  // Bar 컴포넌트 name 속성 추가
  radius?: number | [number, number, number, number];  // Bar 모서리 반지름
  children?: React.ReactNode;  // Cell 등 자식 요소
}

// 🥧 안전한 Pie Props 타입 - TypeScript strict 호환
export interface SafePieProps {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  cx?: string | number;
  cy?: string | number;
  innerRadius?: number;  // Recharts는 number만 허용
  outerRadius?: number;  // Recharts는 number만 허용
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  label?: boolean | React.ReactElement | ((props: unknown) => React.ReactElement);
  labelLine?: boolean;
  startAngle?: number;
  endAngle?: number;
  paddingAngle?: number;
  children?: React.ReactNode;
}

// 🎨 안전한 Cell Props 타입
export interface SafeCellProps {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  key?: string | number;
}

// 📐 안전한 CartesianGrid Props 타입
export interface SafeCartesianGridProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  horizontal?: boolean;
  vertical?: boolean;
  horizontalPoints?: number[];
  verticalPoints?: number[];
  stroke?: string;
  strokeDasharray?: string;  // Recharts는 string만 허용
  strokeWidth?: number;
  fill?: string;
  fillOpacity?: number;
  strokeOpacity?: number;
}

// 📊 안전한 XAxis/YAxis Props 타입 - 실제 Recharts YAxisProps 기반
export interface SafeAxisProps extends Partial<YAxisProps> {
  type?: 'number' | 'category';
  dataKey?: string;
  xAxisId?: string | number;
  yAxisId?: string | number;
  axisLine?: boolean | React.SVGProps<SVGLineElement>;
  tickLine?: boolean | React.SVGProps<SVGLineElement>;
  tick?: boolean | React.SVGProps<SVGTextElement> | React.ReactElement;
  tickFormatter?: (value: string | number) => string;
  domain?: [number | string | 'auto' | 'dataMin' | 'dataMax', number | string | 'auto' | 'dataMin' | 'dataMax'];
  allowDataOverflow?: boolean;
  hide?: boolean;
  orientation?: 'left' | 'right';  // YAxis는 left/right만 허용
}

// 🏷️ 안전한 Legend Props 타입
export interface SafeLegendProps {
  width?: number;
  height?: number;
  layout?: 'horizontal' | 'vertical';
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  iconType?: 'line' | 'square' | 'rect' | 'circle' | 'cross' | 'diamond' | 'star' | 'triangle' | 'wye';
  formatter?: (value: string | number, entry: Record<string, unknown>, index: number) => React.ReactNode;
  wrapperStyle?: React.CSSProperties;
}

// 🎯 타입 헬퍼 유틸리티
export type SafeRechartsColor = string;
export type SafeRechartsDataKey = string | number;
export type SafeRechartsValue = string | number;

// 📋 공통 데이터 인터페이스
export interface SafeChartDataPoint {
  [key: string]: SafeRechartsValue | string;
}

// 🎯 Recharts 컴포넌트에 사용할 수 있는 확장 Props 타입들

// 📊 안전한 Tooltip 확장 Props - 실제 Recharts TooltipProps 완전 호환
export interface ExtendedTooltipProps {
  content?: React.ComponentType<SafeTooltipProps> | React.ReactElement;
  active?: boolean;
  payload?: Array<{
    value: string | number;
    name?: string;
    dataKey?: string | number;
    color?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string | number;
  separator?: string;
  cursor?: boolean | object;
  wrapperStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  itemStyle?: React.CSSProperties;
  formatter?: (value: string | number, name?: string) => [string, string];
  labelFormatter?: (label: string | number) => React.ReactNode;
  animationDuration?: number;
  animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  isAnimationActive?: boolean;
  offset?: number;
  filterNull?: boolean;
  itemSorter?: (item: Record<string, unknown>) => string | number;
  useTranslate3d?: boolean;
}

// 📊 안전한 YAxis 확장 Props - 실제 Recharts YAxisProps 기반  
export interface ExtendedYAxisProps {
  domain?: [number | string | 'auto' | 'dataMin' | 'dataMax', number | string | 'auto' | 'dataMin' | 'dataMax'];
  orientation?: 'left' | 'right';
  yAxisId?: string | number;
  type?: 'number' | 'category';
  dataKey?: string;
  axisLine?: boolean | React.SVGProps<SVGLineElement>;
  tickLine?: boolean | React.SVGProps<SVGLineElement>;
  tick?: boolean | React.SVGProps<SVGTextElement> | React.ReactElement;
  tickFormatter?: (value: string | number) => string;
  allowDataOverflow?: boolean;
  hide?: boolean;
}

// 📊 안전한 XAxis 확장 Props - 실제 Recharts XAxisProps 기반
export interface ExtendedXAxisProps extends Partial<XAxisProps> {
  dataKey?: string;
  angle?: number;
  textAnchor?: string;
  height?: number;
  fontSize?: number;
  tick?: boolean | React.SVGProps<SVGTextElement> | React.ReactElement;
  tickLine?: boolean | React.SVGProps<SVGLineElement>;
  axisLine?: boolean | React.SVGProps<SVGLineElement>;
}

/**
 * 사용 예시:
 * 
 * ```typescript
 * import { SafeTooltipProps, SafeLineProps } from '@/types/CustomRechartsTypes';
 * 
 * const MyTooltip = ({ active, payload, label }: SafeTooltipProps) => {
 *   // 타입 안전한 툴팁 구현
 * };
 * 
 * <Line {...({ dataKey: "CPU", stroke: "#ef4444" } as SafeLineProps)} />
 * <Tooltip {...({ content: <MyTooltip /> } as ExtendedTooltipProps)} />
 * <YAxis {...({ domain: [0, 100] } as ExtendedYAxisProps)} />
 * ```
 */