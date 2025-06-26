/**
 * 타입 안전성을 위한 유틸리티 함수들
 */

// Error 타입 가드
export function isError(error: unknown): error is Error {
    return error instanceof Error;
}

// Error 메시지 안전 추출
export function getErrorMessage(error: unknown): string {
    if (isError(error)) {
        return getErrorMessage(error);
    }
    if (typeof error === 'string') {
        return error;
    }
    return '알 수 없는 오류가 발생했습니다.';
}

// 배열 안전 접근
export function safeArrayAccess<T>(array: T[], index: number): T | undefined {
    return array && array.length > index && index >= 0 ? array[index] : undefined;
}

// 객체 속성 안전 접근
export function safeObjectAccess<T, K extends keyof T>(
    obj: T | null | undefined,
    key: K
): T[K] | undefined {
    return obj?.[key];
}

// 숫자 안전 변환
export function safeParseFloat(value: string | undefined): number {
    if (!value) return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
}

export function safeParseInt(value: string | undefined): number {
    if (!value) return 0;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
}

// 배열이 비어있지 않은지 확인하는 타입 가드
export function isNonEmptyArray<T>(array: T[]): array is [T, ...T[]] {
    return array.length > 0;
}

// undefined가 아닌지 확인하는 타입 가드
export function isDefined<T>(value: T | undefined): value is T {
    return value !== undefined;
}

// null이 아닌지 확인하는 타입 가드
export function isNotNull<T>(value: T | null): value is T {
    return value !== null;
}

// null과 undefined가 아닌지 확인하는 타입 가드
export function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

// 안전한 JSON 파싱
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json);
    } catch {
        return fallback;
    }
}

// 안전한 배열 마지막 요소 접근
export function getLastElement<T>(array: T[]): T | undefined {
    return isNonEmptyArray(array) ? array[array.length - 1] : undefined;
}

// 안전한 배열 첫 번째 요소 접근
export function getFirstElement<T>(array: T[]): T | undefined {
    return isNonEmptyArray(array) ? array[0] : undefined;
}

// 안전한 객체 키 접근
export function safeObjectKeyAccess<T>(
    obj: Record<string, T> | undefined,
    key: string
): T | undefined {
    return obj?.[key];
}

// 기본값과 함께 안전한 접근
export function withDefault<T>(value: T | undefined | null, defaultValue: T): T {
    return isNotNullOrUndefined(value) ? value : defaultValue;
}

// 배열에서 안전한 find
export function safeFindInArray<T>(
    array: T[],
    predicate: (item: T) => boolean
): T | undefined {
    return array.find(predicate);
}

// 타입 안전한 Object.keys
export function getObjectKeys<T extends Record<string, unknown>>(obj: T): Array<keyof T> {
    return Object.keys(obj) as Array<keyof T>;
}

// 타입 안전한 Object.entries
export function getObjectEntries<T extends Record<string, unknown>>(
    obj: T
): Array<[keyof T, T[keyof T]]> {
    return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

// useEffect 안전 반환 (cleanup 함수 또는 undefined)
export function safeUseEffectReturn(cleanup?: () => void): (() => void) | undefined {
    return cleanup;
}

// 배열 인덱스 안전 접근 (기본값 포함)
export function getArrayElement<T>(array: T[], index: number, defaultValue: T): T;
export function getArrayElement<T>(array: T[], index: number): T | undefined;
export function getArrayElement<T>(array: T[], index: number, defaultValue?: T): T | undefined {
    const element = safeArrayAccess(array, index);
    return element !== undefined ? element : defaultValue;
}

// 안전한 Math.min/max (빈 배열 처리)
export function safeMin(values: number[]): number | undefined {
    return isNonEmptyArray(values) ? Math.min(...values) : undefined;
}

export function safeMax(values: number[]): number | undefined {
    return isNonEmptyArray(values) ? Math.max(...values) : undefined;
}

// 안전한 배열 슬라이스
export function safeSlice<T>(array: T[], start?: number, end?: number): T[] {
    return array ? array.slice(start, end) : [];
}

// 배열 요소 존재 확인
export function hasIndex<T>(array: T[], index: number): boolean {
    return array && index >= 0 && index < array.length;
}

// 객체 속성 존재 확인
export function hasProperty<T extends Record<string, unknown>>(
    obj: T | null | undefined,
    key: string
): boolean {
    return obj != null && key in obj;
}

// 안전한 문자열 분할
export function safeSplit(str: string | undefined, separator: string): string[] {
    return str ? str.split(separator) : [];
}

// 안전한 정규식 매치
export function safeMatch(str: string | undefined, regex: RegExp): RegExpMatchArray | null {
    return str ? str.match(regex) : null;
}

// 안전한 배열 정렬 (원본 보존)
export function safeSorted<T>(array: T[], compareFn?: (a: T, b: T) => number): T[] {
    return array ? [...array].sort(compareFn) : [];
} 