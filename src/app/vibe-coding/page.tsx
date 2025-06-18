'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Code2,
    Brain,
    GitBranch,
    Zap,
    Settings,
    ArrowRight,
    Play,
    CheckCircle2,
    Clock,
    Home,
    Monitor,
    FileCode,
    Database,
    Cpu,
} from 'lucide-react';
import Link from 'next/link';

export default function VibeCodingPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isActive, setIsActive] = useState(false);

    const developmentSteps = [
        {
            id: 'analysis',
            title: '📋 시스템 설계',
            description: 'AI 모델과 함께 아키텍처 설계 및 기술스택 결정',
            details: '애플리케이션 AI 엔진, 데이터 생성기, 타이머 최적화 설계',
            tools: ['Claude 4.0', 'GPT-4', 'Mermaid'],
            color: 'from-blue-400 to-blue-600',
            status: '완료',
        },
        {
            id: 'implementation',
            title: '⚡ Cursor AI + 3대 MCP 서버 협업',
            description: '환경별 자동 감지 MCP 시스템으로 개발 생산성 극대화',
            details:
                '🔧 Local Filesystem, 📁 GitHub Integration, 🌐 Browser Tools 동시 활용',
            tools: ['Cursor Composer', '3대 MCP 서버', 'Auto Environment Detection'],
            color: 'from-green-400 to-green-600',
            status: '완료',
        },
        {
            id: 'optimization',
            title: '🔧 성능 최적화',
            description: '타이머 시스템 통합 및 메모리 사용량 최적화',
            details: '23개 개별 타이머를 4개 통합 TimerManager로 재구성',
            tools: ['Chrome DevTools', 'React DevTools', 'Performance Monitor'],
            color: 'from-purple-400 to-purple-600',
            status: '완료',
        },
        {
            id: 'deployment',
            title: '🚀 배포 및 테스트',
            description: 'Vercel 배포 및 CI/CD 파이프라인 구성',
            details: 'GitHub Actions, Vercel 자동 배포, E2E 테스트 구현',
            tools: ['GitHub Actions', 'Vercel', 'Playwright'],
            color: 'from-orange-400 to-orange-600',
            status: '완료',
        },
    ];

    const achievements = [
        {
            title: 'MCP 도구 활용 전략',
            before: '기본 IDE 기능만 사용',
            after: 'Filesystem+GitHub+Browser 통합',
            improvement: '코딩 생산성 3배 향상',
            icon: <Settings className='w-6 h-6' />,
        },
        {
            title: 'AI 엔진용 MCP 서버 개발',
            before: '로컬 AI 처리 방식',
            after: 'HTTP API 서버 클라우드 배포',
            improvement: 'AI 분석 전용 시스템 구축',
            icon: <Brain className='w-6 h-6' />,
        },
        {
            title: 'Render 클라우드 최적화',
            before: '배포 실패 반복',
            after: '안정적인 포트 10000 서비스',
            improvement: 'MCP 서버 배포 성공',
            icon: <Code2 className='w-6 h-6' />,
        },
        {
            title: 'TypeScript 코드 품질',
            before: '혼재된 타입 시스템',
            after: '100% TypeScript 적용',
            improvement: '타입 안전성 보장',
            icon: <FileCode className='w-6 h-6' />,
        },
        {
            title: '데이터 압축 효율성',
            before: '100% 원본 데이터',
            after: '베이스라인+델타 방식',
            improvement: '65% 압축률 달성',
            icon: <Database className='w-6 h-6' />,
        },
        {
            title: '타이머 시스템 최적화',
            before: '23개 개별 setInterval',
            after: '4개 통합 TimerManager',
            improvement: 'CPU 사용량 최적화',
            icon: <Clock className='w-6 h-6' />,
        },
        {
            title: '프로젝트 규모 확장',
            before: '기본 구조',
            after: '11개 페이지 생성',
            improvement: '완전한 시스템 구축',
            icon: <Monitor className='w-6 h-6' />,
        },
    ];

    const handleStart = () => {
        setIsActive(true);
        let stepIndex = 0;

        const progressStep = () => {
            if (stepIndex < developmentSteps.length) {
                setCurrentStep(stepIndex);
                stepIndex++;
                setTimeout(progressStep, 2000);
            }
        };

        progressStep();
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 overflow-hidden'>
            {/* 홈 버튼 */}
            <div className='absolute top-6 left-6 z-50'>
                <Link href='/'>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        className='flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm 
                       rounded-full text-white hover:bg-white/20 transition-all'
                    >
                        <Home className='w-4 h-4' />
                        <span>홈으로</span>
                    </motion.button>
                </Link>
            </div>

            {/* 동적 배경 */}
            <div className='absolute inset-0'>
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                     w-96 h-96 bg-gradient-to-r from-green-500/30 to-cyan-500/30 rounded-full blur-3xl'
                />
            </div>

            {/* 메인 컨텐트 */}
            <div className='relative z-10 min-h-screen flex items-center justify-center px-4 py-12'>
                <div className='max-w-6xl mx-auto'>
                    {/* 헤더 */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='text-center mb-16'
                    >
                        <motion.h1 className='text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent'>
                            ⚡ 바이브 코딩 (Vibe Coding)
                        </motion.h1>
                        <p className='text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto'>
                            AI와 함께하는 혁신적인 개발 방법론 - 20일간의 개발 여정
                        </p>

                        {/* 실제 성과 배지 */}
                        <div className='flex flex-wrap justify-center gap-4 mb-8'>
                            {[
                                'MCP 도구 활용법',
                                'MCP 서버 개발',
                                'Render 클라우드 배포',
                                '507줄 엔진 구현',
                                '65% 압축률',
                                '100% TypeScript',
                                '11개 페이지',
                            ].map(achievement => (
                                <span
                                    key={achievement}
                                    className='px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium'
                                >
                                    ✅ {achievement}
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    {/* 개발 단계 섹션 */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className='mb-16'
                    >
                        <h2 className='text-3xl font-bold text-white text-center mb-8'>
                            🚀 개발 단계
                        </h2>

                        {/* 시작 버튼 */}
                        {!isActive && (
                            <div className='text-center mb-8'>
                                <motion.button
                                    onClick={handleStart}
                                    className='px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-blue-600 transition-all'
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Play className='w-5 h-5 inline mr-2' />
                                    개발 과정 시작하기
                                </motion.button>
                            </div>
                        )}

                        {/* 개발 단계 카드들 */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            {developmentSteps.map((step, index) => (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{
                                        opacity: isActive && currentStep >= index ? 1 : 0.5,
                                        scale: isActive && currentStep === index ? 1.05 : 1,
                                    }}
                                    transition={{ duration: 0.5 }}
                                    className={`bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 ${isActive && currentStep === index
                                        ? 'ring-2 ring-green-400 shadow-lg shadow-green-400/20'
                                        : ''
                                        }`}
                                >
                                    <div className='flex items-start gap-4'>
                                        <div
                                            className={`w-2 h-20 bg-gradient-to-b ${step.color} rounded-full flex-shrink-0`}
                                        />
                                        <div className='flex-1'>
                                            <h3 className='text-xl font-bold text-white mb-2'>
                                                {step.title}
                                            </h3>
                                            <p className='text-gray-300 mb-2'>{step.description}</p>
                                            <p className='text-gray-400 text-sm mb-3'>
                                                {step.details}
                                            </p>
                                            <div className='flex flex-wrap gap-2 mb-3'>
                                                {step.tools.map(tool => (
                                                    <span
                                                        key={tool}
                                                        className='px-3 py-1 bg-white/10 text-gray-300 rounded-full text-xs'
                                                    >
                                                        {tool}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <CheckCircle2
                                            className={`w-6 h-6 flex-shrink-0 mt-1 ${isActive && currentStep >= index
                                                ? 'text-green-400'
                                                : 'text-gray-600'
                                                }`}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* 성과 비교 섹션 */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className='mb-16'
                    >
                        <h2 className='text-3xl font-bold text-white text-center mb-8'>
                            🏆 핵심 성과
                        </h2>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                            {achievements.map((achievement, index) => (
                                <motion.div
                                    key={achievement.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    className='bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6'
                                >
                                    <div className='text-blue-400 mb-3'>{achievement.icon}</div>
                                    <h3 className='text-lg font-bold text-white mb-3'>
                                        {achievement.title}
                                    </h3>
                                    <div className='space-y-2 text-sm'>
                                        <div className='text-red-300'>
                                            <span className='font-medium'>Before:</span>{' '}
                                            {achievement.before}
                                        </div>
                                        <div className='text-green-300'>
                                            <span className='font-medium'>After:</span>{' '}
                                            {achievement.after}
                                        </div>
                                        <div className='text-yellow-300 font-medium'>
                                            ✨ {achievement.improvement}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* 결론 섹션 */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className='text-center'
                    >
                        <h2 className='text-3xl font-bold text-white mb-6'>🎯 결론</h2>
                        <p className='text-xl text-gray-300 mb-8 max-w-3xl mx-auto'>
                            바이브 코딩은 단순한 AI 협업을 넘어서,{' '}
                            <span className='text-blue-400 font-semibold'>
                                개발 패러다임의 혁신
                            </span>
                            을 제시합니다.
                        </p>
                        <div className='bg-gradient-to-r from-green-500/20 to-blue-500/20 p-8 rounded-xl border border-green-500/30 max-w-2xl mx-auto'>
                            <p className='text-2xl font-bold text-white mb-4'>
                                "20일간 11개 페이지, 100% TypeScript, 65% 데이터 압축률"
                            </p>
                            <p className='text-gray-300'>
                                전통적 개발 대비{' '}
                                <span className='text-green-400 font-semibold'>
                                    6배 빠른 개발 속도
                                </span>{' '}
                                달성
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
} 