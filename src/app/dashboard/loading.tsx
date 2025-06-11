'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
    Monitor,
    Bot,
    Database,
    Cpu,
    Network,
    BarChart3,
    Shield,
    Zap,
} from 'lucide-react';

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
            {/* 헤더 스켈레톤 */}
            <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <div>
                            <Skeleton className="w-32 h-5" />
                            <Skeleton className="w-24 h-3 mt-1" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-24 h-8 rounded-md" />
                        <Skeleton className="w-20 h-8 rounded-md" />
                    </div>
                </div>
            </header>

            {/* 메인 로딩 섹션 */}
            <main className="p-6">
                {/* 로딩 진행 상황 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md mx-auto mb-8"
                >
                    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                        <CardHeader className="text-center">
                            <div className="flex items-center justify-center mb-4">
                                <div className="relative">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Monitor className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                시스템 초기화 중
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                대시보드를 준비하고 있습니다...
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Progress value={65} className="w-full" />
                                <div className="text-sm text-center text-gray-500 dark:text-gray-400">
                                    약 2초 남음
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* 로딩 단계 표시 */}
                <div className="max-w-2xl mx-auto mb-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Database, label: '데이터 로드', status: 'completed' },
                            { icon: Bot, label: 'AI 시스템', status: 'loading' },
                            { icon: BarChart3, label: '차트 렌더링', status: 'pending' },
                            { icon: Shield, label: '보안 검사', status: 'pending' },
                        ].map((step, index) => (
                            <motion.div
                                key={step.label}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={`
                  p-4 rounded-lg border-2 transition-all duration-300
                  ${step.status === 'completed'
                                        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700'
                                        : step.status === 'loading'
                                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700 animate-pulse'
                                            : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                                    }
                `}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <step.icon
                                        className={`
                      w-6 h-6 mb-2
                      ${step.status === 'completed'
                                                ? 'text-green-600 dark:text-green-400'
                                                : step.status === 'loading'
                                                    ? 'text-blue-600 dark:text-blue-400'
                                                    : 'text-gray-400 dark:text-gray-600'
                                            }
                    `}
                                    />
                                    <span
                                        className={`
                      text-sm font-medium
                      ${step.status === 'completed'
                                                ? 'text-green-700 dark:text-green-300'
                                                : step.status === 'loading'
                                                    ? 'text-blue-700 dark:text-blue-300'
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }
                    `}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* 대시보드 스켈레톤 */}
                <div className="space-y-6">
                    {/* 상태 카드들 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="bg-white/50 dark:bg-slate-900/50">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="w-20 h-4" />
                                        <Skeleton className="w-6 h-6 rounded" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="w-16 h-8 mb-2" />
                                    <Skeleton className="w-full h-2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* 차트 섹션 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-white/50 dark:bg-slate-900/50">
                            <CardHeader>
                                <Skeleton className="w-32 h-6" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="w-full h-64" />
                            </CardContent>
                        </Card>
                        <Card className="bg-white/50 dark:bg-slate-900/50">
                            <CardHeader>
                                <Skeleton className="w-28 h-6" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="w-full h-64" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* 서버 목록 */}
                    <Card className="bg-white/50 dark:bg-slate-900/50">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Skeleton className="w-24 h-6" />
                                <Skeleton className="w-20 h-8 rounded-md" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <div className="flex-1">
                                            <Skeleton className="w-32 h-4 mb-1" />
                                            <Skeleton className="w-20 h-3" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Skeleton className="w-12 h-6 rounded" />
                                            <Skeleton className="w-12 h-6 rounded" />
                                            <Skeleton className="w-12 h-6 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* 로딩 팁 */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="fixed bottom-6 right-6"
            >
                <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            <div className="text-sm">
                                <p className="font-medium text-gray-900 dark:text-white">빠른 팁</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    ?instant=true 파라미터로 애니메이션 스킵 가능
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
} 