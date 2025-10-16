/**
 * 🔧 Type-safe Recharts Tooltip Wrapper
 *
 * 목적: Recharts 2.15.4와 TypeScript 5.7 strict mode 간 타입 호환성 해결
 * 패턴: Wrapper 패턴 (TypeScript 공식 권장, 업계 표준)
 *
 * 문제:
 * - Recharts TooltipProps.formatter: (value: unknown) => ...
 * - 우리 코드: (value: string | number) => ...
 * - TypeScript 5.7: Parameter contravariance로 타입 불일치 에러
 *
 * 해결:
 * - 컴파일 타임: 타입 안전한 formatter 제공 (string | number)
 * - 런타임: unknown → string | number 타입 가드로 안전 변환
 */

import * as React from 'react';
import { Tooltip as RechartsTooltip } from 'recharts';
import type { TooltipProps } from 'recharts/types/component/Tooltip';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

/**
 * 안전한 Tooltip formatter 타입
 * - value는 string | number만 허용
 * - name은 optional string
 */
type SafeFormatter = (
  value: string | number,
  name?: string
) => React.ReactNode;

/**
 * 타입 안전한 Tooltip Props
 * - formatter를 SafeFormatter로 재정의
 * - 나머지 props (content 포함)는 Recharts 원본 유지
 */
type TypeSafeTooltipProps = Omit<TooltipProps<ValueType, NameType>, 'formatter'> & {
  formatter?: SafeFormatter;
};

/**
 * Type-safe Tooltip 컴포넌트
 *
 * 사용법:
 * ```tsx
 * import { TypeSafeTooltip } from '@/components/charts/wrappers';
 *
 * <TypeSafeTooltip
 *   formatter={(value, name) => [`${value}%`, name]}
 *   content={<CustomTooltip />}
 * />
 * ```
 */
export const TypeSafeTooltip = React.forwardRef<unknown, TypeSafeTooltipProps>(
  (props, _ref) => {
    const { formatter, ...restProps } = props;

    // 런타임 타입 가드로 안전 변환
    const safeFormatter = formatter
      ? (value: unknown, name?: string) => {
          // 타입 가드: unknown → string | number
          if (typeof value === 'string' || typeof value === 'number') {
            return formatter(value, name);
          }
          // Fallback: 예상치 못한 타입은 문자열로 변환
          console.warn(
            `[TypeSafeTooltip] Unexpected value type: ${typeof value}`,
            value
          );
          return String(value);
        }
      : undefined;

    // Recharts 원본 Tooltip에 타입 변환된 props 전달
    // @ts-expect-error - Recharts 타입 불일치 (의도적 우회)
    return <RechartsTooltip {...restProps} formatter={safeFormatter} />;
  }
);

TypeSafeTooltip.displayName = 'TypeSafeTooltip';
