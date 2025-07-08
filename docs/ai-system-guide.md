# 🤖 OpenManager Vibe v5 AI 시스템 가이드

## 📋 목차

1. [AI 시스템 개요](#ai-시스템-개요)
2. [AI 엔진 모드 시스템](#ai-엔진-모드-시스템)
3. [Google AI (Gemini) 통합](#google-ai-gemini-통합)
4. [로컬 AI 엔진](#로컬-ai-엔진)
5. [무료티어 최적화](#무료티어-최적화)
6. [베르셀 환경 파일 시스템 보호](#베르셀-환경-파일-시스템-보호)
7. [정적 분석 연동](#정적-분석-연동)
8. [캐싱 전략](#캐싱-전략)
9. [할당량 관리](#할당량-관리)
10. [폴백 시스템](#폴백-시스템)
11. [실시간 모니터링](#실시간-모니터링)

---

## 🎯 AI 시스템 개요

### OpenManager Vibe v5 AI 철학

> **로컬 엔진 우선**: 로컬 AI 엔진을 메인으로 하고, 필요에 따라 선택적으로 고급 AI 사용

#### 핵심 원칙

- **로컬 엔진 우선**: LOCAL 모드가 기본값, 구글 AI 완전 비활성화
- **선택적 고급 AI**: GOOGLE_ONLY 모드로 자연어 질의 전용 고급 AI 사용
- **베르셀 환경 호환**: 파일 저장 기능 완전 제거, 메모리 기반 관리
- **할당량 보호**: 구글 AI 사용 시 일일 1,000회 안전 한도
- **스마트 캐싱**: 중복 요청 방지 및 응답 재사용
- **우아한 폴백**: AI 서비스 장애 시 로컬 엔진으로 자동 전환

### 현재 AI 시스템 구성

```typescript
// 🤖 AI 시스템 아키텍처 v2.0
LOCAL 엔진 (기본) → 메모리 관리 → 베르셀 호환
     ↓                ↓            ↓
  무료 사용        설정 저장 없음   100% 안정성

GOOGLE_ONLY 모드 (선택) → Cache Layer → Fallback to LOCAL
     ↓                     ↓              ↓
  1,000/일 제한         Redis 캐싱      로컬 엔진
```

---

## 🔧 AI 엔진 모드 시스템

### 2가지 AI 모드

#### 1. LOCAL 모드 (기본값) 🏠

```typescript
// 기본 설정
const defaultMode = {
  mode: 'LOCAL',
  googleAI: false,
  description: '로컬 AI 엔진만 사용, 구글 AI 완전 비활성화',
  features: [
    '완전 구현된 로컬 AI 시스템',
    '프라이버시 보장',
    '오프라인 동작 가능',
    '무료 사용',
    '할당량 제한 없음',
  ],
  engines: [
    'Supabase RAG 엔진',
    '한국어 전용 AI 엔진',
    'MCP 컨텍스트 엔진',
    'Transformers 엔진',
    '도메인 특화 NLP 엔진',
  ],
};
```

#### 2. GOOGLE_ONLY 모드 (선택적) 🚀

```typescript
// 고급 설정
const advancedMode = {
  mode: 'GOOGLE_ONLY',
  googleAI: true,
  description: '자연어 질의 전용 Google AI 사용',
  features: [
    '자연어 처리 특화',
    '고급 추론 능력',
    '확장성 테스트 지원',
    '성능 비교 가능',
  ],
  limitations: [
    '일일 1,000회 할당량',
    '분당 12회 제한',
    '동시 2개 요청',
    '네트워크 연결 필요',
  ],
};
```

### 모드 선택 및 전환

#### UI를 통한 모드 선택

```typescript
// src/domains/ai-sidebar/components/AIEngineSelector.tsx
export const availableEngines = [
  {
    id: 'LOCAL',
    name: 'LOCAL 모드',
    description: '완전 구현된 로컬 AI 시스템 (기본 권장)',
    icon: Database,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    features: ['완전 구현', '프라이버시 보장', '오프라인 동작'],
    status: 'ready',
  },
  {
    id: 'GOOGLE_ONLY',
    name: 'GOOGLE_ONLY 모드',
    description: '자연어 질의 전용 Google AI (성능 비교용)',
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    features: ['자연어 처리 특화', '고급 추론', '확장성 테스트'],
    usage: { used: 45, limit: 100 },
    status: 'ready',
  },
];
```

#### 프로그래밍 방식 모드 변경

```typescript
// src/core/ai/engines/GoogleAIModeManager.ts
export class GoogleAIModeManager {
  private currentMode: AIMode = 'LOCAL'; // 기본값

  constructor(config?: Partial<GoogleAIModeConfig>) {
    this.config = {
      mode: 'LOCAL', // 🏠 로컬 모드가 기본값
      fallbackTimeout: 5000,
      confidenceThreshold: 0.7,
      enableAutoSwitch: true,
      maxRetries: 3,
      quotaLimits: {
        daily: 1000,
        perMinute: 12,
      },
      enableCaching: true,
      ...config,
    };

    console.log(
      `🤖 Google AI Mode Manager 생성됨 (기본 모드: ${this.currentMode})`
    );
  }

  /**
   * 🔄 모드 변경
   */
  public setMode(mode: AIMode): void {
    console.log(`🔄 모드 변경: ${this.currentMode} → ${mode}`);
    this.currentMode = mode;
    this.config.mode = mode;

    // 🚫 베르셀 환경에서는 파일 저장 없이 메모리에서만 관리
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.log('⚠️ 베르셀 환경에서 모드 설정 메모리 관리');
    }
  }

  /**
   * 🏠 LOCAL 모드: Google AI 완전 비활성화
   */
  private async processLocalMode(
    query: string,
    context?: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<AIEngineResult> {
    console.log('🏠 LOCAL 모드: Google AI 비활성화, 로컬 엔진만 사용');

    // 로컬 처리 로직 (Google AI 완전 제외)
    const localResponse = this.generateLocalResponse(query, context, priority);

    return {
      success: true,
      mode: 'LOCAL',
      response: localResponse,
      confidence: 0.75,
      sources: ['local-engine', 'pattern-matching'],
      suggestions: this.generateLocalSuggestions(query),
      processingTime: 0,
      fallbackUsed: false,
      engineDetails: {
        mode: 'LOCAL',
        googleAIUsed: false,
        localEnginesUsed: ['pattern-matcher', 'template-engine'],
      },
    };
  }

  /**
   * 🚀 GOOGLE_ONLY 모드: 자연어 질의 전용 Google AI
   */
  private async processGoogleAIMode(
    query: string,
    context?: any,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<AIEngineResult> {
    console.log('🚀 GOOGLE_AI 모드: 자연어 질의 전용 Google AI 사용');

    try {
      const googleAIAvailable = this.googleAI.isAvailable();

      if (googleAIAvailable) {
        const googleResponse = await this.googleAI.processQuery({
          query: query,
          mode: 'GOOGLE_ONLY',
          timeout: priority === 'critical' ? 10000 : 5000,
          context: {
            isNaturalLanguage: true,
            priority: priority,
          },
        });

        if (googleResponse.success) {
          return {
            success: true,
            mode: 'GOOGLE_ONLY',
            response: googleResponse.response,
            confidence: googleResponse.confidence || 0.9,
            sources: ['google-ai', 'advanced-analysis'],
            suggestions: this.extractSuggestions(googleResponse.response),
            processingTime: googleResponse.processingTime,
            fallbackUsed: false,
            engineDetails: {
              mode: 'GOOGLE_ONLY',
              googleAIUsed: true,
              processingTime: googleResponse.processingTime,
            },
          };
        }
      }

      // Google AI 실패 시 로컬 폴백
      console.log('⚠️ Google AI 사용 불가 - 로컬 폴백 처리');
      return await this.processLocalMode(query, context, priority);
    } catch (error) {
      console.error('❌ Google AI 모드 오류:', error);
      return await this.processLocalMode(query, context, priority);
    }
  }
}
```

---

## 🏠 로컬 AI 엔진

### 로컬 AI 엔진 구성

```typescript
// src/core/ai/managers/AIEngineManager.ts
export class AIEngineManager {
  // 메인 로컬 엔진들
  public readonly supabaseRAG = getSupabaseRAGEngine();
  public readonly koreanEngine: KoreanAIEngine;
  public readonly transformersEngine: TransformersEngine;
  public readonly mcpClient: any; // 컨텍스트 수집기

  // 선택적 고급 엔진
  public readonly googleAI: RequestScopedGoogleAIService;

  constructor() {
    // 로컬 엔진들 초기화
    this.koreanEngine = new KoreanAIEngine();
    this.transformersEngine = new TransformersEngine();

    // Google AI는 선택적 초기화
    this.googleAI = createGoogleAIService();

    console.log('🔧 AI 엔진 관리자 생성 완료 (로컬 엔진 우선)');
  }
}
```

### 로컬 엔진별 특징

#### 1. Supabase RAG 엔진

```typescript
// src/lib/ml/supabase-rag-engine.ts
export class SupabaseRAGEngine {
  // 벡터 검색 기반 문서 검색
  async searchDocuments(query: string): Promise<Document[]> {
    // 로컬 벡터 검색 로직
  }

  // 컨텍스트 기반 응답 생성
  async generateResponse(
    query: string,
    documents: Document[]
  ): Promise<string> {
    // 검색된 문서 기반 응답 생성
  }
}
```

#### 2. 한국어 전용 AI 엔진

```typescript
// src/lib/ml/korean-ai-engine.ts
export class KoreanAIEngine {
  // 한국어 자연어 처리
  async processKoreanNLP(text: string): Promise<NLPResult> {
    // hangul-js + korean-utils 기반 처리
  }

  // 한국어 특화 응답 생성
  async generateKoreanResponse(query: string): Promise<string> {
    // 한국어 도메인 특화 응답
  }
}
```

#### 3. MCP 컨텍스트 엔진

```typescript
// MCP 클라이언트 기반 컨텍스트 수집
export class MCPContextEngine {
  async collectContext(query: string): Promise<Context[]> {
    // MCP 서버에서 관련 컨텍스트 수집
  }

  async enhanceQuery(query: string, context: Context[]): Promise<string> {
    // 컨텍스트 기반 질의 향상
  }
}
```

---

## 🧠 Google AI (Gemini) 통합

### GOOGLE_ONLY 모드에서의 Google AI 사용

```typescript
// src/services/ai/GoogleAIService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GoogleAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private quotaManager: QuotaManager;

  constructor() {
    // GOOGLE_ONLY 모드에서만 초기화
    if (
      process.env.AI_ENGINE_MODE === 'GOOGLE_ONLY' &&
      process.env.GOOGLE_AI_ENABLED === 'true'
    ) {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      this.quotaManager = new QuotaManager();
    }
  }

  async generateResponse(prompt: string): Promise<AIResponse> {
    // LOCAL 모드에서는 사용 안함
    if (process.env.AI_ENGINE_MODE === 'LOCAL') {
      throw new Error('LOCAL 모드에서는 Google AI 사용 불가');
    }

    // 할당량 확인
    const canProceed = await this.quotaManager.checkDailyLimit();
    if (!canProceed) {
      throw new Error('일일 할당량 초과');
    }

    try {
      // 캐시 확인
      const cachedResponse = await this.getCachedResponse(prompt);
      if (cachedResponse) {
        return cachedResponse;
      }

      // AI 요청
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // 🚫 베르셀 환경에서는 캐시 저장 무력화
      if (!(process.env.VERCEL || process.env.NODE_ENV === 'production')) {
        await this.cacheResponse(prompt, response);
      }

      // 사용량 기록
      await this.quotaManager.recordUsage();

      return {
        content: response,
        source: 'google-ai',
        cached: false,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Google AI 요청 실패:', error);
      throw error;
    }
  }
}
```

---

## 🚫 베르셀 환경 파일 시스템 보호

### 파일 저장 기능 무력화

베르셀 환경에서 AI 시스템 관련 파일 저장 기능이 모두 무력화되었습니다.

#### 무력화된 AI 관련 파일 저장 기능들

1. **AI 모드 설정 저장**

   ```typescript
   // GoogleAIModeManager에서 모드 설정 파일 저장 무력화
   public setMode(mode: AIMode): void {
     this.currentMode = mode;

     // 🚫 베르셀 환경에서는 파일 저장 없이 메모리에서만 관리
     if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
       console.log('⚠️ 베르셀 환경에서 모드 설정 메모리 관리');
       return;
     }

     // 개발 환경에서만 파일 저장
   }
   ```

2. **AI 응답 캐시 저장**

   ```typescript
   // Google AI 응답 캐시 파일 저장 무력화
   private async cacheResponse(prompt: string, response: string): Promise<void> {
     if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
       console.log('⚠️ 베르셀 환경에서 AI 캐시 파일 저장 무력화');
       return;
     }

     // 개발 환경에서만 파일 캐시 저장
   }
   ```

3. **AI 사용량 로그 저장**

   ```typescript
   // AI 사용량 통계 파일 저장 무력화
   async recordUsage(): Promise<void> {
     if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
       console.log('⚠️ 베르셀 환경에서 AI 사용량 로그 파일 저장 무력화');
       // 메모리 기반 통계만 유지
       return;
     }

     // 개발 환경에서만 파일 로그 저장
   }
   ```

#### 메모리 기반 AI 시스템 관리

```typescript
// src/config/free-tier-emergency-fix.ts
export const AI_SYSTEM_PROTECTION = {
  // AI 모드 메모리 관리
  aiModeMemoryManagement: {
    currentMode: 'LOCAL', // 런타임 중 메모리에서만 관리
    modeHistory: [], // 메모리 기반 모드 변경 이력
    lastModeSwitch: 0, // 마지막 모드 전환 시간
  },

  // AI 캐시 메모리 관리
  aiCacheMemoryManagement: {
    responseCache: new Map(), // 메모리 기반 응답 캐시
    maxCacheSize: 100, // 최대 캐시 항목 수
    cacheTimeout: 300000, // 5분 캐시 만료
  },

  // AI 사용량 메모리 추적
  aiUsageMemoryTracking: {
    dailyUsage: 0, // 메모리 기반 일일 사용량
    hourlyUsage: [], // 시간별 사용량 추적
    lastReset: Date.now(), // 마지막 리셋 시간
  },
};
```

---

## 💰 무료티어 최적화

### AI 엔진 모드별 최적화 전략

#### LOCAL 모드 최적화

```typescript
const localModeOptimization = {
  cost: '무료',
  performance: '빠름 (100-300ms)',
  accuracy: '높음 (도메인 특화)',
  offline: '가능',
  privacy: '완전 보호',
  quota: '제한 없음',

  optimizations: [
    '로컬 벡터 검색 최적화',
    '한국어 NLP 캐싱',
    'MCP 컨텍스트 재사용',
    '메모리 기반 응답 캐시',
  ],
};
```

#### GOOGLE_ONLY 모드 최적화

```typescript
const googleOnlyModeOptimization = {
  cost: '할당량 제한',
  performance: '보통 (500-2000ms)',
  accuracy: '매우 높음 (범용)',
  offline: '불가능',
  privacy: '외부 전송',
  quota: '일일 1,000회',

  optimizations: [
    '할당량 보호 시스템',
    '스마트 캐싱 전략',
    '자동 로컬 폴백',
    'RPM 제한 준수',
  ],
};
```

### 무료티어 보호 시스템

```typescript
// src/services/ai/QuotaManager.ts
export class QuotaManager {
  private static readonly DAILY_LIMIT = 1000; // 안전 한도
  private static readonly RPM_LIMIT = 12; // 분당 요청 제한
  private static readonly CONCURRENT_LIMIT = 2; // 동시 요청 제한

  async checkDailyLimit(): Promise<boolean> {
    // 🚫 베르셀 환경에서는 메모리 기반 체크
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      return this.checkMemoryBasedLimit();
    }

    // 개발 환경에서는 Redis 기반 체크
    const today = new Date().toISOString().split('T')[0];
    const key = `ai_quota:${today}`;

    const currentUsage = await this.redisClient.get(key);
    const usage = currentUsage ? parseInt(currentUsage) : 0;

    return usage < QuotaManager.DAILY_LIMIT;
  }

  private checkMemoryBasedLimit(): boolean {
    const today = new Date().toISOString().split('T')[0];
    const memoryUsage = AI_SYSTEM_PROTECTION.aiUsageMemoryTracking;

    // 날짜가 바뀌면 리셋
    if (memoryUsage.lastReset < Date.now() - 86400000) {
      memoryUsage.dailyUsage = 0;
      memoryUsage.lastReset = Date.now();
    }

    return memoryUsage.dailyUsage < QuotaManager.DAILY_LIMIT;
  }
}
```

---

## 📊 성능 메트릭 및 모니터링

### AI 엔진 모드별 성능 비교

| 메트릭        | LOCAL 모드         | GOOGLE_ONLY 모드 |
| ------------- | ------------------ | ---------------- |
| 응답 속도     | 100-300ms          | 500-2000ms       |
| 정확도        | 높음 (도메인 특화) | 매우 높음 (범용) |
| 비용          | 무료               | 할당량 제한      |
| 오프라인 지원 | ✅ 가능            | ❌ 불가능        |
| 개인정보 보호 | ✅ 완전 보호       | ⚠️ 외부 전송     |
| 파일 저장     | ❌ 무력화          | ❌ 무력화        |
| 베르셀 호환   | ✅ 100%            | ✅ 100%          |

### 실시간 모니터링 시스템

```typescript
// src/services/ai/AIMonitoringService.ts
export class AIMonitoringService {
  async getAISystemStats(): Promise<AISystemStats> {
    return {
      currentMode: this.getCurrentMode(),
      modeUsage: {
        LOCAL: this.getModeUsageCount('LOCAL'),
        GOOGLE_ONLY: this.getModeUsageCount('GOOGLE_ONLY'),
      },
      quotaStatus: await this.getQuotaStatus(),
      performanceMetrics: {
        averageResponseTime: this.getAverageResponseTime(),
        successRate: this.getSuccessRate(),
        fallbackRate: this.getFallbackRate(),
      },
      systemHealth: {
        localEnginesStatus: await this.checkLocalEngines(),
        googleAIStatus: await this.checkGoogleAI(),
        memoryUsage: process.memoryUsage(),
        fileSystemProtection: this.isFileSystemProtected(),
      },
    };
  }

  private getCurrentMode(): 'LOCAL' | 'GOOGLE_ONLY' {
    return (process.env.AI_ENGINE_MODE as 'LOCAL' | 'GOOGLE_ONLY') || 'LOCAL';
  }

  private isFileSystemProtected(): boolean {
    return !!(process.env.VERCEL || process.env.NODE_ENV === 'production');
  }
}
```

이 AI 시스템 가이드를 통해 OpenManager Vibe v5의 로컬 엔진 우선 AI 시스템과 베르셀 환경 최적화를 완전히 이해하고 활용할 수 있습니다.
