/**
 * 🧠 이상감지/예측 통합 페이지 v3.0
 *
 * 통합 기능:
 * 1. AI 분석: LangGraph Analyst Agent를 통한 이상탐지 및 근본원인 분석
 * 2. 장애 예측: 위험도별 장애 예측 분석 (PredictionPage 통합)
 *
 * v3.0 변경사항 (2025-12-14):
 * - 패턴 학습 탭 제거 (ML API 폐지)
 * - Analyst Agent로 기능 통합 예정
 */

'use client';

import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Cpu,
  HardDrive,
  Monitor,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  Shield,
  Target,
  TrendingUp,
  Wifi,
} from 'lucide-react';
import { createElement, useState } from 'react';
import MonitoringResults from '@/components/ai/MonitoringResults';
import MonitoringWorkflow, {
  defaultWorkflowSteps,
} from '@/components/ai/MonitoringWorkflow';
import type {
  ExtendedIntelligentAnalysisResult,
  IntelligentAnalysisRequest,
} from '@/types/intelligent-monitoring.types';

// ============================================================================
// 타입 정의
// ============================================================================
type TabType = 'analysis' | 'prediction';

interface PredictionData {
  serverId: string;
  serverName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  predictedIssue: string;
  timeToFailure: string;
  confidence: number;
  factors: string[];
}

// ============================================================================
// 상수 정의
// ============================================================================
const TABS = [
  { id: 'analysis' as TabType, label: 'AI 분석', icon: Monitor },
  { id: 'prediction' as TabType, label: '장애 예측', icon: TrendingUp },
];

const MOCK_PREDICTIONS: PredictionData[] = [
  {
    serverId: 'srv-03',
    serverName: 'Server-03',
    riskLevel: 'critical',
    probability: 87,
    predictedIssue: 'CPU 과부하로 인한 서비스 중단',
    timeToFailure: '2시간 내',
    confidence: 92,
    factors: ['CPU 사용률 급증', '메모리 누수 패턴', '응답시간 증가'],
  },
  {
    serverId: 'srv-01',
    serverName: 'Server-01',
    riskLevel: 'high',
    probability: 73,
    predictedIssue: '메모리 부족으로 인한 성능 저하',
    timeToFailure: '6시간 내',
    confidence: 85,
    factors: [
      '메모리 사용률 증가',
      '스왑 사용량 증가',
      '가비지 컬렉션 빈도 증가',
    ],
  },
  {
    serverId: 'srv-07',
    serverName: 'Server-07',
    riskLevel: 'medium',
    probability: 45,
    predictedIssue: '디스크 공간 부족',
    timeToFailure: '24시간 내',
    confidence: 78,
    factors: ['디스크 사용률 증가', '로그 파일 크기 증가'],
  },
  {
    serverId: 'srv-05',
    serverName: 'Server-05',
    riskLevel: 'low',
    probability: 23,
    predictedIssue: '네트워크 지연 증가',
    timeToFailure: '48시간 내',
    confidence: 65,
    factors: ['패킷 손실률 증가', '대역폭 사용률 증가'],
  },
];

// ============================================================================
// 메인 컴포넌트
// ============================================================================
export default function IntelligentMonitoringPage() {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>('analysis');

  // AI 분석 상태 (기존)
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

  // 장애 예측 상태 (PredictionPage 통합)
  const [predictions, setPredictions] =
    useState<PredictionData[]>(MOCK_PREDICTIONS);
  const [isPredictionAnalyzing, setIsPredictionAnalyzing] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(
    new Set()
  );

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
  // 장애 예측 핸들러 (PredictionPage 통합)
  // ============================================================================
  const handlePredictionAnalyze = () => {
    setIsPredictionAnalyzing(true);
    setTimeout(() => {
      setPredictions((prev) =>
        prev.map((p) => ({
          ...p,
          probability: Math.max(
            0,
            Math.min(100, p.probability + (Math.random() - 0.5) * 10)
          ),
          confidence: Math.max(
            50,
            Math.min(100, p.confidence + (Math.random() - 0.5) * 5)
          ),
        }))
      );
      setIsPredictionAnalyzing(false);
    }, 3000);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-green-500 bg-green-50';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Target className="h-5 w-5 text-green-500" />;
    }
  };

  const getFactorIcon = (factor: string) => {
    if (factor.includes('CPU')) return <Cpu className="h-4 w-4" />;
    if (factor.includes('메모리')) return <HardDrive className="h-4 w-4" />;
    if (factor.includes('디스크')) return <HardDrive className="h-4 w-4" />;
    if (factor.includes('네트워크')) return <Wifi className="h-4 w-4" />;
    return <Server className="h-4 w-4" />;
  };

  const filteredPredictions =
    selectedRisk === 'all'
      ? predictions
      : predictions.filter((p) => p.riskLevel === selectedRisk);

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

        {/* 탭 네비게이션 */}
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {createElement(tab.icon, { className: 'h-4 w-4' })}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* AI 분석 탭 */}
        {activeTab === 'analysis' && (
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
                <h3 className="text-lg font-semibold text-gray-900">
                  분석 설정
                </h3>
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
        )}

        {/* 장애 예측 탭 */}
        {activeTab === 'prediction' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {[
                  { id: 'all', label: '전체', count: predictions.length },
                  {
                    id: 'critical',
                    label: '심각',
                    count: predictions.filter((p) => p.riskLevel === 'critical')
                      .length,
                  },
                  {
                    id: 'high',
                    label: '높음',
                    count: predictions.filter((p) => p.riskLevel === 'high')
                      .length,
                  },
                  {
                    id: 'medium',
                    label: '보통',
                    count: predictions.filter((p) => p.riskLevel === 'medium')
                      .length,
                  },
                  {
                    id: 'low',
                    label: '낮음',
                    count: predictions.filter((p) => p.riskLevel === 'low')
                      .length,
                  },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedRisk(filter.id)}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${selectedRisk === filter.id ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 hover:bg-emerald-100'}`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
              <button
                onClick={handlePredictionAnalyze}
                disabled={isPredictionAnalyzing}
                className="flex items-center space-x-2 rounded-lg bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isPredictionAnalyzing ? 'animate-spin' : ''}`}
                />
                <span>{isPredictionAnalyzing ? '분석 중...' : '재분석'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {filteredPredictions.map((prediction) => (
                <div
                  key={prediction.serverId}
                  className={`rounded-lg border-2 p-4 ${getRiskColor(prediction.riskLevel)} ${prediction.riskLevel === 'critical' && !acknowledgedIds.has(prediction.serverId) ? 'animate-pulse ring-2 ring-red-400 ring-offset-2' : ''} ${acknowledgedIds.has(prediction.serverId) ? 'opacity-60' : ''}`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getRiskIcon(prediction.riskLevel)}
                      <div>
                        <h3 className="font-bold text-gray-800">
                          {prediction.serverName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {prediction.predictedIssue}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">
                        {prediction.probability}%
                      </div>
                      <div className="text-xs text-gray-500">발생 확률</div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="mb-1 flex justify-between text-xs text-gray-600">
                      <span>위험도</span>
                      <span>{prediction.confidence}% 신뢰도</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-2 rounded-full ${prediction.riskLevel === 'critical' ? 'bg-red-500' : prediction.riskLevel === 'high' ? 'bg-orange-500' : prediction.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${prediction.probability}%` }}
                      />
                    </div>
                  </div>
                  <div className="mb-3 flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      예상 발생 시간:{' '}
                      <span className="font-medium">
                        {prediction.timeToFailure}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prediction.factors.map((factor, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs"
                      >
                        {getFactorIcon(factor)}
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center space-x-2 border-t border-gray-200 pt-3">
                    {!acknowledgedIds.has(prediction.serverId) && (
                      <button
                        onClick={() =>
                          setAcknowledgedIds(
                            (prev) => new Set([...prev, prediction.serverId])
                          )
                        }
                        className="flex items-center space-x-1 rounded-lg bg-green-100 px-3 py-1.5 text-xs text-green-700 hover:bg-green-200"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>확인</span>
                      </button>
                    )}
                    <button className="flex items-center space-x-1 rounded-lg bg-blue-100 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-200">
                      <Bell className="h-3.5 w-3.5" />
                      <span>알림 설정</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2 rounded-xl border border-gray-200 bg-white p-4 text-center">
              <div>
                <div className="text-lg font-bold text-red-600">
                  {predictions.filter((p) => p.riskLevel === 'critical').length}
                </div>
                <div className="text-xs text-gray-500">심각</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {predictions.filter((p) => p.riskLevel === 'high').length}
                </div>
                <div className="text-xs text-gray-500">높음</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">
                  {predictions.filter((p) => p.riskLevel === 'medium').length}
                </div>
                <div className="text-xs text-gray-500">보통</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {predictions.filter((p) => p.riskLevel === 'low').length}
                </div>
                <div className="text-xs text-gray-500">낮음</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
