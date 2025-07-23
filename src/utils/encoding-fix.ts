/**
 * 🔧 OpenManager Vibe v5 - 한글 인코딩 문제 해결 유틸리티
 *
 * 문제 원인:
 * 1. Windows Git Bash에서 UTF-8 처리 문제
 * 2. Next.js API에서 한글 쿼리 파라미터 인코딩 이슈
 * 3. 터미널 출력에서 한글 깨짐
 *
 * 해결책:
 * 1. Buffer 기반 UTF-8 강제 디코딩
 * 2. 안전한 한글 로그 출력
 * 3. URL 인코딩/디코딩 정규화
 */

/**
 * 🔧 안전한 한글 디코딩
 */
export function safeDecodeKorean(input: string): string {
  try {
    // 1. URL 디코딩 시도
    if (input.includes('%')) {
      try {
        const decoded = decodeURIComponent(input);
        if (isValidKorean(decoded)) {
          return decoded;
        }
      } catch (error) {
        console.warn('URL 디코딩 실패:', (error as Error).message);
      }
    }

    // 2. Buffer 기반 UTF-8 강제 디코딩
    if (Buffer.isBuffer(input)) {
      return Buffer.from(input).toString('utf-8');
    }

    // 3. 문자열을 Buffer로 변환 후 UTF-8 디코딩
    const buffer = Buffer.from(input, 'utf-8');
    const decoded = buffer.toString('utf-8');

    if (isValidKorean(decoded)) {
      return decoded;
    }

    // 4. Latin-1에서 UTF-8로 변환 시도 (일부 깨짐 패턴)
    try {
      const latin1Buffer = Buffer.from(input, 'latin1');
      const utf8Decoded = latin1Buffer.toString('utf-8');
      if (isValidKorean(utf8Decoded)) {
        return utf8Decoded;
      }
    } catch (error) {
      console.warn('Latin-1 변환 실패:', (error as Error).message);
    }

    // 5. 원본 반환 (더 이상 처리할 수 없음)
    return input;
  } catch (error) {
    console.error('한글 디코딩 실패:', (error as Error).message);
    return input;
  }
}

/**
 * 🔍 유효한 한글인지 확인
 */
export function isValidKorean(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  // 한글 유니코드 범위 확인
  const koreanPattern = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;
  const hasKorean = koreanPattern.test(text);

  // 깨진 문자 패턴 확인
  const brokenPattern = /[����]/;
  const hasBrokenChars = brokenPattern.test(text);

  return hasKorean && !hasBrokenChars;
}

/**
 * 🖨️ 안전한 한글 로그 출력
 * Windows 환경에서 한글 깨짐 방지
 */
export function safeKoreanLog(message: string, data?: any): void {
  const timestamp = new Date().toISOString();

  // 한글 문자열 안전 처리
  let safeMessage = message;
  try {
    // UTF-8 강제 인코딩 시도
    safeMessage = Buffer.from(message, 'utf8').toString('utf8');

    // 깨진 문자 패턴 복구 시도
    safeMessage = safeMessage
      .replace(/�+/g, '') // 깨진 문자 제거
      .replace(/\ufffd+/g, '') // 대체 문자 제거
      // eslint-disable-next-line no-control-regex
      .replace(/[^\u0001-\u007F\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g, '') // 한글과 ASCII만 유지 (null 문자 제외)
      .trim();

    // 빈 문자열이 된 경우 원본 사용
    if (!safeMessage) {
      safeMessage = message;
    }
  } catch (error) {
    // 인코딩 실패 시 원본 사용
    safeMessage = message;
  }

  // 콘솔 출력 시 인코딩 명시
  if (data) {
    console.log(`[${timestamp}] ${safeMessage}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`[${timestamp}] ${safeMessage}`);
  }
}

/**
 * 🔄 쿼리 파라미터 안전 처리
 */
export function safeProcessQuery(query: string): string {
  try {
    // 1. 기본 디코딩
    let processed = safeDecodeKorean(query);

    // 2. 공백 정규화
    processed = processed.replace(/\s+/g, ' ').trim();

    // 3. 특수문자 처리 (한글 보존)
    processed = processed.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ');

    // 4. 다중 공백 제거
    processed = processed.replace(/\s+/g, ' ').trim();

    return processed;
  } catch (error) {
    console.error('쿼리 처리 실패:', (error as Error).message);
    return query;
  }
}

/**
 * 🌐 API 요청 본문 안전 처리
 */
export async function safeProcessRequestBody(request: Request): Promise<any> {
  try {
    // 1. ArrayBuffer로 원시 데이터 읽기
    const rawBody = await request.arrayBuffer();

    // 2. Buffer 기반 UTF-8 강제 디코딩
    const bodyText = Buffer.from(rawBody).toString('utf-8');

    // 3. JSON 파싱
    const body = JSON.parse(bodyText);

    // 4. 쿼리 필드 안전 처리
    if (body.query && typeof body.query === 'string') {
      body.query = safeProcessQuery(body.query);
    }

    return body;
  } catch (error) {
    console.error('요청 본문 처리 실패:', (error as Error).message);
    throw new Error('Invalid request body format');
  }
}

/**
 * 🔧 터미널 인코딩 감지 및 수정
 */
export function detectAndFixTerminalEncoding(): void {
  try {
    // Windows 환경에서 터미널 인코딩 확인
    if (process.platform === 'win32') {
      // 환경변수 설정으로 UTF-8 강제
      process.env.LANG = 'ko_KR.UTF-8';
      process.env.LC_ALL = 'ko_KR.UTF-8';

      // stdout 인코딩 설정
      if (process.stdout.setEncoding) {
        process.stdout.setEncoding('utf8');
      }

      console.log('✅ Windows 터미널 UTF-8 인코딩 설정 완료');
    }
  } catch (error) {
    console.warn('터미널 인코딩 설정 실패:', (error as Error).message);
  }
}

/**
 * 🧪 한글 인코딩 테스트
 */
export function testKoreanEncoding(): {
  success: boolean;
  tests: Array<{
    name: string;
    input: string;
    output: string;
    success: boolean;
  }>;
} {
  const testCases = [
    { name: '기본 한글', input: '서버 상태 확인' },
    { name: '한글+영어', input: 'CPU 사용량 분석' },
    { name: '특수문자', input: '메모리 100% 사용중!' },
    { name: 'URL 인코딩', input: encodeURIComponent('네트워크 연결 테스트') },
  ];

  const results = testCases.map(testCase => {
    try {
      const output = safeDecodeKorean(testCase.input);
      const success = isValidKorean(output);

      return {
        name: testCase.name,
        input: testCase.input,
        output,
        success,
      };
    } catch (error) {
      return {
        name: testCase.name,
        input: testCase.input,
        output: (error as Error).message,
        success: false,
      };
    }
  });

  const success = results.every(result => result.success);

  return { success, tests: results };
}

// 시스템 시작 시 터미널 인코딩 자동 설정
if (typeof window === 'undefined') {
  detectAndFixTerminalEncoding();
}
