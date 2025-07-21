/**
 * 🔮 장애 예측 페이지 컴포넌트
 *
 * AI 기반 장애 예측 분석 및 시각화
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  Target,
  Clock,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  RefreshCw,
} from 'lucide-react';

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

export default function PredictionPage() {
  const [predictions, setPredictions] =
    useState<PredictionData[]>(MOCK_PREDICTIONS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<string>('all');

  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    // AI 분석 시뮬레이션
    setTimeout(() => {
      setPredictions(prev =>
        prev.map(p => ({
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
      setIsAnalyzing(false);
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
        return <AlertTriangle className='w-5 h-5 text-red-500' />;
      case 'high':
        return <AlertTriangle className='w-5 h-5 text-orange-500' />;
      case 'medium':
        return <AlertTriangle className='w-5 h-5 text-yellow-500' />;
      default:
        return <Target className='w-5 h-5 text-green-500' />;
    }
  };

  const getFactorIcon = (factor: string) => {
    if (factor.includes('CPU')) return <Cpu className='w-4 h-4' />;
    if (factor.includes('메모리')) return <HardDrive className='w-4 h-4' />;
    if (factor.includes('디스크')) return <HardDrive className='w-4 h-4' />;
    if (factor.includes('네트워크')) return <Wifi className='w-4 h-4' />;
    return <Server className='w-4 h-4' />;
  };

  const filteredPredictions =
    selectedRisk === 'all'
      ? predictions
      : predictions.filter(p => p.riskLevel === selectedRisk);

  return (
    <div className='flex flex-col h-full bg-gradient-to-br from-purple-50 to-indigo-50'>
      {/* 헤더 */}
      <div className='p-4 border-b border-purple-200 bg-white/80 backdrop-blur-sm'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center'>
              <TrendingUp className='w-5 h-5 text-white' />
            </div>
            <div>
              <h2 className='text-lg font-bold text-gray-800'>장애 예측</h2>
              <p className='text-sm text-gray-600'>AI 기반 장애 예측 분석</p>
            </div>
          </div>

          <motion.button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className='flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw
              className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`}
            />
            <span>{isAnalyzing ? '분석 중...' : '재분석'}</span>
          </motion.button>
        </div>
      </div>

      {/* 위험도 필터 */}
      <div className='p-4 border-b border-purple-200 bg-white/50'>
        <div className='flex space-x-2'>
          {[
            { id: 'all', label: '전체', count: predictions.length },
            {
              id: 'critical',
              label: '심각',
              count: predictions.filter(p => p.riskLevel === 'critical').length,
            },
            {
              id: 'high',
              label: '높음',
              count: predictions.filter(p => p.riskLevel === 'high').length,
            },
            {
              id: 'medium',
              label: '보통',
              count: predictions.filter(p => p.riskLevel === 'medium').length,
            },
            {
              id: 'low',
              label: '낮음',
              count: predictions.filter(p => p.riskLevel === 'low').length,
            },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setSelectedRisk(filter.id)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedRisk === filter.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-purple-100'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>

      {/* 예측 목록 */}
      <div className='flex-1 overflow-y-auto p-4 space-y-3'>
        {filteredPredictions.map((prediction, index) => (
          <motion.div
            key={prediction.serverId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border-2 ${getRiskColor(prediction.riskLevel)} hover:shadow-lg transition-shadow`}
          >
            <div className='flex items-start justify-between mb-3'>
              <div className='flex items-center space-x-3'>
                {getRiskIcon(prediction.riskLevel)}
                <div>
                  <h3 className='font-bold text-gray-800'>
                    {prediction.serverName}
                  </h3>
                  <p className='text-sm text-gray-600'>
                    {prediction.predictedIssue}
                  </p>
                </div>
              </div>

              <div className='text-right'>
                <div className='text-2xl font-bold text-gray-800'>
                  {prediction.probability}%
                </div>
                <div className='text-xs text-gray-500'>발생 확률</div>
              </div>
            </div>

            {/* 진행률 바 */}
            <div className='mb-3'>
              <div className='flex justify-between text-xs text-gray-600 mb-1'>
                <span>위험도</span>
                <span>{prediction.confidence}% 신뢰도</span>
              </div>
              <div className='w-full bg-gray-200 rounded-full h-2'>
                <motion.div
                  className={`h-2 rounded-full ${
                    prediction.riskLevel === 'critical'
                      ? 'bg-red-500'
                      : prediction.riskLevel === 'high'
                        ? 'bg-orange-500'
                        : prediction.riskLevel === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${prediction.probability}%` }}
                  transition={{ duration: 1, delay: index * 0.2 }}
                />
              </div>
            </div>

            {/* 예상 시간 */}
            <div className='flex items-center space-x-2 mb-3'>
              <Clock className='w-4 h-4 text-gray-400' />
              <span className='text-sm text-gray-600'>
                예상 발생 시간:{' '}
                <span className='font-medium'>{prediction.timeToFailure}</span>
              </span>
            </div>

            {/* 위험 요소 */}
            <div>
              <h4 className='text-sm font-medium text-gray-700 mb-2'>
                주요 위험 요소
              </h4>
              <div className='flex flex-wrap gap-2'>
                {prediction.factors.map((factor, factorIndex) => (
                  <div
                    key={factorIndex}
                    className='flex items-center space-x-1 px-2 py-1 bg-white rounded-full border border-gray-200 text-xs'
                  >
                    {getFactorIcon(factor)}
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {filteredPredictions.length === 0 && (
          <div className='text-center py-8'>
            <TrendingUp className='w-12 h-12 text-gray-300 mx-auto mb-2' />
            <p className='text-gray-500'>해당 위험도의 예측이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 하단 요약 */}
      <div className='p-4 border-t border-purple-200 bg-white/80 backdrop-blur-sm'>
        <div className='grid grid-cols-4 gap-2 text-center'>
          <div>
            <div className='text-lg font-bold text-red-600'>
              {predictions.filter(p => p.riskLevel === 'critical').length}
            </div>
            <div className='text-xs text-gray-500'>심각</div>
          </div>
          <div>
            <div className='text-lg font-bold text-orange-600'>
              {predictions.filter(p => p.riskLevel === 'high').length}
            </div>
            <div className='text-xs text-gray-500'>높음</div>
          </div>
          <div>
            <div className='text-lg font-bold text-yellow-600'>
              {predictions.filter(p => p.riskLevel === 'medium').length}
            </div>
            <div className='text-xs text-gray-500'>보통</div>
          </div>
          <div>
            <div className='text-lg font-bold text-green-600'>
              {predictions.filter(p => p.riskLevel === 'low').length}
            </div>
            <div className='text-xs text-gray-500'>낮음</div>
          </div>
        </div>
      </div>
    </div>
  );
}
