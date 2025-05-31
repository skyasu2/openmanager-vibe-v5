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
  Cpu
} from 'lucide-react';
import Link from 'next/link';

export default function AICollaborationPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const developmentSteps = [
    {
      id: 'analysis',
      title: '📋 문제 분석 & 설계',
      description: 'Claude와 함께 시스템 아키텍처 설계',
      details: 'MCP 시스템, 데이터 생성 엔진, 타이머 최적화 방향 결정',
      tools: ['Claude 3.5 Sonnet', 'GitHub Issues', 'Mermaid 다이어그램'],
      color: 'from-blue-400 to-blue-600',
      status: '완료'
    },
    {
      id: 'implementation',
      title: '⚡ Cursor AI 협업 코딩',
      description: 'Cursor Composer로 멀티파일 동시 편집',
      details: '507줄 데이터 생성 엔진, MCP 오케스트레이터, 타입 안전성 보장',
      tools: ['Cursor AI', 'TypeScript', 'ESLint', 'Prettier'],
      color: 'from-green-400 to-green-600',
      status: '완료'
    },
    {
      id: 'optimization',
      title: '🔧 시스템 최적화',
      description: '타이머 시스템 통합 및 성능 개선',
      details: '23개 개별 타이머 → 4개 통합 시스템으로 최적화',
      tools: ['Chrome DevTools', 'React DevTools', 'Performance Monitor'],
      color: 'from-purple-400 to-purple-600',
      status: '완료'
    },
    {
      id: 'deployment',
      title: '🚀 자동화된 배포',
      description: 'CI/CD 파이프라인 구축 및 모니터링',
      details: 'GitHub Actions, Vercel 자동 배포, 실시간 성능 모니터링',
      tools: ['GitHub Actions', 'Vercel', 'Render', 'Monitoring'],
      color: 'from-orange-400 to-orange-600',
      status: '완료'
    }
  ];

  const achievements = [
    {
      title: '타이머 시스템 최적화',
      before: '23개 개별 setInterval',
      after: '4개 통합 TimerManager',
      improvement: 'CPU 사용량 최적화',
      icon: <Clock className="w-6 h-6" />
    },
    {
      title: '데이터 압축 효율성',
      before: '100% 원본 데이터',
      after: '베이스라인+델타 방식',
      improvement: '65% 압축률 달성',
      icon: <Database className="w-6 h-6" />
    },
    {
      title: 'TypeScript 코드 품질',
      before: '혼재된 타입 시스템',
      after: '100% TypeScript 적용',
      improvement: '타입 안전성 보장',
      icon: <FileCode className="w-6 h-6" />
    },
    {
      title: '프로젝트 규모 확장',
      before: '기본 구조',
      after: '86개 페이지 생성',
      improvement: '완전한 시스템 구축',
      icon: <Monitor className="w-6 h-6" />
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      
      {/* 홈 버튼 */}
      <div className="absolute top-6 left-6 z-50">
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.1 }}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm 
                       rounded-full text-white hover:bg-white/20 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>홈으로</span>
          </motion.button>
        </Link>
      </div>

      {/* 동적 배경 */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                     w-96 h-96 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl"
        />
      </div>

      {/* 메인 컨텐트 */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-6xl mx-auto">
          
          {/* 헤더 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
            >
              ⚡ AI 협업 개발 과정
            </motion.h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Cursor AI, Claude, GitHub Copilot을 활용한 실제 개발 워크플로우
            </p>
            
            {/* 실제 성과 배지 */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {[
                '507줄 엔진 구현', '65% 압축률', '100% TypeScript', '86개 페이지'
              ].map((achievement) => (
                <span key={achievement} className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium">
                  ✅ {achievement}
                </span>
              ))}
            </div>
          </motion.div>

          {/* 개발 단계 섹션 */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">개발 단계별 프로세스</h2>
              <p className="text-gray-400">실제 사용한 AI 도구와 개발 방법론</p>
            </div>

            {!isActive ? (
              <div className="text-center mb-12">
                <motion.button
                  onClick={handleStart}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 
                             rounded-full text-white font-bold text-lg shadow-2xl
                             hover:from-blue-400 hover:to-purple-400 transition-all duration-300"
                >
                  <div className="flex items-center space-x-3">
                    <Play className="w-6 h-6" />
                    <span>개발 과정 시연 시작</span>
                  </div>
                </motion.button>
              </div>
            ) : (
              <div className="mb-12">
                <div className="text-center mb-6">
                  <span className="text-lg text-blue-400 font-semibold">
                    진행 상황: {currentStep + 1} / {developmentSteps.length}
                  </span>
                </div>
                <div className="w-full max-w-md mx-auto h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-400 to-purple-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentStep + 1) / developmentSteps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* 개발 단계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {developmentSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`
                    relative p-6 rounded-2xl backdrop-blur-lg border transition-all duration-500
                    ${isActive && currentStep >= index 
                      ? 'bg-white/10 border-blue-500/50' 
                      : 'bg-white/5 border-white/10'
                    }
                  `}
                >
                  {/* 상태 표시 */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">
                      {step.title}
                    </h3>
                    {isActive && currentStep >= index && (
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    )}
                  </div>
                  
                  <p className="text-gray-300 mb-4">{step.description}</p>
                  <p className="text-sm text-gray-400 mb-4">{step.details}</p>
                  
                  {/* 사용 도구 */}
                  <div className="flex flex-wrap gap-2">
                    {step.tools.map((tool) => (
                      <span key={tool} className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">
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
            className="mb-16"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">측정 가능한 개선 성과</h2>
              <p className="text-gray-400">Before & After 비교</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.title}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-blue-400">
                      {achievement.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {achievement.title}
                    </h3>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-red-400">Before:</span>
                      <span className="text-gray-300">{achievement.before}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-400">After:</span>
                      <span className="text-gray-300">{achievement.after}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-400">결과:</span>
                      <span className="text-white font-semibold">{achievement.improvement}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 사용한 기술 스택 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h3 className="text-2xl font-bold text-white mb-6">실제 사용한 기술 스택</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                'Cursor AI', 'Claude 3.5 Sonnet', 'GitHub Copilot', 'Next.js 15.3.2',
                'TypeScript', 'React 19', 'TailwindCSS', 'Framer Motion',
                'Vercel', 'GitHub Actions', 'Python FastAPI', 'Redis'
              ].map((tech, index) => (
                <motion.span
                  key={tech}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 
                             text-blue-300 rounded-full text-sm font-medium border border-blue-500/30"
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