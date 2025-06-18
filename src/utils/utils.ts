/**
 * 에러에서 안전하게 메시지를 추출
 */
export function safeErrorMessage(error: unknown, fallback?: string): string {
    if (error === null || error === undefined) {
        return fallback || '알 수 없는 오류가 발생했습니다';
    }

    if (typeof error === 'string') {
        return error || fallback || '알 수 없는 오류가 발생했습니다';
    }

    if (error instanceof Error) {
        return error.message || fallback || '알 수 없는 오류가 발생했습니다';
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
        const message = (error as any).message;
        if (typeof message === 'string' && message) {
            return message;
        }
    }

    return fallback || '알 수 없는 오류가 발생했습니다';
}

/**
 * 백분율 계산
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100 * 100) / 100; // 소수점 둘째 자리까지 정확히 계산
}

/**
 * 문자열 자르기
 */
export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

/**
 * 상태에 따른 색상 반환
 */
export function getStatusColor(status: string): string {
    switch (status) {
        case 'healthy':
            return 'text-green-600';
        case 'warning':
            return 'text-yellow-600';
        case 'critical':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
}

/**
 * 심각도에 따른 아이콘 반환
 */
export function getSeverityIcon(severity: string): string {
    switch (severity) {
        case 'low':
            return '🟢';
        case 'medium':
            return '🟡';
        case 'high':
            return '🟠';
        case 'critical':
            return '🔴';
        default:
            return 'info';
    }
}

/**
 * 서버 환경 감지
 */
export function isServer(): boolean {
    return typeof window === 'undefined' && typeof process !== 'undefined' && !!process.versions?.node;
}

/**
 * 재시도 로직
 */
export async function retry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt === retries) {
                throw lastError;
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError!;
} 