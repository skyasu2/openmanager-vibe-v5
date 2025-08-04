'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import React, { useEffect } from 'react';
import type { 
  FeatureCardModalProps, 
  TechItem, 
  ImportanceLevel,
  TechCategory,
  ImportanceStyle,
  CategoryStyle 
} from '@/types/feature-card.types';
import { TECH_STACKS_DATA, IMPORTANCE_STYLES, CATEGORY_STYLES } from '@/data/tech-stacks.data';

export default function FeatureCardModal({
  selectedCard,
  onClose,
  renderTextWithAIGradient,
  modalRef,
  variant = 'home',
}: FeatureCardModalProps) {
  // 모달은 항상 다크 테마로 고정

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!selectedCard) return null;

  const { title, icon: Icon, gradient, detailedContent } = selectedCard;

  // 중요도별 스타일 가져오기
  const getImportanceStyle = (importance: ImportanceLevel): ImportanceStyle => {
    return IMPORTANCE_STYLES[importance];
  };

  // 카테고리별 스타일 가져오기
  const getCategoryStyle = (category: TechCategory): CategoryStyle => {
    return CATEGORY_STYLES[category];
  };

  // 기술 카드 컴포넌트 (과거 구현 참조)
  const TechCard = ({ tech, index }: { tech: TechItem; index: number }) => {
    const importanceStyle = getImportanceStyle(tech.importance);
    const categoryStyle = getCategoryStyle(tech.category);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`rounded-lg border p-4 ${importanceStyle.bg} transition-all duration-300 hover:scale-105`}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{tech.icon}</span>
            <div>
              <h4 className="text-sm font-semibold text-white">{tech.name}</h4>
              {tech.version && (
                <span className="text-xs text-gray-400">v{tech.version}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${importanceStyle.badge}`}
            >
              {importanceStyle.label}
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs ${categoryStyle.bg} ${categoryStyle.color}`}
            >
              {tech.category}
            </span>
          </div>
        </div>

        <p className="mb-2 text-xs leading-relaxed text-gray-300">
          {tech.description}
        </p>

        <div className="mb-3 rounded bg-gray-800/50 p-2 text-xs text-gray-400">
          <strong className="text-gray-300">구현:</strong> {tech.implementation}
        </div>

        <div className="flex flex-wrap gap-1">
          {tech.tags.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="rounded bg-gray-700/50 px-2 py-1 text-xs text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    );
  };

  const techCards = TECH_STACKS_DATA[selectedCard.id] || [];

  // 중요도별 기술 분류
  const criticalTech = techCards.filter(
    (tech) => tech.importance === 'critical'
  );
  const highTech = techCards.filter((tech) => tech.importance === 'high');
  const mediumTech = techCards.filter((tech) => tech.importance === 'medium');
  const lowTech = techCards.filter((tech) => tech.importance === 'low');

  const mainContent = (
    <div className="p-6 text-white">
      {/* 헤더 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <div
          className={`mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h3 className="mb-3 text-2xl font-bold">
          {renderTextWithAIGradient(title)}
        </h3>
        <p className="mx-auto max-w-2xl text-sm text-gray-300">
          {detailedContent.overview}
        </p>
      </motion.div>

      {/* 중요도별 기술 스택 섹션 */}
      <div className="space-y-8">
        {/* 필수 기술 (Critical) */}
        {criticalTech.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h4 className="flex items-center gap-2 text-lg font-semibold text-red-300">
              <div className="h-3 w-3 rounded-full bg-red-400"></div>
              필수 기술 (Critical)
              <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-300">
                {criticalTech.length}개
              </span>
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {criticalTech.map((tech, index) => (
                <TechCard key={tech.name} tech={tech} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {/* 중요 기술 (High) */}
        {highTech.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h4 className="flex items-center gap-2 text-lg font-semibold text-orange-300">
              <div className="h-3 w-3 rounded-full bg-orange-400"></div>
              중요 기술 (High)
              <span className="rounded-full bg-orange-500/20 px-2 py-1 text-xs text-orange-300">
                {highTech.length}개
              </span>
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {highTech.map((tech, index) => (
                <TechCard key={tech.name} tech={tech} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {/* 보통 기술 (Medium) */}
        {mediumTech.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h4 className="flex items-center gap-2 text-lg font-semibold text-blue-300">
              <div className="h-3 w-3 rounded-full bg-blue-400"></div>
              보통 기술 (Medium)
              <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                {mediumTech.length}개
              </span>
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {mediumTech.map((tech, index) => (
                <TechCard key={tech.name} tech={tech} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {/* 낮은 우선순위 기술 (Low) */}
        {lowTech.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-300">
              <div className="h-3 w-3 rounded-full bg-gray-400"></div>
              보조 기술 (Low)
              <span className="rounded-full bg-gray-500/20 px-2 py-1 text-xs text-gray-300">
                {lowTech.length}개
              </span>
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {lowTech.map((tech, index) => (
                <TechCard key={tech.name} tech={tech} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
        data-modal-version="v2.0-unified-scroll"
      >
        {/* 개선된 배경 블러 효과 */}
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

        {/* 개선된 모달 컨텐츠 */}
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-600/50 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          data-modal-content="unified-scroll-v2"
        >
          <div
            className={`absolute left-0 right-0 top-0 h-48 bg-gradient-to-b ${gradient} opacity-20 blur-3xl`}
          ></div>
          <div className="relative z-10 flex h-full flex-col">
            <header className="flex flex-shrink-0 items-center justify-between border-b border-gray-700/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800">
                  <Icon
                    className="h-5 w-5"
                    style={{
                      color: variant === 'home' ? 'white' : 'currentColor',
                    }}
                  />
                </div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                aria-label="Close modal"
              >
                <X size={20} />
              </motion.button>
            </header>
            <div
              className="overflow-y-auto scroll-smooth"
              style={{ maxHeight: 'calc(85vh - 80px)' }}
            >
              {mainContent}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
