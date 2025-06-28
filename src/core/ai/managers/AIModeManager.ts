/**
 * 🎯 AI Mode Manager
 *
 * ✅ AI 모드 설정 및 전환 관리
 * ✅ 단일 책임: AI 모드 관리만 담당
 * ✅ SOLID 원칙 적용
 */

import { AIMode } from '@/types/ai-types';

// 🎯 AI 모드별 설정
export interface AIModeConfig {
  name: AIMode;
  description: string;
  primaryEngine: string;
  fallbackEngines: string[];
  maxProcessingTime: number;
  priority: number;
  enableCache: boolean;
  optimizationLevel: 'low' | 'medium' | 'high';
}

// 🚀 베르셀 환경 감지 및 최적화 설정
const VERCEL_OPTIMIZATION = {
  isVercel: process.env.VERCEL === '1' || process.env.NODE_ENV === 'production',
  maxProcessingTime: 8000, // 8초 제한
  enableFastMode: true,
  cacheEnabled: true,
  simplifiedChain: true, // 엔진 체인 단순화
};

// 🎯 AI 모드 구성 정의
const AI_MODE_CONFIGS: Record<AIMode, AIModeConfig> = {
  LOCAL: {
    name: 'LOCAL',
    description: 'Supabase RAG + MCP 컨텍스트 기반 로컬 AI',
    primaryEngine: 'supabase-rag',
    fallbackEngines: ['mcp-context', 'korean-ai', 'transformers'],
    maxProcessingTime: VERCEL_OPTIMIZATION.isVercel ? 8000 : 15000,
    priority: 80, // 80% 우선순위
    enableCache: true,
    optimizationLevel: 'high',
  },
  GOOGLE_AI: {
    name: 'GOOGLE_AI',
    description: 'Google AI + Supabase RAG + MCP 컨텍스트 조합',
    primaryEngine: 'google-ai',
    fallbackEngines: ['supabase-rag', 'mcp-context', 'korean-ai'],
    maxProcessingTime: VERCEL_OPTIMIZATION.isVercel ? 8000 : 20000,
    priority: 40, // 40% Google AI + 40% LOCAL + 20% 로컬AI
    enableCache: true,
    optimizationLevel: 'medium',
  },
  AUTO: {
    name: 'AUTO',
    description: '쿼리 분석에 따른 자동 모드 선택',
    primaryEngine: 'auto-selector',
    fallbackEngines: ['supabase-rag', 'google-ai', 'korean-ai'],
    maxProcessingTime: VERCEL_OPTIMIZATION.isVercel ? 8000 : 25000,
    priority: 50, // 동적 우선순위
    enableCache: true,
    optimizationLevel: 'medium',
  },
  GOOGLE_ONLY: {
    name: 'GOOGLE_ONLY',
    description: 'Google AI 전용 모드',
    primaryEngine: 'google-ai',
    fallbackEngines: ['transformers', 'korean-ai'],
    maxProcessingTime: VERCEL_OPTIMIZATION.isVercel ? 8000 : 10000,
    priority: 90, // 90% Google AI 우선
    enableCache: false, // 실시간 응답 우선
    optimizationLevel: 'low',
  },
};

/**
 * 🎯 AIModeManager 클래스
 *
 * 단일 책임: AI 모드 관리만 담당
 */
export class AIModeManager {
  private static instance: AIModeManager | null = null;
  private currentMode: AIMode = 'LOCAL'; // 🎯 기본 모드를 LOCAL로 설정
  private modeHistory: Array<{
    mode: AIMode;
    timestamp: string;
    reason?: string;
  }> = [];
  private modeUsageStats: Record<AIMode, number> = {
    LOCAL: 0,
    GOOGLE_AI: 0,
    AUTO: 0,
    GOOGLE_ONLY: 0,
  };

  constructor() {
    this.initializeMode();
  }

  public static getInstance(): AIModeManager {
    if (!AIModeManager.instance) {
      AIModeManager.instance = new AIModeManager();
    }
    return AIModeManager.instance;
  }

  /**
   * 모드 초기화
   */
  private initializeMode(): void {
    // 환경변수 또는 설정에서 기본 모드 설정
    const envMode = process.env.AI_DEFAULT_MODE as AIMode;
    if (envMode && this.isValidMode(envMode)) {
      this.currentMode = envMode;
    }

    this.recordModeChange(this.currentMode, '초기 설정');
    console.log(`🎯 AIModeManager 초기화: ${this.currentMode} 모드로 시작`);
  }

  /**
   * 현재 AI 모드 조회
   */
  public getCurrentMode(): AIMode {
    return this.currentMode;
  }

  /**
   * AI 모드 설정
   */
  public setMode(mode: AIMode, reason?: string): void {
    if (!this.isValidMode(mode)) {
      throw new Error(`❌ 유효하지 않은 AI 모드: ${mode}`);
    }

    const previousMode = this.currentMode;
    this.currentMode = mode;

    this.recordModeChange(mode, reason || '수동 변경');

    console.log(
      `🔄 AI 모드 변경: ${previousMode} → ${mode} (사유: ${reason || '수동 변경'})`
    );
  }

  /**
   * 쿼리 분석에 따른 자동 모드 선택
   */
  public selectOptimalMode(query: string, context?: any): AIMode {
    // 한국어 쿼리 감지
    const isKorean = this.isKoreanQuery(query);

    // 복잡성 분석
    const complexity = this.analyzeQueryComplexity(query);

    // 실시간 데이터 요구 분석
    const needsRealtime = this.needsRealtimeData(query);

    // 기술적 쿼리 감지
    const isTechnical = this.isTechnicalQuery(query);

    let optimalMode: AIMode;

    if (needsRealtime || complexity === 'high') {
      // 실시간 데이터나 복잡한 쿼리는 Google AI 활용
      optimalMode = 'GOOGLE_AI';
    } else if (isTechnical || isKorean) {
      // 기술적이거나 한국어 쿼리는 LOCAL 모드 우선
      optimalMode = 'LOCAL';
    } else if (complexity === 'simple') {
      // 단순한 쿼리는 LOCAL 모드로 충분
      optimalMode = 'LOCAL';
    } else {
      // 기타 경우는 AUTO 모드
      optimalMode = 'AUTO';
    }

    console.log(
      `🤖 자동 모드 선택: ${optimalMode} (한국어: ${isKorean}, 복잡도: ${complexity}, 실시간: ${needsRealtime})`
    );

    return optimalMode;
  }

  /**
   * 모드별 설정 조회
   */
  public getModeConfig(mode?: AIMode): AIModeConfig {
    const targetMode = mode || this.currentMode;
    return AI_MODE_CONFIGS[targetMode];
  }

  /**
   * 모든 모드 설정 조회
   */
  public getAllModeConfigs(): Record<AIMode, AIModeConfig> {
    return { ...AI_MODE_CONFIGS };
  }

  /**
   * 모드 사용 통계 업데이트
   */
  public recordModeUsage(mode: AIMode): void {
    this.modeUsageStats[mode]++;
  }

  /**
   * 모드 사용 통계 조회
   */
  public getModeUsageStats(): Record<AIMode, number> {
    return { ...this.modeUsageStats };
  }

  /**
   * 모드 변경 이력 조회
   */
  public getModeHistory(): Array<{
    mode: AIMode;
    timestamp: string;
    reason?: string;
  }> {
    return [...this.modeHistory];
  }

  /**
   * 베르셀 최적화 설정 조회
   */
  public getVercelOptimization() {
    return { ...VERCEL_OPTIMIZATION };
  }

  /**
   * 모드 유효성 검증
   */
  private isValidMode(mode: string): mode is AIMode {
    return ['LOCAL', 'GOOGLE_AI', 'AUTO', 'GOOGLE_ONLY'].includes(mode);
  }

  /**
   * 모드 변경 기록
   */
  private recordModeChange(mode: AIMode, reason: string): void {
    this.modeHistory.push({
      mode,
      timestamp: new Date().toISOString(),
      reason,
    });

    // 히스토리 크기 제한 (최근 100개)
    if (this.modeHistory.length > 100) {
      this.modeHistory = this.modeHistory.slice(-100);
    }
  }

  /**
   * 한국어 쿼리 감지
   */
  private isKoreanQuery(query: string): boolean {
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    return koreanRegex.test(query);
  }

  /**
   * 쿼리 복잡성 분석
   */
  private analyzeQueryComplexity(query: string): 'simple' | 'medium' | 'high' {
    const wordCount = query.split(/\s+/).length;
    const hasSpecialTerms =
      /서버|모니터링|AI|장애|분석|최적화|성능|보안|네트워크/.test(query);
    const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;

    if (wordCount > 20 || hasMultipleQuestions) {
      return 'high';
    } else if (wordCount > 10 || hasSpecialTerms) {
      return 'medium';
    } else {
      return 'simple';
    }
  }

  /**
   * 실시간 데이터 요구 분석
   */
  private needsRealtimeData(query: string): boolean {
    const realtimeKeywords = /현재|지금|실시간|최신|상태|현황|모니터링|체크/;
    return realtimeKeywords.test(query);
  }

  /**
   * 기술적 쿼리 감지
   */
  private isTechnicalQuery(query: string): boolean {
    const technicalKeywords =
      /서버|API|데이터베이스|네트워크|CPU|메모리|디스크|로그|에러|버그|코드|스크립트|명령어/;
    return technicalKeywords.test(query);
  }

  /**
   * 통계 초기화
   */
  public resetStats(): void {
    this.modeUsageStats = {
      LOCAL: 0,
      GOOGLE_AI: 0,
      AUTO: 0,
      GOOGLE_ONLY: 0,
    };
    this.modeHistory = [];
    console.log('📊 AIModeManager 통계 초기화 완료');
  }

  /**
   * 성능 정보 조회
   */
  public getPerformanceInfo() {
    const currentConfig = this.getModeConfig();
    const totalUsage = Object.values(this.modeUsageStats).reduce(
      (sum, count) => sum + count,
      0
    );

    return {
      currentMode: this.currentMode,
      config: currentConfig,
      usage: this.modeUsageStats,
      totalRequests: totalUsage,
      historyLength: this.modeHistory.length,
      vercelOptimized: VERCEL_OPTIMIZATION.isVercel,
    };
  }

  /**
   * 리소스 정리
   */
  public dispose(): void {
    this.modeHistory = [];
    this.resetStats();
    AIModeManager.instance = null;
    console.log('🗑️ AIModeManager 리소스 정리 완료');
  }
}
