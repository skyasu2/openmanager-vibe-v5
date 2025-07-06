/**
 * 🏠 Home Page - 이전 버전의 첫 페이지 복구
 * 
 * 로그인 후 나타나는 시스템 시작 버튼이 있는 메인 페이지
 * 시스템 시작 → 카운트다운 → 로딩 → 대시보드 플로우
 */

'use client';

import { motion } from 'framer-motion';
import { Database, Monitor, Play, Shield, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
    const router = useRouter();
    const [isSystemStarted, setIsSystemStarted] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [isCountingDown, setIsCountingDown] = useState(false);

    // 카운트다운 타이머
    useEffect(() => {
        if (isCountingDown && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (isCountingDown && countdown === 0) {
            // 카운트다운 완료 후 로딩 페이지로 이동
            router.push('/system-boot');
        }
    }, [countdown, isCountingDown, router]);

    // 시스템 시작 버튼 클릭
    const handleSystemStart = () => {
        console.log('🚀 시스템 시작 버튼 클릭');
        setIsCountingDown(true);
        setCountdown(3); // 3초 카운트다운
    };

    // 카운트다운 중이면 카운트다운 화면 표시
    if (isCountingDown) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden flex items-center justify-center">
                {/* 배경 효과 */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl animate-pulse" />
                </div>

                {/* 카운트다운 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center z-10"
                >
                    <motion.div
                        key={countdown}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        className="text-8xl font-bold text-white mb-4"
                    >
                        {countdown || '시작!'}
                    </motion.div>
                    <p className="text-xl text-white/80">
                        시스템이 곧 시작됩니다...
                    </p>
                </motion.div>
            </div>
        );
    }

    // 메인 홈 페이지
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
            {/* 파티클 배경 효과 */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/3 rounded-full blur-3xl animate-pulse" />
            </div>

            {/* 메인 컨텐츠 */}
            <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-4xl"
                >
                    {/* 로고 */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="mb-8"
                    >
                        <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                            <span className="text-white text-3xl font-bold">OM</span>
                        </div>
                    </motion.div>

                    {/* 제목 */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="text-6xl font-bold mb-4"
                    >
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            OpenManager
                        </span>
                    </motion.h1>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
                    >
                        AI 기반 서버 모니터링 및 관리 시스템
                        <br />
                        지능형 분석과 실시간 모니터링으로 서버를 효율적으로 관리하세요
                    </motion.h2>

                    {/* 기능 카드들 */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
                    >
                        {[
                            { icon: Monitor, title: '실시간 모니터링', color: 'from-blue-500 to-cyan-500' },
                            { icon: Zap, title: 'AI 분석', color: 'from-purple-500 to-pink-500' },
                            { icon: Shield, title: '보안 관리', color: 'from-green-500 to-emerald-500' },
                            { icon: Database, title: '데이터 관리', color: 'from-orange-500 to-red-500' },
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                                    <feature.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-semibold text-gray-800 text-sm">{feature.title}</h3>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* 시스템 시작 버튼 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2, duration: 0.6 }}
                    >
                        <button
                            onClick={handleSystemStart}
                            className="group relative px-12 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                        >
                            <div className="flex items-center space-x-3">
                                <Play className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
                                <span>시스템 시작</span>
                            </div>

                            {/* 버튼 글로우 효과 */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                        </button>
                    </motion.div>

                    {/* 하단 정보 */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4, duration: 0.6 }}
                        className="mt-12 text-center"
                    >
                        <p className="text-gray-500 text-sm mb-2">
                            시스템 시작을 클릭하여 모니터링을 시작하세요
                        </p>
                        <p className="text-gray-400 text-xs">
                            © 2024 OpenManager. All rights reserved.
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
} 