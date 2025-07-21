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

/**
 * UUID v4를 생성합니다.
 * @returns UUID v4 문자열
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 문자열을 슬러그로 변환합니다.
 * @param str - 변환할 문자열
 * @returns 슬러그 문자열
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 특수문자 제거
    .replace(/[\s_-]+/g, '-') // 공백과 언더스코어를 하이픈으로
    .replace(/^-+|-+$/g, ''); // 시작과 끝의 하이픈 제거
}

/**
 * 문자열을 제한된 길이로 자릅니다.
 * @param str - 자를 문자열
 * @param length - 최대 길이
 * @param suffix - 끝에 추가할 문자열 (기본값: '...')
 * @returns 잘린 문자열
 */
export function truncate(
  str: string,
  length: number,
  suffix: string = '...'
): string {
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
}

/**
 * 숫자를 읽기 쉬운 형태로 포맷팅합니다.
 * @param num - 포맷팅할 숫자
 * @returns 포맷팅된 문자열
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * 바이트를 읽기 쉬운 형태로 포맷팅합니다.
 * @param bytes - 바이트 수
 * @returns 포맷팅된 문자열
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 두 날짜 사이의 차이를 계산합니다.
 * @param date1 - 첫 번째 날짜
 * @param date2 - 두 번째 날짜
 * @returns 밀리초 단위의 차이
 */
export function dateDiff(date1: Date, date2: Date): number {
  return Math.abs(date1.getTime() - date2.getTime());
}

/**
 * 상대적인 시간을 문자열로 반환합니다.
 * @param date - 기준 날짜
 * @returns 상대적인 시간 문자열
 */
export function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return `${seconds}초 전`;
}
