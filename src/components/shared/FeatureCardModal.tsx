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
      className={`group relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 ${
        isDark
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
      className={`flex items-start gap-4 p-4 rounded-lg transition-colors duration-300 ${
        isDark ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'
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
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'tech'>(
    'overview'
  );

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
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          isDarkMode ? 'bg-black/70' : 'bg-black/50'
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
          className={`relative w-full max-w-6xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden ${
            isDarkMode
              ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 border border-gray-700/30'
              : 'bg-white'
          }`}
        >
          {/* 헤더 */}
          <div
            className={`relative p-8 border-b ${
              isDarkMode
                ? 'border-gray-700/50 bg-gradient-to-r from-gray-800/40 to-gray-900/40'
                : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'
            }`}
          >
            {/* 배경 그라데이션 */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${selectedCard.gradient} opacity-5`}
            />

            <div className='relative flex items-center justify-between'>
              <div className='flex items-center gap-6'>
                <div
                  className={`p-4 bg-gradient-to-br ${selectedCard.gradient} rounded-2xl shadow-lg`}
                >
                  <selectedCard.icon className='w-10 h-10 text-white' />
                </div>
                <div>
                  <h2
                    className={`text-4xl font-bold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {selectedCard.title}
                  </h2>
                  <p
                    className={`text-xl leading-relaxed ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {selectedCard.description}
                  </p>
                </div>
              </div>

              <motion.button
                onClick={onClose}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label='모달 닫기'
              >
                <X className='w-6 h-6' />
              </motion.button>
            </div>

            {/* 탭 네비게이션 */}
            <div className='flex gap-2 mt-6'>
              {[
                { id: 'overview', label: '개요', icon: Target },
                { id: 'features', label: '주요 기능', icon: Award },
                { id: 'tech', label: '기술 스택', icon: Layers },
              ].map(tab => {
                const IconComponent = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? isDarkMode
                          ? 'bg-white/10 text-white'
                          : 'bg-gray-900 text-white'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-white hover:bg-white/5'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <IconComponent className='w-4 h-4' />
                    {tab.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className='p-8 overflow-y-auto max-h-[calc(85vh-240px)]'>
            <AnimatePresence mode='wait'>
              {activeTab === 'overview' && (
                <motion.div
                  key='overview'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className='space-y-6'
                >
                  <div
                    className={`p-6 rounded-xl border ${
                      isDarkMode
                        ? 'bg-gray-800/30 border-gray-700/50'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <h3
                      className={`text-2xl font-bold mb-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      시스템 개요
                    </h3>
                    <p
                      className={`text-lg leading-relaxed ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      {selectedCard.detailedContent.overview}
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'features' && (
                <motion.div
                  key='features'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className='space-y-4'
                >
                  <h3
                    className={`text-2xl font-bold mb-6 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    주요 기능
                  </h3>
                  <div className='space-y-2'>
                    {selectedCard.detailedContent.features.map(
                      (feature: string, index: number) => (
                        <FeatureCard
                          key={index}
                          feature={feature}
                          index={index}
                          isDark={isDarkMode}
                        />
                      )
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'tech' && (
                <motion.div
                  key='tech'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className='space-y-6'
                >
                  <h3
                    className={`text-2xl font-bold mb-6 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    적용 기술 스택
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {techStack.map((tech, index) => (
                      <motion.div
                        key={tech.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
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
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
