/**
 * 🧩 TechStackDisplay - 기술 스택 표시 컴포넌트
 *
 * 분석된 기술 스택을 역할별로 분류하여 아름답게 표시합니다.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TechCategory,
  TechItem,
  generateTechStackSummary,
} from '../../utils/TechStackAnalyzer';

interface TechStackDisplayProps {
  categories: TechCategory[];
  showHeader?: boolean;
  compact?: boolean;
  className?: string;
}

// 색상 매핑
const colorMap = {
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  pink: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  green: 'bg-green-500/20 text-green-300 border-green-500/30',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  gray: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  slate: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  red: 'bg-red-500/20 text-red-300 border-red-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

// 중요도별 스타일
const importanceStyles = {
  critical:
    'ring-2 ring-red-400/50 bg-gradient-to-br from-red-500/20 to-pink-500/20 shadow-lg shadow-red-500/20',
  high: 'ring-2 ring-yellow-400/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10',
  showcase:
    'ring-2 ring-purple-400/40 bg-gradient-to-br from-purple-500/15 to-indigo-500/15',
  medium: 'ring-1 ring-blue-400/20',
  low: 'ring-1 ring-gray-400/10',
};

const TechStackDisplay: React.FC<TechStackDisplayProps> = ({
  categories,
  showHeader = true,
  compact = false,
  className = '',
}) => {
  const summary = generateTechStackSummary(categories);

  if (categories.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className='text-gray-400 text-sm'>
          기술 스택 정보를 분석 중입니다...
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 및 요약 정보 */}
      {showHeader && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-6'
        >
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-white flex items-center gap-2'>
              🧩 기술 스택 분석
            </h3>
            <div className='flex items-center gap-4 text-xs text-gray-400'>
              <span>{summary.totalTechs}개 기술</span>
              <span>•</span>
              <span>{summary.categoryCount}개 분야</span>
              <span>•</span>
              <span className='text-amber-400'>{summary.coreCount}개 핵심</span>
            </div>
          </div>

          {/* 상위 카테고리 요약 */}
          <div className='flex flex-wrap gap-2 text-xs'>
            <span className='text-gray-400'>주요 분야:</span>
            {summary.topCategories.map((category, index) => (
              <span key={category} className='text-blue-300'>
                {category}
                {index < summary.topCategories.length - 1 && ', '}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* 카테고리별 기술 스택 */}
      <div className='space-y-6'>
        {categories.map((category, categoryIndex) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className='bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 backdrop-blur-sm'
          >
            {/* 카테고리 헤더 */}
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-3'>
                <span className='text-xl'>{category.icon}</span>
                <div>
                  <h4 className='text-white font-medium'>{category.name}</h4>
                  <p className='text-xs text-gray-400'>
                    {category.description}
                  </p>
                </div>
              </div>
              <div className='text-xs text-gray-500'>
                {category.items.length}개
              </div>
            </div>

            {/* 기술 항목들 */}
            <div
              className={`grid gap-3 ${
                compact
                  ? 'grid-cols-1 md:grid-cols-2'
                  : 'grid-cols-1 lg:grid-cols-2'
              }`}
            >
              {category.items.map((tech, techIndex) => (
                <motion.div
                  key={`${tech.name}-${techIndex}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: categoryIndex * 0.1 + techIndex * 0.05 }}
                  className={`
                    p-3 rounded-lg border transition-all duration-200 hover:scale-105
                    ${colorMap[category.color as keyof typeof colorMap] || colorMap.gray}
                    ${importanceStyles[tech.importance]}
                    ${tech.isCore ? 'shadow-lg shadow-amber-500/10' : ''}
                  `}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h5 className='font-medium text-sm truncate'>
                          {tech.name}
                        </h5>
                        {tech.isCore && (
                          <span className='px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs flex-shrink-0'>
                            핵심
                          </span>
                        )}
                        {tech.usageCount && tech.usageCount > 1 && (
                          <span className='px-1.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-xs flex-shrink-0'>
                            {tech.usageCount}회 사용
                          </span>
                        )}
                      </div>
                      {tech.categories && tech.categories.length > 1 && (
                        <div className='mb-2'>
                          <span className='text-xs text-gray-400'>
                            여러 영역:{' '}
                          </span>
                          <div className='flex flex-wrap gap-1 mt-1'>
                            {tech.categories.map((cat, idx) => {
                              const categoryInfo = categories.find(
                                c => c.id === cat
                              );
                              return categoryInfo ? (
                                <span
                                  key={idx}
                                  className='px-1 py-0.5 bg-gray-700/50 text-gray-300 rounded text-xs'
                                >
                                  {categoryInfo.icon} {categoryInfo.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      <p className='text-xs text-gray-300 leading-relaxed mb-2'>
                        {tech.description}
                      </p>
                      {!compact && tech.usage && (
                        <div className='text-xs text-gray-400 font-mono bg-gray-900/30 px-2 py-1 rounded'>
                          &quot;{tech.usage}&quot;
                        </div>
                      )}
                    </div>

                    {/* 중요도 표시 */}
                    <div className='flex-shrink-0'>
                      <div
                        className={`
                        w-2 h-2 rounded-full
                        ${
                          tech.importance === 'critical'
                            ? 'bg-red-500 shadow-lg shadow-red-500/50'
                            : tech.importance === 'high'
                              ? 'bg-yellow-400'
                              : tech.importance === 'showcase'
                                ? 'bg-purple-400'
                                : tech.importance === 'medium'
                                  ? 'bg-blue-400'
                                  : 'bg-green-400'
                        }
                      `}
                        title={`중요도: ${tech.importance}`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 카테고리 통계 */}
            <div className='mt-4 pt-3 border-t border-gray-700/30 flex items-center justify-between text-xs text-gray-400'>
              <div className='flex gap-4'>
                <span>
                  핵심: {category.items.filter(item => item.isCore).length}개
                </span>
                <span>
                  고중요도:{' '}
                  {
                    category.items.filter(
                      item =>
                        item.importance === 'critical' ||
                        item.importance === 'high'
                    ).length
                  }
                  개
                </span>
              </div>
              <div className='flex items-center gap-1'>
                <span>평균 중요도:</span>
                <div className='flex gap-0.5'>
                  {['critical', 'high', 'showcase', 'medium', 'low'].map(
                    level => {
                      const count = category.items.filter(
                        item => item.importance === level
                      ).length;
                      return count > 0 ? (
                        <div
                          key={level}
                          className={`w-1.5 h-1.5 rounded-full ${
                            level === 'critical'
                              ? 'bg-red-500'
                              : level === 'high'
                                ? 'bg-yellow-400'
                                : level === 'showcase'
                                  ? 'bg-purple-400'
                                  : level === 'medium'
                                    ? 'bg-blue-400'
                                    : 'bg-green-400'
                          }`}
                          style={{
                            opacity: count / category.items.length + 0.3,
                          }}
                        />
                      ) : null;
                    }
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 하단 요약 */}
      {!compact && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: categories.length * 0.1 }}
          className='mt-6 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/20'
        >
          <div className='text-center text-xs text-gray-300'>
            <div className='mb-2 font-medium'>🎯 기술 스택 요약</div>
            <div className='flex justify-center gap-6'>
              <span>
                총{' '}
                <span className='text-blue-300 font-medium'>
                  {summary.totalTechs}개
                </span>{' '}
                기술
              </span>
              <span>•</span>
              <span>
                <span className='text-amber-300 font-medium'>
                  {summary.coreCount}개
                </span>{' '}
                핵심 기술
              </span>
              <span>•</span>
              <span>
                <span className='text-green-300 font-medium'>
                  {summary.categoryCount}개
                </span>{' '}
                기술 분야
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TechStackDisplay;
