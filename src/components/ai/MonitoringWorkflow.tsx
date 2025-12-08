/**
 * 🔄 이상감지/예측 워크플로우 시각화 컴포넌트
 *
 * 기능:
 * - 3단계 워크플로우 시각화 (이상탐지 → 근본원인분석 → 예측모니터링)
 * - 각 단계별 진행 상태 표시
 * - 실행 결과 요약 정보
 */

'use client';

import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import type {
  ExtendedIntelligentAnalysisResult,
  IntelligentAnalysisRequest,
  StepResult,
} from '@/types/intelligent-monitoring.types';

type StepResultWithMeta = StepResult & {
  processingTime?: number;
  confidence?: number;
};

interface WorkflowStep {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  color: string;
  bgColor: string;
  gradient: string;
}

interface MonitoringWorkflowProps {
  isAnalyzing: boolean;
  currentStep: string;
  result: ExtendedIntelligentAnalysisResult | null;
  analysisConfig: IntelligentAnalysisRequest;
  workflowSteps: WorkflowStep[];
  getStatusColor: (status: string) => string;
}

export default function MonitoringWorkflow({
  isAnalyzing,
  currentStep,
  result,
  analysisConfig,
  workflowSteps,
  getStatusColor,
}: MonitoringWorkflowProps) {
  if (!isAnalyzing && !result) {
    return null;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">분석 진행 상황</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{currentStep}</span>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="mb-6 h-2 w-full rounded-full bg-gray-200">
        <div className="h-2 rounded-full bg-linear-to-r from-emerald-500 to-teal-500" />
      </div>

      {/* 3단계 워크플로우 시각화 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {workflowSteps.map((step) => {
          // 타입 안전성을 위한 명시적 타입 가드
          let stepResult: StepResultWithMeta | undefined;

          if (result) {
            switch (step.id) {
              case 'anomalyDetection':
                stepResult = result.anomalyDetection;
                break;
              case 'rootCauseAnalysis':
                stepResult = result.rootCauseAnalysis;
                break;
              case 'predictiveMonitoring':
                stepResult = result.predictiveMonitoring;
                break;
            }
          }

          const isEnabled =
            analysisConfig.includeSteps[
              step.id as keyof typeof analysisConfig.includeSteps
            ];
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`rounded-lg border-2 p-4 transition-all ${
                !isEnabled
                  ? 'border-gray-200 bg-gray-50 opacity-50'
                  : stepResult?.status === 'completed'
                    ? 'border-green-200 bg-green-50'
                    : stepResult?.status === 'failed'
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="mb-2 flex items-center space-x-3">
                <div className={`rounded-lg p-2 ${step.bgColor}`}>
                  <Icon className={`h-5 w-5 ${step.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  {stepResult && (
                    <div className="mt-1 flex items-center space-x-2">
                      {stepResult.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : stepResult.status === 'failed' ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-400" />
                      )}
                      <span
                        className={`text-xs font-medium ${getStatusColor(stepResult.status)}`}
                      >
                        {stepResult.status === 'completed'
                          ? '완료'
                          : stepResult.status === 'failed'
                            ? '실패'
                            : '대기'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <p className="mb-3 text-sm text-gray-600">{step.description}</p>

              {stepResult && stepResult.status === 'completed' && (
                <div className="space-y-2">
                  {typeof stepResult.processingTime === 'number' && (
                    <div className="text-xs text-gray-500">
                      처리 시간: {stepResult.processingTime}
                      ms
                    </div>
                  )}
                  {typeof stepResult.confidence === 'number' && (
                    <div className="text-xs text-gray-500">
                      신뢰도: {Math.round(stepResult.confidence * 100)}%
                    </div>
                  )}
                  {stepResult.summary && (
                    <div className="rounded bg-gray-50 p-2 text-sm text-gray-700">
                      {stepResult.summary}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 워크플로우 단계 정의 (외부에서 사용)
export const defaultWorkflowSteps: WorkflowStep[] = [
  {
    id: 'anomalyDetection',
    title: '이상 탐지',
    icon: AlertTriangle,
    description: 'ML 학습된 패턴으로 실시간 이상 감지',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 'rootCauseAnalysis',
    title: '근본 원인 분석',
    icon: Search,
    description: '다중 AI 엔진과 캐싱된 인사이트로 신속 분석',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'predictiveMonitoring',
    title: '예측적 모니터링',
    icon: TrendingUp,
    description: 'ML 예측 모델로 장애 사전 감지 (95% 정확도)',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    gradient: 'from-purple-500 to-pink-500',
  },
];
