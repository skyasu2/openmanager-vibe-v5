'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import TechStackDisplay from '../ui/TechStackDisplay';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  gradient: string;
  detailedContent: {
    overview: string;
    features: string[];
    technologies: string[];
  };
  requiresAI: boolean;
  isAICard?: boolean;
  isSpecial?: boolean;
  isVibeCard?: boolean;
}

interface FeatureCardModalProps {
  selectedCard: FeatureCard | null | undefined;
  onClose: () => void;
  renderTextWithAIGradient: (text: string) => React.ReactNode;
  analyzedTechStack: any[];
  modalRef: React.RefObject<HTMLDivElement | null>;
  variant?: 'home' | 'landing';
}

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  analyzedTechStack,
  modalRef,
  variant = 'home',
}: FeatureCardModalProps) {
  if (!selectedCard) return null;

  const isHomeVariant = variant === 'home';

  return (
    <AnimatePresence>
      <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md'>
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl ${
            isHomeVariant && selectedCard.isSpecial
              ? 'border-amber-500/50 bg-gradient-to-br from-gray-900/95 to-amber-900/20'
              : ''
          } ${
            isHomeVariant && selectedCard.isAICard
              ? 'border-pink-500/50 bg-gradient-to-br from-gray-900/95 to-pink-900/20'
              : ''
          }`}
        >
          {/* 헤더 */}
          <div
            className={`${isHomeVariant ? 'p-4' : 'sticky top-0 z-10 bg-gray-900/90 backdrop-blur-sm p-6'} border-b border-gray-700/50`}
          >
            <div className='flex items-start justify-between'>
              <div className='flex items-start gap-4'>
                <div
                  className={`${isHomeVariant ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br ${selectedCard.gradient} rounded-${isHomeVariant ? 'lg' : 'xl'} flex items-center justify-center ${
                    isHomeVariant && selectedCard.isSpecial
                      ? 'shadow-lg shadow-amber-500/25'
                      : ''
                  } ${
                    isHomeVariant && selectedCard.isAICard
                      ? 'shadow-lg shadow-pink-500/25'
                      : ''
                  }`}
                >
                  {selectedCard.isAICard ? (
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        rotate: {
                          duration: 8,
                          repeat: Infinity,
                          ease: 'linear',
                        },
                        scale: {
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                      }}
                    >
                      <selectedCard.icon
                        className={`${isHomeVariant ? 'w-5 h-5' : 'w-6 h-6'} text-white`}
                      />
                    </motion.div>
                  ) : selectedCard.isVibeCard ? (
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <selectedCard.icon
                        className={`${isHomeVariant ? 'w-5 h-5' : 'w-6 h-6'} text-white`}
                      />
                    </motion.div>
                  ) : (
                    <selectedCard.icon
                      className={`${isHomeVariant ? 'w-5 h-5' : 'w-6 h-6'} text-white`}
                    />
                  )}
                </div>
                <div>
                  <h2 className='text-lg font-bold text-white'>
                    {renderTextWithAIGradient(selectedCard.title)}
                  </h2>
                  <p className='text-xs text-gray-400'>
                    {renderTextWithAIGradient(selectedCard.description)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className='w-8 h-8 rounded-full bg-gray-800/50 hover:bg-gray-700/50 flex items-center justify-center transition-colors'
              >
                <X className='w-4 h-4 text-gray-400' />
              </button>
            </div>
          </div>

          {/* 상세 내용 */}
          <div
            className={`${isHomeVariant ? 'p-4' : 'p-6'} space-y-${isHomeVariant ? '4' : '6'}`}
          >
            {/* 개요 */}
            <div>
              <h3 className='text-white font-medium mb-2 text-base'>📖 개요</h3>
              <p className='text-gray-300 leading-relaxed text-sm'>
                {renderTextWithAIGradient(
                  selectedCard.detailedContent.overview
                )}
              </p>
            </div>

            {/* 주요 기능 */}
            <div>
              <h3 className='text-white font-medium mb-3 text-base'>
                ⚡ 주요 기능
              </h3>
              <ul className='space-y-2'>
                {selectedCard.detailedContent.features.map((feature, index) => (
                  <li key={index} className='flex items-start gap-2 text-xs'>
                    <div
                      className={`w-1 h-1 rounded-full mt-1.5 flex-shrink-0 ${
                        selectedCard.isAICard
                          ? 'bg-pink-400'
                          : isHomeVariant && selectedCard.isSpecial
                            ? 'bg-amber-400'
                            : 'bg-green-400'
                      }`}
                    />
                    <span className='text-gray-300 leading-relaxed'>
                      {renderTextWithAIGradient(feature)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 기술 스택 분석 */}
            <div>
              <TechStackDisplay
                categories={analyzedTechStack}
                showHeader={true}
                compact={true}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
