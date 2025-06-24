/**
 * 🤖 Transformers.js Engine - 고성능 NLP 처리 (안정화 버전)
 *
 * ✅ Hugging Face Transformers.js 기반
 * ✅ 완전한 폴백 시스템 구현
 * ✅ 모델 로딩 실패 시에도 정상 작동
 * ✅ Vercel 서버리스 환경 최적화
 */

// import { pipeline } from '@xenova/transformers'; // 빌드 오류 임시 비활성화

interface TransformersConfig {
  models: {
    classification: string;
    embedding: string;
    qa: string;
    summarization: string;
  };
  maxLength: number;
  temperature: number;
  enableFallback: boolean;
}

interface AnalysisResult {
  classification: any;
  embedding: number[];
  qa?: any;
  summary?: string;
  confidence: number;
  processingTime: number;
  usingFallback?: boolean;
}

export class TransformersEngine {
  private config: TransformersConfig;
  private classificationPipeline?: any;
  private embeddingPipeline?: any;
  private qaPipeline?: any;
  private summarizationPipeline?: any;
  private isInitialized = false;
  private modelCache = new Map<string, any>();
  private initializationAttempted = false;
  private transformersAvailable = false;

  constructor() {
    this.config = {
      models: {
        // 텍스트 분류 (서버 로그 감정/중요도 분석)
        classification:
          'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        // 문장 임베딩 (의미적 검색)
        embedding: 'Xenova/all-MiniLM-L6-v2',
        // 질의응답 (문서 기반 답변)
        qa: 'Xenova/distilbert-base-cased-distilled-squad',
        // 요약 (긴 로그/문서 요약)
        summarization: 'Xenova/distilbart-cnn-6-6',
      },
      maxLength: 512,
      temperature: 0.7,
      enableFallback: true,
    };
  }

  /**
   * 🚀 Transformers.js 엔진 초기화 (안전한 버전)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || this.initializationAttempted) return;

    console.log('🤖 Transformers.js 엔진 안전 초기화 시작...');
    this.initializationAttempted = true;

    try {
      // Transformers 패키지 가용성 확인
      const transformersModule = await this.checkTransformersAvailability();

      if (transformersModule) {
        console.log('✅ Transformers.js 패키지 확인됨 - 모델 로딩 시도');
        this.transformersAvailable = true;

        // 안전한 모델 로딩 (타임아웃 포함)
        await this.safeModelLoading();
      } else {
        console.warn('⚠️ Transformers.js 패키지 없음 - 폴백 모드로 동작');
        this.transformersAvailable = false;
      }

      this.isInitialized = true;
      console.log('✅ Transformers.js 엔진 초기화 완료 (폴백 모드 포함)');
    } catch (error) {
      console.warn(
        '⚠️ Transformers.js 엔진 초기화 실패 - 폴백 모드로 동작:',
        error
      );
      this.transformersAvailable = false;
      this.isInitialized = true; // 폴백으로라도 초기화 완료
    }
  }

  /**
   * 🔍 Transformers 패키지 가용성 확인
   */
  private async checkTransformersAvailability(): Promise<any> {
    try {
      const transformersModule = await import('@xenova/transformers');
      if (transformersModule && transformersModule.pipeline) {
        return transformersModule;
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Transformers 패키지 로드 실패:', error);
      return null;
    }
  }

  /**
   * 🛡️ 안전한 모델 로딩 (타임아웃 포함)
   */
  private async safeModelLoading(): Promise<void> {
    const loadingPromises = [
      this.safeInitializeClassification(),
      this.safeInitializeEmbedding(),
    ];

    // 10초 타임아웃으로 모델 로딩
    try {
      await Promise.race([
        Promise.allSettled(loadingPromises),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('모델 로딩 타임아웃')), 10000)
        ),
      ]);
    } catch (error) {
      console.warn('⚠️ 모델 로딩 타임아웃 또는 실패 - 폴백 모드 사용:', error);
    }
  }

  /**
   * 📊 안전한 텍스트 분류 모델 초기화
   */
  private async safeInitializeClassification(): Promise<void> {
    try {
      if (!this.transformersAvailable) return;

      const { pipeline } = await import('@xenova/transformers');

      // 타임아웃을 포함한 안전한 모델 로딩
      const modelPromise = pipeline(
        'text-classification',
        this.config.models.classification
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('분류 모델 로딩 타임아웃')), 8000)
      );

      this.classificationPipeline = await Promise.race([
        modelPromise,
        timeoutPromise,
      ]);
      console.log('✅ 텍스트 분류 모델 로드 완료');
    } catch (error) {
      console.warn('⚠️ 텍스트 분류 모델 로드 실패 - 폴백 사용:', error);
      this.classificationPipeline = null;
    }
  }

  /**
   * 🔍 안전한 임베딩 모델 초기화
   */
  private async safeInitializeEmbedding(): Promise<void> {
    try {
      if (!this.transformersAvailable) return;

      const { pipeline } = await import('@xenova/transformers');

      // 타임아웃을 포함한 안전한 모델 로딩
      const modelPromise = pipeline(
        'feature-extraction',
        this.config.models.embedding
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('임베딩 모델 로딩 타임아웃')), 8000)
      );

      this.embeddingPipeline = await Promise.race([
        modelPromise,
        timeoutPromise,
      ]);
      console.log('✅ 임베딩 모델 로드 완료');
    } catch (error) {
      console.warn('⚠️ 임베딩 모델 로드 실패 - 폴백 사용:', error);
      this.embeddingPipeline = null;
    }
  }

  /**
   * 🧠 종합 분석 처리 (안정화 버전)
   */
  async analyzeText(
    text: string,
    options: {
      includeQA?: boolean;
      includeSummary?: boolean;
      context?: string;
      question?: string;
    } = {}
  ): Promise<AnalysisResult> {
    await this.initialize();
    const startTime = Date.now();

    try {
      console.log(
        '🔍 Transformers.js 텍스트 분석 시작:',
        text.substring(0, 100)
      );

      const results: Partial<AnalysisResult> = {};
      const usingFallback =
        !this.transformersAvailable ||
        (!this.classificationPipeline && !this.embeddingPipeline);

      // 1. 텍스트 분류 (실제 모델 또는 폴백)
      results.classification = await this.classifyText(text);

      // 2. 임베딩 생성 (실제 모델 또는 폴백)
      results.embedding = await this.generateEmbedding(text);

      const processingTime = Date.now() - startTime;

      // 신뢰도 계산 (폴백 사용 시 낮춤)
      let confidence = usingFallback ? 0.6 : 0.8;
      if (results.classification && results.classification.score) {
        confidence = Math.max(confidence, results.classification.score);
      }

      return {
        classification: results.classification,
        embedding: results.embedding || [],
        qa: results.qa,
        summary: results.summary,
        confidence,
        processingTime,
        usingFallback,
      };
    } catch (error: any) {
      console.warn('⚠️ Transformers.js 분석 실패 - 폴백 결과 반환:', error);

      // 완전한 폴백 결과 반환
      return {
        classification: this.getFallbackClassification(text),
        embedding: this.generateFallbackEmbedding(text),
        confidence: 0.5,
        processingTime: Date.now() - startTime,
        usingFallback: true,
      };
    }
  }

  /**
   * 📊 텍스트 분류 (안정화 버전)
   */
  async classifyText(text: string): Promise<any> {
    if (!this.classificationPipeline) {
      console.log('⚠️ 분류 모델 없음 - 폴백 분류 사용');
      return this.getFallbackClassification(text);
    }

    try {
      const result = await this.classificationPipeline(text);
      const interpretedResult = this.interpretClassification(result);

      return {
        ...result,
        interpreted: interpretedResult,
        usingFallback: false,
      };
    } catch (error: any) {
      console.warn('⚠️ 텍스트 분류 실패 - 폴백 사용:', error);
      return this.getFallbackClassification(text);
    }
  }

  /**
   * 🔄 폴백 분류 결과 생성
   */
  private getFallbackClassification(text: string): any {
    // 간단한 키워드 기반 분류
    const lowerText = text.toLowerCase();

    let label = 'NEUTRAL';
    let score = 0.5;
    let severity = 'info';
    let category = 'general';
    let action = 'monitor';

    // 에러 관련 키워드
    if (
      lowerText.includes('error') ||
      lowerText.includes('fail') ||
      lowerText.includes('critical') ||
      lowerText.includes('exception')
    ) {
      label = 'NEGATIVE';
      score = 0.8;
      severity = 'error';
      category = 'system_error';
      action = 'investigate';
    }
    // 경고 관련 키워드
    else if (
      lowerText.includes('warn') ||
      lowerText.includes('caution') ||
      lowerText.includes('high') ||
      lowerText.includes('load')
    ) {
      label = 'NEGATIVE';
      score = 0.6;
      severity = 'warning';
      category = 'performance_issue';
      action = 'monitor';
    }
    // 성공 관련 키워드
    else if (
      lowerText.includes('success') ||
      lowerText.includes('complete') ||
      lowerText.includes('ok') ||
      lowerText.includes('normal')
    ) {
      label = 'POSITIVE';
      score = 0.7;
      severity = 'info';
      category = 'normal_operation';
      action = 'continue';
    }

    return {
      label,
      score,
      interpreted: {
        severity,
        category,
        action,
      },
      usingFallback: true,
    };
  }

  /**
   * 🔍 임베딩 생성 (안정화 버전)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.embeddingPipeline) {
      console.log('⚠️ 임베딩 모델 없음 - 폴백 임베딩 사용');
      return this.generateFallbackEmbedding(text);
    }

    try {
      const result = await this.embeddingPipeline(text, {
        pooling: 'mean',
        normalize: true,
      });

      // Transformers.js 결과를 배열로 변환
      if (result && result.data) {
        return Array.from(result.data);
      }

      console.warn('⚠️ 임베딩 결과가 예상과 다름 - 폴백 사용');
      return this.generateFallbackEmbedding(text);
    } catch (error: any) {
      console.warn('⚠️ 임베딩 생성 실패 - 폴백 사용:', error);
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * 🔄 폴백 임베딩 생성 (개선된 버전)
   */
  private generateFallbackEmbedding(text: string): number[] {
    // 향상된 문자 기반 임베딩 (384차원)
    const embedding = new Array(384).fill(0);

    // 텍스트 해시 시드 생성
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash + char) & 0xffffffff;
    }

    // 의사 랜덤 생성기
    let seed = Math.abs(hash);
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 0x100000000;
      return seed / 0x100000000;
    };

    // 텍스트 특성 기반 임베딩 생성
    for (let i = 0; i < 384; i++) {
      let value = random() * 2 - 1; // -1 ~ 1 범위

      // 텍스트 길이 반영
      value *= Math.log(text.length + 1) / 10;

      // 특정 문자 빈도 반영
      if (i < text.length) {
        value += Math.sin(text.charCodeAt(i % text.length) * 0.1);
      }

      embedding[i] = value;
    }

    // L2 정규화
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= norm;
      }
    }

    return embedding;
  }

  /**
   * 🎯 분류 결과 해석
   */
  private interpretClassification(result: any): {
    severity: string;
    category: string;
    action: string;
  } {
    if (!result || !result.label) {
      return {
        severity: 'info',
        category: 'general',
        action: 'monitor',
      };
    }

    const label = result.label.toLowerCase();
    const score = result.score || 0;

    if (label.includes('negative') || score < 0.3) {
      return {
        severity: 'warning',
        category: 'potential_issue',
        action: 'investigate',
      };
    } else if (label.includes('positive') || score > 0.8) {
      return {
        severity: 'info',
        category: 'normal_operation',
        action: 'monitor',
      };
    } else {
      return {
        severity: 'info',
        category: 'neutral',
        action: 'monitor',
      };
    }
  }

  /**
   * 📊 엔진 상태 조회 (개선된 버전)
   */
  getEngineStatus(): any {
    return {
      isInitialized: this.isInitialized,
      transformersAvailable: this.transformersAvailable,
      availableModels: {
        classification: !!this.classificationPipeline,
        embedding: !!this.embeddingPipeline,
        qa: !!this.qaPipeline,
        summarization: !!this.summarizationPipeline,
      },
      fallbackEnabled: this.config.enableFallback,
      modelCache: this.modelCache.size,
      config: this.config,
    };
  }

  /**
   * 🧹 리소스 정리
   */
  dispose(): void {
    this.classificationPipeline = undefined;
    this.embeddingPipeline = undefined;
    this.qaPipeline = undefined;
    this.summarizationPipeline = undefined;
    this.modelCache.clear();
    this.isInitialized = false;
    this.initializationAttempted = false;
    this.transformersAvailable = false;
    console.log('🧹 Transformers.js 엔진 리소스 정리 완료');
  }
}

// 싱글톤 인스턴스
export const transformersEngine = new TransformersEngine();
