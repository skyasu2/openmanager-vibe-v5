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
    Server,
    Globe,
    Shield,
    BarChart3,
    Bot,
} from 'lucide-react';
import Link from 'next/link';

export default function DevelopmentProcessPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isActive, setIsActive] = useState(false);

    const developmentSteps = [
        {
            id: 'analysis',
            title: '📋 요구사항 분석 및 설계',
            description: '서버 모니터링 도메인 특화 AI 시스템 아키텍처 설계',
            details: '기존 모니터링 시스템에 AI 기능을 모듈로 통합하는 확장 가능한 구조 설계',
            tools: ['시스템 설계', 'AI 아키텍처', '도메인 분석', 'UX/UI 설계'],
            color: 'from-blue-400 to-blue-600',
            status: '완료',
        },
        {
            id: 'foundation',
            title: '🏗️ 기술 스택 구축',
            description: '현대적 웹 기술 스택 기반 개발 환경 구성',
            details: 'Next.js 15.3.2 + React 19.1.0 + TypeScript 기반 확장 가능한 프론트엔드 아키텍처',
            tools: ['Next.js 15.3.2', 'React 19.1.0', 'TypeScript', 'Tailwind CSS'],
            color: 'from-green-400 to-green-600',
            status: '완료',
        },
        {
            id: 'lightweight-ai',
            title: '🧠 경량 AI 엔진 개발',
            description: '도메인 특화 경량 AI 엔진 설계 및 구현',
            details: 'TensorFlow 의존성 제거 후 simple-statistics 기반 경량 ML 엔진으로 성능 최적화',
            tools: ['LocalRAG Engine', 'simple-statistics', 'Pattern Matching', 'NLP'],
            color: 'from-purple-400 to-purple-600',
            status: '완료',
        },
        {
            id: 'data-system',
            title: '🔧 데이터 시스템 구축',
            description: '실시간 서버 데이터 처리 및 시뮬레이션 시스템',
            details: '30개 서버 메트릭 실시간 처리, 데이터 영속성을 위한 클라우드 Redis 연동',
            tools: ['Real-time Processing', 'Upstash Redis', 'Data Modeling', 'WebSocket'],
            color: 'from-orange-400 to-orange-600',
            status: '완료',
        },
        {
            id: 'ai-interface',
            title: '🤖 AI 인터페이스 구현',
            description: '자연어 기반 AI 어시스턴트 사용자 인터페이스',
            details: 'AI 사이드바 및 관리자 페이지를 통한 직관적인 AI 상호작용 시스템',
            tools: ['AI Sidebar', 'Admin Dashboard', 'Natural Language UI', 'Context Management'],
            color: 'from-indigo-400 to-indigo-600',
            status: '완료',
        },
        {
            id: 'integration',
            title: '🔗 시스템 통합',
            description: '모니터링 시스템과 AI 모듈 간 완전 통합',
            details: '기존 모니터링 기능과 AI 어시스턴트 기능의 seamless 통합 및 모듈화',
            tools: ['System Integration', 'Module Architecture', 'API Design', 'State Management'],
            color: 'from-cyan-400 to-cyan-600',
            status: '완료',
        },
        {
            id: 'optimization',
            title: '⚡ 성능 최적화',
            description: '시스템 성능 및 사용자 경험 최적화',
            details: '브라우저 알림 시스템, 실시간 차트 최적화, 메모리 사용량 개선',
            tools: ['Performance Optimization', 'Browser APIs', 'Chart.js', 'Memory Management'],
            color: 'from-pink-400 to-pink-600',
            status: '완료',
        },
        {
            id: 'deployment',
            title: '🚀 배포 및 운영',
            description: '클라우드 기반 자동 배포 및 운영 시스템',
            details: 'Vercel 서버리스 배포, CI/CD 파이프라인 구축, 모니터링 및 로깅',
            tools: ['Vercel Deployment', 'CI/CD Pipeline', 'Cloud Services', 'Monitoring'],
            color: 'from-emerald-400 to-emerald-600',
            status: '완료',
        },
    ];

    const achievements = [
        {
            title: '도메인 특화 AI 설계',
            before: '범용 AI 솔루션',
            after: '서버 모니터링 전용 AI',
            improvement: '정확도 및 성능 최적화',
            icon: <Brain className='w-6 h-6' />,
        },
        {
            title: '경량 ML 엔진 구현',
            before: 'TensorFlow.js 의존성',
            after: 'simple-statistics 기반',
            improvement: '번들 크기 30% 감소',
            icon: <Zap className='w-6 h-6' />,
        },
        {
            title: '모듈형 아키텍처',
            before: '단일 통합 시스템',
            after: 'AI 모듈 분리 설계',
            improvement: '확장성 및 유지보수성',
            icon: <Bot className='w-6 h-6' />,
        },
        {
            title: '실시간 데이터 처리',
            before: '정적 데이터 처리',
            after: '30개 서버 실시간 모니터링',
            improvement: '시스템 응답성 향상',
            icon: <Server className='w-6 h-6' />,
        },
        {
            title: '클라우드 연동',
            before: '로컬 메모리 캐시',
            after: 'Upstash Redis 클라우드',
            improvement: '데이터 영속성 확보',
            icon: <Database className='w-6 h-6' />,
        },
        {
            title: '사용자 경험 최적화',
            before: '외부 서비스 의존',
            after: '브라우저 네이티브 알림',
            improvement: '응답 속도 및 안정성',
            icon: <Shield className='w-6 h-6' />,
        },
        {
            title: '현대적 기술 스택',
            before: '레거시 기술',
            after: 'Next.js 15 + React 19',
            improvement: '개발 생산성 향상',
            icon: <Code2 className='w-6 h-6' />,
        },
        {
            title: '완전한 시스템 구축',
            before: '프로토타입 수준',
            after: '프로덕션 레벨 구현',
            improvement: '상용 서비스 준비 완료',
            icon: <BarChart3 className='w-6 h-6' />,
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
                     w-96 h-96 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 rounded-full blur-3xl'
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
                        <motion.h1 className='text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent'>
                            🤖 도메인 기반 AI 어시스턴트 개발
                        </motion.h1>
                        <p className='text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto'>
                            서버 모니터링 전용 AI 시스템 설계부터 구현까지 - 전문화된 개발 과정
                        </p>

                        {/* 핵심 기술 배지 */}
                        <div className='flex flex-wrap justify-center gap-4 mb-8'>
                            {['도메인 특화 AI', '경량 ML 엔진', 'LocalRAG 시스템', '패턴 매칭', 'TypeScript', 'Next.js 15', '클라우드 배포', '모듈 아키텍처'].map(achievement => (
                                <span
                                    key={achievement}
                                    className='px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium'
                                >
                                    ⚡ {achievement}
                                </span>
                            ))}
                        </div>
                    </motion.div>

                    {/* 개발 단계 섹션 */}
                    <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16'>
                        {developmentSteps.map((step, index) => (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative p-6 rounded-2xl bg-gradient-to-br ${isActive && currentStep >= index
                                    ? `${step.color} shadow-lg`
                                    : 'from-gray-800/50 to-gray-900/50'
                                    } border border-gray-700/50 backdrop-blur-sm`}
                            >
                                <div className='flex items-center justify-between mb-4'>
                                    <h3 className='text-lg font-bold text-white'>{step.title}</h3>
                                    {isActive && currentStep >= index && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className='w-6 h-6 bg-green-400 rounded-full flex items-center justify-center'
                                        >
                                            <CheckCircle2 className='w-4 h-4 text-green-900' />
                                        </motion.div>
                                    )}
                                </div>
                                <p className='text-gray-300 text-sm mb-3'>{step.description}</p>
                                <p className='text-gray-400 text-xs mb-4'>{step.details}</p>
                                <div className='flex flex-wrap gap-2'>
                                    {step.tools.map(tool => (
                                        <span
                                            key={tool}
                                            className='px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300'
                                        >
                                            {tool}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* 성과 섹션 */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className='mb-16'
                    >
                        <h2 className='text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent'>
                            🏆 주요 성과
                        </h2>
                        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
                            {achievements.map((achievement, index) => (
                                <motion.div
                                    key={achievement.title}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.9 + index * 0.1 }}
                                    className='p-6 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 
                                             border border-gray-700/50 backdrop-blur-sm hover:scale-105 transition-transform'
                                >
                                    <div className='flex items-center space-x-3 mb-4'>
                                        <div className='p-2 bg-blue-500/20 rounded-lg text-blue-400'>
                                            {achievement.icon}
                                        </div>
                                        <h3 className='font-bold text-white text-sm'>{achievement.title}</h3>
                                    </div>
                                    <div className='space-y-2 text-xs'>
                                        <div className='flex justify-between'>
                                            <span className='text-red-400'>이전:</span>
                                            <span className='text-gray-400'>{achievement.before}</span>
                                        </div>
                                        <div className='flex justify-between'>
                                            <span className='text-green-400'>현재:</span>
                                            <span className='text-gray-300'>{achievement.after}</span>
                                        </div>
                                        <div className='pt-2 border-t border-gray-700'>
                                            <span className='text-blue-400 font-medium'>{achievement.improvement}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* 기술적 특징 */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                        className='text-center'
                    >
                        <h2 className='text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent'>
                            💡 핵심 기술 특징
                        </h2>
                        <div className='grid md:grid-cols-3 gap-8'>
                            <div className='p-6 rounded-2xl bg-gradient-to-br from-purple-800/30 to-purple-900/30 border border-purple-700/50'>
                                <Monitor className='w-12 h-12 text-purple-400 mx-auto mb-4' />
                                <h3 className='text-xl font-bold text-white mb-3'>모듈형 아키텍처</h3>
                                <p className='text-gray-300 text-sm'>
                                    기존 시스템에 AI 기능을 독립 모듈로 통합하여 확장성과 유지보수성을 극대화한 설계 방식
                                </p>
                            </div>
                            <div className='p-6 rounded-2xl bg-gradient-to-br from-blue-800/30 to-blue-900/30 border border-blue-700/50'>
                                <Brain className='w-12 h-12 text-blue-400 mx-auto mb-4' />
                                <h3 className='text-xl font-bold text-white mb-3'>도메인 특화 AI</h3>
                                <p className='text-gray-300 text-sm'>
                                    서버 모니터링 전용으로 최적화된 경량 AI 엔진으로 높은 정확도와 빠른 응답 속도 구현
                                </p>
                            </div>
                            <div className='p-6 rounded-2xl bg-gradient-to-br from-green-800/30 to-green-900/30 border border-green-700/50'>
                                <Zap className='w-12 h-12 text-green-400 mx-auto mb-4' />
                                <h3 className='text-xl font-bold text-white mb-3'>성능 최적화</h3>
                                <p className='text-gray-300 text-sm'>
                                    불필요한 의존성 제거와 경량 라이브러리 활용으로 시스템 성능과 사용자 경험 극대화
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
} 