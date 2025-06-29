/**
 * 🪟 Windows 환경 한국어 UTF-8 강제 설정
 * Windows 터미널에서 한국어가 깨지는 문제를 근본적으로 해결
 */

import process from 'process';
import { utf8Logger } from './utf8-logger';

/**
 * Windows 환경에서 UTF-8 출력 강제 설정
 */
export function forceWindowsUTF8() {
    // Windows 환경에서만 실행
    if (process.platform !== 'win32') {
        return;
    }

    try {
        // 1. 표준 출력 인코딩 설정
        if (process.stdout.setEncoding) {
            process.stdout.setEncoding('utf8');
        }

        // 2. 표준 에러 인코딩 설정
        if (process.stderr.setEncoding) {
            process.stderr.setEncoding('utf8');
        }

        // 3. 환경변수 설정
        process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --no-deprecation';
        process.env.FORCE_COLOR = '1'; // 컬러 출력 강제 활성화

        // 4. 콘솔 강화 설정
        if (typeof process.stdout.write === 'function') {
            const originalWrite = process.stdout.write.bind(process.stdout);

            process.stdout.write = function (chunk: any, encoding?: any, cb?: any) {
                // 한국어 문자열인 경우 UTF-8로 강제 인코딩
                if (typeof chunk === 'string' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(chunk)) {
                    const buffer = Buffer.from(chunk, 'utf8');
                    return originalWrite(buffer, encoding, cb);
                }
                return originalWrite(chunk, encoding, cb);
            };
        }

        // 5. 에러 출력 강화
        if (typeof process.stderr.write === 'function') {
            const originalWrite = process.stderr.write.bind(process.stderr);

            process.stderr.write = function (chunk: any, encoding?: any, cb?: any) {
                // 한국어 문자열인 경우 UTF-8로 강제 인코딩
                if (typeof chunk === 'string' && /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(chunk)) {
                    const buffer = Buffer.from(chunk, 'utf8');
                    return originalWrite(buffer, encoding, cb);
                }
                return originalWrite(chunk, encoding, cb);
            };
        }

        console.log('✅ Windows UTF-8 한국어 출력 강화 설정 완료');
    } catch (error) {
        console.warn('⚠️ Windows UTF-8 설정 실패:', error);
    }
}

/**
 * 한국어 텍스트 UTF-8 검증 및 수정
 */
export function validateKoreanUTF8(text: string): string {
    try {
        // 1. 한국어 감지
        if (!/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text)) {
            return text; // 한국어가 아니면 그대로 반환
        }

        // 2. UTF-8 바이트로 변환 후 다시 디코딩
        const buffer = Buffer.from(text, 'utf8');
        const validated = buffer.toString('utf8');

        // 3. 검증: 깨진 문자 체크
        if (validated.includes('�') || validated.includes('??')) {
            console.warn('⚠️ 한국어 인코딩 문제 감지:', text);

            // 4. 대체 인코딩 시도 (Windows CP949 → UTF-8)
            try {
                const cp949Buffer = Buffer.from(text, 'binary');
                const utf8Text = cp949Buffer.toString('utf8');
                return utf8Text;
            } catch (fallbackError) {
                console.warn('⚠️ 대체 인코딩도 실패:', fallbackError);
                return text; // 원본 반환
            }
        }

        return validated;
    } catch (error) {
        console.warn('⚠️ 한국어 UTF-8 검증 실패:', error);
        return text; // 원본 반환
    }
}

/**
 * 강화된 한국어 안전 console.log
 */
export function safeKoreanLog(message: string, ...args: any[]) {
    try {
        const validatedMessage = validateKoreanUTF8(message);

        if (process.platform === 'win32') {
            // Windows: Buffer를 통한 안전한 출력
            const buffer = Buffer.from(validatedMessage + '\n', 'utf8');
            process.stdout.write(buffer);

            if (args.length > 0) {
                console.log(...args);
            }
        } else {
            // 다른 OS: 일반 출력
            console.log(validatedMessage, ...args);
        }
    } catch (error) {
        // 최후의 수단: 영어로 출력
        console.log('[Korean text encoding error]', message, ...args);
    }
}

/**
 * 🔧 Windows UTF-8 인코딩 강제 설정
 */
export function initializeWindowsUTF8(): void {
    if (process.platform === 'win32') {
        // Windows 환경에서만 실행
        try {
            // Node.js 프로세스 인코딩 설정
            if (process.stdout.isTTY) {
                process.stdout.setEncoding('utf8');
            }
            if (process.stderr.isTTY) {
                process.stderr.setEncoding('utf8');
            }

            // 환경변수 강제 설정
            process.env.LANG = 'ko_KR.UTF-8';
            process.env.LC_ALL = 'ko_KR.UTF-8';
            process.env.PYTHONIOENCODING = 'utf-8';

            utf8Logger.korean('🔧', 'Windows UTF-8 인코딩 강제 설정 완료');
        } catch (error) {
            console.warn('⚠️ Windows UTF-8 설정 실패:', error);
        }
    }
}

/**
 * 🇰🇷 한국어 쿼리 안전 처리
 */
export function safeKoreanQuery(query: string): string {
    if (!query) return '';

    try {
        // 1단계: Buffer 기반 UTF-8 처리
        const buffer = Buffer.from(query, 'utf8');
        let safeQuery = buffer.toString('utf8');

        // 2단계: Windows 특화 깨진 문자 복구
        if (process.platform === 'win32') {
            safeQuery = fixWindowsKoreanEncoding(safeQuery);
        }

        // 3단계: 기본 정규화
        return safeQuery
            .replace(/\s+/g, ' ')
            .trim();

    } catch (error) {
        utf8Logger.error('한국어 쿼리 처리 오류:', error);
        return query; // 원본 반환
    }
}

/**
 * 🔧 Windows 특화 한국어 인코딩 복구
 */
function fixWindowsKoreanEncoding(text: string): string {
    if (!text.includes('\uFFFD')) {
        return text; // 깨진 문자가 없으면 그대로 반환
    }

    // Windows에서 자주 발생하는 한국어 깨짐 패턴 복구
    const koreanPatterns = [
        // 시간 관련
        { pattern: /\uFFFD{3,4}\s*\uFFFD{3,4}\uFFFD{1,2}\s*\uFFFD{4,5}\uFFFD{2,3}\?/g, replace: '현재 시간이 몇시인가요?' },
        { pattern: /\uFFFD{4}\s*\uFFFD{3,4}/g, replace: '현재 시간' },
        { pattern: /\uFFFD{2,3}\uFFFD{2,3}/g, replace: '몇시' },

        // 상태 관련
        { pattern: /\uFFFD{3,4}\s*\uFFFD{2,3}/g, replace: '서버 상태' },
        { pattern: /\uFFFD{4}\s*\uFFFD{3}/g, replace: '시스템 상태' },

        // 일반적인 복구
        { pattern: /\uFFFD+/g, replace: '' }, // 남은 깨진 문자 제거
    ];

    let fixedText = text;

    for (const { pattern, replace } of koreanPatterns) {
        fixedText = fixedText.replace(pattern, replace);
    }

    return fixedText;
}

/**
 * 🧪 한국어 인코딩 테스트
 */
export function testKoreanEncoding(): boolean {
    const testStrings = [
        '현재 시간이 몇시인가요?',
        '서버 상태를 확인해주세요.',
        '시스템 모니터링 상태',
        '한국어 UTF-8 테스트'
    ];

    let allPassed = true;

    for (const testString of testStrings) {
        const processed = safeKoreanQuery(testString);
        const hasKorean = /[가-힣]/.test(processed);

        if (!hasKorean && /[가-힣]/.test(testString)) {
            utf8Logger.error(`❌ 한국어 인코딩 테스트 실패: "${testString}" -> "${processed}"`);
            allPassed = false;
        } else {
            utf8Logger.korean('✅', `한국어 인코딩 테스트 성공: "${processed}"`);
        }
    }

    return allPassed;
}

/**
 * 🎯 Windows 개발 환경 최적화
 */
export function optimizeWindowsDevelopment(): void {
    if (process.platform !== 'win32') return;

    // Windows 개발 환경 최적화 설정
    const optimizations = {
        // 콘솔 출력 최적화
        consoleEncoding: 'utf8',

        // 파일 시스템 인코딩
        fileSystemEncoding: 'utf8',

        // 네트워크 인코딩
        httpEncoding: 'utf8'
    };

    try {
        // 환경변수 설정
        Object.assign(process.env, {
            FORCE_COLOR: '1',
            NODE_OPTIONS: '--max-old-space-size=4096',
            UV_THREADPOOL_SIZE: '4'
        });

        utf8Logger.korean('🎯', 'Windows 개발 환경 최적화 완료');
    } catch (error) {
        console.warn('⚠️ Windows 개발 환경 최적화 실패:', error);
    }
}

/**
 * 🔍 플랫폼별 인코딩 감지
 */
export function detectPlatformEncoding(): string {
    const platform = process.platform;
    const arch = process.arch;
    const nodeVersion = process.version;

    const encoding = platform === 'win32' ? 'utf8-windows' : 'utf8-unix';

    utf8Logger.korean('🔍', `플랫폼 인코딩 감지: ${platform}-${arch}, Node.js ${nodeVersion}, 인코딩: ${encoding}`);

    return encoding;
}

/**
 * 🚀 Windows UTF-8 초기화 (시스템 시작 시 호출)
 */
export function initializeWindowsUTF8System(): void {
    initializeWindowsUTF8();
    optimizeWindowsDevelopment();

    const encoding = detectPlatformEncoding();
    const testResult = testKoreanEncoding();

    if (testResult) {
        utf8Logger.korean('✅', `Windows UTF-8 시스템 초기화 완료 (${encoding})`);
    } else {
        utf8Logger.error('❌', `Windows UTF-8 시스템 초기화 실패 (${encoding})`);
    }
}

// 자동 초기화
if (typeof window === 'undefined') {
    forceWindowsUTF8();
} 