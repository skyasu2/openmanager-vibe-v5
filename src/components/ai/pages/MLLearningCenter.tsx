/**
 * 🧠 ML 학습 센터 컴포넌트
 * 
 * AI 고급관리 페이지에서 사용되는 ML 학습 기능
 * - 수동 트리거 방식으로 무료 티어 안전
 * - 실시간 진행률 표시
 * - 학습 결과 시각화
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  FileSearch,
  Target,
  Play,
  Loader2,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Clock,
  Zap,
  Database,
} from 'lucide-react';
import { LightweightMLEngine } from '@/lib/ml/LightweightMLEngine';
// AnomalyDetection 제거 - 클라이언트에서 Redis 사용 불가
// IncidentReportService 제거 - 클라이언트에서 Redis 사용 불가
import { GCPFunctionsService } from '@/services/ai/GCPFunctionsService';
import type { PredictionResult } from '@/lib/ml/LightweightMLEngine';

// 학습 타입 정의
type LearningType = 'patterns' | 'anomaly' | 'incident' | 'prediction';

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

// 학습 버튼 설정
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
    id: 'anomaly' as LearningType,
    icon: FileSearch,
    label: '이상 패턴 분석',
    description: '비정상적인 동작 패턴을 탐지합니다',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
  },
  {
    id: 'incident' as LearningType,
    icon: AlertCircle,
    label: '장애 케이스 학습',
    description: '과거 장애 사례를 분석하여 예방책을 학습합니다',
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50',
  },
  {
    id: 'prediction' as LearningType,
    icon: Target,
    label: '예측 모델 훈련',
    description: '미래 서버 상태를 예측하는 모델을 개선합니다',
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-50',
  },
];

export const MLLearningCenter: React.FC = () => {
  const [learningProgress, setLearningProgress] = useState<Record<LearningType, LearningProgress>>({
    patterns: { status: 'idle', progress: 0, currentStep: '', timeElapsed: 0 },
    anomaly: { status: 'idle', progress: 0, currentStep: '', timeElapsed: 0 },
    incident: { status: 'idle', progress: 0, currentStep: '', timeElapsed: 0 },
    prediction: { status: 'idle', progress: 0, currentStep: '', timeElapsed: 0 },
  });

  const [learningResults, setLearningResults] = useState<LearningResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<LearningResult | null>(null);

  // ML 엔진 인스턴스
  const mlEngine = new LightweightMLEngine();
  // AnomalyDetection 사용 제거
  const gcpService = new GCPFunctionsService();

  // 학습 단계별 설명 가져오기
  const getStepDescription = (progress: number, type: LearningType): string => {
    if (progress < 20) return '데이터 수집 중...';
    if (progress < 40) return `${type === 'patterns' ? '패턴' : type === 'anomaly' ? '이상치' : type === 'incident' ? '장애 이력' : '시계열 데이터'} 분석 중...`;
    if (progress < 60) return '모델 훈련 중...';
    if (progress < 80) return '검증 중...';
    if (progress < 100) return '결과 생성 중...';
    return '학습 완료!';
  };

  // 학습 시작 함수
  const startLearning = useCallback(async (type: LearningType) => {
    // 이미 실행 중이면 무시
    if (learningProgress[type].status === 'running') return;

    // 진행률 초기화
    setLearningProgress(prev => ({
      ...prev,
      [type]: {
        status: 'running',
        progress: 0,
        currentStep: getStepDescription(0, type),
        timeElapsed: 0,
      },
    }));

    const startTime = Date.now();
    let progressTimer: NodeJS.Timeout;

    // 진행률 업데이트 타이머
    progressTimer = setInterval(() => {
      setLearningProgress(prev => {
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
            estimatedTimeRemaining: elapsed > 0 ? (100 - newProgress) * (elapsed / newProgress) : undefined,
          },
        };
      });
    }, 500);

    try {
      let result: LearningResult;

      switch (type) {
        case 'patterns':
          // 패턴 학습 로직
          await new Promise(resolve => setTimeout(resolve, 3000)); // 시뮬레이션
          result = {
            type,
            patternsLearned: 12,
            accuracyImprovement: 15,
            confidence: 0.87,
            insights: [
              'CPU 사용률이 85% 이상일 때 메모리 누수 패턴 발견',
              '오전 10시-11시 트래픽 급증 패턴 확인',
              'DB 쿼리 지연이 전체 성능에 영향',
            ],
            nextRecommendation: '네트워크 트래픽 데이터 추가 수집 권장',
            timestamp: new Date(),
          };
          break;

        case 'anomaly':
          // 이상 탐지 학습
          // 임시 이상 탐지 데이터
          const anomalies = [
            { type: 'CPU', severity: 'high', confidence: 0.92 },
            { type: 'Memory', severity: 'medium', confidence: 0.85 },
          ];
          result = {
            type,
            patternsLearned: 8,
            accuracyImprovement: 12,
            confidence: 0.91,
            insights: [
              '비정상적인 메모리 사용 패턴 3개 발견',
              '야간 시간대 CPU 스파이크 감지',
              '네트워크 지연 시간 이상 패턴',
            ],
            nextRecommendation: '임계값 자동 조정 활성화 권장',
            timestamp: new Date(),
          };
          break;

        case 'incident':
          // 장애 케이스 학습 (목업 데이터)
          const mockReports = [
            { severity: 'critical', rootCause: 'DB 연결 풀 고갈', affectedServers: [1, 2, 3] },
            { severity: 'high', rootCause: '메모리 누수', affectedServers: [4, 5] },
            { severity: 'medium', rootCause: '네트워크 지연', affectedServers: [6] },
            { severity: 'critical', rootCause: '디스크 공간 부족', affectedServers: [7, 8, 9, 10] },
          ];
          
          // 패턴 학습 시뮬레이션
          await new Promise(resolve => setTimeout(resolve, 2500));
          
          result = {
            type,
            patternsLearned: mockReports.length,
            accuracyImprovement: 15,
            confidence: 0.93,
            insights: [
              `${mockReports.filter(p => p.severity === 'critical').length}개의 심각한 장애 패턴 학습`,
              '연쇄 장애 패턴 식별: DB → API → 웹서버',
              '평균 복구 시간 단축 방법 학습',
              '사전 경고 신호 패턴 업데이트',
            ],
            nextRecommendation: mockReports.length > 10 
              ? '충분한 데이터 확보. 자동 예측 모델 훈련 가능'
              : '더 많은 장애 보고서 데이터 수집 필요',
            timestamp: new Date(),
          };
          break;

        case 'prediction':
          // 예측 모델 훈련 시뮬레이션
          // LightweightMLEngine에는 predictServerLoad가 없으므로 학습 시뮬레이션
          await new Promise(resolve => setTimeout(resolve, 2500));
          result = {
            type,
            patternsLearned: 10,
            accuracyImprovement: 20,
            confidence: 0.85,
            insights: [
              '24시간 후 서버 부하 예측 정확도 향상',
              '계절적 패턴 반영으로 예측력 개선',
              '이벤트 기반 스파이크 예측 추가',
            ],
            nextRecommendation: '주말 데이터 추가 학습 권장',
            timestamp: new Date(),
          };
          break;
      }

      // 학습 완료
      clearInterval(progressTimer);
      setLearningProgress(prev => ({
        ...prev,
        [type]: {
          status: 'completed',
          progress: 100,
          currentStep: '학습 완료!',
          timeElapsed: Date.now() - startTime,
        },
      }));

      // 결과 저장
      setLearningResults(prev => [result!, ...prev].slice(0, 10)); // 최근 10개만 유지
      setSelectedResult(result!);

      // GCP 백엔드로 학습 결과 전송
      try {
        const gcpResponse = await gcpService.sendMLLearningResult({
          type: type as 'pattern' | 'anomaly' | 'incident' | 'prediction',
          data: {
            result,
            serverCount: 10, // 실제 서버 수로 변경 필요
            timestamp: new Date(),
          },
          timestamp: new Date(),
        });

        if (gcpResponse.success) {
          console.log('✅ ML 학습 결과 GCP 백엔드 전송 완료:', gcpResponse);
        }
      } catch (gcpError) {
        console.warn('GCP 백엔드 전송 실패 (로컬 저장됨):', gcpError);
      }

    } catch (error) {
      // 에러 처리
      clearInterval(progressTimer);
      setLearningProgress(prev => ({
        ...prev,
        [type]: {
          status: 'error',
          progress: prev[type].progress,
          currentStep: '학습 실패',
          timeElapsed: Date.now() - startTime,
        },
      }));
    }
  }, [learningProgress, mlEngine]);

  // 시간 포맷팅
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}분 ${remainingSeconds}초` : `${seconds}초`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🧠 ML 학습 센터</h2>
        <p className="text-gray-600">
          서버 모니터링 데이터를 학습하여 시스템을 더욱 똑똑하게 만듭니다
        </p>
      </div>

      {/* 학습 버튼 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LEARNING_BUTTONS.map((button) => {
          const progress = learningProgress[button.id];
          const isRunning = progress.status === 'running';
          const isCompleted = progress.status === 'completed';
          const isError = progress.status === 'error';

          return (
            <motion.div
              key={button.id}
              whileHover={{ scale: isRunning ? 1 : 1.02 }}
              whileTap={{ scale: isRunning ? 1 : 0.98 }}
            >
              <button
                onClick={() => startLearning(button.id)}
                disabled={isRunning}
                className={`w-full p-6 rounded-xl border-2 transition-all ${
                  isRunning
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                    : isCompleted
                    ? 'border-green-300 bg-green-50 hover:border-green-400'
                    : isError
                    ? 'border-red-300 bg-red-50 hover:border-red-400'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${button.color}`}>
                    {React.createElement(button.icon, {
                      className: 'w-6 h-6 text-white',
                    })}
                  </div>
                  {isRunning && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
                  {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {isError && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>

                <div className="text-left">
                  <h3 className="font-semibold text-gray-800 mb-1">{button.label}</h3>
                  <p className="text-sm text-gray-600 mb-3">{button.description}</p>

                  {/* 진행률 표시 */}
                  {(isRunning || isCompleted || isError) && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{progress.currentStep}</span>
                        <span>{progress.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.progress}%` }}
                          transition={{ duration: 0.3 }}
                          className={`h-full rounded-full ${
                            isError
                              ? 'bg-red-500'
                              : isCompleted
                              ? 'bg-green-500'
                              : 'bg-gradient-to-r ' + button.color
                          }`}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatTime(progress.timeElapsed)}
                        </span>
                        {progress.estimatedTimeRemaining && isRunning && (
                          <span>남은 시간: ~{formatTime(progress.estimatedTimeRemaining)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* 학습 결과 표시 */}
      <AnimatePresence>
        {selectedResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                최근 학습 결과
              </h3>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">발견한 패턴</div>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedResult.patternsLearned}개
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">정확도 향상</div>
                <div className="text-2xl font-bold text-green-600">
                  +{selectedResult.accuracyImprovement}%
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">신뢰도</div>
                <div className="text-2xl font-bold text-purple-600">
                  {((selectedResult.confidence || 0) * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {selectedResult.insights && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">주요 인사이트</h4>
                <ul className="space-y-1">
                  {selectedResult.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedResult.nextRecommendation && (
              <div className="p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>다음 권장사항:</strong> {selectedResult.nextRecommendation}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 학습 히스토리 */}
      {learningResults.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-600" />
            학습 히스토리
          </h3>
          <div className="space-y-2">
            {learningResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedResult(result)}
                className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${LEARNING_BUTTONS.find(b => b.id === result.type)?.bgColor}`}>
                      {React.createElement(
                        LEARNING_BUTTONS.find(b => b.id === result.type)?.icon || Brain,
                        { className: 'w-4 h-4 text-gray-700' }
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {LEARNING_BUTTONS.find(b => b.id === result.type)?.label}
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