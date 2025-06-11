'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Settings, Bug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface DashboardErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
    const [isReporting, setIsReporting] = React.useState(false);

    const handleReport = async () => {
        setIsReporting(true);
        try {
            // 에러 리포팅 로직
            await fetch('/api/error-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: error.message,
                    digest: error.digest,
                    stack: error.stack,
                    timestamp: new Date().toISOString(),
                    page: 'dashboard',
                }),
            });
        } catch (e) {
            console.error('Error reporting failed:', e);
        } finally {
            setIsReporting(false);
        }
    };

    const errorType = React.useMemo(() => {
        const message = error.message.toLowerCase();
        if (message.includes('network') || message.includes('fetch')) {
            return 'network';
        }
        if (message.includes('permission') || message.includes('auth')) {
            return 'auth';
        }
        if (message.includes('loading') || message.includes('timeout')) {
            return 'loading';
        }
        return 'unknown';
    }, [error.message]);

    const errorInfo = {
        network: {
            title: '네트워크 연결 오류',
            description: '서버와의 연결에 문제가 발생했습니다.',
            solution: '인터넷 연결을 확인하고 다시 시도해주세요.',
            icon: AlertTriangle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        },
        auth: {
            title: '권한 오류',
            description: '대시보드 접근 권한이 없습니다.',
            solution: '로그인 후 다시 시도하거나 관리자에게 문의하세요.',
            icon: Settings,
            color: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
        },
        loading: {
            title: '로딩 시간 초과',
            description: '데이터 로딩에 예상보다 시간이 걸리고 있습니다.',
            solution: '페이지를 새로고침하거나 잠시 후 다시 시도해주세요.',
            icon: RefreshCw,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        },
        unknown: {
            title: '알 수 없는 오류',
            description: '예상치 못한 오류가 발생했습니다.',
            solution: '문제가 지속되면 관리자에게 문의해주세요.',
            icon: Bug,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        },
    };

    const currentError = errorInfo[errorType];
    const IconComponent = currentError.icon;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full"
            >
                <Card className={`${currentError.bgColor} border-2`}>
                    <CardHeader className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex justify-center mb-4"
                        >
                            <div className={`p-4 rounded-full ${currentError.bgColor}`}>
                                <IconComponent className={`w-12 h-12 ${currentError.color}`} />
                            </div>
                        </motion.div>
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                            {currentError.title}
                        </CardTitle>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {currentError.description}
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* 해결 방법 */}
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                                해결 방법:
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                                {currentError.solution}
                            </p>
                        </div>

                        {/* 액션 버튼들 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button
                                onClick={reset}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                다시 시도
                            </Button>
                            <Button
                                onClick={() => (window.location.href = '/')}
                                variant="outline"
                                className="w-full"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                홈으로 돌아가기
                            </Button>
                        </div>

                        {/* 안전 모드 */}
                        <div className="text-center">
                            <Button
                                onClick={() => (window.location.href = '/dashboard?instant=true&safe=true')}
                                variant="outline"
                                className="w-full border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                안전 모드로 접속
                            </Button>
                        </div>

                        {/* 에러 상세 정보 (개발자용) */}
                        {process.env.NODE_ENV === 'development' && (
                            <details className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4">
                                <summary className="cursor-pointer font-medium text-gray-900 dark:text-white">
                                    개발자 정보
                                </summary>
                                <div className="mt-4 space-y-2 text-sm">
                                    <div>
                                        <strong>Error Message:</strong>
                                        <code className="block bg-gray-200 dark:bg-slate-700 p-2 rounded text-xs mt-1">
                                            {error.message}
                                        </code>
                                    </div>
                                    {error.digest && (
                                        <div>
                                            <strong>Error Digest:</strong>
                                            <code className="block bg-gray-200 dark:bg-slate-700 p-2 rounded text-xs mt-1">
                                                {error.digest}
                                            </code>
                                        </div>
                                    )}
                                    {error.stack && (
                                        <div>
                                            <strong>Stack Trace:</strong>
                                            <code className="block bg-gray-200 dark:bg-slate-700 p-2 rounded text-xs mt-1 overflow-auto max-h-32">
                                                {error.stack}
                                            </code>
                                        </div>
                                    )}
                                </div>
                            </details>
                        )}

                        {/* 에러 신고 */}
                        <div className="text-center">
                            <Button
                                onClick={handleReport}
                                disabled={isReporting}
                                variant="ghost"
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <Bug className="w-4 h-4 mr-2" />
                                {isReporting ? '신고 중...' : '문제 신고하기'}
                            </Button>
                        </div>

                        {/* 추가 도움말 */}
                        <div className="text-center border-t pt-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                문제가 계속 발생하면{' '}
                                <a
                                    href="mailto:support@openmanager.com"
                                    className="text-blue-600 hover:underline"
                                >
                                    기술 지원팀
                                </a>
                                에 문의하세요.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* 시스템 상태 확인 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 text-center"
                >
                    <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                시스템 상태를 확인하려면{' '}
                                <a
                                    href="/api/health"
                                    target="_blank"
                                    className="text-blue-600 hover:underline"
                                >
                                    여기를 클릭
                                </a>
                                하세요.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </div>
    );
} 