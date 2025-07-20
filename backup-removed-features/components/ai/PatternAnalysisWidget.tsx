/**
 * 🤖 AI 패턴 분석 위젯 - Phase 1 연동
 * 
 * ✅ 기능:
 * - AI 에이전트와 PatternMatcher 연동
 * - 실시간 패턴 분석 결과 표시
 * - AI 기반 추천 및 해석
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Brain, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Eye
} from 'lucide-react';
import { useSystemIntegration } from '@/hooks/useSystemIntegration';

interface PatternAnalysisWidgetProps {
  className?: string;
  showAIInsights?: boolean;
}

interface PatternInsight {
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  aiRecommendation: string;
  trend: 'improving' | 'stable' | 'degrading';
}

export const PatternAnalysisWidget: React.FC<PatternAnalysisWidgetProps> = ({
  className = '',
  showAIInsights = true
}) => {
  const systemIntegration = useSystemIntegration();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<PatternInsight[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  /**
   * 🔍 패턴 분석 실행
   */
  const runPatternAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await systemIntegration.triggerPatternAnalysis();
      
      if (result) {
        // AI 기반 인사이트 생성 (시뮬레이션)
        const mockInsights: PatternInsight[] = [
          {
            pattern: 'CPU 사용률 급증',
            severity: 'high',
            confidence: 0.87,
            aiRecommendation: '스케일링을 통한 부하 분산을 권장합니다',
            trend: 'degrading'
          },
          {
            pattern: '메모리 누수 패턴',
            severity: 'medium',
            confidence: 0.73,
            aiRecommendation: '가비지 컬렉션 최적화가 필요합니다',
            trend: 'stable'
          },
          {
            pattern: '네트워크 지연 증가',
            severity: 'low',
            confidence: 0.65,
            aiRecommendation: 'CDN 캐시 설정을 검토해보세요',
            trend: 'improving'
          }
        ];
        
        setInsights(mockInsights);
        setLastAnalysis(new Date());
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * 🎨 심각도별 스타일
   */
  const getSeverityStyles = (severity: PatternInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  /**
   * 🎭 트렌드 아이콘
   */
  const getTrendIcon = (trend: PatternInsight['trend']) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'degrading':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable':
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  // 실시간 상태 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      if (systemIntegration.patternMatcher.isActive && systemIntegration.patternMatcher.lastAnalysis) {
        setLastAnalysis(systemIntegration.patternMatcher.lastAnalysis);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [systemIntegration]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI 패턴 분석
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Phase 1 PatternMatcher + AI 인사이트
            </p>
          </div>
        </div>

        <button
          onClick={runPatternAnalysis}
          disabled={isAnalyzing || !systemIntegration.patternMatcher.isActive}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {isAnalyzing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          <span>{isAnalyzing ? '분석 중...' : '분석 실행'}</span>
        </button>
      </div>

      {/* 시스템 상태 */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {systemIntegration.patternMatcher.activeRules}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">활성 룰</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {systemIntegration.patternMatcher.detectedAnomalies}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">감지된 이상</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {systemIntegration.patternMatcher.averageProcessingTime}ms
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">평균 처리시간</div>
          </div>
        </div>
      </div>

      {/* AI 인사이트 */}
      {showAIInsights && insights.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            AI 인사이트
          </h4>
          
          <div className="space-y-3">
            <AnimatePresence>
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${getSeverityStyles(insight.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(insight.trend)}
                      <span className="font-medium">{insight.pattern}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded-full">
                        신뢰도 {Math.round(insight.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm opacity-90">
                    💡 {insight.aiRecommendation}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* 마지막 분석 시간 */}
      {lastAnalysis && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>마지막 분석:</span>
            <span>{lastAnalysis.toLocaleTimeString('ko-KR')}</span>
          </div>
        </div>
      )}

      {/* 패턴 매칭 비활성화 상태 */}
      {!systemIntegration.patternMatcher.isActive && (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 mb-2">
            <AlertTriangle className="w-8 h-8 mx-auto" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            PatternMatcher가 비활성화되어 있습니다
          </p>
          <button
            onClick={() => systemIntegration.initializeSystem()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            시스템 활성화
          </button>
        </div>
      )}
    </div>
  );
};

export default PatternAnalysisWidget; 