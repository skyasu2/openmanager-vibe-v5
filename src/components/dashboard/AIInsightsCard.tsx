/**
 * 🔮 AI 인사이트 카드 컴포넌트
 *
 * - 실시간 AI 분석 결과 표시
 * - 시스템 추천사항 제공
 * - 이상 징후 감지 알림
 * - 성능 최적화 제안
 */

'use client';

import { useAIInsights } from '@/hooks/api/useAIInsights';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Lightbulb,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

interface AIInsightsCardProps {
  className?: string;
  showRecommendations?: boolean;
}

export default function AIInsightsCard({
  className = '',
  showRecommendations: _showRecommendations = true,
}: AIInsightsCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: insights, isLoading, error, refetch } = useAIInsights();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // 스마트 갱신 로직 사용
      const refreshResult = await refetch();

      // 갱신이 실제로 발생했는지 확인
      if (refreshResult.data) {
        console.log('✅ AI 인사이트 갱신 완료');
      } else {
        console.log('⏳ AI 인사이트 갱신 제한됨');
      }
    } catch (error) {
      console.error('❌ AI 인사이트 갱신 실패:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'performance':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'optimization':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'anomaly':
        return <Activity className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'performance':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'optimization':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'anomaly':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-lg ${className}`}
    >
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-pink-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">AI 인사이트</h3>
            <p className="text-sm text-gray-600">실시간 AI 분석 결과</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:opacity-50"
          title="인사이트 새로고침"
        >
          <RefreshCw
            className={`h-4 w-4 text-gray-500 ${isLoading || isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="space-y-4">
        {/* 로딩 상태 */}
        {(isLoading || isRefreshing) && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-gray-600">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>AI 분석 중...</span>
            </div>
          </div>
        )}

        {/* 에러 상태 */}
        {error && !isLoading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">AI 인사이트를 불러올 수 없습니다</span>
            </div>
            <p className="mt-1 text-xs text-red-600">{error.message}</p>
          </div>
        )}

        {/* 인사이트 목록 */}
        {insights && !isLoading && (
          <div className="space-y-3">
            {insights.length > 0 ? (
              insights.slice(0, 3).map((insight, index) => (
                <motion.div
                  key={insight.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-lg border p-3 ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{insight.title}</div>
                      <div className="mt-1 text-xs opacity-80">
                        {insight.description}
                      </div>
                      {insight.confidence && (
                        <div className="mt-2 text-xs opacity-60">
                          신뢰도: {Math.round(insight.confidence * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-6 text-center text-gray-500">
                <Brain className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">
                  현재 분석할 데이터가 충분하지 않습니다
                </p>
                <p className="mt-1 text-xs">
                  시스템이 더 많은 데이터를 수집하면 인사이트가 표시됩니다
                </p>
              </div>
            )}
          </div>
        )}

        {/* 마지막 업데이트 시간 */}
        {insights && insights.length > 0 && (
          <div className="border-t border-gray-100 pt-2 text-center text-xs text-gray-500">
            마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
          </div>
        )}
      </div>
    </div>
  );
}
