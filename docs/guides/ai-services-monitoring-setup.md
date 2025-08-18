# 🤖 AI 서비스 & 모니터링 설정 가이드

> **AI 통합 + 헬스체크 + 성능 모니터링**  
> 최종 업데이트: 2025-08-18  
> 서비스: Claude + Google AI + OpenAI + 통합 모니터링

## 🎯 개요

OpenManager VIBE v5의 AI 서비스 통합 관리, 실시간 헬스체크 시스템, 성능 모니터링을 완전히 설정하고 관리하는 가이드입니다.

## 📋 목차

1. [AI 서비스 통합](#ai-서비스-통합)
2. [모니터링 및 헬스체크](#모니터링-및-헬스체크)
3. [성능 최적화](#성능-최적화)
4. [체크리스트 및 가이드](#체크리스트-및-가이드)
5. [문제 해결](#문제-해결)

## 🤖 AI 서비스 통합

### 1단계: AI 서비스 추상화

```typescript
// src/lib/ai/ai-service-manager.ts
export interface AIServiceConfig {
  name: string;
  endpoint: string;
  apiKey: string;
  enabled: boolean;
  rateLimit: number;
}

export interface AIResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  timestamp: Date;
}

export class AIServiceManager {
  private services: Map<string, AIServiceConfig> = new Map();

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Claude AI
    this.services.set('claude', {
      name: 'Claude',
      endpoint: 'https://api.anthropic.com',
      apiKey: process.env.CLAUDE_API_KEY || '',
      enabled: !!process.env.CLAUDE_API_KEY,
      rateLimit: 60, // requests per minute
    });

    // Google AI
    this.services.set('google', {
      name: 'Google AI',
      endpoint: 'https://generativelanguage.googleapis.com',
      apiKey: process.env.GOOGLE_AI_API_KEY || '',
      enabled: !!process.env.GOOGLE_AI_API_KEY,
      rateLimit: 15,
    });

    // OpenAI
    this.services.set('openai', {
      name: 'OpenAI',
      endpoint: 'https://api.openai.com',
      apiKey: process.env.OPENAI_API_KEY || '',
      enabled: !!process.env.OPENAI_API_KEY,
      rateLimit: 50,
    });
  }

  async callAI(
    serviceName: string,
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<AIResponse> {
    const service = this.services.get(serviceName);

    if (!service || !service.enabled) {
      throw new Error(`AI 서비스 '${serviceName}'을 사용할 수 없습니다`);
    }

    // 실제 AI 서비스 호출 구현
    // 각 서비스별 API 호출 로직
    return this.executeAICall(service, prompt, options);
  }

  private async executeAICall(
    service: AIServiceConfig,
    prompt: string,
    options: any
  ): Promise<AIResponse> {
    // 서비스별 구현
    switch (service.name) {
      case 'Claude':
        return this.callClaude(service, prompt, options);
      case 'Google AI':
        return this.callGoogleAI(service, prompt, options);
      case 'OpenAI':
        return this.callOpenAI(service, prompt, options);
      default:
        throw new Error(`지원하지 않는 AI 서비스: ${service.name}`);
    }
  }

  private async callClaude(
    service: AIServiceConfig,
    prompt: string,
    options: any
  ): Promise<AIResponse> {
    // Claude API 호출 구현
    const response = await fetch(`${service.endpoint}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': service.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options.model || 'claude-3-sonnet-20240229',
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature || 0.1,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API 오류: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      model: data.model,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      timestamp: new Date(),
    };
  }

  private async callGoogleAI(
    service: AIServiceConfig,
    prompt: string,
    options: any
  ): Promise<AIResponse> {
    // Google AI API 호출 구현
    const model = options.model || 'gemini-pro';
    const response = await fetch(
      `${service.endpoint}/v1/models/${model}:generateContent?key=${service.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options.temperature || 0.1,
            maxOutputTokens: options.maxTokens || 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google AI API 오류: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    return {
      content,
      model,
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount || 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      timestamp: new Date(),
    };
  }

  private async callOpenAI(
    service: AIServiceConfig,
    prompt: string,
    options: any
  ): Promise<AIResponse> {
    // OpenAI API 호출 구현
    const response = await fetch(`${service.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${service.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature || 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      timestamp: new Date(),
    };
  }

  getAvailableServices(): string[] {
    return Array.from(this.services.entries())
      .filter(([, service]) => service.enabled)
      .map(([name]) => name);
  }

  getServiceStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.services.forEach((service, name) => {
      status[name] = service.enabled;
    });
    return status;
  }
}
```

### 2단계: AI 서비스 레이트 리미터

```typescript
// src/lib/ai/rate-limiter.ts
export class AIRateLimiter {
  private requestCounts: Map<string, number[]> = new Map();
  private limits: Map<string, number> = new Map();

  constructor() {
    this.limits.set('claude', 60); // 60 requests per minute
    this.limits.set('google', 15); // 15 requests per minute
    this.limits.set('openai', 50); // 50 requests per minute
  }

  async checkRateLimit(serviceName: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    const requests = this.requestCounts.get(serviceName) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    const limit = this.limits.get(serviceName) || 10;
    
    if (recentRequests.length >= limit) {
      return false; // Rate limit exceeded
    }
    
    // Add current request
    recentRequests.push(now);
    this.requestCounts.set(serviceName, recentRequests);
    
    return true;
  }

  getRemainingRequests(serviceName: string): number {
    const now = Date.now();
    const windowStart = now - 60000;
    
    const requests = this.requestCounts.get(serviceName) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    const limit = this.limits.get(serviceName) || 10;
    return Math.max(0, limit - recentRequests.length);
  }

  getResetTime(serviceName: string): Date {
    const requests = this.requestCounts.get(serviceName) || [];
    if (requests.length === 0) {
      return new Date();
    }
    
    const oldestRequest = Math.min(...requests);
    return new Date(oldestRequest + 60000);
  }
}
```

## 📊 모니터링 및 헬스체크

### 통합 헬스체크 시스템

```typescript
// src/lib/monitoring/integrated-health-check.ts
import { SupabaseService } from '@/lib/supabase/client';
import { VectorService } from '@/lib/pgvector/vector-service';
import { MCPManager } from '@/lib/mcp/mcp-manager';
import { AIServiceManager } from '@/lib/ai/ai-service-manager';

export interface ServiceHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  details?: any;
}

export class IntegratedHealthCheck {
  private aiManager = new AIServiceManager();

  async checkAllServices(): Promise<ServiceHealthStatus[]> {
    const checks = await Promise.allSettled([
      this.checkSupabase(),
      this.checkPgVector(),
      this.checkMCPServers(),
      this.checkAIServices(),
    ]);

    return checks
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          const serviceNames = ['Supabase', 'pgvector', 'MCP', 'AI Services'];
          return {
            service: serviceNames[index],
            status: 'unhealthy' as const,
            responseTime: 0,
            lastCheck: new Date(),
            details: { error: result.reason?.message },
          };
        }
      })
      .flat();
  }

  private async checkSupabase(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();

    try {
      // 간단한 쿼리로 연결 테스트
      await SupabaseService.getServerStatistics('test-user-id');

      return {
        service: 'Supabase',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
      };
    } catch (error) {
      return {
        service: 'Supabase',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        details: { error: error.message },
      };
    }
  }

  private async checkPgVector(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();

    try {
      const stats = await VectorService.getVectorStats();

      return {
        service: 'pgvector',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        details: stats,
      };
    } catch (error) {
      return {
        service: 'pgvector',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        details: { error: error.message },
      };
    }
  }

  private async checkMCPServers(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();

    try {
      const healthReport = await MCPManager.generateHealthReport();

      const status =
        healthReport.healthyPercentage >= 80
          ? 'healthy'
          : healthReport.healthyPercentage >= 50
            ? 'degraded'
            : 'unhealthy';

      return {
        service: 'MCP Servers',
        status,
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        details: healthReport,
      };
    } catch (error) {
      return {
        service: 'MCP Servers',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        details: { error: error.message },
      };
    }
  }

  private async checkAIServices(): Promise<ServiceHealthStatus> {
    const startTime = Date.now();

    try {
      const serviceStatus = this.aiManager.getServiceStatus();
      const availableServices = this.aiManager.getAvailableServices();

      const status = availableServices.length > 0 ? 'healthy' : 'unhealthy';

      return {
        service: 'AI Services',
        status,
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        details: {
          available: availableServices,
          status: serviceStatus,
        },
      };
    } catch (error) {
      return {
        service: 'AI Services',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        details: { error: error.message },
      };
    }
  }

  async generateDashboard(): Promise<object> {
    const services = await this.checkAllServices();

    const totalServices = services.length;
    const healthyServices = services.filter(
      (s) => s.status === 'healthy'
    ).length;
    const degradedServices = services.filter(
      (s) => s.status === 'degraded'
    ).length;
    const unhealthyServices = services.filter(
      (s) => s.status === 'unhealthy'
    ).length;

    const overallStatus =
      unhealthyServices > 0
        ? 'critical'
        : degradedServices > 0
          ? 'warning'
          : 'healthy';

    return {
      timestamp: new Date().toISOString(),
      overallStatus,
      services: {
        total: totalServices,
        healthy: healthyServices,
        degraded: degradedServices,
        unhealthy: unhealthyServices,
      },
      details: services,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }
}
```

### 실시간 모니터링 API

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { IntegratedHealthCheck } from '@/lib/monitoring/integrated-health-check';

const healthChecker = new IntegratedHealthCheck();

export async function GET() {
  try {
    const dashboard = await healthChecker.generateDashboard();
    
    return NextResponse.json(dashboard, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Health check failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
```

## ⚡ 성능 최적화

### AI 서비스 최적화 전략

```typescript
// src/lib/ai/ai-optimizer.ts
export class AIOptimizer {
  private static readonly PERFORMANCE_THRESHOLDS = {
    responseTime: 5000, // 5초
    tokenEfficiency: 0.8, // 80% 효율성
    errorRate: 0.05, // 5% 이하
  };

  static async optimizeAICall(
    serviceName: string,
    prompt: string,
    options: any = {}
  ): Promise<any> {
    // 1. 프롬프트 최적화
    const optimizedPrompt = this.optimizePrompt(prompt);
    
    // 2. 모델 선택 최적화
    const optimizedModel = this.selectOptimalModel(serviceName, prompt.length);
    
    // 3. 토큰 사용량 최적화
    const optimizedOptions = this.optimizeTokenUsage(options, prompt.length);
    
    return {
      prompt: optimizedPrompt,
      model: optimizedModel,
      options: optimizedOptions,
    };
  }

  private static optimizePrompt(prompt: string): string {
    // 불필요한 공백 제거
    let optimized = prompt.trim().replace(/\s+/g, ' ');
    
    // 반복적인 구문 제거
    optimized = optimized.replace(/(.{10,})\1+/g, '$1');
    
    // 길이 제한 적용
    if (optimized.length > 4000) {
      optimized = optimized.substring(0, 3900) + '...';
    }
    
    return optimized;
  }

  private static selectOptimalModel(serviceName: string, promptLength: number): string {
    switch (serviceName) {
      case 'claude':
        return promptLength > 2000 ? 'claude-3-opus-20240229' : 'claude-3-haiku-20240307';
      case 'google':
        return promptLength > 2000 ? 'gemini-pro' : 'gemini-pro';
      case 'openai':
        return promptLength > 2000 ? 'gpt-4' : 'gpt-3.5-turbo';
      default:
        return 'default';
    }
  }

  private static optimizeTokenUsage(options: any, promptLength: number): any {
    const baseTokens = Math.ceil(promptLength / 4); // 대략적인 토큰 수
    
    return {
      ...options,
      maxTokens: Math.min(options.maxTokens || 1024, baseTokens * 2),
      temperature: options.temperature || 0.1,
    };
  }

  static async measurePerformance(
    serviceName: string,
    executionFn: () => Promise<any>
  ): Promise<{
    result: any;
    metrics: {
      responseTime: number;
      success: boolean;
      tokenEfficiency: number;
    };
  }> {
    const startTime = Date.now();
    let success = false;
    let result: any;
    
    try {
      result = await executionFn();
      success = true;
    } catch (error) {
      result = { error: error.message };
    }
    
    const responseTime = Date.now() - startTime;
    const tokenEfficiency = this.calculateTokenEfficiency(result);
    
    return {
      result,
      metrics: {
        responseTime,
        success,
        tokenEfficiency,
      },
    };
  }

  private static calculateTokenEfficiency(result: any): number {
    if (!result.usage) return 0;
    
    const { inputTokens, outputTokens } = result.usage;
    return outputTokens / (inputTokens + outputTokens);
  }
}
```

## 📚 체크리스트 및 가이드

### 서비스 통합 체크리스트

#### 초기 설정

- [ ] Supabase 프로젝트 생성 및 데이터베이스 스키마 적용
- [ ] pgvector 확장 활성화 및 네이티브 함수 설치
- [ ] MCP 서버 12개 설치 및 환경변수 설정
- [ ] 테스트 환경 Vitest + Mock 데이터 구성
- [ ] AI 서비스 API 키 설정 및 연동 테스트

#### 개발 과정

- [ ] 새 기능 개발 시 관련 서비스 통합 테스트
- [ ] 환경변수 변경 시 모든 환경 업데이트
- [ ] Mock 데이터 최신 상태 유지
- [ ] 서비스별 에러 핸들링 구현

#### 배포 전

- [ ] 전체 서비스 헬스체크 통과
- [ ] 통합 테스트 전체 통과
- [ ] 성능 테스트 (pgvector 3.6x 향상 확인)
- [ ] MCP 서버 정상 작동 확인
- [ ] AI 서비스 연결 상태 확인

### 모니터링 설정 가이드

#### 헬스체크 엔드포인트 설정

```typescript
// next.config.js에 헬스체크 리라이트 추가
module.exports = {
  async rewrites() {
    return [
      {
        source: '/health',
        destination: '/api/health',
      },
    ];
  },
};
```

#### 알림 설정

```typescript
// src/lib/monitoring/alerts.ts
export class AlertManager {
  static async sendAlert(
    service: string,
    status: string,
    details: any
  ): Promise<void> {
    if (status === 'unhealthy') {
      console.error(`🚨 ${service} 서비스 장애:`, details);
      
      // 실제 알림 서비스 연동 (Slack, Discord 등)
      // await this.sendSlackAlert(service, details);
    }
  }
}
```

## 🚨 문제 해결

### AI 서비스 연결 오류

**증상**: `API key invalid` 또는 `Rate limit exceeded`

**해결책**:
```typescript
// AI 서비스 진단
const diagnoseAIServices = async () => {
  const aiManager = new AIServiceManager();
  
  console.log('🤖 AI 서비스 진단...');
  
  const services = aiManager.getAvailableServices();
  console.log('사용 가능한 서비스:', services);
  
  for (const service of ['claude', 'google', 'openai']) {
    try {
      const testResponse = await aiManager.callAI(service, '테스트', {
        maxTokens: 10,
      });
      console.log(`✅ ${service}: 정상`);
    } catch (error) {
      console.error(`❌ ${service}: ${error.message}`);
    }
  }
};
```

### 성능 최적화 문제

**증상**: AI 응답 시간이 느림 (>10초)

**해결책**:
```typescript
// 성능 진단 및 최적화
const optimizeAIPerformance = async () => {
  const optimizer = new AIOptimizer();
  
  const testPrompt = "긴 테스트 프롬프트...";
  
  // 최적화 전후 비교
  const beforeOptimization = await AIOptimizer.measurePerformance(
    'claude',
    () => aiManager.callAI('claude', testPrompt)
  );
  
  const optimized = await AIOptimizer.optimizeAICall('claude', testPrompt);
  
  const afterOptimization = await AIOptimizer.measurePerformance(
    'claude',
    () => aiManager.callAI('claude', optimized.prompt, optimized.options)
  );
  
  console.log('성능 개선:', {
    before: beforeOptimization.metrics.responseTime,
    after: afterOptimization.metrics.responseTime,
    improvement: beforeOptimization.metrics.responseTime - afterOptimization.metrics.responseTime,
  });
};
```

### 모니터링 시스템 오류

**증상**: 헬스체크가 실패하거나 응답하지 않음

**해결책**:
```typescript
// 모니터링 시스템 진단
const diagnoseMonitoring = async () => {
  console.log('📊 모니터링 시스템 진단...');
  
  try {
    const healthChecker = new IntegratedHealthCheck();
    const dashboard = await healthChecker.generateDashboard();
    
    console.log('✅ 모니터링 시스템 정상');
    console.log('서비스 상태:', dashboard.services);
  } catch (error) {
    console.error('❌ 모니터링 시스템 오류:', error.message);
    
    // 개별 서비스 체크
    console.log('개별 서비스 진단 시작...');
    // ... 개별 진단 로직
  }
};
```

---

## 📚 관련 문서

- [데이터베이스 & 스토리지 설정](./database-storage-setup.md)
- [인프라 통합 가이드](./infrastructure-integration-setup.md)
- [개발 환경 가이드](./development-environment-complete.md)
- [인증 보안 가이드](./auth-security-complete-setup.md)
- [MCP 종합 가이드](../MCP-GUIDE.md)

---

**💡 핵심 원칙**: 서비스 간 느슨한 결합 + 강력한 통합 테스트 + 실시간 모니터링

🤖 **성공 요소**: AI 서비스 통합 + 자동화된 헬스체크 + 성능 최적화