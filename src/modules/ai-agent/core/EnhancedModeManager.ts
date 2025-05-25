/**
 * Enhanced Mode Manager
 * 
 * 🎛️ 스마트 모드 관리 시스템
 * - 자동 모드 감지 및 전환
 * - 모드별 설정 관리
 * - 성능 최적화
 */

import { SmartModeDetector, QueryAnalysis, AIAgentMode } from './SmartModeDetector';

export interface ModeConfig {
  maxProcessingTime: number;
  contextLength: number;
  responseDepth: 'standard' | 'comprehensive';
  enableAdvancedAnalysis: boolean;
  enablePredictiveAnalysis: boolean;
  enableMultiServerCorrelation: boolean;
  maxResponseLength: number;
}

export class EnhancedModeManager {
  private modeDetector: SmartModeDetector;
  private currentMode: AIAgentMode = 'basic';
  private autoModeEnabled: boolean = true;
  private modeHistory: Array<{
    timestamp: number;
    query: string;
    detectedMode: AIAgentMode;
    confidence: number;
    reasoning: string;
  }> = [];

  constructor() {
    this.modeDetector = new SmartModeDetector();
  }

  /**
   * 쿼리 분석 후 자동 모드 선택
   */
  analyzeAndSetMode(query: string): QueryAnalysis {
    const analysis = this.modeDetector.analyzeQuery(query);
    
    if (this.autoModeEnabled) {
      const previousMode = this.currentMode;
      this.currentMode = analysis.detectedMode;
      
      // 모드 변경 히스토리 기록
      this.modeHistory.push({
        timestamp: Date.now(),
        query: query.substring(0, 100),
        detectedMode: analysis.detectedMode,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning
      });

      // 히스토리 크기 제한 (최근 100개만 유지)
      if (this.modeHistory.length > 100) {
        this.modeHistory = this.modeHistory.slice(-100);
      }
      
      console.log(`🧠 Smart Mode Detection:`, {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        previousMode,
        detectedMode: analysis.detectedMode,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        triggers: analysis.triggers
      });
    }
    
    return analysis;
  }

  /**
   * 모드별 설정 반환
   */
  getModeConfig(): ModeConfig {
    const configs: Record<AIAgentMode, ModeConfig> = {
      basic: {
        maxProcessingTime: 3000,
        contextLength: 2048,
        responseDepth: 'standard',
        enableAdvancedAnalysis: false,
        enablePredictiveAnalysis: false,
        enableMultiServerCorrelation: false,
        maxResponseLength: 300
      },
      advanced: {
        maxProcessingTime: 10000,
        contextLength: 8192,
        responseDepth: 'comprehensive',
        enableAdvancedAnalysis: true,
        enablePredictiveAnalysis: true,
        enableMultiServerCorrelation: true,
        maxResponseLength: 2000
      }
    };
    
    return configs[this.currentMode];
  }

  /**
   * 현재 모드 조회
   */
  getCurrentMode(): AIAgentMode {
    return this.currentMode;
  }

  /**
   * 수동 모드 설정
   */
  setMode(mode: AIAgentMode): void {
    this.currentMode = mode;
    console.log(`🔄 Manual mode change to: ${mode}`);
  }

  /**
   * 자동 모드 활성화/비활성화
   */
  setAutoMode(enabled: boolean): void {
    this.autoModeEnabled = enabled;
    console.log(`🔄 Auto mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 자동 모드 상태 확인
   */
  isAutoModeEnabled(): boolean {
    return this.autoModeEnabled;
  }

  /**
   * 모드 변경 히스토리 조회
   */
  getModeHistory(): typeof this.modeHistory {
    return [...this.modeHistory];
  }

  /**
   * 모드 사용 통계
   */
  getModeStats(): {
    totalQueries: number;
    basicModeCount: number;
    advancedModeCount: number;
    basicModePercentage: number;
    advancedModePercentage: number;
    averageConfidence: number;
  } {
    const total = this.modeHistory.length;
    const basicCount = this.modeHistory.filter(h => h.detectedMode === 'basic').length;
    const advancedCount = this.modeHistory.filter(h => h.detectedMode === 'advanced').length;
    const avgConfidence = total > 0 
      ? this.modeHistory.reduce((sum, h) => sum + h.confidence, 0) / total 
      : 0;

    return {
      totalQueries: total,
      basicModeCount: basicCount,
      advancedModeCount: advancedCount,
      basicModePercentage: total > 0 ? Math.round((basicCount / total) * 100) : 0,
      advancedModePercentage: total > 0 ? Math.round((advancedCount / total) * 100) : 0,
      averageConfidence: Math.round(avgConfidence)
    };
  }

  /**
   * 모드 최적화 제안
   */
  getOptimizationSuggestions(): string[] {
    const stats = this.getModeStats();
    const suggestions: string[] = [];

    if (stats.totalQueries < 10) {
      suggestions.push('더 많은 질문을 통해 모드 감지 정확도를 향상시킬 수 있습니다.');
    }

    if (stats.averageConfidence < 70) {
      suggestions.push('질문을 더 구체적으로 작성하면 모드 감지 정확도가 향상됩니다.');
    }

    if (stats.advancedModePercentage > 80) {
      suggestions.push('복잡한 질문이 많습니다. 간단한 조회는 기본 모드를 활용해보세요.');
    }

    if (stats.basicModePercentage > 90) {
      suggestions.push('고급 분석 기능을 더 활용해보세요. 상세한 분석이나 예측을 요청해보세요.');
    }

    return suggestions;
  }

  /**
   * 정리 작업
   */
  cleanup(): void {
    this.modeHistory = [];
    console.log('🧹 Enhanced Mode Manager cleanup completed');
  }
} 