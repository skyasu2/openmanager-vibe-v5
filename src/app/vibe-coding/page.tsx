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

export default function AICollaborationPage() {
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
      after: '86개 페이지 생성',
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
              ⚡ AI 협업 개발 과정
            </motion.h1>
            <p className='text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto'>
              Cursor AI의 MCP 개발도구와 AI 모델들을 활용한 1주일 집중 개발 과정
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
                '86개 페이지',
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
          <div className='mb-16'>
            <div className='text-center mb-12'>
              <h2 className='text-3xl font-bold text-white mb-4'>
                개발 단계별 프로세스
              </h2>
              <p className='text-gray-400'>실제 사용한 AI 도구와 개발 방법론</p>
            </div>

            {!isActive ? (
              <div className='text-center mb-12'>
                <motion.button
                  onClick={handleStart}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 
                             rounded-full text-white font-bold text-lg shadow-2xl
                             hover:from-blue-400 hover:to-purple-400 transition-all duration-300'
                >
                  <div className='flex items-center space-x-3'>
                    <Play className='w-6 h-6' />
                    <span>개발 과정 시연 시작</span>
                  </div>
                </motion.button>
              </div>
            ) : (
              <div className='mb-12'>
                <div className='text-center mb-6'>
                  <span className='text-lg text-blue-400 font-semibold'>
                    진행 상황: {currentStep + 1} / {developmentSteps.length}
                  </span>
                </div>
                <div className='w-full max-w-md mx-auto h-2 bg-gray-700 rounded-full overflow-hidden'>
                  <motion.div
                    className='h-full bg-gradient-to-r from-blue-400 to-purple-500'
                    initial={{ width: '0%' }}
                    animate={{
                      width: `${((currentStep + 1) / developmentSteps.length) * 100}%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* 개발 단계 카드 */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {developmentSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`
                    relative p-6 rounded-2xl backdrop-blur-lg border transition-all duration-500
                    ${
                      isActive && currentStep >= index
                        ? 'bg-white/10 border-blue-500/50'
                        : 'bg-white/5 border-white/10'
                    }
                  `}
                >
                  {/* 상태 표시 */}
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-xl font-bold text-white'>
                      {step.title}
                    </h3>
                    {isActive && currentStep >= index && (
                      <CheckCircle2 className='w-6 h-6 text-green-400' />
                    )}
                  </div>

                  <p className='text-gray-300 mb-4'>{step.description}</p>
                  <p className='text-sm text-gray-400 mb-4'>{step.details}</p>

                  {/* 사용 도구 */}
                  <div className='flex flex-wrap gap-2'>
                    {step.tools.map(tool => (
                      <span
                        key={tool}
                        className='px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs'
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 실제 달성 성과 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className='mb-16'
          >
            <div className='text-center mb-12'>
              <h2 className='text-3xl font-bold text-white mb-4'>
                측정 가능한 개선 성과
              </h2>
              <p className='text-gray-400'>Before & After 비교</p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.title}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className='p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10'
                >
                  <div className='flex items-center space-x-4 mb-4'>
                    <div className='text-blue-400'>{achievement.icon}</div>
                    <h3 className='text-lg font-bold text-white'>
                      {achievement.title}
                    </h3>
                  </div>

                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-red-400'>Before:</span>
                      <span className='text-gray-300'>
                        {achievement.before}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-green-400'>After:</span>
                      <span className='text-gray-300'>{achievement.after}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-blue-400'>결과:</span>
                      <span className='text-white font-semibold'>
                        {achievement.improvement}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 이중 MCP 아키텍처 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className='mb-16'
          >
            <div className='text-center mb-12'>
              <h2 className='text-3xl font-bold text-white mb-4'>
                🚀 MCP 활용 & 개발 아키텍처
              </h2>
              <p className='text-gray-400'>
                개발 도구 활용 방안 + AI 엔진 개발 결과물 분석
              </p>
            </div>

            {/* 아키텍처 구분 */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12'>
              {/* 1. MCP 도구 활용 방안 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className='p-6 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-lg rounded-2xl border-2 border-blue-500/30'
              >
                <div className='flex items-center space-x-3 mb-6'>
                  <Code2 className='w-10 h-10 text-blue-400' />
                  <div>
                    <h3 className='text-2xl font-bold text-blue-300'>
                      1️⃣ 바이브코딩시 MCP 도구 활용
                    </h3>
                    <p className='text-sm text-gray-400'>
                      개발 과정에서의 MCP 활용 방안
                    </p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div className='p-4 bg-blue-500/10 rounded-lg border border-blue-500/20'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <FileCode className='w-5 h-5 text-blue-400' />
                      <span className='font-semibold text-blue-300'>
                        Local Filesystem MCP
                      </span>
                    </div>
                    <p className='text-xs text-gray-300'>
                      프로젝트 파일 직접 접근, 실시간 코드 수정
                    </p>
                  </div>

                  <div className='p-4 bg-green-500/10 rounded-lg border border-green-500/20'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <GitBranch className='w-5 h-5 text-green-400' />
                      <span className='font-semibold text-green-300'>
                        GitHub Integration MCP
                      </span>
                    </div>
                    <p className='text-xs text-gray-300'>
                      Git 저장소 연동, 버전 관리 최적화
                    </p>
                  </div>

                  <div className='p-4 bg-purple-500/10 rounded-lg border border-purple-500/20'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <Monitor className='w-5 h-5 text-purple-400' />
                      <span className='font-semibold text-purple-300'>
                        Browser Tools MCP
                      </span>
                    </div>
                    <p className='text-xs text-gray-300'>
                      웹 검색, 문서 수집, API 테스트
                    </p>
                  </div>
                </div>

                <div className='mt-4 p-3 bg-blue-500/5 rounded-lg'>
                  <p className='text-xs text-blue-200'>
                    <strong>활용 효과:</strong> 코딩 속도 3배 향상, 실시간
                    컨텍스트 이해
                  </p>
                </div>
              </motion.div>

              {/* 2. AI 엔진 MCP 개발 결과물 */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className='p-6 bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-lg rounded-2xl border-2 border-orange-500/30'
              >
                <div className='flex items-center space-x-3 mb-6'>
                  <Brain className='w-10 h-10 text-orange-400' />
                  <div>
                    <h3 className='text-2xl font-bold text-orange-300'>
                      2️⃣ AI 엔진용 MCP 서버 개발
                    </h3>
                    <p className='text-sm text-gray-400'>
                      실제 개발한 MCP 서버 시스템
                    </p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div className='p-4 bg-orange-500/10 rounded-lg border border-orange-500/20'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <Cpu className='w-5 h-5 text-orange-400' />
                      <span className='font-semibold text-orange-300'>
                        OpenManager MCP Server
                      </span>
                    </div>
                    <p className='text-xs text-gray-300'>
                      서버 모니터링 데이터 전용 분석
                    </p>
                  </div>

                  <div className='p-4 bg-red-500/10 rounded-lg border border-red-500/20'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <Database className='w-5 h-5 text-red-400' />
                      <span className='font-semibold text-red-300'>
                        HTTP API Server
                      </span>
                    </div>
                    <p className='text-xs text-gray-300'>
                      Render.com 배포, 포트 10000
                    </p>
                  </div>

                  <div className='p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <Zap className='w-5 h-5 text-yellow-400' />
                      <span className='font-semibold text-yellow-300'>
                        AI Engine Integration
                      </span>
                    </div>
                    <p className='text-xs text-gray-300'>
                      AI 모델과 직접 통신, 데이터 분석
                    </p>
                  </div>
                </div>

                <div className='mt-4 p-3 bg-orange-500/5 rounded-lg'>
                  <p className='text-xs text-orange-200'>
                    <strong>개발 결과:</strong> HTTP API 서버, Render.com 배포
                    완료
                  </p>
                </div>
              </motion.div>
            </div>

            {/* 핵심 차이점 강조 */}
            <div className='text-center p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 backdrop-blur-lg rounded-2xl border border-cyan-500/20'>
              <h4 className='text-lg font-bold text-cyan-300 mb-4'>
                🎯 MCP 활용법 vs 개발 결과물 구분
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 text-sm'>
                <div className='space-y-2'>
                  <h5 className='font-bold text-blue-300'>
                    1️⃣ MCP 도구 활용 (개발 과정)
                  </h5>
                  <p className='text-gray-300'>
                    • <strong>성격:</strong> 개발할 때 사용한 도구
                    <br />• <strong>위치:</strong> Cursor IDE 로컬 환경
                    <br />• <strong>역할:</strong> 코딩 생산성 향상 지원
                    <br />• <strong>활용:</strong> Filesystem, GitHub, Browser
                  </p>
                </div>
                <div className='space-y-2'>
                  <h5 className='font-bold text-orange-300'>
                    2️⃣ MCP 서버 개발 (개발 결과물)
                  </h5>
                  <p className='text-gray-300'>
                    • <strong>성격:</strong> 실제로 개발한 시스템
                    <br />• <strong>위치:</strong> Render.com 클라우드 배포
                    <br />• <strong>역할:</strong> AI 엔진용 MCP 서버
                    <br />• <strong>구현:</strong> HTTP API, 포트 10000
                  </p>
                </div>
              </div>
              <div className='mt-4 p-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg'>
                <p className='text-xs text-green-200 font-semibold'>
                  🚀 <strong>핵심 구분:</strong> 개발 과정의 도구 활용 vs 실제
                  개발한 결과물을 명확히 분리
                </p>
              </div>
            </div>
          </motion.div>

          {/* 사용한 기술 스택 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className='text-center'
          >
            <h3 className='text-2xl font-bold text-white mb-6'>
              실제 사용한 기술 스택
            </h3>
            <div className='flex flex-wrap justify-center gap-3'>
              {[
                'MCP Tools Usage',
                'MCP Server Development',
                'Cursor IDE Integration',
                'Render Cloud Deployment',
                'Claude 3.5 Sonnet',
                'HTTP API Server',
                'Next.js 15.3.2',
                'TypeScript',
                'React 19',
                'TailwindCSS',
                'Framer Motion',
                'Vercel',
                'Node.js',
              ].map((tech, index) => (
                <motion.span
                  key={tech}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className='px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 
                             text-blue-300 rounded-full text-sm font-medium border border-blue-500/30'
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
