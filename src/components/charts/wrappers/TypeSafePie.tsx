/**
 * 🔧 Type-safe Recharts Pie Wrapper
 *
 * 목적: Recharts 2.15.4와 TypeScript 5.7 strict mode 간 타입 호환성 해결
 * 패턴: Wrapper 패턴 (TypeScript 공식 권장, 업계 표준)
 *
 * 문제:
 * - Recharts PieProps.label: boolean | ReactElement | ((entry: unknown) => string)
 * - 우리 코드: ({ name, value }: { name: string; value: number }) => string
 * - TypeScript 5.7: Parameter contravariance로 타입 불일치 에러
 *
 * 해결:
 * - 컴파일 타임: 타입 안전한 label 함수 제공
 * - 런타임: unknown → 구조화된 객체로 타입 가드
 */

import * as React from 'react';
import { Pie as RechartsPie, PieProps } from 'recharts';

/**
 * 안전한 Pie label 함수 타입
 * - entry는 name, value, percent 등을 포함한 객체
 * - Recharts가 제공하는 다양한 필드 허용
 */
type SafeLabelFunction = (entry: {
  name?: string;
  value?: number;
  percent?: number;
  tier?: any;
  percentage?: any;
  [key: string]: any;
}) => string;

/**
 * 타입 안전한 Pie Props
 * - label을 SafeLabelFunction으로 재정의
 * - data를 유연한 타입으로 재정의 (any 배열)
 * - 나머지 props는 Recharts 원본 유지
 */
type TypeSafePieProps = Omit<PieProps, 'label' | 'data'> & {
  label?: boolean | React.ReactElement | SafeLabelFunction;
  data: Array<any>;
};

/**
 * Type-safe Pie 컴포넌트
 *
 * 사용법:
 * ```tsx
 * import { TypeSafePie } from '@/components/charts/wrappers';
 *
 * <TypeSafePie
 *   data={chartData}
 *   label={({ name, value }) => `${name}: ${value}%`}
 *   dataKey="value"
 * />
 * ```
 */
export const TypeSafePie = React.forwardRef<unknown, TypeSafePieProps>(
  (props, _ref) => {
    const { label, data, ...restProps } = props;

    // 런타임 타입 가드로 안전 변환
    const safeLabel =
      typeof label === 'function'
        ? (entry: unknown) => {
            // 타입 가드: unknown → { name, value, ... }
            if (entry && typeof entry === 'object') {
              return label(entry as Parameters<SafeLabelFunction>[0]);
            }
            // Fallback: 예상치 못한 타입
            console.warn(
              `[TypeSafePie] Unexpected entry type: ${typeof entry}`,
              entry
            );
            return '';
          }
        : label;

    // Recharts 원본 Pie에 타입 변환된 label, data 전달
        return <RechartsPie {...restProps} data={data} label={safeLabel} />;
  }
);

TypeSafePie.displayName = 'TypeSafePie';
