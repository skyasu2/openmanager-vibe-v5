/**
 * 🧠 지능형 모니터링 통합 페이지
 *
 * 3단계 AI 분석 워크플로우:
 * 1단계: 🚨 실시간 이상 탐지
 * 2단계: 🔍 다중 AI 근본 원인 분석
 * 3단계: 🔮 예측적 모니터링
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Monitor,
  AlertTriangle,
  Search,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Target,
  Lightbulb,
} from 'lucide-react';

interface IntelligentAnalysisRequest {
  serverId?: string;
  analysisDepth: 'quick' | 'standard' | 'deep';
  includeSteps: {
    anomalyDetection: boolean;
    rootCauseAnalysis: boolean;
    predictiveMonitoring: boolean;
  };
}

interface StepResult {
  status: 'completed' | 'failed' | 'skipped';
  summary: string;
  confidence: number;
  processingTime: number;
}

interface AnomalyDetectionResult extends StepResult {
  anomalies: any[];
}

interface RootCauseAnalysisResult extends StepResult {
  causes: any[];
  aiInsights: any[];
}

interface PredictiveMonitoringResult extends StepResult {
  predictions: any[];
  recommendations: string[];
}

interface IntelligentAnalysisResult {
  analysisId: string;
  timestamp: string;
  request: IntelligentAnalysisRequest;
  anomalyDetection: AnomalyDetectionResult;
  rootCauseAnalysis: RootCauseAnalysisResult;
  predictiveMonitoring: PredictiveMonitoringResult;
  overallResult: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    actionRequired: boolean;
    priorityActions: string[];
    summary: string;
    confidence: number;
    totalProcessingTime: number;
  };
}

export default function IntelligentMonitoringPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('준비');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<IntelligentAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // 3단계 워크플로우 정의
  const workflowSteps = [
    {
      id: 'anomalyDetection',
      title: '이상 탐지',
      icon: AlertTriangle,
      description: '실시간 메트릭 분석으로 비정상 패턴 식별',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      id: 'rootCauseAnalysis',
      title: '근본 원인 분석',
      icon: Search,
      description: '다중 AI 엔진 협업으로 장애 원인 추적',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      gradient: 'from-blue-500 to-indigo-500',
    },
    {
      id: 'predictiveMonitoring',
      title: '예측적 모니터링',
      icon: TrendingUp,
      description: '패턴 분석을 통한 장애 사전 감지',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  /**
   * 🚀 지능형 모니터링 분석 실행
   */
  const runIntelligentAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setCurrentStep('분석 시작');
    setResult(null);
    setError(null);

    try {
      console.log('🧠 지능형 모니터링 분석 시작', analysisConfig);

      const response = await fetch('/api/ai/intelligent-monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisConfig),
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '분석 실행 실패');
      }

      setResult(data.data);
      setProgress(100);
      setCurrentStep('분석 완료');

      console.log('✅ 지능형 모니터링 분석 완료', data.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류';
      setError(errorMessage);
      setCurrentStep('오류 발생');
      console.error('❌ 지능형 모니터링 분석 실패:', err);
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
    setAnalysisConfig(prev => ({ ...prev, ...updates }));
  };

  /**
   * 🔄 분석 재시작
   */
  const resetAnalysis = () => {
    setResult(null);
    setError(null);
    setProgress(0);
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
    <div className='h-full flex flex-col space-y-6'>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <div className='p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg'>
            <Monitor className='w-6 h-6 text-white' />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>
              지능형 모니터링
            </h1>
            <p className='text-sm text-gray-600'>
              3단계 AI 분석 워크플로우로 시스템을 종합 진단합니다
            </p>
          </div>
        </div>

        <div className='flex items-center space-x-2'>
          <motion.button
            onClick={resetAnalysis}
            disabled={isAnalyzing}
            className='px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50'
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className='w-4 h-4 mr-1 inline' />
            초기화
          </motion.button>

          <motion.button
            onClick={runIntelligentAnalysis}
            disabled={isAnalyzing}
            className='px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50'
            whileTap={{ scale: 0.95 }}
          >
            {isAnalyzing ? (
              <>
                <Pause className='w-4 h-4 mr-2 inline animate-pulse' />
                분석 중...
              </>
            ) : (
              <>
                <Play className='w-4 h-4 mr-2 inline' />
                분석 시작
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* 분석 설정 패널 */}
      <div className='bg-white rounded-xl border border-gray-200 p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>분석 설정</h3>
          <div className='flex items-center space-x-2 text-sm text-emerald-600'>
            <Shield className='w-4 h-4' />
            <span>오프라인 모드 지원</span>
          </div>
        </div>

        {/* AI 엔진 상태 표시 */}
        <div className='mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200'>
          <div className='flex items-center space-x-2 mb-2'>
            <div className='w-2 h-2 bg-emerald-500 rounded-full'></div>
            <span className='text-sm font-medium text-emerald-800'>
              다중 AI 엔진 폴백 시스템
            </span>
          </div>
          <p className='text-xs text-emerald-700'>
            Korean AI → Google AI → Local AI 순서로 폴백하여 항상 분석 결과를
            제공합니다. Google AI가 없어도 완전히 작동합니다.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* 서버 선택 */}
          <div>
            <label
              htmlFor='server-select'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              대상 서버
            </label>
            <select
              id='server-select'
              value={analysisConfig.serverId}
              onChange={e => updateAnalysisConfig({ serverId: e.target.value })}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
              disabled={isAnalyzing}
              aria-label='분석할 대상 서버를 선택하세요'
            >
              <option value=''>전체 시스템</option>
              <option value='web-server-01'>웹 서버 01</option>
              <option value='web-server-02'>웹 서버 02</option>
              <option value='db-server-01'>DB 서버 01</option>
              <option value='api-server-01'>API 서버 01</option>
            </select>
          </div>

          {/* 분석 깊이 */}
          <div>
            <label
              htmlFor='depth-select'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              분석 깊이
            </label>
            <select
              id='depth-select'
              value={analysisConfig.analysisDepth}
              onChange={e =>
                updateAnalysisConfig({
                  analysisDepth: e.target.value as
                    | 'quick'
                    | 'standard'
                    | 'deep',
                })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
              disabled={isAnalyzing}
              aria-label='분석 깊이를 선택하세요'
            >
              <option value='quick'>빠른 분석 (30초)</option>
              <option value='standard'>표준 분석 (2분)</option>
              <option value='deep'>심층 분석 (5분)</option>
            </select>
          </div>

          {/* 분석 단계 선택 */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              포함할 분석 단계
            </label>
            <div className='space-y-2'>
              {workflowSteps.map(step => (
                <label key={step.id} className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    checked={
                      analysisConfig.includeSteps[
                        step.id as keyof typeof analysisConfig.includeSteps
                      ]
                    }
                    onChange={e =>
                      updateAnalysisConfig({
                        includeSteps: {
                          ...analysisConfig.includeSteps,
                          [step.id]: e.target.checked,
                        },
                      })
                    }
                    className='rounded border-gray-300 text-emerald-600 focus:ring-emerald-500'
                    disabled={isAnalyzing}
                  />
                  <span className='text-sm text-gray-700'>{step.title}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 진행 상황 표시 */}
      {(isAnalyzing || result || error) && (
        <div className='bg-white rounded-xl border border-gray-200 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-gray-900'>
              분석 진행 상황
            </h3>
            <div className='flex items-center space-x-2 text-sm text-gray-600'>
              <Clock className='w-4 h-4' />
              <span>{currentStep}</span>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className='w-full bg-gray-200 rounded-full h-2 mb-6'>
            <motion.div
              className='bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full'
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* 3단계 워크플로우 시각화 */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {workflowSteps.map((step, index) => {
              // 타입 안전성을 위한 명시적 타입 가드
              let stepResult: StepResult | undefined;

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
                <motion.div
                  key={step.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    !isEnabled
                      ? 'bg-gray-50 border-gray-200 opacity-50'
                      : stepResult?.status === 'completed'
                        ? 'bg-green-50 border-green-200'
                        : stepResult?.status === 'failed'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className='flex items-center space-x-3 mb-2'>
                    <div className={`p-2 rounded-lg ${step.bgColor}`}>
                      <Icon className={`w-5 h-5 ${step.color}`} />
                    </div>
                    <div className='flex-1'>
                      <h4 className='font-medium text-gray-900'>
                        {step.title}
                      </h4>
                      {stepResult && (
                        <div className='flex items-center space-x-2 mt-1'>
                          {stepResult.status === 'completed' ? (
                            <CheckCircle className='w-4 h-4 text-green-600' />
                          ) : stepResult.status === 'failed' ? (
                            <XCircle className='w-4 h-4 text-red-600' />
                          ) : (
                            <Clock className='w-4 h-4 text-gray-400' />
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
                  <p className='text-sm text-gray-600 mb-3'>
                    {step.description}
                  </p>

                  {stepResult && stepResult.status === 'completed' && (
                    <div className='space-y-2'>
                      <div className='text-xs text-gray-500'>
                        처리 시간: {stepResult.processingTime}ms
                      </div>
                      <div className='text-xs text-gray-500'>
                        신뢰도: {Math.round(stepResult.confidence * 100)}%
                      </div>
                      {stepResult.summary && (
                        <div className='text-sm text-gray-700 bg-gray-50 p-2 rounded'>
                          {stepResult.summary}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 오류 표시 */}
      {error && (
        <motion.div
          className='bg-red-50 border border-red-200 rounded-xl p-4'
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className='flex items-center space-x-2'>
            <XCircle className='w-5 h-5 text-red-600' />
            <h3 className='font-medium text-red-800'>분석 실행 오류</h3>
          </div>
          <p className='text-red-700 mt-2'>{error}</p>
        </motion.div>
      )}

      {/* 통합 결과 표시 */}
      {result && (
        <motion.div
          className='bg-white rounded-xl border border-gray-200 p-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            통합 분석 결과
          </h3>

          {/* 전체 요약 */}
          <div
            className={`p-4 rounded-lg border-2 mb-6 ${getSeverityColor(result.overallResult.severity)}`}
          >
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center space-x-2'>
                <Shield className='w-5 h-5' />
                <span className='font-medium'>
                  심각도: {result.overallResult.severity.toUpperCase()}
                </span>
              </div>
              <div className='flex items-center space-x-4 text-sm'>
                <span>
                  신뢰도: {Math.round(result.overallResult.confidence * 100)}%
                </span>
                <span>
                  처리 시간: {result.overallResult.totalProcessingTime}ms
                </span>
              </div>
            </div>
            <p className='text-sm mb-3'>{result.overallResult.summary}</p>

            {result.overallResult.actionRequired && (
              <div className='space-y-2'>
                <h4 className='font-medium text-sm'>🚨 우선순위 조치사항:</h4>
                <ul className='space-y-1'>
                  {result.overallResult.priorityActions.map((action, index) => (
                    <li
                      key={index}
                      className='text-sm flex items-center space-x-2'
                    >
                      <Target className='w-3 h-3' />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 단계별 상세 결과 */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* 이상 탐지 결과 */}
            {result.anomalyDetection.status === 'completed' && (
              <div className='bg-orange-50 rounded-lg p-4'>
                <div className='flex items-center space-x-2 mb-3'>
                  <AlertTriangle className='w-5 h-5 text-orange-600' />
                  <h4 className='font-medium text-orange-800'>
                    이상 탐지 결과
                  </h4>
                </div>
                <div className='space-y-2 text-sm'>
                  <div>
                    감지된 이상: {result.anomalyDetection.anomalies.length}개
                  </div>
                  <div>
                    신뢰도:{' '}
                    {Math.round(result.anomalyDetection.confidence * 100)}%
                  </div>
                  <div className='text-orange-700 bg-orange-100 p-2 rounded'>
                    {result.anomalyDetection.summary}
                  </div>
                </div>
              </div>
            )}

            {/* 근본 원인 분석 결과 */}
            {result.rootCauseAnalysis.status === 'completed' && (
              <div className='bg-blue-50 rounded-lg p-4'>
                <div className='flex items-center space-x-2 mb-3'>
                  <Search className='w-5 h-5 text-blue-600' />
                  <h4 className='font-medium text-blue-800'>근본 원인 분석</h4>
                  {result.rootCauseAnalysis.aiInsights.length > 0 && (
                    <div className='flex items-center space-x-1 text-xs bg-blue-100 px-2 py-1 rounded'>
                      <span>🤖</span>
                      <span>
                        {result.rootCauseAnalysis.aiInsights.length}개 AI 엔진
                        활용
                      </span>
                    </div>
                  )}
                </div>
                <div className='space-y-2 text-sm'>
                  <div>
                    식별된 원인: {result.rootCauseAnalysis.causes.length}개
                  </div>
                  <div>
                    AI 인사이트: {result.rootCauseAnalysis.aiInsights.length}개
                  </div>
                  <div>
                    신뢰도:{' '}
                    {Math.round(result.rootCauseAnalysis.confidence * 100)}%
                  </div>

                  {/* AI 엔진별 기여도 표시 */}
                  {result.rootCauseAnalysis.aiInsights.length > 0 && (
                    <div className='mt-2'>
                      <div className='text-xs text-blue-600 mb-1'>
                        활용된 AI 엔진:
                      </div>
                      <div className='flex flex-wrap gap-1'>
                        {result.rootCauseAnalysis.aiInsights.map(
                          (insight, index) => (
                            <span
                              key={index}
                              className='inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded'
                            >
                              {insight.engine}
                              <span className='ml-1 text-blue-500'>
                                ({Math.round(insight.confidence * 100)}%)
                              </span>
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className='text-blue-700 bg-blue-100 p-2 rounded'>
                    {result.rootCauseAnalysis.summary}
                  </div>
                </div>
              </div>
            )}

            {/* 예측적 모니터링 결과 */}
            {result.predictiveMonitoring.status === 'completed' && (
              <div className='bg-purple-50 rounded-lg p-4'>
                <div className='flex items-center space-x-2 mb-3'>
                  <TrendingUp className='w-5 h-5 text-purple-600' />
                  <h4 className='font-medium text-purple-800'>
                    예측적 모니터링
                  </h4>
                </div>
                <div className='space-y-2 text-sm'>
                  <div>
                    예측 결과: {result.predictiveMonitoring.predictions.length}
                    개
                  </div>
                  <div>
                    권장사항:{' '}
                    {result.predictiveMonitoring.recommendations.length}개
                  </div>
                  <div>
                    신뢰도:{' '}
                    {Math.round(result.predictiveMonitoring.confidence * 100)}%
                  </div>
                  <div className='text-purple-700 bg-purple-100 p-2 rounded'>
                    {result.predictiveMonitoring.summary}
                  </div>
                  {result.predictiveMonitoring.recommendations.length > 0 && (
                    <div className='mt-3'>
                      <h5 className='font-medium text-purple-800 mb-1'>
                        💡 권장사항:
                      </h5>
                      <ul className='space-y-1'>
                        {result.predictiveMonitoring.recommendations.map(
                          (rec, index) => (
                            <li
                              key={index}
                              className='text-xs flex items-center space-x-1'
                            >
                              <Lightbulb className='w-3 h-3' />
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
        </motion.div>
      )}
    </div>
  );
}
