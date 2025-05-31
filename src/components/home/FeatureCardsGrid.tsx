'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Brain, 
  BarChart3, 
  Settings, 
  Sparkles,
  ExternalLink,
  Play,
  Code2,
  Server
} from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { FeatureModal } from './FeatureModal';

interface FeatureData {
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

const featureData: FeatureData[] = [
  {
    id: 'mcp-ai-agent',
    title: 'MCP AI 에이전트',
    description: '문서 기반 패턴 대응형 에이전트 시스템',
    detailedDescription: 'Model Context Protocol 기반으로 구축된 지능형 AI 에이전트입니다. 자연어 질의를 통해 서버 모니터링, 장애 분석, 성능 최적화 제안을 실시간으로 수행합니다.',
    icon: Brain,
    emoji: '🤖',
    gradientFrom: 'from-cyan-500/80',
    gradientTo: 'to-blue-600/80',
    features: [
      '자연어 기반 서버 질의 처리',
      'MCP 프로토콜 기반 문서 이해',
      '실시간 장애 패턴 분석',
      '자동 솔루션 추천 시스템',
      '멀티모달 데이터 분석'
    ],
    actionText: 'AI 에이전트 체험하기',
    actionUrl: '/test-ai-sidebar'
  },
  {
    id: 'data-simulator',
    title: '서버 데이터 시뮬레이터',
    description: '24시간 시계열 + 실시간 장애 데이터 자동 생성기',
    detailedDescription: '실제 서버 환경을 모방한 고도화된 데이터 시뮬레이터입니다. CPU, 메모리, 네트워크 등 다양한 메트릭을 실시간으로 생성하며, 장애 시나리오를 통해 AI 에이전트 학습을 지원합니다.',
    icon: BarChart3,
    emoji: '📊',
    gradientFrom: 'from-blue-500/80',
    gradientTo: 'to-indigo-600/80',
    features: [
      '실시간 서버 메트릭 시뮬레이션',
      '다양한 장애 시나리오 자동 생성',
      '24시간 연속 데이터 스트리밍',
      'Prometheus 메트릭 호환',
      '커스텀 패턴 정의 가능'
    ],
    actionText: '데이터 생성기 확인',
    actionUrl: '/admin-test'
  },
  {
    id: 'system-architecture',
    title: '전체 시스템 구조',
    description: '모듈 분리형 Next.js + MCP 아키텍처 기반',
    detailedDescription: '최신 웹 기술과 AI 프로토콜을 결합한 확장 가능한 아키텍처입니다. Next.js 14 App Router, TypeScript, Tailwind CSS, 그리고 MCP를 활용하여 모듈화된 구조로 설계되었습니다.',
    icon: Settings,
    emoji: '⚙️',
    gradientFrom: 'from-slate-500/80',
    gradientTo: 'to-gray-700/80',
    features: [
      'Next.js 14 App Router 기반',
      'TypeScript 완전 타입 안전성',
      'Tailwind CSS 모던 스타일링',
      'MCP 프로토콜 네이티브 지원',
      '모듈화된 확장 가능 구조'
    ],
    actionText: '아키텍처 문서 보기',
    actionUrl: '/docs/architecture'
  },
  {
    id: 'vibe-coding',
    title: 'Vibe Coding with Cursor',
    description: '자연어로 코드 자동 생성 – 진짜 AI 개발',
    detailedDescription: 'Cursor AI IDE를 활용한 혁신적인 개발 방식입니다. 자연어 프롬프트만으로 전체 기능을 구현하고, AI가 코드 작성부터 디버깅까지 모든 과정을 지원합니다.',
    icon: Sparkles,
    emoji: '✨',
    gradientFrom: 'from-yellow-400/80',
    gradientTo: 'to-orange-500/80',
    features: [
      'Cursor AI 기반 자연어 코딩',
      '실시간 코드 생성 및 수정',
      'AI 페어 프로그래밍 경험',
      '프롬프트 엔지니어링 최적화',
      'GitHub 연동 자동 배포'
    ],
    actionText: 'Vibe Coding 체험',
    actionUrl: '/vibe-coding',
    isSpecial: true
  }
];

export const FeatureCardsGrid: React.FC = () => {
  const router = useRouter();
  const [selectedFeature, setSelectedFeature] = useState<FeatureData | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const handleCardClick = (feature: FeatureData) => {
    setSelectedFeature(feature);
  };

  const handleActionClick = (url: string) => {
    setSelectedFeature(null);
    router.push(url);
  };

  return (
    <>
      <motion.div
        className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 섹션 헤더 */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            핵심 <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">기능</span>
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            AI 기반 서버 모니터링의 모든 것을 경험해보세요
          </p>
        </motion.div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
          {featureData.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              id={feature.id}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              emoji={feature.emoji}
              gradientFrom={feature.gradientFrom}
              gradientTo={feature.gradientTo}
              onClick={() => handleCardClick(feature)}
              index={index}
              isSpecial={feature.isSpecial}
            />
          ))}
        </div>

        {/* 하단 액션 버튼들 */}
        <motion.div
          className="mt-16 text-center space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard')}
            >
              <Server className="w-5 h-5" />
              대시보드 바로가기
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              className="group flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm rounded-xl font-semibold text-white border border-white/20 hover:bg-white/20 transition-all duration-300"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/docs')}
            >
              <Code2 className="w-5 h-5" />
              개발자 문서
            </motion.button>
          </div>

          <p className="text-white/60 text-sm">
            모든 기능이 실시간으로 작동합니다. 클릭하여 바로 체험해보세요!
          </p>
        </motion.div>
      </motion.div>

      {/* 기능 상세 모달 */}
      {selectedFeature && (
        <FeatureModal
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
          onAction={handleActionClick}
        />
      )}
    </>
  );
}; 