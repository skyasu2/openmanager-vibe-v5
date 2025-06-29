/**
 * 🧠 PredictionDashboard - 장애 예측 분석 대시보드
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Target,
  Activity,
  Shield,
  Zap,
  BarChart3,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { PredictionResult } from '@/engines/PredictiveAnalysisEngine';

interface PredictionDashboardProps {
  className?: string;
  serverId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface PredictionData {
  prediction: PredictionResult;
  dataStatus: 'sufficient' | 'insufficient';
  message: string;
}

interface AccuracyData {
  overallAccuracy: {
    global: number;
    recent: number;
    byServer: { [key: string]: number };
  };
  timeRangeStats: {
    range: string;
    totalPredictions: number;
    accuratePredictions: number;
    accuracy: number;
  };
  performanceMetrics: {
    averageConfidence: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
  };
}

export const PredictionDashboard: React.FC<PredictionDashboardProps> = ({
  className = '',
  serverId = 'web-server-01',
  autoRefresh = true,
  refreshInterval = 20000, // 20초로 통일
}) => {
  const [predictionData, setPredictionData] = useState<PredictionData | null>(
    null
  );
  const [accuracyData, setAccuracyData] = useState<AccuracyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 예측 분석 실행
  const runPredictionAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/prediction/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId,
          timeHorizon: 30,
          analysisType: 'hybrid',
        }),
      });

      if (!response.ok) throw new Error('예측 분석 요청 실패');

      const data = await response.json();
      if (data.success) {
        setPredictionData(data);
        setLastUpdate(new Date());
      } else {
        setError(data.error || '예측 분석 실패');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };

  // 정확도 데이터 조회
  const fetchAccuracyData = async () => {
    try {
      const response = await fetch(`/api/prediction/accuracy?timeRange=24h`);
      if (!response.ok) throw new Error('정확도 데이터 조회 실패');

      const data = await response.json();
      if (data.success) {
        setAccuracyData(data.data);
      }
    } catch (err) {
      console.error('정확도 데이터 조회 오류:', err);
    }
  };

  // 초기 로드 및 자동 새로고침
  useEffect(() => {
    runPredictionAnalysis();
    fetchAccuracyData();

    if (autoRefresh) {
      const interval = setInterval(() => {
        runPredictionAnalysis();
        fetchAccuracyData();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [serverId, autoRefresh, refreshInterval]);

  // 심각도별 색상 및 아이콘
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          icon: XCircle,
          label: '심각',
        };
      case 'high':
        return {
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/20',
          borderColor: 'border-orange-500/30',
          icon: AlertTriangle,
          label: '높음',
        };
      case 'medium':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          icon: AlertCircle,
          label: '보통',
        };
      case 'low':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          icon: CheckCircle2,
          label: '낮음',
        };
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/30',
          icon: Activity,
          label: '알 수 없음',
        };
    }
  };

  // 장애 확률 게이지
  const ProbabilityGauge: React.FC<{
    probability: number;
    severity: string;
  }> = ({ probability, severity }) => {
    const config = getSeverityConfig(severity);
    const circumference = 2 * Math.PI * 45;
    const strokeDasharray = circumference;
    const strokeDashoffset =
      circumference - (probability / 100) * circumference;

    return (
      <div className='relative w-32 h-32 mx-auto'>
        <svg className='w-32 h-32 transform -rotate-90' viewBox='0 0 100 100'>
          <circle
            cx='50'
            cy='50'
            r='45'
            stroke='currentColor'
            strokeWidth='8'
            fill='transparent'
            className='text-gray-700'
          />
          <motion.circle
            cx='50'
            cy='50'
            r='45'
            stroke='currentColor'
            strokeWidth='8'
            fill='transparent'
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={config.color}
            strokeLinecap='round'
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className='absolute inset-0 flex items-center justify-center flex-col'>
          <span className='text-2xl font-bold text-white'>
            {Math.round(probability)}%
          </span>
          <span className={`text-xs ${config.color}`}>장애 확률</span>
        </div>
      </div>
    );
  };

  // 예측 시간 카운트다운
  const TimeCountdown: React.FC<{ predictedTime: Date }> = ({
    predictedTime,
  }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const target = new Date(predictedTime).getTime();
        const difference = target - now;

        if (difference > 0) {
          const hours = Math.floor(difference / (1000 * 60 * 60));
          const minutes = Math.floor(
            (difference % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);

          setTimeLeft(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          );
        } else {
          setTimeLeft('예측 시점 도달');
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }, [predictedTime]);

    return (
      <div className='flex items-center space-x-2'>
        <Clock className='w-4 h-4 text-blue-400' />
        <span className='text-sm text-gray-300'>예상 시점:</span>
        <span className='font-mono text-blue-400'>{timeLeft}</span>
      </div>
    );
  };

  if (error) {
    return (
      <div
        className={`bg-gray-900/95 backdrop-blur-lg border border-red-500/30 rounded-xl p-6 ${className}`}
      >
        <div className='flex items-center space-x-3'>
          <XCircle className='w-6 h-6 text-red-400' />
          <div>
            <h3 className='text-lg font-semibold text-white'>예측 분석 오류</h3>
            <p className='text-red-400 text-sm'>{error}</p>
          </div>
        </div>
        <button
          onClick={runPredictionAnalysis}
          className='mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors'
        >
          <RefreshCw className='w-4 h-4' />
          <span>다시 시도</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3'>
          <Brain className='w-6 h-6 text-purple-400' />
          <h2 className='text-xl font-bold text-white'>장애 예측 분석</h2>
          <span className='text-sm text-gray-400'>({serverId})</span>
        </div>
        <div className='flex items-center space-x-3'>
          <span className='text-xs text-gray-500'>
            마지막 업데이트: {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={runPredictionAnalysis}
            disabled={isLoading}
            className='flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors disabled:opacity-50'
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {/* 메인 예측 결과 */}
      <AnimatePresence mode='wait'>
        {isLoading ? (
          <motion.div
            key='loading'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 rounded-xl p-8'
          >
            <div className='flex items-center justify-center space-x-3'>
              <RefreshCw className='w-6 h-6 animate-spin text-purple-400' />
              <span className='text-white'>예측 분석 중...</span>
            </div>
          </motion.div>
        ) : predictionData?.prediction ? (
          <motion.div
            key='prediction'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6'
          >
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              {/* 장애 확률 게이지 */}
              <div className='text-center'>
                <ProbabilityGauge
                  probability={predictionData.prediction.failureProbability}
                  severity={predictionData.prediction.severity}
                />
                <div className='mt-4'>
                  <div
                    className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs ${getSeverityConfig(predictionData.prediction.severity).bgColor} ${getSeverityConfig(predictionData.prediction.severity).color}`}
                  >
                    {React.createElement(
                      getSeverityConfig(predictionData.prediction.severity)
                        .icon,
                      { className: 'w-3 h-3' }
                    )}
                    <span>
                      {
                        getSeverityConfig(predictionData.prediction.severity)
                          .label
                      }{' '}
                      위험도
                    </span>
                  </div>
                </div>
              </div>

              {/* 예측 정보 */}
              <div className='space-y-4'>
                <div>
                  <h3 className='text-sm font-medium text-gray-400 mb-2'>
                    예측 정보
                  </h3>
                  <div className='space-y-2'>
                    <TimeCountdown
                      predictedTime={predictionData.prediction.predictedTime}
                    />
                    <div className='flex items-center space-x-2'>
                      <Target className='w-4 h-4 text-green-400' />
                      <span className='text-sm text-gray-300'>신뢰도:</span>
                      <span className='text-green-400'>
                        {Math.round(predictionData.prediction.confidence)}%
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Activity className='w-4 h-4 text-blue-400' />
                      <span className='text-sm text-gray-300'>분석 타입:</span>
                      <span className='text-blue-400 capitalize'>
                        {predictionData.prediction.analysisType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 주요 원인 메트릭 */}
                <div>
                  <h3 className='text-sm font-medium text-gray-400 mb-2'>
                    주요 원인
                  </h3>
                  <div className='flex flex-wrap gap-2'>
                    {predictionData.prediction.triggerMetrics.map(
                      (metric, index) => (
                        <span
                          key={index}
                          className='px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs'
                        >
                          {metric}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* 권장 조치 */}
              <div>
                <h3 className='text-sm font-medium text-gray-400 mb-2'>
                  권장 조치
                </h3>
                <div className='space-y-2'>
                  {predictionData.prediction.preventiveActions
                    .slice(0, 4)
                    .map((action, index) => (
                      <div key={index} className='flex items-start space-x-2'>
                        <Shield className='w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0' />
                        <span className='text-xs text-gray-300'>{action}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key='no-data'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 rounded-xl p-8 text-center'
          >
            <Eye className='w-12 h-12 text-gray-500 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-white mb-2'>
              예측 데이터 없음
            </h3>
            <p className='text-gray-400 text-sm mb-4'>
              충분한 메트릭 데이터를 수집한 후 예측 분석을 시작합니다.
            </p>
            <button
              onClick={runPredictionAnalysis}
              className='flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm transition-colors mx-auto'
            >
              <Brain className='w-4 h-4' />
              <span>예측 분석 시작</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 성능 통계 */}
      {accuracyData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6'
        >
          <h3 className='text-lg font-semibold text-white mb-4 flex items-center'>
            <BarChart3 className='w-5 h-5 text-blue-400 mr-2' />
            예측 성능 통계
          </h3>

          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-400'>
                {accuracyData.overallAccuracy.recent}%
              </div>
              <div className='text-sm text-gray-400'>전체 정확도</div>
            </div>

            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-400'>
                {accuracyData.performanceMetrics.averageConfidence}%
              </div>
              <div className='text-sm text-gray-400'>평균 신뢰도</div>
            </div>

            <div className='text-center'>
              <div className='text-2xl font-bold text-orange-400'>
                {accuracyData.performanceMetrics.falsePositiveRate}%
              </div>
              <div className='text-sm text-gray-400'>오탐률</div>
            </div>

            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-400'>
                {accuracyData.timeRangeStats.totalPredictions}
              </div>
              <div className='text-sm text-gray-400'>총 예측 수</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PredictionDashboard;
