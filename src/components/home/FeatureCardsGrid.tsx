'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Database, Layers, Activity, Zap, Settings } from 'lucide-react';
import { FeatureModal } from './FeatureModal';

// 카드 데이터 타입 정의
export interface FeatureCardData {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  icon: any;
  gradientFrom: string;
  gradientTo: string;
  features: string[];
  actionText: string;
  actionUrl: string;
  isSpecial?: boolean;
}

// 3개 주요 기능 카드 데이터
export const featureCards: FeatureCardData[] = [
  {
    id: 'ai-agent',
    title: '지능형 AI 에이전트',
    description: 'MCP 기반 AI 시스템으로 자연어 분석 및 대응',
    detailedDescription: '서버 메트릭을 분석하여 원인 탐지, 예측, 최적화까지 수행하는 차세대 AI 시스템입니다.',
    icon: Brain,
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
    id: 'monitoring-system',
    title: 'Prometheus 모니터링',
    description: '실시간 서버 메트릭 수집과 고성능 데이터 분석',
    detailedDescription: 'Prometheus 메트릭을 실시간으로 수집하고 다양한 서버 시나리오를 모니터링하는 고성능 시스템입니다.',
    icon: Activity,
    gradientFrom: 'from-white/5',
    gradientTo: 'to-white/10',
    features: [
      'Prometheus 호환 메트릭 실시간 수집 및 분석',
      'Normal, High-Load, Maintenance 시나리오 감지',
      'TimerManager 최적화로 CPU 사용량 40% 감소',
      'Redis 기반 고성능 캐싱 및 데이터 저장',
      'Grafana 대시보드 연동 및 실시간 시각화'
    ],
    actionText: '모니터링 대시보드 보기',
    actionUrl: '/dashboard'
  },
  {
    id: 'tech-stack',
    title: '최신 기술 스택',
    description: 'Next.js 14 + Supabase + Redis 통합 아키텍처',
    detailedDescription: '최신 웹 기술 스택으로 구축된 확장 가능하고 성능 최적화된 모던 아키텍처입니다.',
    icon: Layers,
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
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto ${className}`}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {featureCards.map((feature, index) => (
          <motion.div
            key={feature.id}
            className="
              relative group cursor-pointer
              p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300
              bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20
              hover:scale-105 hover:-translate-y-2
            "
            variants={cardVariants}
            whileHover={{ 
              scale: 1.05,
              y: -8,
              transition: { type: "spring", stiffness: 300 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleCardClick(feature)}
          >
            {/* 아이콘 영역 */}
            <div className="flex items-start justify-start mb-6">
              <motion.div
                className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <feature.icon className="w-7 h-7 text-white" />
              </motion.div>
            </div>

            {/* 텍스트 영역 */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white group-hover:text-white/90 transition-colors leading-tight">
                {feature.id === 'ai-agent' && (
                  <>지능형 <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">AI</span> 에이전트</>
                )}
                {feature.id === 'monitoring-system' && (
                  <><span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Prometheus</span> 모니터링</>
                )}
                {feature.id === 'tech-stack' && (
                  <>최신 <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">기술</span> 스택</>
                )}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>

            {/* 호버 효과용 그라데이션 오버레이 */}
            <motion.div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/5 to-white/10"
              initial={false}
            />
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