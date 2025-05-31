'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

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
  isSpecial = false
}) => {
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 60,
      scale: 0.8
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        delay: index * 0.15,
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const hoverVariants = {
    hover: {
      scale: 1.05,
      y: -8,
      rotateY: 5,
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1
      }
    }
  };

  const glowVariants = {
    hover: {
      boxShadow: [
        '0 0 0 rgba(255, 255, 255, 0)',
        '0 20px 60px rgba(255, 255, 255, 0.1)',
        '0 25px 80px rgba(255, 255, 255, 0.15)'
      ],
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      className="relative"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
    >
      <motion.div
        className={`
          relative overflow-hidden cursor-pointer
          rounded-3xl p-8 h-72
          backdrop-blur-xl border border-white/20
          bg-gradient-to-br ${gradientFrom} ${gradientTo}
          ${isSpecial ? 'ring-2 ring-yellow-400/50' : ''}
          shadow-2xl
        `}
        variants={hoverVariants}
        onClick={onClick}
      >
        {/* 특수 효과 - 황금카드용 */}
        {isSpecial && (
          <>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-gold-300/10 to-yellow-500/10"
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.02, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </>
        )}

        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 text-6xl opacity-30">
            {emoji}
          </div>
          <div className="absolute bottom-4 left-4 w-32 h-32 border border-white/10 rounded-full transform -rotate-12" />
          <div className="absolute top-1/2 left-1/2 w-16 h-16 border border-white/10 rounded-lg transform rotate-45 -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* 글로우 효과 */}
        <motion.div
          className="absolute inset-0 rounded-3xl"
          variants={glowVariants}
        />

        {/* 콘텐츠 */}
        <div className="relative z-10 h-full flex flex-col">
          {/* 아이콘 영역 */}
          <motion.div
            className="flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-white/20 backdrop-blur-sm"
            whileHover={{ 
              scale: 1.1, 
              rotate: 360,
              transition: { duration: 0.6 }
            }}
          >
            <Icon className="w-8 h-8 text-white" />
          </motion.div>

          {/* 텍스트 영역 */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <motion.h3 
                className="text-xl font-bold text-white mb-3 leading-tight"
                whileHover={{ scale: 1.02 }}
              >
                {title}
              </motion.h3>
              <motion.p 
                className="text-white/90 text-sm leading-relaxed"
                whileHover={{ scale: 1.01 }}
              >
                {description}
              </motion.p>
            </div>

            {/* 하단 액션 힌트 */}
            <motion.div
              className="flex items-center justify-between mt-6 pt-4 border-t border-white/20"
              initial={{ opacity: 0.7 }}
              whileHover={{ opacity: 1 }}
            >
              <span className="text-white/80 text-xs font-medium">
                클릭하여 자세히 보기
              </span>
              <motion.div
                className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
                whileHover={{ 
                  scale: 1.2,
                  backgroundColor: "rgba(255, 255, 255, 0.3)"
                }}
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* 호버 시 보더 애니메이션 */}
        <motion.div
          className="absolute inset-0 rounded-3xl border-2 border-transparent"
          whileHover={{
            borderColor: "rgba(255, 255, 255, 0.3)",
            transition: { duration: 0.3 }
          }}
        />
      </motion.div>
    </motion.div>
  );
}; 