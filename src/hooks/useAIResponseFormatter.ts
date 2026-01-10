/**
 * useAIResponseFormatter Hook
 *
 * 🧠 AI 응답을 육하원칙(5W1H) 구조로 변환하는 커스텀 훅
 */

import { useCallback, useMemo, useState } from 'react';
import type { ErrorState, SixWPrincipleResponse } from '@/types/ai-thinking';
import { logger } from '@/lib/logging';

interface FormatOptions {
  language: 'ko' | 'en';
  enableFallback: boolean;
  strictParsing: boolean;
}

export const useAIResponseFormatter = () => {
  const [isFormatting, setIsFormatting] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);

  // 🎯 6W1H 패턴 매핑 (메모화)
  const sixWPatterns = useMemo(
    () => ({
      who: {
        ko: /(?:누가|관리자|시스템|사용자|AI|에이전트|운영자)/i,
        en: /(?:who|admin|system|user|ai|agent|operator)/i,
      },
      what: {
        ko: /(?:무엇을|작업|분석|모니터링|처리|실행|관리|제어)/i,
        en: /(?:what|task|analysis|monitoring|processing|execution|management|control)/i,
      },
      when: {
        ko: /(?:언제|시간|현재|실시간|지속적|즉시|정기적)/i,
        en: /(?:when|time|current|realtime|continuous|immediate|regular)/i,
      },
      where: {
        ko: /(?:어디서|위치|서버|시스템|환경|플랫폼|OpenManager)/i,
        en: /(?:where|location|server|system|environment|platform|OpenManager)/i,
      },
      why: {
        ko: /(?:왜|이유|목적|안정성|성능|최적화|보안|효율성)/i,
        en: /(?:why|reason|purpose|stability|performance|optimization|security|efficiency)/i,
      },
      how: {
        ko: /(?:어떻게|방법|자동|수동|AI기반|알고리즘|프로세스)/i,
        en: /(?:how|method|automatic|manual|ai-based|algorithm|process)/i,
      },
    }),
    []
  );

  // 🎯 키워드-아이콘 매핑 (메모화)
  const _keywordIcons = useMemo(
    () => ({
      // 시스템 관련
      시스템: '🖥️',
      서버: '🌐',
      네트워크: '🌐',
      데이터베이스: '💾',
      메모리: '🧠',
      프로세서: '⚙️',
      CPU: '⚙️',
      RAM: '🧠',
      GPU: '🎮',
      저장소: '💾',
      디스크: '💿',

      // 상태 관련
      온라인: '✅',
      오프라인: '❌',
      연결됨: '🔗',
      '연결 끊김': '🔗💥',
      활성: '✅',
      비활성: '⚠️',
      정상: '✅',
      오류: '❌',
      경고: '⚠️',
      성공: '✅',
      실패: '❌',

      // 성능 관련
      느림: '🐌',
      빠름: '⚡',
      지연: '⏱️',
      응답시간: '⏱️',
      처리량: '📊',
      대역폭: '📶',
      로드: '📈',
      부하: '📈',
      과부하: '🔥',

      // AI 관련
      AI: '🤖',
      인공지능: '🤖',
      머신러닝: '🧠',
      학습: '📚',
      예측: '🔮',
      분석: '📊',
      모델: '🎯',
      알고리즘: '⚡',

      // 작업 관련
      백업: '💾',
      복원: '🔄',
      동기화: '🔄',
      업데이트: '🔄',
      설치: '📦',
      다운로드: '📥',
      업로드: '📤',
      전송: '📡',

      // 보안 관련
      보안: '🔒',
      인증: '🔐',
      권한: '👑',
      암호화: '🔐',
      해킹: '🚫',
      취약점: '⚠️',
      방화벽: '🛡️',

      // 모니터링 관련
      모니터링: '👁️',
      감시: '👁️',
      알림: '🔔',
      로그: '📝',
      기록: '📝',
      추적: '🔍',
      통계: '📊',
      지표: '📈',

      // 사용자 관련
      사용자: '👤',
      관리자: '👑',
      계정: '👤',
      로그인: '🔑',
      로그아웃: '🚪',
      세션: '⏱️',
    }),
    []
  );

  // 에러 처리 함수
  const handleError = useCallback(
    (type: ErrorState['errorType'], message: string) => {
      const errorState: ErrorState = {
        hasError: true,
        errorType: type,
        message,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3,
      };
      setError(errorState);
      logger.error(`🚨 AI Response Formatter Error [${type}]:`, message);
    },
    []
  );

  // 안전한 상태 업데이트
  const safeStateUpdate = useCallback(
    (updateFn: () => void) => {
      try {
        updateFn();
      } catch (error) {
        logger.error('❌ 상태 업데이트 실패:', error);
        handleError('unknown', '상태 업데이트 중 오류가 발생했습니다.');
      }
    },
    [handleError]
  );

  // 텍스트에서 키워드 기반 섹션 추출
  const extractSection = useCallback(
    (text: string, patterns: RegExp[], fallback: string = '정보 없음') => {
      const sentences = text.split(/[.!?]\s+/);

      for (const sentence of sentences) {
        for (const pattern of patterns) {
          if (pattern.test(sentence)) {
            return sentence.trim().replace(/^[:\-\s]+/, '');
          }
        }
      }

      return fallback;
    },
    []
  );

  // 신뢰도 계산
  const calculateConfidence = useCallback(
    (text: string, language: 'ko' | 'en') => {
      let matches = 0;
      const total = 6;

      // 6W1H 패턴 매칭 확인
      Object.values(sixWPatterns).forEach((pattern) => {
        if (pattern[language].test(text)) {
          matches++;
        }
      });

      return Math.min(matches / total + 0.3, 1.0); // 최소 0.3, 최대 1.0
    },
    [sixWPatterns]
  );

  // 구조화된 응답 파싱 (형식: "누가: 내용\n무엇을: 내용...")
  const parseStructuredResponse = useCallback(
    (response: string, language: 'ko' | 'en'): SixWPrincipleResponse => {
      const sections = {
        who:
          language === 'ko'
            ? /(?:누가|Who):\s*(.+?)(?:\n|$)/i
            : /Who:\s*(.+?)(?:\n|$)/i,
        what:
          language === 'ko'
            ? /(?:무엇을|What):\s*(.+?)(?:\n|$)/i
            : /What:\s*(.+?)(?:\n|$)/i,
        when:
          language === 'ko'
            ? /(?:언제|When):\s*(.+?)(?:\n|$)/i
            : /When:\s*(.+?)(?:\n|$)/i,
        where:
          language === 'ko'
            ? /(?:어디서|Where):\s*(.+?)(?:\n|$)/i
            : /Where:\s*(.+?)(?:\n|$)/i,
        why:
          language === 'ko'
            ? /(?:왜|Why):\s*(.+?)(?:\n|$)/i
            : /Why:\s*(.+?)(?:\n|$)/i,
        how:
          language === 'ko'
            ? /(?:어떻게|How):\s*(.+?)(?:\n|$)/i
            : /How:\s*(.+?)(?:\n|$)/i,
      };

      const extract = (pattern: RegExp, fallback: string) => {
        const match = response.match(pattern);
        return match?.[1] ? match[1].trim() : fallback;
      };

      return {
        who: extract(sections.who, '정보 없음'),
        what: extract(sections.what, '정보 없음'),
        when: extract(sections.when, '정보 없음'),
        where: extract(sections.where, '정보 없음'),
        why: extract(sections.why, '정보 없음'),
        how: extract(sections.how, '정보 없음'),
        confidence: 0.9, // 구조화된 응답은 높은 신뢰도
        sources: ['구조화된 AI 응답'],
      };
    },
    []
  );

  // AI 응답을 6W 구조로 파싱
  const parseResponse = useCallback(
    (rawResponse: string, options: FormatOptions): SixWPrincipleResponse => {
      const { language, enableFallback } = options;

      try {
        // 정규표현식으로 구조화된 응답 파싱 시도
        const structuredMatch = rawResponse.match(
          /(?:누가|Who):\s*(.+?)(?:\n|$)/i
        );
        if (structuredMatch) {
          return parseStructuredResponse(rawResponse, language);
        }

        // 키워드 기반 파싱
        const patterns = sixWPatterns;

        const who = extractSection(
          rawResponse,
          [patterns.who[language]],
          enableFallback ? 'AI 시스템' : '정보 없음'
        );

        const what = extractSection(
          rawResponse,
          [patterns.what[language]],
          enableFallback ? '시스템 분석 및 모니터링' : '정보 없음'
        );

        const when = extractSection(
          rawResponse,
          [patterns.when[language]],
          enableFallback ? '실시간 / 지속적' : '정보 없음'
        );

        const where = extractSection(
          rawResponse,
          [patterns.where[language]],
          enableFallback ? 'OpenManager V5 시스템' : '정보 없음'
        );

        const why = extractSection(
          rawResponse,
          [patterns.why[language]],
          enableFallback ? '시스템 안정성 및 성능 최적화' : '정보 없음'
        );

        const how = extractSection(
          rawResponse,
          [patterns.how[language]],
          enableFallback ? 'AI 기반 자동 분석 및 모니터링' : '정보 없음'
        );

        // 신뢰도 계산 (키워드 매칭 기반)
        const confidence = calculateConfidence(rawResponse, language);

        return {
          who,
          what,
          when,
          where,
          why,
          how,
          confidence,
          sources: ['AI 분석', '시스템 메트릭', '실시간 모니터링'],
        };
      } catch (error) {
        logger.error('❌ 응답 파싱 실패:', error);
        throw new Error('응답 파싱 중 오류가 발생했습니다.');
      }
    },
    [extractSection, calculateConfidence, sixWPatterns, parseStructuredResponse]
  );

  // 메인 포맷 함수
  const formatResponse = useCallback(
    async (
      rawResponse: string,
      options: Partial<FormatOptions> = {}
    ): Promise<SixWPrincipleResponse> => {
      const defaultOptions: FormatOptions = {
        language: 'ko',
        enableFallback: true,
        strictParsing: false,
      };

      const finalOptions = { ...defaultOptions, ...options };

      safeStateUpdate(() => {
        setIsFormatting(true);
        setError(null);
      });

      try {
        // 입력 검증
        if (!rawResponse?.trim()) {
          throw new Error('빈 응답입니다.');
        }

        if (rawResponse.length < 10) {
          throw new Error('응답이 너무 짧습니다.');
        }

        // 타임아웃 설정
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('포맷팅 타임아웃')), 5000);
        });

        const formatPromise = Promise.resolve(
          parseResponse(rawResponse, finalOptions)
        );

        const result = await Promise.race([formatPromise, timeoutPromise]);

        logger.info('✅ AI 응답 포맷팅 완료:', result);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.';

        if (error instanceof Error && error.message.includes('타임아웃')) {
          handleError('timeout', errorMessage);
        } else if (
          error instanceof Error &&
          error.message.includes('네트워크')
        ) {
          handleError('network', errorMessage);
        } else if (error instanceof Error && error.message.includes('파싱')) {
          handleError('parsing', errorMessage);
        } else {
          handleError('unknown', errorMessage);
        }

        // 폴백 응답 반환
        if (finalOptions.enableFallback) {
          return {
            who: 'AI 시스템',
            what: '응답 처리 중 오류 발생',
            when: '현재',
            where: 'OpenManager V5',
            why: '시스템 오류',
            how: '오류 복구 중',
            confidence: 0.1,
            sources: ['오류 폴백'],
          };
        }

        throw error;
      } finally {
        safeStateUpdate(() => setIsFormatting(false));
      }
    },
    [parseResponse, safeStateUpdate, handleError]
  );

  // 응답 검증
  const validateResponse = useCallback(
    (response: SixWPrincipleResponse): boolean => {
      const required = ['who', 'what', 'when', 'where', 'why', 'how'];
      return required.every(
        (key) =>
          response[key as keyof SixWPrincipleResponse] &&
          (response[key as keyof SixWPrincipleResponse] as string).trim() !== ''
      );
    },
    []
  );

  // 에러 재시도
  const retryFormat = useCallback(
    async (rawResponse: string, options?: Partial<FormatOptions>) => {
      if (error && error.retryCount < error.maxRetries) {
        setError((prev) =>
          prev ? { ...prev, retryCount: prev.retryCount + 1 } : null
        );
        return formatResponse(rawResponse, options);
      }
      throw new Error('최대 재시도 횟수를 초과했습니다.');
    },
    [error, formatResponse]
  );

  return {
    formatResponse,
    validateResponse,
    retryFormat,
    isFormatting,
    error,
    clearError: () => setError(null),
  };
};
