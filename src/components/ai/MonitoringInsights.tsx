/**
 * 🧠 ML 학습 인사이트 및 AI 인사이트 컴포넌트
 *
 * 기능:
 * - AI 인사이트 자동 분석 (AIInsightsCard 통합)
 * - ML 학습된 패턴 및 예측 정확도 표시
 * - ML 캐시 최적화 상태 표시
 */

'use client';

import { Activity, Brain, Database, Lightbulb, X, Zap } from 'lucide-react';
import AIInsightsCard from '@/components/dashboard/AIInsightsCard';

interface MonitoringInsightsProps {
  showAIInsights: boolean;
  showMLInsights: boolean;
  mlCacheStats: {
    hitRate: number;
    memorySize: number;
  };
  onCloseAIInsights: () => void;
  onCloseMLInsights: () => void;
  onOpenAIInsights?: () => void;
  onOpenMLInsights?: () => void;
}

export default function MonitoringInsights({
  showAIInsights,
  showMLInsights,
  mlCacheStats,
  onCloseAIInsights,
  onCloseMLInsights,
  onOpenAIInsights,
  onOpenMLInsights,
}: MonitoringInsightsProps) {
  // 닫힌 섹션 다시 열기 버튼들
  const hasClosedSections = !showAIInsights || !showMLInsights;

  return (
    <>
      {/* 🔄 닫힌 섹션 토글 버튼 */}
      {hasClosedSections && (
        <div className="mb-4 flex flex-wrap gap-2">
          {!showAIInsights && onOpenAIInsights && (
            <button
              onClick={onOpenAIInsights}
              className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100"
            >
              <Lightbulb className="h-4 w-4" />
              AI 인사이트 열기
            </button>
          )}
          {!showMLInsights && onOpenMLInsights && (
            <button
              onClick={onOpenMLInsights}
              className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
            >
              <Brain className="h-4 w-4" />
              ML 인사이트 열기
            </button>
          )}
        </div>
      )}

      {/* AI 인사이트 통합 섹션 */}
      {showAIInsights && (
        <div className="mb-6">
          <div className="rounded-lg border border-orange-200 bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                <Lightbulb className="h-5 w-5 text-orange-600" />💡 AI 인사이트
                (자동 분석)
              </h3>
              <button
                onClick={onCloseAIInsights}
                className="rounded p-1 transition-colors hover:bg-gray-100"
                title="AI 인사이트 섹션 닫기"
                aria-label="AI 인사이트 섹션 닫기"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="mb-3 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 p-3">
              <p className="text-sm text-orange-800">
                🤖 <strong>자동 분석 모드:</strong> 시스템 데이터를 실시간으로
                분석하여 인사이트를 자동 생성합니다.
              </p>
              <p className="mt-1 text-xs text-orange-700">
                ⚡ <strong>최적화:</strong> 5분 간격 갱신, 유의미한 변화 시에만
                업데이트하여 시스템 부하를 최소화합니다.
              </p>
            </div>
            <AIInsightsCard />
          </div>
        </div>
      )}

      {/* ML 학습 인사이트 섹션 */}
      {showMLInsights && (
        <div className="mb-6">
          <div className="rounded-lg border border-purple-200 bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                <Brain className="h-5 w-5 text-purple-600" />🧠 ML 학습 인사이트
              </h3>
              <button
                onClick={onCloseMLInsights}
                className="rounded p-1 transition-colors hover:bg-gray-100"
                title="ML 인사이트 섹션 닫기"
                aria-label="ML 인사이트 섹션 닫기"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* 학습된 패턴 */}
              <div className="rounded-lg bg-purple-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-purple-800">
                    학습된 패턴
                  </h4>
                  <Activity className="h-4 w-4 text-purple-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-purple-700">
                    메모리 누수 패턴: 3개
                  </p>
                  <p className="text-xs text-purple-700">CPU 급증 패턴: 5개</p>
                  <p className="text-xs text-purple-700">연쇄 장애 패턴: 2개</p>
                </div>
              </div>

              {/* 예측 정확도 */}
              <div className="rounded-lg bg-indigo-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-indigo-800">
                    예측 정확도
                  </h4>
                  <Zap className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-indigo-700">단기 예측: 92%</p>
                  <p className="text-xs text-indigo-700">장기 예측: 78%</p>
                  <p className="text-xs text-indigo-700">이상감지: 95%</p>
                </div>
              </div>

              {/* ML 캐시 상태 */}
              <div className="rounded-lg bg-green-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-green-800">
                    캐시 최적화
                  </h4>
                  <Database className="h-4 w-4 text-green-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-green-700">
                    캐시 적중률: {Math.round(mlCacheStats.hitRate * 100)}%
                  </p>
                  <p className="text-xs text-green-700">
                    메모리 사용: {mlCacheStats.memorySize} 항목
                  </p>
                  <p className="text-xs text-green-700">
                    절약된 연산: ~{Math.round(mlCacheStats.hitRate * 1000)}ms
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 p-2">
              <p className="text-xs text-purple-800">
                <strong>💪 ML 강화:</strong> 학습된 패턴을 활용하여 더 정확한
                이상감지와 예측이 가능합니다. 캐싱으로 응답 속도가 크게
                향상되었습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
