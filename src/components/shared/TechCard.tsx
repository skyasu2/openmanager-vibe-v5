import { memo } from 'react';
import { CATEGORY_STYLES, IMPORTANCE_STYLES } from '@/data/tech-stacks.data';
import type {
  CategoryStyle,
  ImportanceLevel,
  ImportanceStyle,
  TechCategory,
  TechItem,
} from '@/types/feature-card.types';

// XSS 방지를 위한 텍스트 검증
const sanitizeText = (text: string): string => {
  if (typeof text !== 'string') return '';
  return text.replace(/<script[^>]*>.*?<\/script>/gi, '').substring(0, 1000);
};

// 중요도별 스타일 가져오기
const getImportanceStyle = (importance: ImportanceLevel): ImportanceStyle => {
  return IMPORTANCE_STYLES[importance];
};

// 카테고리별 스타일 가져오기
const getCategoryStyle = (category: TechCategory): CategoryStyle => {
  return CATEGORY_STYLES[category];
};

export type TechCardProps = {
  tech: TechItem;
};

/**
 * 기술 카드 컴포넌트
 * 기술 스택 정보를 시각적으로 표시
 */
export const TechCard = memo(function TechCard({ tech }: TechCardProps) {
  const importanceStyle = getImportanceStyle(tech.importance);
  const categoryStyle = getCategoryStyle(tech.category);

  return (
    <div
      className={`rounded-lg border p-4 ${importanceStyle.bg} transition-all duration-300 hover:scale-105`}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{tech.icon}</span>
          <div>
            <h4 className="text-sm font-semibold text-white">
              {sanitizeText(tech.name)}
            </h4>
            {tech.version && (
              <span className="text-xs text-gray-400">
                v{sanitizeText(tech.version)}
              </span>
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
        {sanitizeText(tech.description)}
      </p>

      <div className="mb-3 rounded bg-gray-800/50 p-2 text-xs text-gray-400">
        <strong className="text-gray-300">구현:</strong>{' '}
        {sanitizeText(tech.implementation)}
      </div>

      {/* 제품 타입 및 AI 엔진 타입 배지 */}
      <div className="mb-2 flex flex-wrap gap-2">
        {tech.type && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              tech.type === 'custom'
                ? 'border border-blue-500/30 bg-blue-500/20 text-blue-300'
                : tech.type === 'opensource'
                  ? 'border border-green-500/30 bg-green-500/20 text-green-300'
                  : 'border border-purple-500/30 bg-purple-500/20 text-purple-300'
            }`}
          >
            {tech.type === 'custom'
              ? '🏭 커스텀'
              : tech.type === 'opensource'
                ? '🔓 오픈소스'
                : '📦 상용'}
          </span>
        )}
        {tech.aiType && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              tech.aiType === 'google-api'
                ? 'border border-green-500/30 bg-green-500/20 text-green-300'
                : 'border border-yellow-500/30 bg-yellow-500/20 text-yellow-300'
            }`}
          >
            {tech.aiType === 'google-api' ? '🌐 Cloud AI' : '💻 로컬 AI'}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        {tech.tags?.map((tag, tagIndex) => (
          <span
            key={tagIndex}
            className="rounded bg-gray-700/50 px-2 py-1 text-xs text-gray-300"
          >
            {sanitizeText(tag)}
          </span>
        )) || null}
      </div>
    </div>
  );
});
