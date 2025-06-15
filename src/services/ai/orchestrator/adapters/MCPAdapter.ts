import { EngineAdapter, EngineResult } from '../types';
import { MCPOrchestrator } from '@/services/mcp/mcp-orchestrator';

export class MCPAdapter implements EngineAdapter {
  name = 'mcp';
  private orchestrator = new MCPOrchestrator();
  private initialized = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      try {
        await this.orchestrator.initialize();
      } catch (e) {
        // ignore
      }
      this.initialized = true;
    }
  }

  async isAvailable(): Promise<boolean> {
    // MCP 서비스는 별도 헬스체크 가정 (항상 true)
    return true;
  }

  async query(question: string, context?: any): Promise<EngineResult> {
    const start = Date.now();
    try {
      await this.ensureInitialized();
      const result = await this.orchestrator.processQuery({
        id: `mcp_${Date.now()}`,
        question,
        timestamp: Date.now(),
        context,
      } as any);

      return {
        success: true,
        answer: result.answer,
        confidence: result.confidence,
        engine: this.name,
        processingTime: Date.now() - start,
        sources: result.sources,
        metadata: {
          recommendations: result.recommendations,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        answer: error.message || 'MCP 오류',
        confidence: 0,
        engine: this.name,
        processingTime: Date.now() - start,
        metadata: { error: true },
      };
    }
  }
} 