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

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* 헤더 */}
      <div className="border-b border-purple-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">장애 예측</h2>
              <p className="text-sm text-gray-600">AI 기반 장애 예측 분석</p>
            </div>
          </div>

          <motion.button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center space-x-2 rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600 disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw
              className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`}
            />
            <span>{isAnalyzing ? '분석 중...' : '재분석'}</span>
          </motion.button>
        </div>
      </div>

      {/* 위험도 필터 */}
      <div className="border-b border-purple-200 bg-white/50 p-4">
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
              count: predictions.filter((p) => p.riskLevel === 'high').length,
            },
            {
              id: 'medium',
              label: '보통',
              count: predictions.filter((p) => p.riskLevel === 'medium').length,
            },
            {
              id: 'low',
              label: '낮음',
              count: predictions.filter((p) => p.riskLevel === 'low').length,
            },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedRisk(filter.id)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
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
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {filteredPredictions.map((prediction, index) => (
          <motion.div
            key={prediction.serverId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`rounded-lg border-2 p-4 ${getRiskColor(prediction.riskLevel)} transition-shadow hover:shadow-lg`}
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

            {/* 진행률 바 */}
            <div className="mb-3">
              <div className="mb-1 flex justify-between text-xs text-gray-600">
                <span>위험도</span>
                <span>{prediction.confidence}% 신뢰도</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
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
            <div className="mb-3 flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                예상 발생 시간:{' '}
                <span className="font-medium">{prediction.timeToFailure}</span>
              </span>
            </div>

            {/* 위험 요소 */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">
                주요 위험 요소
              </h4>
              <div className="flex flex-wrap gap-2">
                {prediction.factors.map((factor, factorIndex) => (
                  <div
                    key={factorIndex}
                    className="flex items-center space-x-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-xs"
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
          <div className="py-8 text-center">
            <TrendingUp className="mx-auto mb-2 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">해당 위험도의 예측이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 하단 요약 */}
      <div className="border-t border-purple-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="grid grid-cols-4 gap-2 text-center">
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
    </div>
  );
}
