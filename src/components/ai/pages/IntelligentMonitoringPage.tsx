/**
 * 🧠 AI 분석 페이지 v4.0
 *
 * 기능:
 * - LangGraph Analyst Agent를 통한 이상탐지 및 근본원인 분석
 *
 * v4.0 변경사항 (2025-12-23):
 * - 장애 예측 탭 제거 (MOCK 데이터만 사용하여 실제 동작 안함)
 * - 복잡한 예측은 자연어 질의로 통합 (AI 사이드바에서 "장애 예측해줘" 요청)
 */

'use client';

import { Monitor, Pause, Play, RotateCcw, Shield } from 'lucide-react';
import { useState } from 'react';
import MonitoringResults from '@/components/ai/MonitoringResults';
import MonitoringWorkflow, {
  defaultWorkflowSteps,
} from '@/components/ai/MonitoringWorkflow';
import type {
  ExtendedIntelligentAnalysisResult,
  IntelligentAnalysisRequest,
} from '@/types/intelligent-monitoring.types';

// ============================================================================
// 메인 컴포넌트
// ============================================================================
export default function IntelligentMonitoringPage() {
  // AI 분석 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('준비');
  const [result, setResult] =
    useState<ExtendedIntelligentAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  // ============================================================================
  // AI 분석 핸들러 (기존)
  // ============================================================================
  const runIntelligentAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentStep('분석 시작');
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/ai/intelligent-monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_server', ...analysisConfig }),
      });

      if (!response.ok) throw new Error(`API 요청 실패: ${response.status}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.error || '분석 실행 실패');

      setResult(data.data);
      setCurrentStep('분석 완료');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setCurrentStep('오류 발생');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateAnalysisConfig = (
    updates: Partial<IntelligentAnalysisRequest>
  ) => {
    setAnalysisConfig((prev) => ({ ...prev, ...updates }));
  };

  const resetAnalysis = () => {
    setResult(null);
    setError(null);
    setCurrentStep('준비');
    setIsAnalyzing(false);
  };

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

  // ============================================================================
  // 렌더링
  // ============================================================================
  return (
    <div className="flex h-full flex-col bg-linear-to-br from-slate-50 to-blue-50">
      {/* 헤더 */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-r from-emerald-500 to-teal-500">
              <Monitor className="h-5 w-5 text-white" />
            </div>
            이상감지/예측
          </h1>
        </div>
      </div>

      {/* 분석 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={resetAnalysis}
              disabled={isAnalyzing}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50"
            >
              <RotateCcw className="mr-1 inline h-4 w-4" />
              초기화
            </button>
            <button
              onClick={() => void runIntelligentAnalysis()}
              disabled={isAnalyzing}
              className="rounded-lg bg-linear-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50"
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

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">분석 설정</h3>
              <div className="flex items-center space-x-2 text-sm text-emerald-600">
                <Shield className="h-4 w-4" />
                <span>오프라인 모드 지원</span>
              </div>
            </div>
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="mb-2 flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-medium text-emerald-800">
                  다중 AI 엔진 폴백 시스템
                </span>
              </div>
              <p className="text-xs text-emerald-700">
                Korean AI → Google AI → Local AI 순서로 폴백하여 항상 분석
                결과를 제공합니다.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
                >
                  <option value="">전체 시스템</option>
                  <option value="web-server-01">웹 서버 01</option>
                  <option value="web-server-02">웹 서버 02</option>
                  <option value="db-server-01">DB 서버 01</option>
                </select>
              </div>
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
                >
                  <option value="quick">빠른 분석 (30초)</option>
                  <option value="standard">표준 분석 (2분)</option>
                  <option value="deep">심층 분석 (5분)</option>
                </select>
              </div>
              <div>
                <p className="mb-2 block text-sm font-medium text-gray-700">
                  포함할 분석 단계
                </p>
                <div className="space-y-2">
                  {defaultWorkflowSteps.map((step) => (
                    <label
                      key={step.id}
                      htmlFor={`step-${step.id}`}
                      className="flex items-center space-x-2"
                    >
                      <input
                        id={`step-${step.id}`}
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
                      <span className="text-sm text-gray-700">
                        {step.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <MonitoringWorkflow
            isAnalyzing={isAnalyzing}
            currentStep={currentStep}
            result={result}
            analysisConfig={analysisConfig}
            workflowSteps={defaultWorkflowSteps}
            getStatusColor={getStatusColor}
          />
          <MonitoringResults
            result={result}
            error={error}
            getSeverityColor={getSeverityColor}
            onRetry={() => void runIntelligentAnalysis()}
            isAnalyzing={isAnalyzing}
            onStartAnalysis={() => void runIntelligentAnalysis()}
          />
        </div>
      </div>
    </div>
  );
}
