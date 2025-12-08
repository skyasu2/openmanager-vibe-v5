/**
 * 🧠 ML 학습 센터 컴포넌트
 *
 * AI 고급관리 페이지에서 사용되는 ML 학습 기능
 * - /api/ai/ml/train API 연동
 * - 수동 트리거 방식으로 무료 티어 안전
 * - 실시간 진행률 표시
 * - 학습 결과 시각화
 */

'use client';

import {
  AlertCircle,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Database,
  Loader2,
  Play,
  RotateCcw,
  Settings,
  Zap,
} from 'lucide-react';
import { createElement, type FC, useCallback, useState } from 'react';

// 학습 타입 정의 (anomaly, prediction은 IntelligentMonitoringPage에서 제공)
type LearningType = 'patterns' | 'incident';

// API 응답 타입
interface APITrainingResult {
  id: string;
  type: LearningType;
  patternsLearned: number;
  accuracyImprovement: number;
  confidence: number;
  insights: string[];
  nextRecommendation: string;
  metadata: {
    processingTime: number;
    dataPoints: number;
    algorithm: string;
    version: string;
  };
  timestamp: string;
}

interface LearningProgress {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  currentStep: string;
  timeElapsed: number;
  estimatedTimeRemaining?: number;
}

interface LearningResult {
  type: LearningType;
  patternsLearned?: number;
  accuracyImprovement?: number;
  confidence?: number;
  insights?: string[];
  nextRecommendation?: string;
  timestamp: Date;
}

// 학습 버튼 설정 (anomaly/prediction은 이상감지/예측 페이지에서 제공)
const LEARNING_BUTTONS = [
  {
    id: 'patterns' as LearningType,
    icon: Brain,
    label: '패턴 학습 시작',
    description: '서버 메트릭 패턴을 분석하고 학습합니다',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'incident' as LearningType,
    icon: AlertCircle,
    label: '장애 케이스 학습',
    description: '과거 장애 사례를 분석하여 예방책을 학습합니다',
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50',
  },
];

export const MLLearningCenter: FC = () => {
  const [learningProgress, setLearningProgress] = useState<
    Record<LearningType, LearningProgress>
  >({
    patterns: { status: 'idle', progress: 0, currentStep: '', timeElapsed: 0 },
    incident: { status: 'idle', progress: 0, currentStep: '', timeElapsed: 0 },
  });

  const [learningResults, setLearningResults] = useState<LearningResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<LearningResult | null>(
    null
  );

  // ML 엔진 인스턴스 제거 (사용하지 않음)
  // AnomalyDetection 사용 제거

  // 학습 단계별 설명 가져오기
  const getStepDescription = useCallback(
    (progress: number, type: LearningType): string => {
      if (progress < 20) return '데이터 수집 중...';
      if (progress < 40)
        return `${type === 'patterns' ? '패턴' : '장애 이력'} 분석 중...`;
      if (progress < 60) return '모델 훈련 중...';
      if (progress < 80) return '검증 중...';
      if (progress < 100) return '결과 생성 중...';
      return '학습 완료!';
    },
    []
  );

  // 학습 시작 함수 (API 연동)
  const startLearning = useCallback(
    async (type: LearningType) => {
      // 이미 실행 중이면 무시
      if (learningProgress[type].status === 'running') return;

      // 진행률 초기화
      setLearningProgress((prev) => ({
        ...prev,
        [type]: {
          status: 'running',
          progress: 0,
          currentStep: getStepDescription(0, type),
          timeElapsed: 0,
        },
      }));

      const startTime = Date.now();

      // 진행률 업데이트 타이머 (API 호출 중 UI 피드백용)
      const progressTimer = setInterval(() => {
        setLearningProgress((prev) => {
          const current = prev[type];
          const newProgress = Math.min(current.progress + 10, 90);
          const elapsed = Date.now() - startTime;

          return {
            ...prev,
            [type]: {
              ...current,
              progress: newProgress,
              currentStep: getStepDescription(newProgress, type),
              timeElapsed: elapsed,
              estimatedTimeRemaining:
                elapsed > 0
                  ? (100 - newProgress) * (elapsed / newProgress)
                  : undefined,
            },
          };
        });
      }, 500);

      try {
        // API 호출
        const response = await fetch('/api/ai/ml/train', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            timeRange: '24h',
            config: { sensitivity: 'medium' },
          }),
        });

        if (!response.ok) {
          throw new Error(`API 오류: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.result) {
          throw new Error(data.error || '학습 결과가 없습니다.');
        }

        const apiResult: APITrainingResult = data.result;

        // API 응답을 UI 타입으로 변환
        const result: LearningResult = {
          type: apiResult.type,
          patternsLearned: apiResult.patternsLearned,
          accuracyImprovement: apiResult.accuracyImprovement,
          confidence: apiResult.confidence,
          insights: apiResult.insights,
          nextRecommendation: apiResult.nextRecommendation,
          timestamp: new Date(apiResult.timestamp),
        };

        // 학습 완료
        clearInterval(progressTimer);
        setLearningProgress((prev) => ({
          ...prev,
          [type]: {
            status: 'completed',
            progress: 100,
            currentStep: '학습 완료!',
            timeElapsed: Date.now() - startTime,
          },
        }));

        // 결과 저장
        setLearningResults((prev) => [result, ...prev].slice(0, 10)); // 최근 10개만 유지
        setSelectedResult(result);

        console.log('✅ ML 학습 결과:', {
          type,
          patternsLearned: result.patternsLearned,
          accuracyImprovement: result.accuracyImprovement,
          confidence: result.confidence,
          cached: data.cached,
        });
      } catch (error) {
        // 에러 처리
        clearInterval(progressTimer);
        console.error('ML 학습 실패:', error);
        setLearningProgress((prev) => ({
          ...prev,
          [type]: {
            status: 'error',
            progress: prev[type].progress,
            currentStep: error instanceof Error ? error.message : '학습 실패',
            timeElapsed: Date.now() - startTime,
          },
        }));
      }
    },
    [learningProgress, getStepDescription]
  );

  // 시간 포맷팅
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}분 ${remainingSeconds}초` : `${seconds}초`;
  };

  // 전체 초기화
  const resetAll = () => {
    setLearningProgress({
      patterns: { status: 'idle', progress: 0, currentStep: '', timeElapsed: 0 },
      incident: { status: 'idle', progress: 0, currentStep: '', timeElapsed: 0 },
    });
    setLearningResults([]);
    setSelectedResult(null);
  };

  // 학습 중인지 확인
  const isAnyLearning = Object.values(learningProgress).some(
    (p) => p.status === 'running'
  );

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
      {/* 헤더 - IntelligentMonitoringPage 스타일 */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
              <Settings className="h-5 w-5 text-white" />
            </div>
            AI 고급관리
          </h1>

          {/* 실행 버튼들 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={resetAll}
              disabled={isAnyLearning}
              className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              <RotateCcw className="mr-1 inline h-4 w-4" />
              초기화
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          서버 모니터링 데이터를 학습하여 AI 시스템의 정확도를 향상시킵니다
        </p>
      </div>

      {/* 학습 기능 설명 카드 */}
      <div className="mb-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
        <div className="mb-2 flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
          <span className="text-sm font-medium text-indigo-800">
            ML 학습 시스템
          </span>
        </div>
        <p className="text-xs text-indigo-700">
          실제 Supabase 데이터를 기반으로 패턴 분석 및 장애 케이스를 학습합니다.
          GCP Cloud Functions와 연동되어 고급 ML 처리를 수행합니다.
        </p>
      </div>

      {/* 학습 버튼 그리드 */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {LEARNING_BUTTONS.map((button) => {
          const progress = learningProgress[button.id];
          const isRunning = progress.status === 'running';
          const isCompleted = progress.status === 'completed';
          const isError = progress.status === 'error';
          const isIdle = progress.status === 'idle';

          return (
            <div key={button.id} className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-md">
              <div className="mb-4 flex items-start justify-between">
                <div className={`rounded-lg bg-gradient-to-br p-3 ${button.color}`}>
                  {createElement(button.icon, {
                    className: 'w-6 h-6 text-white',
                  })}
                </div>
                <div className="flex items-center gap-2">
                  {isRunning && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  )}
                  {isCompleted && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {isError && <AlertCircle className="h-5 w-5 text-red-500" />}
                </div>
              </div>

              <div className="text-left">
                <h3 className="mb-1 font-semibold text-gray-800">
                  {button.label}
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  {button.description}
                </p>

                {/* 진행률 표시 */}
                {(isRunning || isCompleted || isError) && (
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{progress.currentStep}</span>
                      <span>{progress.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isError
                            ? 'bg-red-500'
                            : isCompleted
                              ? 'bg-green-500'
                              : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        }`}
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        <Clock className="mr-1 inline h-3 w-3" />
                        {formatTime(progress.timeElapsed)}
                      </span>
                      {progress.estimatedTimeRemaining && isRunning && (
                        <span>
                          남은 시간: ~{formatTime(progress.estimatedTimeRemaining)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 학습 시작 버튼 */}
                <button
                  onClick={() => {
                    void startLearning(button.id);
                  }}
                  disabled={isRunning}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    isRunning
                      ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                      : isCompleted
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : isError
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
                  }`}
                >
                  {isRunning ? (
                    <>학습 중...</>
                  ) : isCompleted ? (
                    <>
                      <Play className="mr-1 inline h-4 w-4" />
                      재학습
                    </>
                  ) : isError ? (
                    <>
                      <RotateCcw className="mr-1 inline h-4 w-4" />
                      다시 시도
                    </>
                  ) : (
                    <>
                      <Play className="mr-1 inline h-4 w-4" />
                      {isIdle ? '학습 시작' : '학습'}
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 학습 결과 표시 */}
      {selectedResult && (
        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              최근 학습 결과
            </h3>
            <button
              onClick={() => setSelectedResult(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-4">
              <div className="mb-1 text-sm text-gray-600">발견한 패턴</div>
              <div className="text-2xl font-bold text-blue-600">
                {selectedResult.patternsLearned}개
              </div>
            </div>
            <div className="rounded-lg bg-white p-4">
              <div className="mb-1 text-sm text-gray-600">정확도 향상</div>
              <div className="text-2xl font-bold text-green-600">
                +{selectedResult.accuracyImprovement}%
              </div>
            </div>
            <div className="rounded-lg bg-white p-4">
              <div className="mb-1 text-sm text-gray-600">신뢰도</div>
              <div className="text-2xl font-bold text-purple-600">
                {((selectedResult.confidence || 0) * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {selectedResult.insights && (
            <div className="mb-4">
              <h4 className="mb-2 font-medium text-gray-700">주요 인사이트</h4>
              <ul className="space-y-1">
                {selectedResult.insights.map((insight, idx) => (
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

          {selectedResult.nextRecommendation && (
            <div className="rounded-lg bg-blue-100 p-3">
              <p className="text-sm text-blue-800">
                <strong>다음 권장사항:</strong>{' '}
                {selectedResult.nextRecommendation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State - 학습 전 */}
      {learningResults.length === 0 && !selectedResult && !isAnyLearning && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100">
              <Brain className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-800">
              ML 학습 준비 완료
            </h3>
            <p className="mx-auto mb-4 max-w-md text-sm text-gray-600">
              위의 학습 버튼을 클릭하여 서버 모니터링 데이터 패턴을 학습하세요.
              학습된 패턴은 이상 감지 및 예측의 정확도를 향상시킵니다.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                🧠 패턴 학습
              </span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                🚨 장애 케이스
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 학습 히스토리 */}
      {learningResults.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Database className="h-5 w-5 text-gray-600" />
            학습 히스토리
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {learningResults.length}개
            </span>
          </h3>
          <div className="space-y-2">
            {learningResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedResult(result)}
                className={`w-full rounded-lg border p-3 text-left transition-all hover:shadow-sm ${
                  selectedResult === result
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${LEARNING_BUTTONS.find((b) => b.id === result.type)?.bgColor}`}
                    >
                      {createElement(
                        LEARNING_BUTTONS.find((b) => b.id === result.type)
                          ?.icon || Brain,
                        { className: 'w-4 h-4 text-gray-700' }
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {
                          LEARNING_BUTTONS.find((b) => b.id === result.type)
                            ?.label
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        {result.timestamp.toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      +{result.accuracyImprovement}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.patternsLearned} 패턴
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
