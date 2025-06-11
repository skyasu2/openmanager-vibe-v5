'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { LoadingStep } from '../../hooks/useLoadingState';

interface ProgressIndicatorProps {
    progress: number;
    currentStep?: string;
    steps: LoadingStep[];
    estimatedTimeRemaining: number;
    elapsedTime: number;
    isCompleted: boolean;
    hasError: boolean;
    error?: string;
    className?: string;
}

export function ProgressIndicator({
    progress,
    currentStep,
    steps,
    estimatedTimeRemaining,
    elapsedTime,
    isCompleted,
    hasError,
    error,
    className = '',
}: ProgressIndicatorProps) {
    const formatTime = (ms: number) => {
        if (ms < 1000) return `${Math.ceil(ms)}ms`;
        const seconds = Math.ceil(ms / 1000);
        if (seconds < 60) return `${seconds}초`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}분 ${remainingSeconds}초`;
    };

    const getCurrentStepInfo = () => {
        const step = steps.find(s => s.id === currentStep);
        return step || null;
    };

    const currentStepInfo = getCurrentStepInfo();

    return (
        <div className={`space-y-4 ${className}`}>
            {/* 메인 진행률 바 */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {isCompleted ? '완료!' : hasError ? '오류 발생' : '로딩 중...'}
                    </h3>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {progress}%
                    </span>
                </div>

                <Progress
                    value={progress}
                    className="h-3"
                />

                {currentStepInfo && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        {currentStepInfo.status === 'loading' && (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        )}
                        {currentStepInfo.status === 'completed' && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        {currentStepInfo.status === 'error' && (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span>{currentStepInfo.label}</span>
                        {currentStepInfo.description && (
                            <span className="text-gray-500">- {currentStepInfo.description}</span>
                        )}
                    </div>
                )}
            </div>

            {/* 시간 정보 */}
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>경과: {formatTime(elapsedTime)}</span>
                </div>

                {!isCompleted && !hasError && estimatedTimeRemaining > 0 && (
                    <div className="text-gray-500 dark:text-gray-400">
                        남은 시간: {formatTime(estimatedTimeRemaining)}
                    </div>
                )}
            </div>

            {/* 단계별 표시 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {steps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`
              px-3 py-2 rounded-lg border text-center transition-all duration-300
              ${step.status === 'completed'
                                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
                                : step.status === 'loading'
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300 animate-pulse'
                                    : step.status === 'error'
                                        ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
                                        : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                            }
            `}
                    >
                        <div className="flex flex-col items-center gap-1">
                            {step.status === 'completed' && (
                                <CheckCircle className="w-4 h-4" />
                            )}
                            {step.status === 'loading' && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            {step.status === 'error' && (
                                <AlertCircle className="w-4 h-4" />
                            )}
                            {step.status === 'pending' && (
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}

                            <span className="text-xs font-medium">{step.label}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* 에러 메시지 */}
            {hasError && error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-700"
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <p className="text-sm text-red-700 dark:text-red-300">
                            {error}
                        </p>
                    </div>
                </motion.div>
            )}

            {/* 완료 메시지 */}
            {isCompleted && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-700"
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm text-green-700 dark:text-green-300">
                            모든 작업이 성공적으로 완료되었습니다!
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
} 