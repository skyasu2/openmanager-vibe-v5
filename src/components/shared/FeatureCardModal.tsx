'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  Star,
  Zap,
  Shield,
  TrendingUp,
  Database,
  Code,
  Cpu,
  Network,
  Globe,
  Settings,
  Monitor,
  Cloud,
  Brain,
  ArrowRight,
  ExternalLink,
  Rocket,
  Award,
  Target,
  Layers,
} from 'lucide-react';

interface FeatureCardModalProps {
  selectedCard: any;
  onClose: () => void;
  renderTextWithAIGradient: (text: string) => React.ReactNode;
  modalRef: React.RefObject<HTMLDivElement>;
  variant?: 'home' | 'landing';
  isDarkMode?: boolean;
}

// 기술 태그 컴포넌트
const TechTag = ({
  name,
  category,
  isDark = false,
}: {
  name: string;
  category: string;
  isDark?: boolean;
}) => {
  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: any } = {
      AI: Brain,
      Framework: Code,
      Database: Database,
      Cloud: Cloud,
      Tool: Settings,
      Frontend: Monitor,
      Backend: Network,
      Language: Globe,
      Testing: CheckCircle,
      Deployment: Rocket,
      Animation: Star,
      State: Layers,
    };
    return iconMap[category] || Settings;
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      AI: isDark
        ? 'from-pink-500 to-purple-500'
        : 'from-pink-400 to-purple-400',
      Framework: isDark
        ? 'from-blue-500 to-cyan-500'
        : 'from-blue-400 to-cyan-400',
      Database: isDark
        ? 'from-green-500 to-emerald-500'
        : 'from-green-400 to-emerald-400',
      Cloud: isDark
        ? 'from-indigo-500 to-purple-500'
        : 'from-indigo-400 to-purple-400',
      Tool: isDark
        ? 'from-gray-500 to-slate-500'
        : 'from-gray-400 to-slate-400',
      Frontend: isDark
        ? 'from-teal-500 to-cyan-500'
        : 'from-teal-400 to-cyan-400',
      Backend: isDark
        ? 'from-orange-500 to-red-500'
        : 'from-orange-400 to-red-400',
      Language: isDark
        ? 'from-violet-500 to-purple-500'
        : 'from-violet-400 to-purple-400',
      Testing: isDark
        ? 'from-lime-500 to-green-500'
        : 'from-lime-400 to-green-400',
      Deployment: isDark
        ? 'from-amber-500 to-orange-500'
        : 'from-amber-400 to-orange-400',
      Animation: isDark
        ? 'from-rose-500 to-pink-500'
        : 'from-rose-400 to-pink-400',
      State: isDark
        ? 'from-emerald-500 to-teal-500'
        : 'from-emerald-400 to-teal-400',
    };
    return (
      colorMap[category] ||
      (isDark ? 'from-gray-500 to-slate-500' : 'from-gray-400 to-slate-400')
    );
  };

  const IconComponent = getCategoryIcon(category);

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className={`group relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${isDark
        ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70'
        : 'bg-white border-gray-200 hover:shadow-md'
        }`}
    >
      {/* 아이콘 */}
      <div
        className={`w-12 h-12 rounded-lg bg-gradient-to-r ${getCategoryColor(category)} flex items-center justify-center`}
      >
        <IconComponent className='w-6 h-6 text-white' />
      </div>

      {/* 텍스트 */}
      <div className='flex-1'>
        <h4
          className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          {name}
        </h4>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {category}
        </p>
      </div>

      {/* 호버 효과 */}
      <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
        <ArrowRight
          className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
        />
      </div>
    </motion.div>
  );
};

// 특징 카드 컴포넌트
const FeatureCard = ({
  feature,
  index,
  isDark = false,
}: {
  feature: string;
  index: number;
  isDark?: boolean;
}) => {
  // 이모지와 텍스트 분리
  const emojiMatch = feature.match(
    /^([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u
  );
  const emoji = emojiMatch ? emojiMatch[0] : '✨';
  const text = feature.replace(
    /^([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])\s*/u,
    ''
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex items-start gap-4 p-4 rounded-lg transition-colors duration-300 ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'
        }`}
    >
      <div className='text-2xl'>{emoji}</div>
      <div className='flex-1'>
        <p
          className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
        >
          {text}
        </p>
      </div>
    </motion.div>
  );
};

// 카드별 기술 매핑
const getTechMapping = (cardId: string) => {
  const mappings: { [key: string]: Array<{ name: string; category: string }> } =
  {
    'mcp-ai-engine': [
      { name: 'MCP AI Server', category: 'AI' },
      { name: 'RAG Backup Engine', category: 'AI' },
      { name: 'TensorFlow.js', category: 'AI' },
      { name: 'Google AI Studio', category: 'AI' },
      { name: 'Vector Database', category: 'Database' },
      { name: 'Korean NLP', category: 'Language' },
      { name: 'Hybrid Deployment', category: 'Deployment' },
    ],
    'fullstack-ecosystem': [
      { name: 'Next.js 15', category: 'Framework' },
      { name: 'React 19', category: 'Frontend' },
      { name: 'TypeScript', category: 'Language' },
      { name: 'Serverless APIs', category: 'Backend' },
      { name: 'Vercel Deployment', category: 'Cloud' },
      { name: 'Render Hosting', category: 'Cloud' },
      { name: 'CI/CD Pipeline', category: 'Deployment' },
    ],
    'tech-stack': [
      { name: 'Next.js 15', category: 'Framework' },
      { name: 'TypeScript', category: 'Language' },
      { name: 'TailwindCSS', category: 'Frontend' },
      { name: 'Framer Motion', category: 'Animation' },
      { name: 'Supabase', category: 'Database' },
      { name: 'Redis', category: 'Database' },
      { name: 'Testing Suite', category: 'Testing' },
    ],
    'vibe-coding': [
      { name: 'Cursor AI', category: 'AI' },
      { name: 'Claude Sonnet', category: 'AI' },
      { name: 'MCP Protocol', category: 'Tool' },
      { name: 'GitHub Integration', category: 'Tool' },
      { name: 'Auto Deployment', category: 'Deployment' },
      { name: 'CI/CD Pipeline', category: 'Deployment' },
      { name: 'AI Workflow', category: 'AI' },
    ],
  };

  return mappings[cardId] || [];
};

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  modalRef,
  variant = 'home',
  isDarkMode = false,
}: FeatureCardModalProps) {
  // 키보드 네비게이션
  useEffect(() => {
    if (!selectedCard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard, onClose]);

  if (!selectedCard) return null;

  const techStack = getTechMapping(selectedCard.id);

  // 모달 애니메이션
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2 },
    },
  };

  return (
    <AnimatePresence mode='wait'>
      {/* 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isDarkMode ? 'bg-black/70' : 'bg-black/50'
          }`}
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          variants={modalVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
          onClick={e => e.stopPropagation()}
          className={`relative w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden ${isDarkMode
            ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 border border-gray-700/30'
            : 'bg-white'
            }`}
        >
          {/* 고정 헤더 */}
          <div
            className={`relative p-6 border-b ${isDarkMode
              ? 'border-gray-700/50 bg-gradient-to-r from-gray-800/40 to-gray-900/40'
              : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'
              }`}
          >
            {/* 배경 그라데이션 */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${selectedCard.gradient} opacity-5`}
            />

            <div className='relative flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div
                  className={`p-3 bg-gradient-to-br ${selectedCard.gradient} rounded-xl shadow-lg`}
                >
                  <selectedCard.icon className='w-8 h-8 text-white' />
                </div>
                <div>
                  <h2
                    className={`text-2xl md:text-3xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                  >
                    {selectedCard.title}
                  </h2>
                  <p
                    className={`text-sm md:text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}
                  >
                    {selectedCard.description}
                  </p>
                </div>
              </div>

              <motion.button
                onClick={onClose}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDarkMode
                  ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label='모달 닫기'
              >
                <X className='w-5 h-5' />
              </motion.button>
            </div>
          </div>

          {/* 스크롤 가능한 콘텐츠 영역 */}
          <div className='overflow-y-auto max-h-[calc(90vh-140px)] p-4 md:p-6 space-y-6 md:space-y-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500'>
            {/* 1. 시스템 개요 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`p-4 md:p-6 rounded-xl border ${isDarkMode
                ? 'bg-gray-800/30 border-gray-700/50'
                : 'bg-gray-50 border-gray-200'
                }`}
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                  <Target className={`w-4 h-4 md:w-5 md:h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                </div>
                <h3
                  className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                >
                  시스템 개요
                </h3>
              </div>
              <p
                className={`text-sm md:text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
              >
                {selectedCard.detailedContent.overview}
              </p>
            </motion.div>

            {/* 2. 주요 기능 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-4 md:p-6 rounded-xl border ${isDarkMode
                ? 'bg-gray-800/30 border-gray-700/50'
                : 'bg-gray-50 border-gray-200'
                }`}
            >
              <div className='flex items-center gap-3 mb-4 md:mb-6'>
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                  }`}>
                  <Award className={`w-4 h-4 md:w-5 md:h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                </div>
                <h3
                  className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                >
                  주요 기능
                </h3>
              </div>
              <div className='space-y-2 md:space-y-3'>
                {selectedCard.detailedContent.features.map(
                  (feature: string, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <FeatureCard
                        feature={feature}
                        index={index}
                        isDark={isDarkMode}
                      />
                    </motion.div>
                  )
                )}
              </div>
            </motion.div>

            {/* 3. 기술 스택 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`p-4 md:p-6 rounded-xl border ${isDarkMode
                ? 'bg-gray-800/30 border-gray-700/50'
                : 'bg-gray-50 border-gray-200'
                }`}
            >
              <div className='flex items-center gap-3 mb-4 md:mb-6'>
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100'
                  }`}>
                  <Layers className={`w-4 h-4 md:w-5 md:h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                </div>
                <h3
                  className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                >
                  적용 기술 스택
                </h3>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
                {techStack.map((tech, index) => (
                  <motion.div
                    key={tech.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                  >
                    <TechTag
                      name={tech.name}
                      category={tech.category}
                      isDark={isDarkMode}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 4. 추가 정보 카드 (새로운 섹션) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={`p-4 md:p-6 rounded-xl border ${isDarkMode
                ? 'bg-gradient-to-r from-gray-800/30 via-blue-900/20 to-purple-900/20 border-gray-700/50'
                : 'bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-gray-200'
                }`}
            >
              <div className='flex items-center gap-3 mb-4'>
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-500/20' : 'bg-orange-100'
                  }`}>
                  <Rocket className={`w-4 h-4 md:w-5 md:h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'
                    }`} />
                </div>
                <h3
                  className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                >
                  성능 특징
                </h3>
              </div>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4'>
                {[
                  { label: '응답시간', value: '<100ms', icon: '⚡' },
                  { label: '가용성', value: '99.9%', icon: '🛡️' },
                  { label: '확장성', value: '무제한', icon: '📈' },
                  { label: '보안성', value: 'Enterprise', icon: '🔒' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className={`text-center p-3 md:p-4 rounded-lg ${isDarkMode
                      ? 'bg-gray-700/30 border border-gray-600/30'
                      : 'bg-white border border-gray-200'
                      }`}
                  >
                    <div className='text-xl md:text-2xl mb-1 md:mb-2'>{stat.icon}</div>
                    <div className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                      {stat.value}
                    </div>
                    <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 스크롤 안내 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className='flex flex-col items-center pt-2 pb-4 space-y-2'
            >
              <div className={`text-xs text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                모든 정보를 확인했습니다
              </div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className={`text-lg ${isDarkMode ? 'text-gray-600' : 'text-gray-300'
                  }`}
              >
                ✨
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
