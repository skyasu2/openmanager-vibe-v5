/**
 * MCP → RAG 하이브리드 엔진
 *
 * ✅ MCP 우선, 실패 시 로컬 RAG 폴백
 * ✅ 실시간 건강성 체크 및 모드 전환
 */

import { LocalRAGEngine } from './local-rag-engine';
import { MCPHealthChecker } from './mcp-health-checker';

interface AIResponse {
  response: string;
  confidence: number;
  source: 'mcp' | 'rag' | 'fallback';
  processingTime: number;
  reliability: 'high' | 'medium' | 'low';
  error?: string;
  notice?: string;
}

interface HybridConfig {
  mcpTimeout: number;
  mcpRetries: number;
  preferRAG: boolean;
  emergencyRAG: boolean;
  healthCheckInterval: number;
}

export interface HybridEngineStatus {
  currentMode: 'mcp' | 'rag';
  mcpHealth: ReturnType<MCPHealthChecker['getHealthStatus']>;
  ragReady: boolean;
  lastProcessingTime?: number;
  totalQueries?: number;
  successRate?: number;
}

class MCPAIEngine {
  private mcpServerUrl = 'https://openmanager-vibe-v5.onrender.com';

  async processQuery(query: string, sessionId: string): Promise<AIResponse> {
    // 실제 Render MCP 서버에 연결
    const res = await fetch(`${this.mcpServerUrl}/mcp/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      throw new Error('MCP_SERVER_UNREACHABLE');
    }

    // MCP 서버가 살아있으면 실제 쿼리 처리
    const queryRes = await fetch('/api/mcp/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query, 
        sessionId,
        mcpServerUrl: this.mcpServerUrl 
      }),
    });
    
    if (!queryRes.ok) throw new Error('MCP_QUERY_ERROR');
    
    const data = await queryRes.json();
    return {
      response: data.response,
      confidence: data.confidence || 0.8,
      source: 'mcp',
      processingTime: data.processingTime || 0,
      reliability: 'high',
    };
  }

  async checkHealth(): Promise<boolean> {
    try {
      // AbortController로 타임아웃 처리
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${this.mcpServerUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }
}

export class HybridFailoverEngine {
  private mcpEngine = new MCPAIEngine();
  private ragEngine = new LocalRAGEngine();
  private healthChecker = new MCPHealthChecker();
  private config: HybridConfig;

  private lastProcessingTime = 0;
  private totalQueries = 0;
  private successes = 0;

  constructor() {
    this.config = {
      mcpTimeout: 3000,
      mcpRetries: 2,
      preferRAG: false,
      emergencyRAG: true,
      healthCheckInterval: 15_000,
    };

    this.startHealthMonitoring();
  }

  private async isMCPHealthy(): Promise<boolean> {
    const healthy = await this.healthChecker.checkHealth();
    return healthy;
  }

  async processQuery(query: string, sessionId: string): Promise<AIResponse> {
    const start = Date.now();
    let result: AIResponse;

    if (!this.config.preferRAG && (await this.isMCPHealthy())) {
      try {
        result = await Promise.race([
          this.mcpEngine.processQuery(query, sessionId),
          new Promise<never>((_, r) =>
            setTimeout(() => r(new Error('MCP_TIMEOUT')), this.config.mcpTimeout)
          ),
        ]);
        this.successes++;
      } catch (err: any) {
        console.warn('❌ MCP 엔진 실패:', err.message);
        this.healthChecker.recordFailure();
        result = await this.processWithRAG(query, sessionId, 'mcp-failed');
      }
    } else {
      result = await this.processWithRAG(query, sessionId, 'primary');
    }

    this.lastProcessingTime = Date.now() - start;
    this.totalQueries++;
    return result;
  }

  private async processWithRAG(
    query: string,
    sessionId: string,
    reason: 'primary' | 'mcp-failed' | 'health-check-failed'
  ): Promise<AIResponse> {
    const start = Date.now();
    try {
      const ragResult = await this.ragEngine.processQuery(query, sessionId);
      return {
        ...ragResult,
        source: 'rag',
        reliability: reason === 'primary' ? 'high' : 'medium',
        processingTime: Date.now() - start,
        notice: reason !== 'primary' ? this.getFailoverNotice(reason) : undefined,
      };
    } catch (error: any) {
      return {
        response: '죄송합니다. 현재 AI 시스템에 문제가 발생했습니다.',
        confidence: 0.1,
        source: 'fallback',
        processingTime: Date.now() - start,
        reliability: 'low',
        error: error.message,
      };
    }
  }

  private getFailoverNotice(reason: string) {
    const notices: Record<string, string> = {
      'mcp-failed': '⚠️ 외부 서버 연결 문제로 로컬 엔진을 사용했습니다.',
      'health-check-failed': '⚠️ 서버 상태 확인 실패로 로컬 엔진을 사용했습니다.',
    };
    return notices[reason] || '⚠️ 로컬 엔진을 사용하여 응답했습니다.';
  }

  private startHealthMonitoring() {
    setInterval(async () => {
      const isHealthy = await this.healthChecker.checkHealth();
      if (!isHealthy && !this.config.preferRAG) {
        console.warn('🚨 MCP 서버 건강성 악화, RAG 모드로 임시 전환');
        this.config.preferRAG = true;
        setTimeout(() => {
          this.config.preferRAG = false;
          console.log('🔄 MCP 모드로 복귀 시도');
        }, 30_000);
      }
    }, this.config.healthCheckInterval);
  }

  setMode(mode: 'mcp' | 'rag' | 'auto'): void {
    switch (mode) {
      case 'mcp':
        this.config.preferRAG = false;
        this.config.emergencyRAG = true;
        break;
      case 'rag':
        this.config.preferRAG = true;
        this.config.emergencyRAG = false;
        break;
      default:
        this.config.preferRAG = false;
        this.config.emergencyRAG = true;
    }
    console.log(`🔧 AI 엔진 모드 변경: ${mode}`);
  }

  getStatus(): HybridEngineStatus {
    const successRate = this.totalQueries
      ? this.successes / this.totalQueries
      : 1;
    return {
      currentMode: this.config.preferRAG ? 'rag' : 'mcp',
      mcpHealth: this.healthChecker.getHealthStatus(),
      ragReady: this.ragEngine.isReady(),
      lastProcessingTime: this.lastProcessingTime,
      totalQueries: this.totalQueries,
      successRate,
    };
  }
}

export const hybridFailoverEngine = new HybridFailoverEngine();

