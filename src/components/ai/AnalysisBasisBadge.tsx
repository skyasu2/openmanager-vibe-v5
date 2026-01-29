'use client';

import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Database,
  Gauge,
} from 'lucide-react';
import { type FC, useState } from 'react';
import type { AnalysisBasis } from '@/stores/useAISidebarStore';

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

  // 신뢰도에 따른 색상
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-500';
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
          {basis.confidence && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full bg-white border ${getConfidenceColor(basis.confidence)}`}
            >
              {basis.confidence}%
            </span>
          )}
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

          {/* 신뢰도 */}
          {basis.confidence && (
            <div className="flex items-center gap-2">
              <Gauge className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-500">신뢰도:</span>
              <div className="flex items-center gap-1">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      basis.confidence >= 80
                        ? 'bg-green-500'
                        : basis.confidence >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${basis.confidence}%` }}
                  />
                </div>
                <span className={getConfidenceColor(basis.confidence)}>
                  {basis.confidence}%
                </span>
              </div>
            </div>
          )}

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
                    <span
                      className="text-gray-700 truncate max-w-[180px]"
                      title={source.title}
                    >
                      {source.title}
                    </span>
                    <span
                      className={`px-1 py-0.5 rounded text-[10px] font-medium ${
                        source.similarity >= 0.8
                          ? 'bg-green-100 text-green-700'
                          : source.similarity >= 0.6
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {Math.round(source.similarity * 100)}%
                    </span>
                    <span className="px-1 py-0.5 rounded bg-purple-50 text-purple-600 text-[10px]">
                      {source.sourceType}
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
