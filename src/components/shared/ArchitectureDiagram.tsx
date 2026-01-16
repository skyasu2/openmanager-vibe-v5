'use client';

/**
 * ArchitectureDiagram Component
 * Feature Card 모달용 아키텍처 다이어그램 렌더링 컴포넌트
 *
 * @version 5.89.0
 * @updated 2026-01-16
 *
 * 개선사항:
 * - Swimlane 배경 추가 (영역 구분 명확화)
 * - 호버 시 상세 정보 툴팁
 * - 시각적 계층 구조 강화
 */

import { memo, useState } from 'react';
import type {
  ArchitectureDiagram as DiagramData,
  DiagramLayer,
  DiagramNode,
} from '@/data/architecture-diagrams.data';
import { NODE_STYLES } from '@/data/architecture-diagrams.data';

interface ArchitectureDiagramProps {
  diagram: DiagramData;
}

/**
 * 개별 노드 컴포넌트 (호버 툴팁 포함)
 */
const DiagramNodeItem = memo(({ node }: { node: DiagramNode }) => {
  const styles = NODE_STYLES[node.type];
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      role="group"
      aria-label={node.label}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 호버 툴팁 */}
      {isHovered && node.sublabel && (
        <div className="absolute -top-10 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-3 py-1.5 text-xs text-white shadow-lg ring-1 ring-white/20">
          {node.sublabel}
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800 ring-1 ring-white/20 ring-t-0 ring-l-0" />
        </div>
      )}

      {/* 노드 */}
      <div
        className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-white/5 ${styles.bg} ${styles.border}`}
      >
        {node.icon && <span className="text-xl">{node.icon}</span>}
        <div className={`text-sm font-semibold ${styles.text}`}>
          {node.label}
        </div>
        {node.sublabel && (
          <div className="truncate text-xs text-white/50 max-w-[140px]">
            {node.sublabel}
          </div>
        )}
      </div>
    </div>
  );
});

DiagramNodeItem.displayName = 'DiagramNodeItem';

/**
 * 레이어 컴포넌트 (Swimlane 배경 포함)
 */
const DiagramLayerSection = memo(
  ({ layer, isLast }: { layer: DiagramLayer; isLast?: boolean }) => {
    return (
      <div className="relative">
        {/* Swimlane 배경 */}
        <div className="absolute inset-0 -mx-4 rounded-xl bg-white/[0.02]" />

        <div className="relative px-4 py-4">
          {/* 레이어 타이틀 - 중앙 정렬 */}
          <div className="mb-3 flex justify-center">
            <div
              className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${layer.color} px-3 py-1 shadow-sm`}
            >
              <span className="text-xs font-semibold text-white">
                {layer.title}
              </span>
            </div>
          </div>

          {/* 노드 그리드 - 중앙 정렬 */}
          <div
            className={`grid gap-3 justify-items-center ${
              layer.nodes.length === 1
                ? 'grid-cols-1 max-w-xs mx-auto'
                : layer.nodes.length === 2
                  ? 'grid-cols-2 max-w-lg mx-auto'
                  : layer.nodes.length === 3
                    ? 'grid-cols-3 max-w-2xl mx-auto'
                    : 'grid-cols-2 md:grid-cols-4'
            }`}
          >
            {layer.nodes.map((node) => (
              <DiagramNodeItem key={node.id} node={node} />
            ))}
          </div>
        </div>

        {/* 레이어 구분선 (마지막 제외) */}
        {!isLast && (
          <div className="absolute -bottom-1 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        )}
      </div>
    );
  }
);

DiagramLayerSection.displayName = 'DiagramLayerSection';

/**
 * 연결선 화살표 (레이어 간)
 */
const LayerConnector = memo(() => (
  <div className="flex items-center justify-center py-2">
    <div className="flex flex-col items-center">
      <div className="h-4 w-px bg-gradient-to-b from-white/40 to-white/20" />
      <div className="h-0 w-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/30" />
    </div>
  </div>
));

LayerConnector.displayName = 'LayerConnector';

/**
 * 메인 다이어그램 컴포넌트
 */
function ArchitectureDiagram({ diagram }: ArchitectureDiagramProps) {
  return (
    <div className="space-y-2">
      {/* 다이어그램 헤더 */}
      <div className="mb-6 text-center">
        <h3 className="mb-2 text-xl font-bold text-white">{diagram.title}</h3>
        <p className="mx-auto max-w-2xl text-sm text-gray-300">
          {diagram.description}
        </p>
      </div>

      {/* 레이어 스택 */}
      <div className="mx-auto max-w-3xl space-y-1">
        {diagram.layers.map((layer, index) => (
          <div key={layer.title}>
            <DiagramLayerSection
              layer={layer}
              isLast={index === diagram.layers.length - 1}
            />
            {index < diagram.layers.length - 1 && <LayerConnector />}
          </div>
        ))}
      </div>

      {/* 범례 */}
      <div className="mt-8 flex flex-wrap justify-center gap-4 border-t border-white/10 pt-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-gradient-to-br from-yellow-500/40 to-amber-500/40 ring-1 ring-yellow-400/50" />
          <span className="text-xs text-gray-400">핵심 컴포넌트</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-white/15 ring-1 ring-white/30" />
          <span className="text-xs text-gray-400">주요 기술</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-white/5 ring-1 ring-white/10" />
          <span className="text-xs text-gray-400">보조 도구</span>
        </div>
      </div>
    </div>
  );
}

export default memo(ArchitectureDiagram);
