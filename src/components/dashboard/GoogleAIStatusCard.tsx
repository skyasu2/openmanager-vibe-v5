/**
 * 🤖 Google AI 상태 카드 컴포넌트
 * 
 * - Google AI API 연결 상태 실시간 모니터링
 * - Gemini 모델 상태 표시
 * - API 할당량 및 사용량 표시
 * - 연결 테스트 기능
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    CheckCircle,
    AlertTriangle,
    XCircle,
    RefreshCw,
    Activity,
    Zap,
    Clock,
    BarChart3
} from 'lucide-react';
import { useGoogleAIStatus } from '@/hooks/api/useGoogleAIStatus';

interface GoogleAIStatusCardProps {
    className?: string;
    showDetails?: boolean;
}

export default function GoogleAIStatusCard({
    className = '',
    showDetails = true
}: GoogleAIStatusCardProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { data: status, isLoading, error, refetch } = useGoogleAIStatus();

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetch();
        } finally {
            setIsRefreshing(false);
        }
    };

    const getStatusIcon = () => {
        if (isLoading || isRefreshing) {
            return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
        }

        if (error || !status?.isConnected) {
            return <XCircle className="w-5 h-5 text-red-500" />;
        }

        if (status?.isConnected && status?.healthCheckStatus === 'healthy') {
            return <CheckCircle className="w-5 h-5 text-green-500" />;
        }

        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    };

    const getStatusText = () => {
        if (isLoading) return '상태 확인 중...';
        if (error) return '연결 오류';
        if (!status?.isConnected) return '연결 끊김';
        if (status?.healthCheckStatus === 'healthy') return '정상 작동';
        if (status?.healthCheckStatus === 'degraded') return '부분 작동';
        return '비정상';
    };

    const getStatusColor = () => {
        if (isLoading || isRefreshing) return 'text-blue-600';
        if (error || !status?.isConnected) return 'text-red-600';
        if (status?.healthCheckStatus === 'healthy') return 'text-green-600';
        if (status?.healthCheckStatus === 'degraded') return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Google AI 상태</h3>
                        <p className="text-sm text-gray-600">Gemini API 연결 모니터링</p>
                    </div>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    title="상태 새로고침"
                >
                    <RefreshCw className={`w-4 h-4 text-gray-500 ${(isLoading || isRefreshing) ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* 상태 표시 */}
            <div className="space-y-4">
                {/* 메인 상태 */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {getStatusIcon()}
                    <div className="flex-1">
                        <div className={`font-medium ${getStatusColor()}`}>
                            {getStatusText()}
                        </div>
                        {status?.lastHealthCheck && (
                            <div className="text-xs text-gray-500 mt-1">
                                마지막 확인: {new Date(status.lastHealthCheck).toLocaleTimeString('ko-KR')}
                            </div>
                        )}
                    </div>
                </div>

                {/* 상세 정보 */}
                {showDetails && status && (
                    <AnimatePresence>
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                        >
                            {/* API 모델 정보 */}
                            {status.model && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Zap className="w-4 h-4 text-purple-500" />
                                    <span className="text-gray-600">모델:</span>
                                    <span className="font-medium text-gray-800">{status.model}</span>
                                </div>
                            )}

                            {/* 응답 시간 */}
                            {status.performance?.averageResponseTime && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span className="text-gray-600">평균 응답 시간:</span>
                                    <span className="font-medium text-gray-800">{status.performance.averageResponseTime}ms</span>
                                </div>
                            )}

                            {/* 할당량 정보 */}
                            {status.quotaStatus && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <BarChart3 className="w-4 h-4 text-green-500" />
                                        <span className="text-gray-600">일일 할당량:</span>
                                        <span className="font-medium text-gray-800">
                                            {status.quotaStatus.daily.used} / {status.quotaStatus.daily.limit}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Activity className="w-4 h-4 text-blue-500" />
                                        <span className="text-gray-600">분당 할당량:</span>
                                        <span className="font-medium text-gray-800">
                                            {status.quotaStatus.perMinute.used} / {status.quotaStatus.perMinute.limit}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* 활성 기능 */}
                            {status.features && (
                                <div className="mt-3">
                                    <div className="text-sm text-gray-600 mb-2">활성 기능:</div>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(status.features).map(([feature, enabled]) => (
                                            enabled && (
                                                <span
                                                    key={feature}
                                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                                >
                                                    {feature}
                                                </span>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* 에러 메시지 */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>연결 오류: {error.message || '알 수 없는 오류'}</span>
                        </div>
                    </div>
                )}

                {/* 연결 테스트 버튼 */}
                <button
                    onClick={handleRefresh}
                    disabled={isLoading || isRefreshing}
                    className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                    {isLoading || isRefreshing ? '테스트 중...' : '연결 테스트'}
                </button>
            </div>
        </div>
    );
} 