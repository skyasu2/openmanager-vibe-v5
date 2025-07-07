/**
 * 전역 객체 타입 확장
 * Node.js global 객체에 커스텀 속성들의 타입을 정의
 */

// 시스템 요청 제한 관련 타입
interface StatusRequestCount {
    count: number;
    resetTime: number;
}

// 마지막 상태 체크 관련 타입
interface LastStatusCheck {
    [userId: string]: number;
}

// 무료 티어 캐시 관련 타입
interface FreeTierCache {
    [key: string]: any;
}

declare global {
    // Node.js global 객체 확장
    namespace NodeJS {
        interface Global {
            statusRequestCount?: StatusRequestCount;
            lastStatusCheck?: LastStatusCheck;
            freeTierCache?: FreeTierCache;
        }
    }

    // 글로벌 스코프에서 직접 사용할 수 있도록 확장
    var statusRequestCount: StatusRequestCount | undefined;
    var lastStatusCheck: LastStatusCheck | undefined;
    var freeTierCache: FreeTierCache | undefined;
}

export { };
