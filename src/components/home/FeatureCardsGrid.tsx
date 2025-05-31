'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Database, Code2, Sparkles, Server, Zap, Layers, Cpu } from 'lucide-react';
import { FeatureModal } from './FeatureModal';

// 카드 데이터 타입 정의
export interface FeatureCardData {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  icon: any;
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  features: string[];
  actionText: string;
  actionUrl: string;
  isSpecial?: boolean;
}

// 4개 주요 기능 카드 데이터
export const featureCards: FeatureCardData[] = [
  {
    id: 'mcp-ai-agent',
    title: '지능형 AI 에이전트',
    description: 'MCP 기반 AI 시스템으로 자연어 분석 및 대응',
    detailedDescription: '서버 메트릭을 분석하여 원인 탐지, 예측, 최적화까지 수행하는 차세대 AI 시스템입니다.',
    icon: Brain,
    emoji: '🧠',
    gradientFrom: 'from-white/5',
    gradientTo: 'to-white/10',
    features: [
      'MCP Protocol 기반 AI 엔진으로 실시간 자연어 처리',
      'Python ML 모델과 TypeScript 엔진의 하이브리드 구조',
      'LLM 비용 없는 경량화 AI 추론 시스템',
      '도메인 특화 서버 모니터링 AI 에이전트',
      '패턴 매칭 기반 의도 분류 및 실시간 응답'
    ],
    actionText: 'AI 에이전트 보기',
    actionUrl: '/admin/ai-agent'
  },
  {
    id: 'prometheus-data-generator',
    title: 'Prometheus 데이터 생성기',
    description: '실시간 서버 메트릭 시뮬레이터와 고성능 모니터링',
    detailedDescription: 'Prometheus 메트릭을 실시간으로 생성하고 다양한 서버 시나리오를 시뮬레이션하는 고성능 데이터 엔진입니다.',
    icon: Database,
    emoji: '📊',
    gradientFrom: 'from-white/5',
    gradientTo: 'to-white/10',
    features: [
      'Prometheus 호환 메트릭 실시간 생성 (65% 압축률)',
      'Normal, High-Load, Maintenance 시나리오 시뮬레이션',
      'TimerManager 최적화로 CPU 사용량 40% 감소',
      'Redis 기반 고성능 캐싱 및 데이터 저장',
      'Grafana 대시보드 연동 및 실시간 시각화'
    ],
    actionText: '데이터 생성기 보기',
    actionUrl: '/dashboard'
  },
  {
    id: 'modern-tech-stack',
    title: '최신 기술 스택',
    description: 'Next.js 14 + Supabase + Redis 통합 아키텍처',
    detailedDescription: '최신 웹 기술 스택으로 구축된 확장 가능하고 성능 최적화된 모던 아키텍처입니다.',
    icon: Layers,
    emoji: '🚀',
    gradientFrom: 'from-white/5',
    gradientTo: 'to-white/10',
    features: [
      'Next.js 14 App Router + TypeScript 100% 적용',
      'Supabase PostgreSQL + Redis 하이브리드 데이터베이스',
      'Vercel 배포 + GitHub Actions CI/CD 파이프라인',
      'Tailwind CSS + Framer Motion 모던 UI/UX',
      'Playwright E2E 테스트 + Vitest 단위 테스트'
    ],
    actionText: '기술 스택 보기',
    actionUrl: '/admin/charts'
  },
  {
    id: 'vibe-coding',
    title: '바이브 코딩 경험',
    description: 'Cursor AI + Claude 협업으로 구현된 차세대 개발 방식',
    detailedDescription: 'AI 협업을 통해 전체 시스템을 구축한 혁신적인 개발 경험과 4단계 개발 프로세스를 소개합니다.',
    icon: Sparkles,
    emoji: '✨',
    gradientFrom: 'from-yellow-500/80',
    gradientTo: 'to-amber-600/80',
    features: [
      'Cursor AI Composer를 활용한 멀티파일 동시 편집',
      'Claude 3.5 Sonnet 기반 아키텍처 설계 및 문서화',
      'GitHub Copilot 보일러플레이트 생성 및 테스트 자동화',
      '86개 페이지 자동 생성 및 타입 에러 0% 달성',
      '4단계 Vibe Coding 프로세스 인터랙티브 시연'
    ],
    actionText: 'Vibe Coding 보기',
    actionUrl: '/vibe-coding',
    isSpecial: true
  }
];

interface FeatureCardsGridProps {
  className?: string;
}

export const FeatureCardsGrid: React.FC<FeatureCardsGridProps> = ({ className = '' }) => {
  const [selectedFeature, setSelectedFeature] = useState<FeatureCardData | null>(null);

  const handleCardClick = (feature: FeatureCardData) => {
    setSelectedFeature(feature);
  };

  const handleCloseModal = () => {
    setSelectedFeature(null);
  };

  const handleAction = (url: string) => {
    window.open(url, '_blank');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <>
      <motion.div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto ${className}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {featureCards.map((feature, index) => (
          <motion.div
            key={feature.id}
            className={`
              relative group cursor-pointer
              p-4 sm:p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 font-mono
              ${feature.isSpecial 
                ? 'bg-gradient-to-br from-yellow-500/20 to-amber-600/20 border-yellow-400/40 shadow-lg shadow-yellow-500/20 hover:shadow-xl hover:shadow-yellow-500/30' 
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }
              hover:scale-105 hover:-translate-y-2
            `}
            variants={cardVariants}
            whileHover={{ 
              scale: 1.05,
              y: -8,
              rotateY: feature.isSpecial ? 3 : 1,
              transition: { type: "spring", stiffness: 300 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick(feature)}
          >
            {/* 바이브 코딩 특수 효과 - 황금 글로우 */}
            {feature.isSpecial && (
              <>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-amber-300/15 to-yellow-500/10 rounded-2xl"
                  animate={{
                    opacity: [0.3, 0.7, 0.3],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                {/* 황금 파티클 효과 */}
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full opacity-80"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </>
            )}

            {/* 아이콘 영역 */}
            <div className="flex items-start justify-between mb-4">
              <motion.div
                className={`
                  w-12 h-12 sm:w-14 sm:h-14 rounded-xl backdrop-blur-sm flex items-center justify-center
                  ${feature.isSpecial ? 'bg-yellow-500/20' : 'bg-white/10'}
                `}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </motion.div>
              
              <motion.div
                className="text-3xl sm:text-4xl opacity-60"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {feature.emoji}
              </motion.div>
            </div>

            {/* 텍스트 영역 - 키워드 그라데이션 적용 */}
            <div className="space-y-3">
              <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-white/90 transition-colors font-mono leading-tight">
                {">"} 
                {feature.id === 'mcp-ai-agent' && (
                  <>지능형 <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">AI</span> 에이전트</>
                )}
                {feature.id === 'prometheus-data-generator' && (
                  <><span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Prometheus</span> 데이터 생성기</>
                )}
                {feature.id === 'modern-tech-stack' && (
                  <>최신 <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">기술</span> 스택</>
                )}
                {feature.id === 'vibe-coding' && (
                  <><span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">바이브</span> 코딩 경험</>
                )}
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed font-mono">
                {feature.description}
              </p>
            </div>

            {/* 호버 효과용 그라데이션 오버레이 */}
            <motion.div
              className={`
                absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
                ${feature.isSpecial 
                  ? 'bg-gradient-to-br from-yellow-500/10 to-amber-500/10' 
                  : 'bg-gradient-to-br from-white/5 to-white/10'
                }
              `}
              initial={false}
            />

            {/* 클릭 힌트 */}
            <motion.div
              className={`
                absolute bottom-3 right-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono
                ${feature.isSpecial ? 'text-yellow-400' : 'text-green-400'}
              `}
              initial={false}
            >
              [ENTER] 자세히 보기
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* 모달 */}
      {selectedFeature && (
        <FeatureModal
          feature={selectedFeature}
          onClose={handleCloseModal}
          onAction={handleAction}
        />
      )}
    </>
  );
}; 