/**
 * 🐍 FastAPI AI 엔진 클라이언트
 * 
 * ✅ Render 호스팅 FastAPI 연동
 * ✅ KoNLPy 한국어 NLP 처리
 * ✅ 연결 상태 관리 & 재시도 로직
 * ✅ 응답 캐싱 (Upstash Redis)
 */

import { Redis } from '@upstash/redis';

export interface FastAPIConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheEnabled: boolean;
  cacheTTL: number;
}

export interface KoNLPAnalysis {
  tokens: Array<{
    word: string;
    pos: string; // 품사
    confidence: number;
  }>;
  entities: Array<{
    text: string;
    label: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  sentiment: {
    polarity: 'positive' | 'negative' | 'neutral';
    confidence: number;
    score: number; // -1 to 1
  };
  intent: {
    category: string;
    confidence: number;
    keywords: string[];
  };
  embedding: number[]; // 384-dim vector
}

export interface AIQuery {
  id: string;
  text: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  options?: {
    includeEmbedding?: boolean;
    includeEntities?: boolean;
    includeSentiment?: boolean;
    language?: 'ko' | 'en';
  };
}

export interface AIResponse {
  id: string;
  queryId: string;
  analysis: KoNLPAnalysis;
  response: string;
  confidence: number;
  processingTime: number;
  fromCache: boolean;
  timestamp: number;
}

export interface FastAPIHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  models: {
    konlpy: boolean;
    embedding: boolean;
    sentiment: boolean;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  lastWarmup: number | null;
}

export class FastAPIClient {
  private config: FastAPIConfig;
  private redis: Redis;
  private isConnected = false;
  private lastHealthCheck = 0;
  private healthStatus: FastAPIHealth | null = null;

  constructor(config: Partial<FastAPIConfig> = {}) {
    this.config = {
      baseUrl: process.env.FASTAPI_BASE_URL || 'https://openmanager-ai-engine.onrender.com',
      timeout: 30000, // 30초
      retryAttempts: 3,
      retryDelay: 1000, // 1초
      cacheEnabled: true,
      cacheTTL: 300, // 5분
      ...config
    };

    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  /**
   * 🔗 FastAPI 연결 확인
   */
  async connect(): Promise<boolean> {
    console.log('🔗 [FastAPI] AI 엔진 연결 확인...');
    
    try {
      const health = await this.checkHealth();
      this.isConnected = health.status !== 'unhealthy';
      
      if (this.isConnected) {
        console.log('✅ [FastAPI] AI 엔진 연결 성공');
        
        // 필요시 웜업 실행
        if (!health.lastWarmup || Date.now() - health.lastWarmup > 30 * 60 * 1000) {
          await this.warmup();
        }
      } else {
        console.error('❌ [FastAPI] AI 엔진 연결 실패');
      }
      
      return this.isConnected;
    } catch (error) {
      console.error('❌ [FastAPI] 연결 확인 실패:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * 🏥 헬스 체크
   */
  async checkHealth(): Promise<FastAPIHealth> {
    const cacheKey = 'fastapi:health';
    
    // 캐시에서 조회 (1분 캐시)
    if (Date.now() - this.lastHealthCheck < 60000 && this.healthStatus) {
      const cached = await this.redis.get<FastAPIHealth>(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.makeRequest<FastAPIHealth>('/health', 'GET');
      this.healthStatus = response;
      this.lastHealthCheck = Date.now();
      
      // 헬스 상태 캐시
      await this.redis.setex(cacheKey, 60, response);
      
      return response;
    } catch (error) {
      console.error('❌ [FastAPI] 헬스 체크 실패:', error);
      
      return {
        status: 'unhealthy',
        version: 'unknown',
        uptime: 0,
        models: { konlpy: false, embedding: false, sentiment: false },
        memory: { used: 0, total: 0, percentage: 0 },
        lastWarmup: null
      };
    }
  }

  /**
   * 🔥 AI 엔진 웜업
   */
  async warmup(): Promise<boolean> {
    console.log('🔥 [FastAPI] AI 엔진 웜업 시작...');
    
    try {
      const response = await this.makeRequest<{ success: boolean; time: number }>('/warmup', 'POST');
      
      if (response.success) {
        console.log(`✅ [FastAPI] 웜업 완료 (${response.time}ms)`);
        return true;
      } else {
        console.error('❌ [FastAPI] 웜업 실패');
        return false;
      }
    } catch (error) {
      console.error('❌ [FastAPI] 웜업 오류:', error);
      return false;
    }
  }

  /**
   * 🧠 자연어 분석
   */
  async analyzeText(query: AIQuery): Promise<AIResponse> {
    const startTime = Date.now();
    console.log(`🧠 [FastAPI] 텍스트 분석 시작: "${query.text}"`);

    // 캐시 확인
    const cacheKey = `fastapi:analysis:${this.generateCacheKey(query.text)}`;
    
    if (this.config.cacheEnabled) {
      const cached = await this.redis.get<AIResponse>(cacheKey);
      if (cached) {
        console.log('📦 [FastAPI] 캐시에서 응답 반환');
        return { ...cached, fromCache: true };
      }
    }

    try {
      // FastAPI 엔드포인트 호출
      const analysis = await this.makeRequest<KoNLPAnalysis>('/analyze', 'POST', {
        text: query.text,
        options: query.options || {},
        context: query.context || {}
      });

      // 응답 생성
      const response: AIResponse = {
        id: `response_${Date.now()}`,
        queryId: query.id,
        analysis,
        response: this.generateNaturalResponse(analysis, query.text),
        confidence: this.calculateOverallConfidence(analysis),
        processingTime: Date.now() - startTime,
        fromCache: false,
        timestamp: Date.now()
      };

      // 캐시 저장
      if (this.config.cacheEnabled) {
        await this.redis.setex(cacheKey, this.config.cacheTTL, response);
      }

      console.log(`✅ [FastAPI] 분석 완료 (${response.processingTime}ms)`);
      return response;

    } catch (error) {
      console.error('❌ [FastAPI] 텍스트 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 🔤 텍스트 임베딩 생성
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = `fastapi:embedding:${this.generateCacheKey(text)}`;
    
    // 캐시 확인
    if (this.config.cacheEnabled) {
      const cached = await this.redis.get<number[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      const embedding = await this.makeRequest<number[]>('/embedding', 'POST', { text });
      
      // 캐시 저장 (임베딩은 오래 캐시)
      if (this.config.cacheEnabled) {
        await this.redis.setex(cacheKey, 3600, embedding); // 1시간
      }
      
      return embedding;
    } catch (error) {
      console.error('❌ [FastAPI] 임베딩 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 💭 감정 분석
   */
  async analyzeSentiment(text: string): Promise<KoNLPAnalysis['sentiment']> {
    try {
      const sentiment = await this.makeRequest<KoNLPAnalysis['sentiment']>('/sentiment', 'POST', { text });
      return sentiment;
    } catch (error) {
      console.error('❌ [FastAPI] 감정 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 🏷️ 개체명 인식
   */
  async extractEntities(text: string): Promise<KoNLPAnalysis['entities']> {
    try {
      const entities = await this.makeRequest<KoNLPAnalysis['entities']>('/entities', 'POST', { text });
      return entities;
    } catch (error) {
      console.error('❌ [FastAPI] 개체명 인식 실패:', error);
      throw error;
    }
  }

  /**
   * 📡 HTTP 요청 실행
   */
  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' = 'GET', 
    data?: any
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const options: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OpenManager-FastAPI-Client/1.0',
            'Accept': 'application/json',
          },
          signal: controller.signal
        };

        if (data && method === 'POST') {
          options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result as T;

      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ [FastAPI] 요청 실패 (시도 ${attempt}/${this.config.retryAttempts}):`, error);

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw lastError || new Error('Unknown request error');
  }

  /**
   * 📝 자연어 응답 생성
   */
  private generateNaturalResponse(analysis: KoNLPAnalysis, originalText: string): string {
    const { sentiment, intent, tokens } = analysis;
    
    let response = '';

    // 감정에 따른 응답 시작
    switch (sentiment.polarity) {
      case 'positive':
        response += '긍정적인 내용이군요! ';
        break;
      case 'negative':
        response += '문제가 있는 것 같습니다. ';
        break;
      default:
        response += '내용을 분석해보겠습니다. ';
    }

    // 의도에 따른 응답
    switch (intent.category) {
      case 'status':
        response += '시스템 상태를 확인하고 있습니다.';
        break;
      case 'troubleshooting':
        response += '문제 해결을 도와드리겠습니다.';
        break;
      case 'configuration':
        response += '설정 관련 도움을 드리겠습니다.';
        break;
      default:
        response += '요청사항을 처리하겠습니다.';
    }

    // 주요 키워드 언급
    if (intent.keywords.length > 0) {
      response += ` 주요 키워드: ${intent.keywords.slice(0, 3).join(', ')}`;
    }

    return response;
  }

  /**
   * 📊 전체 신뢰도 계산
   */
  private calculateOverallConfidence(analysis: KoNLPAnalysis): number {
    const confidences = [
      analysis.sentiment.confidence,
      analysis.intent.confidence,
      analysis.tokens.reduce((sum, token) => sum + token.confidence, 0) / analysis.tokens.length || 0
    ];

    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  /**
   * 🔑 캐시 키 생성
   */
  private generateCacheKey(text: string): string {
    // Node.js 환경에서 btoa 대신 Buffer 사용
    try {
      if (typeof Buffer !== 'undefined') {
        // Node.js 환경
        return Buffer.from(text, 'utf8')
          .toString('base64')
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 32);
      } else {
        // 브라우저 환경 (fallback)
        return btoa(text).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      }
    } catch (error) {
      // 에러 시 간단한 해시 대체
      console.warn('⚠️ [FastAPI] 캐시 키 생성 실패, 단순 해시 사용:', error);
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit 정수로 변환
      }
      return Math.abs(hash).toString(36).substring(0, 32);
    }
  }

  /**
   * ⏱️ 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 📊 연결 상태 조회
   */
  getConnectionStatus(): {
    isConnected: boolean;
    lastHealthCheck: number;
    healthStatus: FastAPIHealth | null;
  } {
    return {
      isConnected: this.isConnected,
      lastHealthCheck: this.lastHealthCheck,
      healthStatus: this.healthStatus
    };
  }

  /**
   * 🧹 캐시 정리
   */
  async clearCache(pattern: string = 'fastapi:*'): Promise<void> {
    try {
      // Upstash Redis는 SCAN을 지원하지 않으므로 개별 키 삭제 필요
      console.log('🧹 [FastAPI] 캐시 정리 요청됨');
      // 실제 구현에서는 캐시 키 목록을 별도로 관리하여 삭제
    } catch (error) {
      console.error('❌ [FastAPI] 캐시 정리 실패:', error);
    }
  }
}

// 전역 인스턴스
export const fastApiClient = new FastAPIClient(); 