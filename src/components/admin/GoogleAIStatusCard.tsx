'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    RefreshCcw,
    Zap,
    AlertCircle,
    CheckCircle,
    Key,
    Activity
} from 'lucide-react';
import {
    useGoogleAIStatus,
    useRefreshGoogleAIStatus
} from '@/hooks/api/useGoogleAIStatus';

interface GoogleAIStatusCardProps {
    className?: string;
}

export const GoogleAIStatusCard: React.FC<GoogleAIStatusCardProps> = ({
    className = ''
}) => {
    const { data: status, isLoading, error, isRefetching } = useGoogleAIStatus();
    const refreshStatus = useRefreshGoogleAIStatus();

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
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Google AI 상태</h3>
                            <p className="text-sm text-gray-600">Gemini API 모니터링</p>
                        </div>
                    </div>

                    <button
                        onClick={refreshStatus}
                        disabled={isRefetching}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        title="새로고침"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* 📄 컨텐츠 */}
            <div className="p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Google AI 상태 확인 중...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                        <p className="text-red-600 font-medium">상태 확인 실패</p>
                        <p className="text-sm text-gray-500 mt-1">{error.message}</p>
                    </div>
                ) : !status ? (
                    <div className="text-center py-8">
                        <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Google AI 상태 정보 없음</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* 기본 상태 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">활성화</span>
                                <CheckCircle className={`w-4 h-4 ${status.isEnabled ? 'text-green-500' : 'text-red-500'}`} />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">연결</span>
                                <CheckCircle className={`w-4 h-4 ${status.isConnected ? 'text-green-500' : 'text-red-500'}`} />
                            </div>
                        </div>

                        {/* API 키 상태 */}
                        <div className="border rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <Key className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">API 키: {status.apiKeyStatus}</span>
                            </div>
                        </div>

                        {/* 성능 지표 */}
                        <div className="border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">성능 지표</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div>
                                    <div className="font-bold text-blue-600">{status.performance?.averageResponseTime || 0}ms</div>
                                    <div className="text-gray-500">응답시간</div>
                                </div>
                                <div>
                                    <div className="font-bold text-green-600">{Math.round((status.performance?.successRate || 0) * 100)}%</div>
                                    <div className="text-gray-500">성공률</div>
                                </div>
                                <div>
                                    <div className="font-bold text-red-600">{Math.round((status.performance?.errorRate || 0) * 100)}%</div>
                                    <div className="text-gray-500">오류율</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
