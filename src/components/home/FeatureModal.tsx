'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, CheckCircle } from 'lucide-react';

// FeatureCardsGrid와 동일한 타입 사용
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

interface FeatureModalProps {
  feature: FeatureCardData;
  onClose: () => void;
  onAction: (url: string) => void;
}

export const FeatureModal: React.FC<FeatureModalProps> = ({
  feature,
  onClose,
  onAction
}) => {
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: 100,
      rotateX: -15
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      rotateX: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.5
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: 100,
      transition: {
        duration: 0.3
      }
    }
  };

  const featureItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4
      }
    })
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        {/* 백드롭 */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* 모달 컨테이너 */}
        <motion.div
          className={`
            relative w-full max-w-2xl max-h-[90vh] overflow-hidden
            rounded-3xl backdrop-blur-xl border border-white/20
            bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientTo}
            ${feature.isSpecial ? 'ring-2 ring-yellow-400/50' : ''}
            shadow-2xl
          `}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* 특수 효과 - 황금카드용 */}
          {feature.isSpecial && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 via-gold-300/5 to-yellow-500/5"
              animate={{
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}

          {/* 닫기 버튼 */}
          <motion.button
            className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* 스크롤 가능한 컨텐츠 */}
          <div className="overflow-y-auto max-h-[90vh]">
            <div className="p-8 space-y-8">
              {/* 헤더 */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-center mb-6">
                  <motion.div
                    className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
                    whileHover={{ 
                      scale: 1.1, 
                      rotate: 360,
                      transition: { duration: 0.8 }
                    }}
                  >
                    <feature.icon className="w-10 h-10 text-white" />
                  </motion.div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-4">
                  {feature.title}
                </h2>
                <p className="text-white/90 text-lg leading-relaxed">
                  {feature.detailedDescription}
                </p>
              </motion.div>

              {/* 기능 목록 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  주요 기능
                </h3>
                <div className="space-y-4">
                  {feature.features.map((featureItem, index) => (
                    <motion.div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm"
                      custom={index}
                      variants={featureItemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <div className="w-2 h-2 rounded-full bg-white/60 mt-2 flex-shrink-0" />
                      <span className="text-white/90 leading-relaxed">
                        {featureItem}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* 액션 버튼 */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <motion.button
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm rounded-xl text-white font-medium hover:bg-white/30 transition-colors"
                  onClick={() => onAction(feature.actionUrl)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ExternalLink className="w-5 h-5" />
                  {feature.actionText}
                </motion.button>
              </motion.div>
            </div>
          </div>

          {/* 배경 장식 */}
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div className="absolute top-10 right-10 w-32 h-32 border border-white/20 rounded-full transform rotate-12" />
            <div className="absolute bottom-10 left-10 w-24 h-24 border border-white/20 rounded-lg transform -rotate-12" />
            <div className="absolute top-1/2 left-1/2 w-40 h-40 border border-white/10 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 