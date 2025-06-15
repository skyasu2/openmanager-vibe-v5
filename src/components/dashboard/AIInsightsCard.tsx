/**
 * 🔮 AI 인사이트 카드 컴포넌트
 * 
 * - 실시간 AI 분석 결과 표시
 * - 시스템 추천사항 제공
 * - 이상 징후 감지 알림
 * - 성능 최적화 제안
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Lightbulb,
    Target,
    Activity,
    Zap
} from 'lucide-react';
import { useAIInsights } from '@/hooks/api/useAIInsights';

interface AIInsightsCardProps {
    className?: string;
    showRecommendations?: boolean;
}

export default function AIInsightsCard({
    className = '',
    showRecommendations = true
}: AIInsightsCardProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { data: insights, isLoading, error, refetch } = useAIInsights();

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetch();
        } finally {
            setIsRefreshing(false);
        }
    };

    const getInsightIcon = (type: string) => {
        switch (type) {
            case 'performance':
                return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'optimization':
                return <Lightbulb className="w-4 h-4 text-blue-500" />;
            case 'anomaly':
                return <Activity className="w-4 h-4 text-red-500" />;
            default:
                return <CheckCircle className="w-4 h-4 text-gray-500" />;
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
        <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">AI 인사이트</h3>
                        <p className="text-sm text-gray-600">실시간 AI 분석 결과</p>
                    </div>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    title="인사이트 새로고침"
                >
                    <RefreshCw className={`w-4 h-4 text-gray-500 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* 콘텐츠 */}
            <div className="space-y-4">
                {/* 로딩 상태 */}
                {(isLoading || isRefreshing) && (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-3 text-gray-600">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>AI 분석 중...</span>
                        </div>
                    </div>
                )}

                {/* 에러 상태 */}
                {error && !isLoading && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm">AI 인사이트를 불러올 수 없습니다</span>
                        </div>
                        <p className="text-red-600 text-xs mt-1">{error.message}</p>
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
                                    className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        {getInsightIcon(insight.type)}
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">
                                                {insight.title}
                                            </div>
                                            <div className="text-xs mt-1 opacity-80">
                                                {insight.description}
                                            </div>
                                            {insight.confidence && (
                                                <div className="text-xs mt-2 opacity-60">
                                                    신뢰도: {Math.round(insight.confidence * 100)}%
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">현재 분석할 데이터가 충분하지 않습니다</p>
                                <p className="text-xs mt-1">시스템이 더 많은 데이터를 수집하면 인사이트가 표시됩니다</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 마지막 업데이트 시간 */}
                {insights && insights.length > 0 && (
                    <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                        마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
                    </div>
                )}
            </div>
        </div>
    );
} 