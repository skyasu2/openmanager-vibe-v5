'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    RefreshCcw,
    TrendingUp,
    AlertTriangle,
    Lightbulb,
    Clock,
    BarChart3
} from 'lucide-react';
import {
    useAIInsights,
    useRefreshAIInsights,
    getSeverityColor,
    getTypeIcon,
    type AIInsight
} from '@/hooks/api/useAIInsights';

interface AIInsightsCardProps {
    className?: string;
}

export const AIInsightsCard: React.FC<AIInsightsCardProps> = ({
    className = ''
}) => {
    const { data: insights, isLoading, error, isRefetching } = useAIInsights();
    const refreshInsights = useRefreshAIInsights();

    // 📊 인사이트 통계 계산
    const stats = React.useMemo(() => {
        if (!insights) return { total: 0, high: 0, medium: 0, low: 0 };

        return {
            total: insights.length,
            high: insights.filter(i => i.severity === 'high').length,
            medium: insights.filter(i => i.severity === 'medium').length,
            low: insights.filter(i => i.severity === 'low').length,
        };
    }, [insights]);

    // 🎯 타입별 아이콘 매핑
    const getTypeIconComponent = (type: AIInsight['type']) => {
        switch (type) {
            case 'prediction':
                return <TrendingUp className="w-4 h-4" />;
            case 'anomaly':
                return <AlertTriangle className="w-4 h-4" />;
            case 'recommendation':
                return <Lightbulb className="w-4 h-4" />;
            default:
                return <BarChart3 className="w-4 h-4" />;
        }
    };

    // 📅 시간 포맷팅
    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now.getTime() - time.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}시간 전`;
        return `${Math.floor(diffMins / 1440)}일 전`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}
        >
            {/* 📋 헤더 */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">AI 인사이트</h3>
                            <p className="text-sm text-gray-600">실시간 AI 분석 결과</p>
                        </div>
                    </div>

                    <button
                        onClick={refreshInsights}
                        disabled={isRefetching}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        title="새로고침"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* 📊 통계 요약 */}
                <div className="flex items-center gap-6 mt-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                        <div className="text-xs text-gray-500">총 인사이트</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.high}</div>
                        <div className="text-xs text-gray-500">높음</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
                        <div className="text-xs text-gray-500">보통</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.low}</div>
                        <div className="text-xs text-gray-500">낮음</div>
                    </div>
                </div>
            </div>

            {/* 📄 컨텐츠 */}
            <div className="p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <span className="ml-3 text-gray-600">AI 인사이트 로딩 중...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="text-red-600 font-medium">인사이트 로딩 실패</p>
                        <p className="text-sm text-gray-500 mt-1">{error.message}</p>
                        <button
                            onClick={refreshInsights}
                            className="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                            다시 시도
                        </button>
                    </div>
                ) : !insights || insights.length === 0 ? (
                    <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">현재 AI 인사이트가 없습니다</p>
                        <p className="text-sm text-gray-400 mt-1">AI가 분석 중입니다...</p>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {insights.map((insight, index) => (
                            <motion.div
                                key={insight.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-4 rounded-lg border ${getSeverityColor(insight.severity)}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                        {getTypeIconComponent(insight.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-opacity-20">
                                                {insight.type === 'prediction' ? '예측' :
                                                    insight.type === 'anomaly' ? '이상탐지' : '권장사항'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                신뢰도 {Math.round(insight.confidence * 100)}%
                                            </span>
                                        </div>

                                        <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed mb-2">
                                            {insight.description}
                                        </p>

                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            <span>{formatTimeAgo(insight.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}; 