'use client';

/**
 * ArchitectureDiagram Component
 * Feature Card 모달용 아키텍처 다이어그램 렌더링 컴포넌트
 *
 * @version 5.87.0
 * @updated 2026-01-14
 */

import { memo } from 'react';
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
 * 개별 노드 컴포넌트
 */
const DiagramNodeItem = memo(({ node }: { node: DiagramNode }) => {
  const styles = NODE_STYLES[node.type];

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-all duration-200 hover:scale-105 ${styles.bg} ${styles.border}`}
    >
      {node.icon && <span className="text-xl">{node.icon}</span>}
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-semibold ${styles.text}`}>
          {node.label}
        </div>
        {node.sublabel && (
          <div className="truncate text-xs text-white/60">{node.sublabel}</div>
        )}
      </div>
    </div>
  );
});

DiagramNodeItem.displayName = 'DiagramNodeItem';

/**
 * 레이어 컴포넌트
 */
const DiagramLayerSection = memo(({ layer }: { layer: DiagramLayer }) => {
  return (
    <div className="relative">
      {/* 레이어 타이틀 */}
      <div
        className={`mb-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${layer.color} px-3 py-1`}
      >
        <span className="text-xs font-semibold text-white">{layer.title}</span>
      </div>

      {/* 노드 그리드 */}
      <div
        className={`grid gap-3 ${
          layer.nodes.length === 1
            ? 'grid-cols-1'
            : layer.nodes.length === 2
              ? 'grid-cols-2'
              : layer.nodes.length === 3
                ? 'grid-cols-3'
                : 'grid-cols-2 md:grid-cols-4'
        }`}
      >
        {layer.nodes.map((node) => (
          <DiagramNodeItem key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
});

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
            <DiagramLayerSection layer={layer} />
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
