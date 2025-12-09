/**
 * 🧠 이상감지/예측 통합 페이지 v2.0
 *
 * 통합 기능:
 * 1. AI 분석: 4단계 이상탐지→근본원인→예측모니터링→AI인사이트
 * 2. 장애 예측: 위험도별 장애 예측 분석 (PredictionPage 통합)
 * 3. 패턴 학습: ML 패턴 학습 기능 (MLLearningCenter 통합)
 */

'use client';

import {
  AlertTriangle,
  BarChart3,
  Bell,
  Brain,
  CheckCircle,
  Clock,
  Cpu,
  Eye,
  HardDrive,
  Loader2,
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
  Zap,
} from 'lucide-react';
import { createElement, useCallback, useEffect, useState } from 'react';
import MonitoringInsights from '@/components/ai/MonitoringInsights';
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
type TabType = 'analysis' | 'prediction' | 'patterns';

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

interface LearningProgress {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  currentStep: string;
  timeElapsed: number;
  estimatedTimeRemaining?: number;
}

interface LearningResult {
  patternsLearned?: number;
  accuracyImprovement?: number;
  confidence?: number;
  insights?: string[];
  nextRecommendation?: string;
  timestamp: Date;
}

// ============================================================================
// 상수 정의
// ============================================================================
const TABS = [
  { id: 'analysis' as TabType, label: 'AI 분석', icon: Monitor },
  { id: 'prediction' as TabType, label: '장애 예측', icon: TrendingUp },
  { id: 'patterns' as TabType, label: '패턴 학습', icon: Brain },
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
  const [showMLInsights, setShowMLInsights] = useState(true);
  const [mlCacheStats, setMlCacheStats] = useState<{
    hitRate: number;
    memorySize: number;
  }>({ hitRate: 0, memorySize: 0 });
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

  // 패턴 학습 상태 (MLLearningCenter 통합)
  const [learningProgress, setLearningProgress] = useState<LearningProgress>({
    status: 'idle',
    progress: 0,
    currentStep: '',
    timeElapsed: 0,
  });
  const [learningResult, setLearningResult] = useState<LearningResult | null>(
    null
  );

  // ML 캐시 통계 로드
  useEffect(() => {
    setMlCacheStats({ hitRate: 0.85, memorySize: 256 });
  }, []);

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
  // 패턴 학습 핸들러 (MLLearningCenter 통합)
  // ============================================================================
  const getStepDescription = useCallback((progress: number): string => {
    if (progress < 20) return '데이터 수집 중...';
    if (progress < 40) return '패턴 분석 중...';
    if (progress < 60) return '모델 훈련 중...';
    if (progress < 80) return '검증 중...';
    if (progress < 100) return '결과 생성 중...';
    return '학습 완료!';
  }, []);

  const startPatternLearning = useCallback(async () => {
    if (learningProgress.status === 'running') return;

    setLearningProgress({
      status: 'running',
      progress: 0,
      currentStep: getStepDescription(0),
      timeElapsed: 0,
    });

    const startTime = Date.now();
    const progressTimer = setInterval(() => {
      setLearningProgress((prev) => {
        const newProgress = Math.min(prev.progress + 10, 90);
        return {
          ...prev,
          progress: newProgress,
          currentStep: getStepDescription(newProgress),
          timeElapsed: Date.now() - startTime,
          estimatedTimeRemaining:
            newProgress > 0
              ? (100 - newProgress) * ((Date.now() - startTime) / newProgress)
              : undefined,
        };
      });
    }, 500);

    try {
      const response = await fetch('/api/ai/ml/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'patterns',
          timeRange: '24h',
          config: { sensitivity: 'medium' },
        }),
      });

      if (!response.ok) throw new Error(`API 오류: ${response.status}`);
      const data = await response.json();
      if (!data.success || !data.result)
        throw new Error(data.error || '학습 결과가 없습니다.');

      clearInterval(progressTimer);
      setLearningProgress({
        status: 'completed',
        progress: 100,
        currentStep: '학습 완료!',
        timeElapsed: Date.now() - startTime,
      });
      setLearningResult({
        patternsLearned: data.result.patternsLearned,
        accuracyImprovement: data.result.accuracyImprovement,
        confidence: data.result.confidence,
        insights: data.result.insights,
        nextRecommendation: data.result.nextRecommendation,
        timestamp: new Date(data.result.timestamp),
      });
    } catch (error) {
      clearInterval(progressTimer);
      setLearningProgress((prev) => ({
        ...prev,
        status: 'error',
        currentStep: error instanceof Error ? error.message : '학습 실패',
      }));
    }
  }, [learningProgress.status, getStepDescription]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}분 ${seconds % 60}초` : `${seconds}초`;
  };

  // ============================================================================
  // 렌더링
  // ============================================================================
  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 헤더 */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500">
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
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50"
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

            <MonitoringInsights
              showMLInsights={showMLInsights}
              mlCacheStats={mlCacheStats}
              onCloseMLInsights={() => setShowMLInsights(false)}
              onOpenMLInsights={() => setShowMLInsights(true)}
            />

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

        {/* 패턴 학습 탭 */}
        {activeTab === 'patterns' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
              <div className="mb-2 flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                <span className="text-sm font-medium text-indigo-800">
                  ML 패턴 학습 시스템
                </span>
              </div>
              <p className="text-xs text-indigo-700">
                실제 Supabase 데이터를 기반으로 패턴 분석을 학습합니다. GCP
                Cloud Functions와 연동되어 고급 ML 처리를 수행합니다.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 p-3">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  {learningProgress.status === 'running' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  )}
                  {learningProgress.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {learningProgress.status === 'error' && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
              <h3 className="mb-1 font-semibold text-gray-800">
                패턴 학습 시작
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                서버 메트릭 패턴을 분석하고 학습합니다
              </p>

              {(learningProgress.status === 'running' ||
                learningProgress.status === 'completed' ||
                learningProgress.status === 'error') && (
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{learningProgress.currentStep}</span>
                    <span>{learningProgress.progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${learningProgress.status === 'error' ? 'bg-red-500' : learningProgress.status === 'completed' ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}
                      style={{ width: `${learningProgress.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      <Clock className="mr-1 inline h-3 w-3" />
                      {formatTime(learningProgress.timeElapsed)}
                    </span>
                    {learningProgress.estimatedTimeRemaining &&
                      learningProgress.status === 'running' && (
                        <span>
                          남은 시간: ~
                          {formatTime(learningProgress.estimatedTimeRemaining)}
                        </span>
                      )}
                  </div>
                </div>
              )}

              <button
                onClick={() => void startPatternLearning()}
                disabled={learningProgress.status === 'running'}
                className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-all ${learningProgress.status === 'running' ? 'cursor-not-allowed bg-gray-100 text-gray-400' : learningProgress.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-200' : learningProgress.status === 'error' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'}`}
              >
                {learningProgress.status === 'running' ? (
                  '학습 중...'
                ) : learningProgress.status === 'completed' ? (
                  <>
                    <Play className="mr-1 inline h-4 w-4" />
                    재학습
                  </>
                ) : learningProgress.status === 'error' ? (
                  <>
                    <RotateCcw className="mr-1 inline h-4 w-4" />
                    다시 시도
                  </>
                ) : (
                  <>
                    <Play className="mr-1 inline h-4 w-4" />
                    학습 시작
                  </>
                )}
              </button>
            </div>

            {learningResult && (
              <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    학습 결과
                  </h3>
                  <button
                    onClick={() => setLearningResult(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-white p-4">
                    <div className="mb-1 text-sm text-gray-600">
                      발견한 패턴
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {learningResult.patternsLearned}개
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-4">
                    <div className="mb-1 text-sm text-gray-600">
                      정확도 향상
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      +{learningResult.accuracyImprovement}%
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-4">
                    <div className="mb-1 text-sm text-gray-600">신뢰도</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {((learningResult.confidence || 0) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                {learningResult.insights && (
                  <div className="mb-4">
                    <h4 className="mb-2 font-medium text-gray-700">
                      주요 인사이트
                    </h4>
                    <ul className="space-y-1">
                      {learningResult.insights.map((insight, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-600"
                        >
                          <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {learningResult.nextRecommendation && (
                  <div className="rounded-lg bg-blue-100 p-3">
                    <p className="text-sm text-blue-800">
                      <strong>다음 권장사항:</strong>{' '}
                      {learningResult.nextRecommendation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!learningResult && learningProgress.status === 'idle' && (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
                  <Brain className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-800">
                  ML 학습 준비 완료
                </h3>
                <p className="mx-auto mb-4 max-w-md text-sm text-gray-600">
                  위의 학습 버튼을 클릭하여 서버 모니터링 데이터 패턴을
                  학습하세요. 학습된 패턴은 이상 감지 및 예측의 정확도를
                  향상시킵니다.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
