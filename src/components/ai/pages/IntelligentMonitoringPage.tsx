/**
 * 🧠 이상감지/예측 통합 페이지
 *
 * 4단계 AI 분석 워크플로우:
 * 1단계: 🚨 실시간 이상 탐지 (ML 강화)
 * 2단계: 🔍 다중 AI 근본 원인 분석
 * 3단계: 🔮 예측적 모니터링 (학습된 패턴 활용)
 * 4단계: 💡 AI 인사이트 자동 분석 (통합)
 */

'use client';

import { Monitor, Pause, Play, RotateCcw, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import MonitoringInsights from '@/components/ai/MonitoringInsights';
import MonitoringResults from '@/components/ai/MonitoringResults';
import MonitoringWorkflow, {
  defaultWorkflowSteps,
} from '@/components/ai/MonitoringWorkflow';
import type {
  ExtendedIntelligentAnalysisResult,
  IntelligentAnalysisRequest,
} from '@/types/intelligent-monitoring.types';
// MLDataManager 제거 - 클라이언트에서 Redis 사용 불가

export default function IntelligentMonitoringPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('준비');

  const [result, setResult] =
    useState<ExtendedIntelligentAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [_lastInsightsRefresh, _setLastInsightsRefresh] = useState<number>(0);

  // ML 강화 상태
  const [showMLInsights, setShowMLInsights] = useState(true);
  const [mlCacheStats, setMlCacheStats] = useState<{
    hitRate: number;
    memorySize: number;
  }>({ hitRate: 0, memorySize: 0 });

  // 분석 설정
  const [analysisConfig, setAnalysisConfig] =
    useState<IntelligentAnalysisRequest>({
      serverId: '',
      analysisDepth: 'standard',
      includeSteps: {
        anomalyDetection: true,
        rootCauseAnalysis: true,
        predictiveMonitoring: true,
      },
    });

  // ML 캐시 통계 로드 (하드코딩 값)
  useEffect(() => {
    // Redis 없이 기본값 사용
    setMlCacheStats({
      hitRate: 0.85,
      memorySize: 256,
    });
  }, []);

  /**
   * 🚀 이상감지/예측 분석 실행
   */
  const runIntelligentAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentStep('분석 시작');
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/ai/intelligent-monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'analyze_server',
          ...analysisConfig,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '분석 실행 실패');
      }

      setResult(data.data);
      setCurrentStep('분석 완료');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      setCurrentStep('오류 발생');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * 🎯 분석 설정 업데이트
   */
  const updateAnalysisConfig = (
    updates: Partial<IntelligentAnalysisRequest>
  ) => {
    setAnalysisConfig((prev) => ({ ...prev, ...updates }));
  };

  /**
   * 🔄 분석 재시작
   */
  const resetAnalysis = () => {
    setResult(null);
    setError(null);
    setCurrentStep('준비');
    setIsAnalyzing(false);
  };

  /**
   * 📊 결과 상태에 따른 색상 반환
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'skipped':
        return 'text-gray-400';
      default:
        return 'text-gray-600';
    }
  };

  /**
   * 🎨 심각도에 따른 색상 반환
   */
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            이상감지/예측
          </h1>

          {/* 실행 버튼들 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={resetAnalysis}
              disabled={isAnalyzing}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              <RotateCcw className="mr-1 inline h-4 w-4" />
              초기화
            </button>

            <button
              onClick={() => {
                void runIntelligentAnalysis();
              }}
              disabled={isAnalyzing}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Pause className="animate-pulse mr-2 inline h-4 w-4" />
                  분석 중...
                </>
              ) : (
                <>
                  <Play className="mr-2 inline h-4 w-4" />
                  분석 시작
                </>
              )}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          4단계 AI 분석: 이상탐지 → 근본원인분석 → 예측모니터링 → AI인사이트
          자동분석
        </p>
      </div>

      {/* AI/ML 인사이트 섹션 */}
      <MonitoringInsights
        showAIInsights={showAIInsights}
        showMLInsights={showMLInsights}
        mlCacheStats={mlCacheStats}
        onCloseAIInsights={() => setShowAIInsights(false)}
        onCloseMLInsights={() => setShowMLInsights(false)}
        onOpenAIInsights={() => setShowAIInsights(true)}
        onOpenMLInsights={() => setShowMLInsights(true)}
      />

      {/* 분석 설정 패널 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">분석 설정</h3>
          <div className="flex items-center space-x-2 text-sm text-emerald-600">
            <Shield className="h-4 w-4" />
            <span>오프라인 모드 지원</span>
          </div>
        </div>

        {/* AI 엔진 상태 표시 */}
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <div className="mb-2 flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium text-emerald-800">
              다중 AI 엔진 폴백 시스템
            </span>
          </div>
          <p className="text-xs text-emerald-700">
            Korean AI → Google AI → Local AI 순서로 폴백하여 항상 분석 결과를
            제공합니다. Google AI가 없어도 완전히 작동합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* 서버 선택 */}
          <div>
            <label
              htmlFor="server-select"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              대상 서버
            </label>
            <select
              id="server-select"
              value={analysisConfig.serverId}
              onChange={(e) =>
                updateAnalysisConfig({ serverId: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              disabled={isAnalyzing}
              aria-label="분석할 대상 서버를 선택하세요"
            >
              <option value="">전체 시스템</option>
              <option value="web-server-01">웹 서버 01</option>
              <option value="web-server-02">웹 서버 02</option>
              <option value="db-server-01">DB 서버 01</option>
              <option value="api-server-01">API 서버 01</option>
            </select>
          </div>

          {/* 분석 깊이 */}
          <div>
            <label
              htmlFor="depth-select"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              분석 깊이
            </label>
            <select
              id="depth-select"
              value={analysisConfig.analysisDepth}
              onChange={(e) =>
                updateAnalysisConfig({
                  analysisDepth: e.target.value as
                    | 'quick'
                    | 'standard'
                    | 'deep',
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              disabled={isAnalyzing}
              aria-label="분석 깊이를 선택하세요"
            >
              <option value="quick">빠른 분석 (30초)</option>
              <option value="standard">표준 분석 (2분)</option>
              <option value="deep">심층 분석 (5분)</option>
            </select>
          </div>

          {/* 분석 단계 선택 */}
          <div>
            <p className="mb-2 block text-sm font-medium text-gray-700">
              포함할 분석 단계
            </p>
            <div className="space-y-2">
              {defaultWorkflowSteps.map((step) => {
                const checkboxId = `workflow-step-${step.id}`;
                return (
                  <label
                    key={step.id}
                    htmlFor={checkboxId}
                    className="flex items-center space-x-2"
                  >
                    <input
                      id={checkboxId}
                      type="checkbox"
                      checked={
                        analysisConfig.includeSteps[
                          step.id as keyof typeof analysisConfig.includeSteps
                        ]
                      }
                      onChange={(e) =>
                        updateAnalysisConfig({
                          includeSteps: {
                            ...analysisConfig.includeSteps,
                            [step.id]: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      disabled={isAnalyzing}
                    />
                    <span className="text-sm text-gray-700">{step.title}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 진행 상황 표시 */}
      <MonitoringWorkflow
        isAnalyzing={isAnalyzing}
        currentStep={currentStep}
        result={result}
        analysisConfig={analysisConfig}
        workflowSteps={defaultWorkflowSteps}
        getStatusColor={getStatusColor}
      />

      {/* 결과 및 오류 표시 */}
      <MonitoringResults
        result={result}
        error={error}
        getSeverityColor={getSeverityColor}
        onRetry={() => void runIntelligentAnalysis()}
        isAnalyzing={isAnalyzing}
        onStartAnalysis={() => void runIntelligentAnalysis()}
      />
    </div>
  );
}
