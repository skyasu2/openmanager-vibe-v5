/**
 * Recharts 3.x 타입 정의 확장
 *
 * 1. PieProps children prop 지원:
 *    Recharts 3.x PieProps에 children prop이 명시적으로 정의되어 있지 않지만,
 *    Cell 패턴 (<Pie><Cell /></Pie>)은 공식적으로 지원되는 패턴입니다.
 *
 * 2. ChartDataInput 호환성:
 *    프로젝트의 ChartDataPoint 타입이 Recharts의 ChartDataInput과 호환되도록 보장합니다.
 *    TypeScript의 구조적 타이핑 제한을 우회하기 위해 any를 사용합니다.
 *
 * 3. Legend formatter 타입 확장:
 *    LegendPayload의 color가 optional이므로 타입 확장으로 처리합니다.
 */

import { ReactNode } from 'react';

declare module 'recharts' {
  // Pie 컴포넌트 타입 확장
  interface PieProps {
    children?: ReactNode;
    // ChartDataPoint[] 호환을 위한 data prop 타입 완전 재정의
    data?: any[];
  }

  // Legend 컴포넌트 타입 확장
  interface LegendProps {
    formatter?: (value: any, entry: any, index: number) => React.ReactNode;
  }
}
