/**
 * 🧩 TechStackDisplay - 기술 스택 표시 컴포넌트
 *
 * 분석된 기술 스택을 역할별로 분류하여 아름답게 표시합니다.
 */

// React import 제거 - Next.js 15 자동 JSX Transform 사용
// framer-motion 제거 - CSS 애니메이션 사용
import { FC } from 'react';
import type { TechCategory, TechItem } from '../../utils/TechStackAnalyzer';
import { generateTechStackSummary } from '../../utils/TechStackAnalyzer';

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

const TechStackDisplay: FC<TechStackDisplayProps> = ({
  categories,
  showHeader = true,
  compact = false,
  className = '',
}) => {
  const summary = generateTechStackSummary(categories);

  if (categories.length === 0) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <div className="text-sm text-gray-400">
          기술 스택 정보를 분석 중입니다...
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 및 요약 정보 */}
      {showHeader && (
        <div
          className="mb-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
              🧩 기술 스택 분석
            </h3>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{summary.totalTechs}개 기술</span>
              <span>•</span>
              <span>{summary.categoryCount}개 분야</span>
              <span>•</span>
              <span className="text-amber-400">{summary.coreCount}개 핵심</span>
            </div>
          </div>

          {/* 상위 카테고리 요약 */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-gray-400">주요 분야:</span>
            {summary.topCategories.map((category: string, index: number) => (
              <span key={category} className="text-blue-300">
                {category}
                {index < summary.topCategories.length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 카테고리별 기술 스택 */}
      <div className="space-y-6">
        {categories.map((category: TechCategory, categoryIndex: number) => (
          <div
            key={category.id}
            className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4 backdrop-blur-sm"
          >
            {/* 카테고리 헤더 */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{category.icon}</span>
                <div>
                  <h4 className="font-medium text-white">{category.name}</h4>
                  <p className="text-xs text-gray-400">
                    {category.description}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
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
              {category.items.map((tech: TechItem, techIndex: number) => (
                <div
                  key={`${tech.name}-${techIndex}`}
                  className={`rounded-lg border p-3 transition-all duration-200 hover:scale-105 ${colorMap[category.color as keyof typeof colorMap] || colorMap.gray} ${importanceStyles[tech.importance] || importanceStyles.medium} ${tech.isCore ? 'shadow-lg shadow-amber-500/10' : ''} `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h5 className="truncate text-sm font-medium">
                          {tech.name}
                        </h5>
                        {tech.isCore && (
                          <span className="flex-shrink-0 rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-300">
                            핵심
                          </span>
                        )}
                        {tech.usageCount && tech.usageCount > 1 && (
                          <span className="flex-shrink-0 rounded border border-purple-500/30 bg-purple-500/20 px-1.5 py-0.5 text-xs text-purple-300">
                            {tech.usageCount}회 사용
                          </span>
                        )}
                      </div>
                      {tech.categories && tech.categories.length > 1 && (
                        <div className="mb-2">
                          <span className="text-xs text-gray-400">
                            여러 영역:{' '}
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {tech.categories.map((cat: string, idx: number) => {
                              const categoryInfo = categories.find(
                                (c) => c.id === cat
                              );
                              return categoryInfo ? (
                                <span
                                  key={idx}
                                  className="rounded bg-gray-700/50 px-1 py-0.5 text-xs text-gray-300"
                                >
                                  {categoryInfo.icon} {categoryInfo.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      <p className="mb-2 text-xs leading-relaxed text-gray-300">
                        {tech.description}
                      </p>
                      {!compact && tech.usage && (
                        <div className="rounded bg-gray-900/30 px-2 py-1 font-mono text-xs text-gray-400">
                          &quot;{tech.usage}&quot;
                        </div>
                      )}
                    </div>

                    {/* 중요도 표시 */}
                    <div className="flex-shrink-0">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          tech.importance === 'critical'
                            ? 'bg-red-500 shadow-lg shadow-red-500/50'
                            : tech.importance === 'high'
                              ? 'bg-yellow-400'
                              : tech.importance === 'showcase'
                                ? 'bg-purple-400'
                                : tech.importance === 'medium'
                                  ? 'bg-blue-400'
                                  : 'bg-green-400'
                        } `}
                        title={`중요도: ${tech.importance}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 카테고리 통계 */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-700/30 pt-3 text-xs text-gray-400">
              <div className="flex gap-4">
                <span>
                  핵심: {category.items.filter((item: TechItem) => item.isCore).length}개
                </span>
                <span>
                  고중요도:{' '}
                  {
                    category.items.filter(
                      (item: TechItem) =>
                        item.importance === 'critical' ||
                        item.importance === 'high'
                    ).length
                  }
                  개
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>평균 중요도:</span>
                <div className="flex gap-0.5">
                  {['critical', 'high', 'showcase', 'medium', 'low'].map(
                    (level) => {
                      const count = category.items.filter(
                        (item: TechItem) => item.importance === level
                      ).length;
                      return count > 0 ? (
                        <div
                          key={level}
                          className={`h-1.5 w-1.5 rounded-full ${
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
          </div>
        ))}
      </div>

      {/* 하단 요약 */}
      {!compact && (
        <div
          className="mt-6 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4"
        >
          <div className="text-center text-xs text-gray-300">
            <div className="mb-2 font-medium">🎯 기술 스택 요약</div>
            <div className="flex justify-center gap-6">
              <span>
                총{' '}
                <span className="font-medium text-blue-300">
                  {summary.totalTechs}개
                </span>{' '}
                기술
              </span>
              <span>•</span>
              <span>
                <span className="font-medium text-amber-300">
                  {summary.coreCount}개
                </span>{' '}
                핵심 기술
              </span>
              <span>•</span>
              <span>
                <span className="font-medium text-green-300">
                  {summary.categoryCount}개
                </span>{' '}
                기술 분야
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechStackDisplay;
