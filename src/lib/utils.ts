import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 숫자를 소수점 두 자리까지의 퍼센테이지 문자열로 변환합니다.
 * null, undefined, NaN과 같은 값은 '0.00%'로 안전하게 처리합니다.
 * @param value - 변환할 숫자 (예: 75.123)
 * @returns 포맷팅된 문자열 (예: "75.12%")
 */
export function formatPercentage(value: number | null | undefined): string {
  const num = Number(value);
  if (isNaN(num)) {
    return '0.00%';
  }
  return `${num.toFixed(2)}%`;
}
