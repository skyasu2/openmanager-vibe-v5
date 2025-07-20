/**
 * 🔄 AI 라우팅 시스템 v2.0
 * 작성일: 2025-07-02 00:16:30 (KST)
 *
 * UnifiedAIEngineRouter에서 분리된 모드별 라우팅 로직
 * TDD Green 단계 - AIRoutingSystem 모듈 분리
 */

import { AIMode, AIRequest } from '@/types/ai-types';
import { KoreanTimeUtil } from '@/utils/koreanTime';

/**
 * 📡 VERCEL 배포 최적화 설정
 */
const VERCEL_OPTIMIZATION = {
  isVercel: !!process.env.VERCEL,
  maxTimeout: 8000, // Vercel 8초 제한
  fallbackTimeout: 5000,
  enableQuickFallback: true,
};

/**
 * 🎛️ AI 모드별 설정
 */
interface AIModeConfig {
  name: AIMode;
  description: string;
  primaryEngine: string;
  maxProcessingTime: number;
  priority: number;
  enableCache: boolean;
  optimizationLevel: 'low' | 'medium' | 'high';
}

/**
 * 📋 AI 모드 설정 v3.0 (폴백 제거)
 * 각 모드는 오직 primaryEngine만 사용
 */
const AI_MODE_CONFIGS: Record<AIMode, AIModeConfig> = {
  LOCAL: {
    name: 'LOCAL',
    description: 'Supabase RAG + Korean AI + MCP 컨텍스트 (기본값)',
    primaryEngine: 'supabase-rag',
    maxProcessingTime: VERCEL_OPTIMIZATION.isVercel ? 8000 : 15000,
    priority: 90, // 90% 우선순위 (기본값)
    enableCache: true,
    optimizationLevel: 'high',
  },
  GOOGLE_ONLY: {
    name: 'GOOGLE_ONLY',
    description: 'Google AI 전용 모드 (자연어 처리용)',
    primaryEngine: 'google-ai',
    maxProcessingTime: VERCEL_OPTIMIZATION.isVercel ? 8000 : 10000,
    priority: 80, // 80% Google AI 우선
    enableCache: false, // 실시간 응답 우선
    optimizationLevel: 'low',
  },
};

/**
 * 🔄 AI 라우팅 시스템
 *
 * UnifiedAIEngineRouter에서 분리된 라우팅 로직:
 * - 모드별 라우팅 결정 (LOCAL, GOOGLE_ONLY)
 * - 쿼리 분석 및 모드 추천
 * - 모드 검증 및 정규화
 */
export class AIRoutingSystem {
  private currentMode: AIMode = 'LOCAL';
  private routingStats = {
    totalRoutes: 0,
    modeUsage: {
      LOCAL: 0,
      GOOGLE_ONLY: 0,
    },
    lastUpdated: KoreanTimeUtil.now(),
  };

  constructor(initialMode: AIMode = 'LOCAL') {
    this.currentMode = initialMode;
    console.log(`🔄 AI 라우팅 시스템 초기화 (기본 모드: ${initialMode})`);
  }

  /**
   * 🎯 메인 라우팅 결정 메서드
   * @param request AI 요청
   * @returns 라우팅 정보 및 처리 모드
   */
  public routeRequest(request: AIRequest): {
    targetMode: AIMode;
    config: AIModeConfig;
    routingReason: string;
    processingStrategy: string;
  } {
    const startTime = Date.now();

    // 모드 검증 및 정규화
    const validatedMode = this.validateAndNormalizeMode(
      request.mode || 'LOCAL'
    );

    // 검증된 모드 사용
    const targetMode = validatedMode;

    const config = AI_MODE_CONFIGS[targetMode];

    // 라우팅 통계 업데이트
    this.routingStats.totalRoutes++;
    this.routingStats.modeUsage[targetMode]++;
    this.routingStats.lastUpdated = KoreanTimeUtil.now();

    const processingTime = Date.now() - startTime;

    console.log(
      `🔄 라우팅 결정: ${request.mode || 'LOCAL'} → ${targetMode} (${processingTime}ms)`
    );

    return {
      targetMode,
      config,
      routingReason: this.generateRoutingReason(request, targetMode),
      processingStrategy: this.generateProcessingStrategy(targetMode, request),
    };
  }

  /**
   * 🔍 모드 검증 및 정규화
   * @param mode 입력 모드
   * @returns 정규화된 모드
   */
  public validateAndNormalizeMode(mode: string): AIMode {
    const supportedModes: AIMode[] = ['LOCAL', 'GOOGLE_ONLY'];

    // 레거시 모드 변환 맵 (단순화)
    const modeMap: Record<string, AIMode> = {
      LOCAL: 'LOCAL',
      GOOGLE_ONLY: 'GOOGLE_ONLY',
      // 레거시 호환성
      GOOGLE_AI: 'GOOGLE_ONLY',
      local: 'LOCAL',
      'google-only': 'GOOGLE_ONLY',
    };

    const normalizedMode = modeMap[mode] || 'LOCAL'; // 기본값을 LOCAL로 변경

    if (!supportedModes.includes(normalizedMode)) {
      console.warn(`⚠️ 지원되지 않는 AI 모드: ${mode}, LOCAL 모드로 폴백`);
      return 'LOCAL';
    }

    if (mode !== normalizedMode) {
      console.log(`🔄 AI 모드 변환: ${mode} → ${normalizedMode}`);
    }

    return normalizedMode;
  }

  /**
   * 🔍 한국어 쿼리 감지
   * @param query 쿼리 문자열
   * @returns 한국어 여부
   */
  private isKoreanQuery(query: string): boolean {
    const koreanRegex = /[ㄱ-ㅎㅏ-ㅣ가-힣]/;
    return koreanRegex.test(query);
  }

  /**
   * 📊 쿼리 복잡성 분석
   * @param query 쿼리 문자열
   * @returns 복잡성 수준
   */
  private analyzeQueryComplexity(query: string): 'simple' | 'medium' | 'high' {
    const wordCount = query.trim().split(/\s+/).length;
    const hasSpecialTerms =
      /분석|예측|모니터링|최적화|알고리즘|머신러닝|딥러닝/.test(query);
    const hasMultipleClauses = /그리고|그런데|하지만|그래서|따라서|또한/.test(
      query
    );

    if (wordCount > 20 || hasSpecialTerms || hasMultipleClauses) {
      return 'high';
    } else if (wordCount > 10 || /어떻게|왜|무엇|어디/.test(query)) {
      return 'medium';
    } else {
      return 'simple';
    }
  }

  /**
   * ⏰ 실시간 데이터 요구 분석
   * @param query 쿼리 문자열
   * @returns 실시간 데이터 필요 여부
   */
  private needsRealtimeData(query: string): boolean {
    const realtimeKeywords =
      /현재|지금|실시간|최신|오늘|실행중|상태|모니터링|라이브/;
    return realtimeKeywords.test(query);
  }

  /**
   * 🔧 기술적 쿼리 감지
   * @param query 쿼리 문자열
   * @returns 기술적 쿼리 여부
   */
  private isTechnicalQuery(query: string): boolean {
    const technicalKeywords =
      /서버|API|데이터베이스|코드|프로그래밍|배포|로그|에러|버그|성능|메모리|CPU/;
    return technicalKeywords.test(query);
  }

  /**
   * 📝 라우팅 이유 생성
   * @param request 요청
   * @param targetMode 선택된 모드
   * @returns 라우팅 이유
   */
  private generateRoutingReason(
    request: AIRequest,
    targetMode: AIMode
  ): string {
    const isKorean = this.isKoreanQuery(request.query);
    const complexity = this.analyzeQueryComplexity(request.query);
    const needsRealtime = this.needsRealtimeData(request.query);
    const isTechnical = this.isTechnicalQuery(request.query);

    const reasons: string[] = [];

    if (isKorean) reasons.push('한국어 쿼리');
    if (isTechnical) reasons.push('기술적 내용');
    if (needsRealtime) reasons.push('실시간 데이터 필요');
    if (complexity === 'high') reasons.push('복잡한 쿼리');

    return reasons.length > 0
      ? `${targetMode} 모드 선택 이유: ${reasons.join(', ')}`
      : `${targetMode} 모드 기본 처리`;
  }

  /**
   * 🎯 처리 전략 생성
   * @param mode 처리 모드
   * @param request 요청
   * @returns 처리 전략
   */
  private generateProcessingStrategy(mode: AIMode, request: AIRequest): string {
    const config = AI_MODE_CONFIGS[mode];

    return `주요 엔진: ${config.primaryEngine}, 타임아웃: ${config.maxProcessingTime}ms`;
  }

  // 🎛️ 상태 관리 메서드들

  public setMode(mode: AIMode): void {
    this.currentMode = mode;
    console.log(`🔄 AI 라우팅 모드 변경: ${mode}`);
  }

  public getCurrentMode(): AIMode {
    return this.currentMode;
  }

  public getModeConfig(mode?: AIMode): AIModeConfig {
    return AI_MODE_CONFIGS[mode || this.currentMode];
  }

  public getRoutingStats() {
    return {
      ...this.routingStats,
      currentMode: this.currentMode,
    };
  }

  public resetStats(): void {
    this.routingStats = {
      totalRoutes: 0,
      modeUsage: {
        LOCAL: 0,
        GOOGLE_ONLY: 0,
      },
      lastUpdated: KoreanTimeUtil.now(),
    };
    console.log('📊 라우팅 통계가 초기화되었습니다.');
  }
}
