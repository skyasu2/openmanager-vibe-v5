/**
 * 📊 이상감지/예측 분석 결과 표시 컴포넌트
 *
 * 기능:
 * - 전체 요약 (심각도, 신뢰도, 처리 시간)
 * - 우선순위 조치사항
 * - 단계별 상세 결과 (이상탐지, 근본원인분석, 예측모니터링)
 */

'use client';

import {
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  Search,
  Shield,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import type { ExtendedIntelligentAnalysisResult } from '@/types/intelligent-monitoring.types';

interface MonitoringResultsProps {
  result: ExtendedIntelligentAnalysisResult | null;
  error: string | null;
  getSeverityColor: (severity: string) => string;
  onRetry?: () => void;
  isAnalyzing?: boolean;
  onStartAnalysis?: () => void;
}

export default function MonitoringResults({
  result,
  error,
  getSeverityColor,
  onRetry,
  isAnalyzing = false,
  onStartAnalysis,
}: MonitoringResultsProps) {
  // 오류 표시
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-medium text-red-800">분석 실행 오류</h3>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center space-x-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>다시 시도</span>
            </button>
          )}
        </div>
        <p className="mt-2 text-red-700">{error}</p>
      </div>
    );
  }

  // 🎯 Empty State: 분석 전 상태
  if (!result && !isAnalyzing) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
            <Search className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-800">
            AI 분석 준비 완료
          </h3>
          <p className="mx-auto mb-4 max-w-md text-sm text-gray-600">
            위에서 분석 설정을 확인한 후 &quot;분석 시작&quot; 버튼을 클릭하세요.
            이상탐지, 근본원인분석, 예측모니터링을 자동으로 수행합니다.
          </p>
          <div className="mb-4 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
              🚨 이상 탐지
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              🔍 근본 원인 분석
            </span>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
              🔮 예측 모니터링
            </span>
          </div>
          {onStartAnalysis && (
            <button
              onClick={onStartAnalysis}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg"
            >
              <TrendingUp className="h-4 w-4" />
              분석 시작하기
            </button>
          )}
        </div>
      </div>
    );
  }

  // 분석 중일 때는 표시하지 않음 (Workflow에서 표시)
  if (!result) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        통합 분석 결과
      </h3>

      {/* 전체 요약 */}
      <div
        className={`mb-6 rounded-lg border-2 p-4 ${getSeverityColor(result.overallResult.severity)}`}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span className="font-medium">
              심각도: {result.overallResult.severity.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span>
              신뢰도: {Math.round(result.overallResult.confidence * 100)}%
            </span>
            <span>처리 시간: {result.overallResult.totalProcessingTime}ms</span>
          </div>
        </div>
        <p className="mb-3 text-sm">{result.overallResult.summary}</p>

        {result.overallResult.actionRequired && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">🚨 우선순위 조치사항:</h4>
            <ul className="space-y-1">
              {result.overallResult.priorityActions.map((action, index) => (
                <li key={index} className="flex items-center space-x-2 text-sm">
                  <Target className="h-3 w-3" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 단계별 상세 결과 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 이상 탐지 결과 */}
        {result.anomalyDetection.status === 'completed' && (
          <div className="rounded-lg bg-orange-50 p-4">
            <div className="mb-3 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h4 className="font-medium text-orange-800">이상 탐지 결과</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                감지된 이상: {result.anomalyDetection.anomalies.length}개
              </div>
              <div>
                신뢰도: {Math.round(result.anomalyDetection.confidence * 100)}%
              </div>
              <div className="rounded bg-orange-100 p-2 text-orange-700">
                {result.anomalyDetection.summary}
              </div>
            </div>
          </div>
        )}

        {/* 근본 원인 분석 결과 */}
        {result.rootCauseAnalysis.status === 'completed' && (
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="mb-3 flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-800">근본 원인 분석</h4>
              {result.rootCauseAnalysis.aiInsights.length > 0 && (
                <div className="flex items-center space-x-1 rounded bg-blue-100 px-2 py-1 text-xs">
                  <span>🤖</span>
                  <span>
                    {result.rootCauseAnalysis.aiInsights.length}개 AI 엔진 활용
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div>식별된 원인: {result.rootCauseAnalysis.causes.length}개</div>
              <div>
                AI 인사이트: {result.rootCauseAnalysis.aiInsights.length}개
              </div>
              <div>
                신뢰도: {Math.round(result.rootCauseAnalysis.confidence * 100)}%
              </div>

              {/* AI 엔진별 기여도 표시 */}
              {result.rootCauseAnalysis.aiInsights.length > 0 && (
                <div className="mt-2">
                  <div className="mb-1 text-xs text-blue-600">
                    활용된 AI 엔진:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {result.rootCauseAnalysis.aiInsights.map(
                      (insight, index) => {
                        const insightData = insight as {
                          engine?: string;
                          confidence?: number;
                        };
                        return (
                          <span
                            key={index}
                            className="inline-flex items-center rounded bg-blue-100 px-2 py-1 text-xs text-blue-700"
                          >
                            {insightData.engine || 'Unknown'}
                            <span className="ml-1 text-blue-500">
                              ({Math.round((insightData.confidence || 0) * 100)}
                              %)
                            </span>
                          </span>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              <div className="rounded bg-blue-100 p-2 text-blue-700">
                {result.rootCauseAnalysis.summary}
              </div>
            </div>
          </div>
        )}

        {/* 예측적 모니터링 결과 */}
        {result.predictiveMonitoring.status === 'completed' && (
          <div className="rounded-lg bg-purple-50 p-4">
            <div className="mb-3 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-purple-800">예측적 모니터링</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                예측 결과: {result.predictiveMonitoring.predictions.length}개
              </div>
              <div>
                권장사항: {result.predictiveMonitoring.recommendations.length}개
              </div>
              <div>
                신뢰도:{' '}
                {Math.round(result.predictiveMonitoring.confidence * 100)}%
              </div>
              <div className="rounded bg-purple-100 p-2 text-purple-700">
                {result.predictiveMonitoring.summary}
              </div>
              {result.predictiveMonitoring.recommendations.length > 0 && (
                <div className="mt-3">
                  <h5 className="mb-1 font-medium text-purple-800">
                    💡 권장사항:
                  </h5>
                  <ul className="space-y-1">
                    {result.predictiveMonitoring.recommendations.map(
                      (rec, index) => (
                        <li
                          key={index}
                          className="flex items-center space-x-1 text-xs"
                        >
                          <Lightbulb className="h-3 w-3" />
                          <span>{rec}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
