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
            id: 'foundation',
            title: '🏗️ 기반 구조 설계',
            description: 'OpenManager 서버 모니터링 시스템 홈페이지 기획 및 Cursor AI 개발 환경 구축',
            details: 'Next.js 15.3.2 + React 19.1.0 + TypeScript 스택으로 현대적 웹 애플리케이션 구조 설계',
            tools: ['Cursor AI', 'Next.js 15.3.2', 'TypeScript', 'Tailwind CSS'],
            color: 'from-blue-400 to-blue-600',
            status: '완료',
        },
        {
            id: 'cicd',
            title: '🚀 CI/CD 파이프라인',
            description: 'GitHub 연동 및 Vercel 자동 배포 시스템 구축',
            details: 'Git 커밋 시 자동으로 Vercel에 배포되는 완전 자동화 개발 워크플로우 구현',
            tools: ['GitHub Actions', 'Vercel', 'Git Hooks'],
            color: 'from-green-400 to-green-600',
            status: '완료',
        },
        {
            id: 'frontend',
            title: '🎨 프론트엔드 구현',
            description: '서버 모니터링 대시보드 UI/UX 개발',
            details: '실시간 서버 상태 표시, 차트 시각화, 반응형 디자인 구현 (200,081라인)',
            tools: ['React 19.1.0', 'Framer Motion', 'Chart.js', 'Responsive Design'],
            color: 'from-purple-400 to-purple-600',
            status: '완료',
        },
        {
            id: 'data-generator',
            title: '🔧 서버데이터 생성기',
            description: '실제 서버를 대체하는 가상 서버 데이터 생성 시스템 개발',
            details: '30개 가상 서버의 CPU, 메모리, 디스크, 네트워크 메트릭을 실시간으로 시뮬레이션 (실제 서버 데이터로 취급)',
            tools: ['Node.js', 'Real-time Simulation', 'Data Modeling'],
            color: 'from-orange-400 to-orange-600',
            status: '완료',
        },
        {
            id: 'monitoring',
            title: '📊 모니터링 시스템',
            description: '서버 상태 모니터링 및 브라우저 알림 시스템 구현',
            details: '임계값 기반 브라우저 알림, 실시간 차트, 장애 감지 및 자동 보고서 생성 (Slack 알림 제거)',
            tools: ['WebSocket', 'Real-time Charts', 'Browser Notifications'],
            color: 'from-red-400 to-red-600',
            status: '완료',
        },
        {
            id: 'ai-assistant',
            title: '🤖 AI 어시스턴트 모듈',
            description: '기존 모니터링 시스템에 AI 기능을 모듈로 추가 (AI Assistant → AI Agent 리브랜딩 예정)',
            details: 'AI 사이드바를 통한 자연어 서버 질의 및 분석 기능 구현',
            tools: ['AI Sidebar', 'Natural Language Processing', 'Context Management'],
            color: 'from-indigo-400 to-indigo-600',
            status: '완료',
        },
        {
            id: 'ai-admin',
            title: '⚙️ AI 관리자 페이지',
            description: '프로필 기능에서 접근 가능한 별도 AI 관리 시스템',
            details: 'AI 엔진 설정, 컨텍스트 관리, 성능 모니터링 전용 관리자 인터페이스',
            tools: ['Admin Dashboard', 'Profile Integration', 'AI Configuration'],
            color: 'from-cyan-400 to-cyan-600',
            status: '완료',
        },
        {
            id: 'lightweight-ai',
            title: '🧠 경량 AI 엔진 개발',
            description: 'TensorFlow 완전 제거 후 경량 ML 엔진 기반 룰 패턴 대응 AI 시스템',
            details: '외부 LLM 없이 서버 모니터링 도메인 특화 컨텍스트로 질의응답 (simple-statistics, ml-regression 활용)',
            tools: ['LocalRAG Engine', 'Pattern Matching', 'Domain Context', 'simple-statistics'],
            color: 'from-pink-400 to-pink-600',
            status: '완료',
        },
        {
            id: 'ai-collaboration',
            title: '🔧 AI 협업 고도화',
            description: 'Cursor AI Claude Sonnet 3.7과 개발한 AI 엔진 간의 API 통신을 통한 지속적 개선',
            details: 'AI 엔진의 컨텍스트 구성 및 패턴 매칭 알고리즘을 Cursor AI와 협업으로 고도화 (20일간 개발)',
            tools: ['Claude Sonnet 3.7', 'Cursor AI Collaboration', 'API Integration'],
            color: 'from-emerald-400 to-emerald-600',
            status: '완료',
        },
    ];

    const achievements = [
        {
            title: 'Cursor AI 바이브 코딩',
            before: '전통적인 IDE 개발',
            after: 'Claude Sonnet 3.7 협업',
            improvement: '개발 속도 6배 향상 (20일)',
            icon: <Code2 className='w-6 h-6' />,
        },
        {
            title: 'TensorFlow 완전 제거',
            before: 'TensorFlow.js 의존성',
            after: 'simple-statistics 경량화',
            improvement: '번들 크기 30% 감소',
            icon: <Zap className='w-6 h-6' />,
        },
        {
            title: '서버데이터 생성기',
            before: '실제 서버 의존성',
            after: '30개 가상 서버 (실제 취급)',
            improvement: '개발/테스트 환경 독립화',
            icon: <Server className='w-6 h-6' />,
        },
        {
            title: 'AI Assistant → Agent',
            before: '단일 통합 시스템',
            after: 'AI 사이드바 + 관리자 페이지',
            improvement: '모듈형 아키텍처 분리',
            icon: <Bot className='w-6 h-6' />,
        },
        {
            title: '도메인 특화 AI',
            before: '범용 AI 솔루션',
            after: '서버 모니터링 전용 컨텍스트',
            improvement: 'LocalRAG 독립 운영',
            icon: <Brain className='w-6 h-6' />,
        },
        {
            title: 'Slack → 브라우저 알림',
            before: 'Slack 웹훅 의존',
            after: '브라우저 네이티브 알림',
            improvement: '외부 의존성 제거',
            icon: <Shield className='w-6 h-6' />,
        },
        {
            title: 'Upstash Redis 연동',
            before: '메모리 기반 캐시',
            after: 'Redis 클라우드 연동',
            improvement: '데이터 영속성 확보',
            icon: <Database className='w-6 h-6' />,
        },
        {
            title: '프로젝트 규모',
            before: '기본 구조',
            after: '603파일, 200,081라인',
            improvement: '완전한 시스템 구축',
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
                            🔧 OpenManager 개발과정
                        </motion.h1>
                        <p className='text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto'>
                            서버 모니터링 시스템부터 AI 어시스턴트까지 - 체계적인 개발 여정
                        </p>

                        {/* 실제 성과 배지 */}
                        <div className='flex flex-wrap justify-center gap-4 mb-8'>
                            {['Claude Sonnet 3.7', 'TensorFlow 제거', '경량 AI 엔진', 'LocalRAG 독립', 'Upstash Redis', '브라우저 알림', '603파일 구축', '20일 개발'].map(achievement => (
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

                    {/* 시작 버튼 */}
                    {!isActive && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className='text-center mb-16'
                        >
                            <motion.button
                                onClick={handleStart}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className='px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 
                                         rounded-full text-white font-bold text-lg flex items-center 
                                         space-x-3 mx-auto shadow-lg hover:shadow-xl transition-all'
                            >
                                <Play className='w-6 h-6' />
                                <span>개발과정 시연 시작</span>
                                <ArrowRight className='w-6 h-6' />
                            </motion.button>
                        </motion.div>
                    )}

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
                            💡 핵심 개발 철학
                        </h2>
                        <div className='grid md:grid-cols-3 gap-8'>
                            <div className='p-6 rounded-2xl bg-gradient-to-br from-purple-800/30 to-purple-900/30 border border-purple-700/50'>
                                <Monitor className='w-12 h-12 text-purple-400 mx-auto mb-4' />
                                <h3 className='text-xl font-bold text-white mb-3'>모듈형 분리 설계</h3>
                                <p className='text-gray-300 text-sm'>
                                    기존 모니터링 시스템에 AI 어시스턴트를 독립 모듈로 추가. 향후 AI 에이전트로 리브랜딩 예정
                                </p>
                            </div>
                            <div className='p-6 rounded-2xl bg-gradient-to-br from-blue-800/30 to-blue-900/30 border border-blue-700/50'>
                                <Brain className='w-12 h-12 text-blue-400 mx-auto mb-4' />
                                <h3 className='text-xl font-bold text-white mb-3'>경량 AI 모델</h3>
                                <p className='text-gray-300 text-sm'>
                                    TensorFlow 제거 후 simple-statistics 기반 경량화. 외부 LLM 없이 룰 기반 패턴 매칭으로 서버 모니터링 특화
                                </p>
                            </div>
                            <div className='p-6 rounded-2xl bg-gradient-to-br from-green-800/30 to-green-900/30 border border-green-700/50'>
                                <Zap className='w-12 h-12 text-green-400 mx-auto mb-4' />
                                <h3 className='text-xl font-bold text-white mb-3'>AI로 만드는 AI</h3>
                                <p className='text-gray-300 text-sm'>
                                    Cursor AI Claude Sonnet 3.7이 직접 개발한 AI 엔진과 API 통신하며 컨텍스트 구성 및 패턴 매칭 고도화
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
} 