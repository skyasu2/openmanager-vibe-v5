import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatRelativeTime } from '../utils/utils-functions';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 고유한 ID를 생성합니다.
 * @param prefix - ID 접두사 (선택사항)
 * @returns 고유한 ID 문자열
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

export * from '../utils/utils-functions';

/**
 * 상대적인 시간을 문자열로 반환합니다.
 * @param date - 기준 날짜
 * @returns 상대적인 시간 문자열
 */
export const timeAgo = formatRelativeTime;
