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
      className='relative group'
      variants={cardVariants}
      initial='hidden'
      _animate='visible'
      whileHover='hover'
      whileTap='tap'
    >
      <motion.div
        className={`
          relative overflow-hidden cursor-pointer
          rounded-3xl p-8 h-72
          backdrop-filter backdrop-blur-xl 
          border border-white/25
          bg-gradient-to-br ${gradientFrom} ${gradientTo}
          ${isSpecial ? 'ring-2 ring-yellow-400/50' : ''}
          shadow-2xl
          transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)
        `}
        variants={hoverVariants}
        onClick={onClick}
      >
        {/* 특수 효과 - 황금카드용 */}
        {isSpecial && (
          <>
            <motion.div
              className='absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-gold-300/10 to-yellow-500/10'
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
              className='absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full'
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
        <div className='absolute inset-0 overflow-hidden'>
          {/* 메인 이모지 - 더 섬세한 투명도 */}
          <div className='absolute top-4 right-4 text-6xl opacity-15 group-hover:opacity-25 transition-opacity duration-300'>
            {emoji}
          </div>

          {/* 기하학적 패턴들 */}
          <div className='absolute bottom-4 left-4 w-32 h-32 border border-white/8 rounded-full transform -rotate-12 group-hover:border-white/20 transition-colors duration-300' />
          <div className='absolute top-1/2 left-1/2 w-16 h-16 border border-white/8 rounded-lg transform rotate-45 -translate-x-1/2 -translate-y-1/2 group-hover:border-white/20 transition-colors duration-300' />

          {/* 🆕 추가된 원형 패턴들 */}
          <div className='absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full transform translate-x-8 -translate-y-8 group-hover:bg-white/10 transition-colors duration-300' />
          <div className='absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full transform -translate-x-4 translate-y-4 group-hover:bg-white/10 transition-colors duration-300' />

          {/* 🎯 새로운 미묘한 라인 패턴 */}
          <div className='absolute top-8 left-8 w-12 h-12'>
            <div className='absolute inset-0 border-l border-t border-white/8 rounded-tl-lg group-hover:border-white/20 transition-colors duration-300' />
          </div>
        </div>

        {/* 강화된 글로우 효과 */}
        <motion.div
          className='absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent opacity-0'
          variants={glowVariants}
        />

        {/* 콘텐츠 */}
        <div className='relative z-10 h-full flex flex-col'>
          {/* 🔥 아이콘 영역 - 강화된 애니메이션 */}
          <motion.div
            className='flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30'
            variants={iconRotateVariants}
            whileHover={{
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderColor: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <Icon className='w-8 h-8 text-white' />
          </motion.div>

          {/* 📝 텍스트 영역 - 개선된 가독성 */}
          <div className='flex-1'>
            <motion.h3
              className='text-xl font-bold mb-3 leading-tight'
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
              className='text-sm leading-relaxed'
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
            className='flex items-center justify-between mt-4 mb-4'
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
          >
            <span className='text-xs text-white/60 font-medium'>완성도</span>
            <div className='flex items-center gap-2'>
              <div className='w-16 h-1 bg-white/20 rounded-full overflow-hidden'>
                <motion.div
                  className='h-full bg-white/80 rounded-full'
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                />
              </div>
              <span className='text-xs font-semibold text-white/90'>
                {completionRate}%
              </span>
            </div>
          </motion.div>

          {/* 하단 액션 힌트 - 개선된 디자인 */}
          <motion.div
            className='flex items-center justify-between pt-4 border-t border-white/20'
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
          >
            <span className='text-white/80 text-xs font-medium'>
              클릭하여 자세히 보기
            </span>
            <motion.div
              className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30'
              whileHover={{
                scale: 1.3,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                rotate: 90,
                transition: { duration: 0.3 },
              }}
            >
              <svg
                className='w-3 h-3 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </motion.div>
          </motion.div>
        </div>

        {/* 🔥 호버 시 강화된 보더 애니메이션 */}
        <motion.div
          className='absolute inset-0 rounded-3xl border-2 border-transparent'
          whileHover={{
            borderColor: 'rgba(255, 255, 255, 0.4)',
            boxShadow: '0 0 30px rgba(255, 255, 255, 0.2)',
            transition: { duration: 0.3 },
          }}
        />

        {/* 🆕 호버시 상단 라인 효과 */}
        <motion.div
          className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-t-3xl'
          initial={{ scaleX: 0 }}
          whileHover={{
            scaleX: 1,
            transition: { duration: 0.4, ease: 'easeOut' },
          }}
        />

        {/* 🆕 미묘한 테두리 효과 */}
        <div className='absolute inset-0 rounded-3xl border border-white/10 group-hover:border-white/20 transition-colors duration-300' />
      </motion.div>
    </motion.div>
  );
};
