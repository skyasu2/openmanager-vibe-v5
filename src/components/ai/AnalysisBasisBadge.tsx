'use client';

import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Database,
  ExternalLink,
} from 'lucide-react';
import { type FC, useState } from 'react';
import type { AnalysisBasis } from '@/stores/useAISidebarStore';

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

interface AnalysisBasisBadgeProps {
  basis: AnalysisBasis;
  className?: string;
}

/**
 * 📊 분석 근거 뱃지 컴포넌트
 *
 * AI 응답의 투명성을 위해 분석에 사용된 근거 정보를 표시합니다.
 * - 데이터 소스
 * - AI 엔진
 * - 신뢰도
 * - RAG 사용 여부
 *
 * 기본적으로 접힌 상태로 표시되며, 클릭하면 상세 정보가 펼쳐집니다.
 */
export const AnalysisBasisBadge: FC<AnalysisBasisBadgeProps> = ({
  basis,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 엔진 종류에 따른 색상
  const getEngineColor = (engine: string) => {
    if (engine.includes('Cloud Run')) return 'text-green-600';
    if (engine.includes('Fallback')) return 'text-orange-500';
    if (engine.includes('Streaming')) return 'text-blue-500';
    return 'text-gray-600';
  };

  return (
    <div
      className={`mt-2 rounded-lg border border-gray-200 bg-gray-50 text-sm ${className}`}
    >
      {/* 헤더 (클릭으로 토글) */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-100 transition-colors rounded-lg"
        aria-expanded={isExpanded}
        aria-label="분석 근거 상세 보기"
      >
        <span className="flex items-center gap-2 text-gray-600">
          <Database className="h-4 w-4" />
          <span className="font-medium">분석 근거</span>
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* 상세 정보 (확장 시) */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-200">
          {/* 데이터 소스 */}
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-500">데이터:</span>
            <span className="text-gray-700">{basis.dataSource}</span>
          </div>

          {/* AI 엔진 */}
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-500">엔진:</span>
            <span className={getEngineColor(basis.engine)}>{basis.engine}</span>
            {basis.ragUsed && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">
                RAG
              </span>
            )}
          </div>

          {/* 시간 범위 */}
          {basis.timeRange && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-500">기간:</span>
              <span className="text-gray-700">{basis.timeRange}</span>
            </div>
          )}

          {/* 서버 수 */}
          {basis.serverCount && (
            <div className="flex items-center gap-2">
              <span className="ml-5 text-gray-500">분석 서버:</span>
              <span className="text-gray-700">{basis.serverCount}개</span>
            </div>
          )}

          {/* RAG 출처 목록 */}
          {basis.ragSources && basis.ragSources.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-1.5">
                <BookOpen className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-gray-600 font-medium text-xs">
                  RAG 참조 문서
                </span>
              </div>
              <div className="space-y-1 ml-5">
                {basis.ragSources.map((source, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-400 shrink-0">[{idx + 1}]</span>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline truncate flex-1 min-w-0"
                        title={source.url}
                      >
                        {source.title}
                      </a>
                    ) : (
                      <span
                        className="text-gray-700 truncate flex-1 min-w-0"
                        title={source.title}
                      >
                        {source.title}
                      </span>
                    )}
                    {source.url && (
                      <ExternalLink className="h-3 w-3 shrink-0 text-blue-400" />
                    )}
                    {source.sourceType !== 'web' && (
                      <span
                        className={`px-1 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                          source.similarity >= 0.8
                            ? 'bg-green-100 text-green-700'
                            : source.similarity >= 0.6
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {Math.round(source.similarity * 100)}%
                      </span>
                    )}
                    <span className="px-1 py-0.5 rounded bg-purple-50 text-purple-600 text-[10px] shrink-0">
                      {source.sourceType === 'web' && source.url
                        ? extractDomain(source.url)
                        : source.sourceType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisBasisBadge;
