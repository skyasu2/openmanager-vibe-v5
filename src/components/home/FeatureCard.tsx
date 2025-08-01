'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import type { Variants } from 'framer-motion';

interface FeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  onClick: () => void;
  index: number;
  isSpecial?: boolean; // 황금카드용
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  id,
  title,
  description,
  icon: Icon,
  emoji,
  gradientFrom,
  gradientTo,
  onClick,
  index,
  isSpecial = false,
}) => {
  // 카드별 완성도 계산 (실제 프로젝트 진행률 기준)
  const getCompletionRate = (cardId: string) => {
    const completionRates: { [key: string]: number } = {
      'mcp-ai-engine': 95,
      'data-generator': 88,
      'tech-stack': 92,
      'cursor-ai': 85,
      default: 80,
    };
    return completionRates[cardId] || completionRates.default;
  };

  const completionRate = getCompletionRate(id);

  const cardVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: index * 0.1,
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      },
    },
    hover: {
      y: -12,
      scale: 1.03,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      },
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  };

  const hoverVariants: Variants = {
    hover: {
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)',
      transition: { duration: 0.3 },
    },
  };

  const glowVariants: Variants = {
    hover: {
      opacity: [0, 0.3, 0],
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const iconRotateVariants: Variants = {
    hover: {
      rotate: [0, 10, -10, 0],
      scale: [1, 1.2, 1],
      transition: {
        duration: 0.6,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      className="group relative"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
    >
      <motion.div
        className={`relative h-72 cursor-pointer overflow-hidden rounded-3xl border border-white/25 bg-gradient-to-br p-8 backdrop-blur-xl backdrop-filter ${gradientFrom} ${gradientTo} ${isSpecial ? 'ring-2 ring-yellow-400/50' : ''} cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl transition-all duration-300`}
        variants={hoverVariants}
        onClick={onClick}
      >
        {/* 특수 효과 - 황금카드용 */}
        {isSpecial && (
          <>
            <motion.div
              className="via-gold-300/10 absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-yellow-500/10"
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-yellow-400"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </>
        )}

        {/* 🎨 개선된 배경 패턴 */}
        <div className="absolute inset-0 overflow-hidden">
          {/* 메인 이모지 - 더 섬세한 투명도 */}
          <div className="absolute right-4 top-4 text-6xl opacity-15 transition-opacity duration-300 group-hover:opacity-25">
            {emoji}
          </div>

          {/* 기하학적 패턴들 */}
          <div className="border-white/8 absolute bottom-4 left-4 h-32 w-32 -rotate-12 transform rounded-full border transition-colors duration-300 group-hover:border-white/20" />
          <div className="border-white/8 absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rotate-45 transform rounded-lg border transition-colors duration-300 group-hover:border-white/20" />

          {/* 🆕 추가된 원형 패턴들 */}
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 transform rounded-full bg-white/5 transition-colors duration-300 group-hover:bg-white/10" />
          <div className="absolute bottom-0 left-0 h-16 w-16 -translate-x-4 translate-y-4 transform rounded-full bg-white/5 transition-colors duration-300 group-hover:bg-white/10" />

          {/* 🎯 새로운 미묘한 라인 패턴 */}
          <div className="absolute left-8 top-8 h-12 w-12">
            <div className="border-white/8 absolute inset-0 rounded-tl-lg border-l border-t transition-colors duration-300 group-hover:border-white/20" />
          </div>
        </div>

        {/* 강화된 글로우 효과 */}
        <motion.div
          className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent opacity-0"
          variants={glowVariants}
        />

        {/* 콘텐츠 */}
        <div className="relative z-10 flex h-full flex-col">
          {/* 🔥 아이콘 영역 - 강화된 애니메이션 */}
          <motion.div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 backdrop-blur-sm"
            variants={iconRotateVariants}
            whileHover={{
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderColor: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <Icon className="h-8 w-8 text-white" />
          </motion.div>

          {/* 📝 텍스트 영역 - 개선된 가독성 */}
          <div className="flex-1">
            <motion.h3
              className="mb-3 text-xl font-bold leading-tight"
              style={{
                color: 'rgba(255, 255, 255, 0.95)',
                fontWeight: 600,
                lineHeight: 1.4,
              }}
              whileHover={{ scale: 1.02 }}
            >
              {title}
            </motion.h3>
            <motion.p
              className="text-sm leading-relaxed"
              style={{
                color: 'rgba(255, 255, 255, 0.80)',
                lineHeight: 1.5,
                fontWeight: 500,
              }}
              whileHover={{ scale: 1.01 }}
            >
              {description}
            </motion.p>
          </div>

          {/* 🆕 진행률/완성도 표시 */}
          <motion.div
            className="mb-4 mt-4 flex items-center justify-between"
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
          >
            <span className="text-xs font-medium text-white/60">완성도</span>
            <div className="flex items-center gap-2">
              <div className="h-1 w-16 overflow-hidden rounded-full bg-white/20">
                <motion.div
                  className="h-full rounded-full bg-white/80"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                />
              </div>
              <span className="text-xs font-semibold text-white/90">
                {completionRate}%
              </span>
            </div>
          </motion.div>

          {/* 하단 액션 힌트 - 개선된 디자인 */}
          <motion.div
            className="flex items-center justify-between border-t border-white/20 pt-4"
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
          >
            <span className="text-xs font-medium text-white/80">
              클릭하여 자세히 보기
            </span>
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/20"
              whileHover={{
                scale: 1.3,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                rotate: 90,
                transition: { duration: 0.3 },
              }}
            >
              <svg
                className="h-3 w-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.div>
          </motion.div>
        </div>

        {/* 🔥 호버 시 강화된 보더 애니메이션 */}
        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-transparent"
          whileHover={{
            borderColor: 'rgba(255, 255, 255, 0.4)',
            boxShadow: '0 0 30px rgba(255, 255, 255, 0.2)',
            transition: { duration: 0.3 },
          }}
        />

        {/* 🆕 호버시 상단 라인 효과 */}
        <motion.div
          className="absolute left-0 right-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r from-transparent via-white/60 to-transparent"
          initial={{ scaleX: 0 }}
          whileHover={{
            scaleX: 1,
            transition: { duration: 0.4, ease: 'easeOut' },
          }}
        />

        {/* 🆕 미묘한 테두리 효과 */}
        <div className="absolute inset-0 rounded-3xl border border-white/10 transition-colors duration-300 group-hover:border-white/20" />
      </motion.div>
    </motion.div>
  );
};
