'use client';

/**
 * ReactFlowDiagram Component
 * React Flow 기반 아키텍처 다이어그램 렌더링 컴포넌트
 *
 * 기존 ArchitectureDiagram.tsx 대비 개선점:
 * - connections 데이터를 실제 연결선으로 렌더링
 * - 인터랙티브한 노드 (드래그, 줌, 패닝)
 * - 더 정교한 레이아웃
 *
 * @version 5.88.0
 * @updated 2026-01-15
 */

import {
  Background,
  Controls,
  type Edge,
  Handle,
  MarkerType,
  MiniMap,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from '@xyflow/react';
import { memo, useCallback, useMemo } from 'react';
import '@xyflow/react/dist/style.css';
import type {
  DiagramNode as DataNode,
  ArchitectureDiagram as DiagramData,
} from '@/data/architecture-diagrams.data';

// =============================================================================
// Types
// =============================================================================

interface ReactFlowDiagramProps {
  diagram: DiagramData;
  /** 컴팩트 모드 (모달 내부용) */
  compact?: boolean;
  /** 컨트롤 표시 여부 */
  showControls?: boolean;
  /** 미니맵 표시 여부 */
  showMiniMap?: boolean;
}

interface CustomNodeData extends Record<string, unknown> {
  label: string;
  sublabel?: string;
  icon?: string;
  nodeType: 'primary' | 'secondary' | 'tertiary' | 'highlight';
  layerColor: string;
  layerTitle: string;
}

// =============================================================================
// Constants
// =============================================================================

const NODE_WIDTH = 180;
const NODE_HEIGHT = 70;
const LAYER_GAP = 120;
const NODE_GAP = 20;

const NODE_STYLES: Record<
  CustomNodeData['nodeType'],
  { bg: string; border: string; shadow: string }
> = {
  primary: {
    bg: 'bg-white/15 backdrop-blur-sm',
    border: 'border-white/30',
    shadow: 'shadow-lg shadow-white/5',
  },
  secondary: {
    bg: 'bg-white/10 backdrop-blur-sm',
    border: 'border-white/20',
    shadow: 'shadow-md shadow-white/5',
  },
  tertiary: {
    bg: 'bg-white/5 backdrop-blur-sm',
    border: 'border-white/10',
    shadow: '',
  },
  highlight: {
    bg: 'bg-gradient-to-br from-yellow-500/25 to-amber-500/25 backdrop-blur-sm',
    border: 'border-yellow-400/50',
    shadow: 'shadow-lg shadow-yellow-500/10',
  },
};

// =============================================================================
// Custom Node Component
// =============================================================================

const CustomNode = memo(({ data }: NodeProps<Node<CustomNodeData>>) => {
  const styles = NODE_STYLES[data.nodeType];

  return (
    <>
      {/* 입력 핸들 (상단) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-2 !border-white/40 !bg-white/20"
      />

      {/* 노드 본체 */}
      <div
        className={`flex min-w-[160px] items-center gap-2 rounded-xl border-2 p-3 transition-all duration-200 hover:scale-105 ${styles.bg} ${styles.border} ${styles.shadow}`}
      >
        {data.icon && <span className="text-lg">{data.icon}</span>}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">
            {data.label}
          </div>
          {data.sublabel && (
            <div className="truncate text-xs text-white/60">
              {data.sublabel}
            </div>
          )}
        </div>
      </div>

      {/* 출력 핸들 (하단) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-2 !border-white/40 !bg-white/20"
      />

      {/* 좌우 핸들 (수평 연결용) */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!h-2 !w-2 !border-2 !border-white/40 !bg-white/20"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!h-2 !w-2 !border-2 !border-white/40 !bg-white/20"
      />
    </>
  );
});

CustomNode.displayName = 'CustomNode';

// =============================================================================
// Layer Label Node Component
// =============================================================================

const LayerLabelNode = memo(
  ({ data }: NodeProps<Node<{ title: string; color: string }>>) => {
    return (
      <div
        className={`rounded-full bg-gradient-to-r ${data.color} px-4 py-1.5 shadow-lg`}
      >
        <span className="text-xs font-bold text-white">{data.title}</span>
      </div>
    );
  }
);

LayerLabelNode.displayName = 'LayerLabelNode';

// =============================================================================
// Conversion Utilities
// =============================================================================

/**
 * 기존 데이터 형식을 React Flow 노드/엣지로 변환
 */
function convertToReactFlow(diagram: DiagramData): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodePositions: Record<string, { x: number; y: number }> = {};

  let currentY = 0;

  // 레이어별로 노드 생성
  diagram.layers.forEach((layer, layerIndex) => {
    const layerWidth = layer.nodes.length * (NODE_WIDTH + NODE_GAP) - NODE_GAP;
    const startX = -layerWidth / 2;

    // 레이어 라벨 노드 추가
    nodes.push({
      id: `layer-${layerIndex}`,
      type: 'layerLabel',
      position: {
        x: -layerWidth / 2 - 100,
        y: currentY + NODE_HEIGHT / 2 - 12,
      },
      data: { title: layer.title, color: layer.color },
      draggable: false,
      selectable: false,
    });

    // 레이어 내 노드들 배치
    layer.nodes.forEach((node, nodeIndex) => {
      const x = startX + nodeIndex * (NODE_WIDTH + NODE_GAP);
      const y = currentY;

      nodePositions[node.id] = { x, y };

      nodes.push({
        id: node.id,
        type: 'customNode',
        position: { x, y },
        data: {
          label: node.label,
          sublabel: node.sublabel,
          icon: node.icon,
          nodeType: node.type,
          layerColor: layer.color,
          layerTitle: layer.title,
        } as CustomNodeData,
      });
    });

    currentY += LAYER_GAP;
  });

  // 연결선 생성
  if (diagram.connections) {
    diagram.connections.forEach((conn, index) => {
      const sourcePos = nodePositions[conn.from];
      const targetPos = nodePositions[conn.to];

      if (!sourcePos || !targetPos) return;

      // 같은 레이어인지 확인 (수평 연결)
      const isHorizontal = Math.abs(sourcePos.y - targetPos.y) < 10;
      // 소스가 타겟보다 위에 있는지 (수직 연결)
      const isSourceAbove = sourcePos.y < targetPos.y;

      edges.push({
        id: `edge-${index}`,
        source: conn.from,
        target: conn.to,
        sourceHandle: isHorizontal ? 'right' : undefined,
        targetHandle: isHorizontal ? 'left' : undefined,
        type: 'smoothstep',
        animated: conn.type === 'dashed',
        style: {
          stroke:
            conn.type === 'dashed'
              ? 'rgba(167, 139, 250, 0.6)'
              : 'rgba(255, 255, 255, 0.4)',
          strokeWidth: 2,
          strokeDasharray: conn.type === 'dashed' ? '5 5' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color:
            conn.type === 'dashed'
              ? 'rgba(167, 139, 250, 0.8)'
              : 'rgba(255, 255, 255, 0.6)',
        },
        label: conn.label,
        labelStyle: {
          fill: 'rgba(255, 255, 255, 0.8)',
          fontSize: 10,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: 'rgba(30, 30, 46, 0.9)',
          fillOpacity: 0.9,
        },
        labelBgPadding: [4, 4] as [number, number],
        labelBgBorderRadius: 4,
      });
    });
  }

  return { nodes, edges };
}

// =============================================================================
// Main Component
// =============================================================================

const nodeTypes = {
  customNode: CustomNode,
  layerLabel: LayerLabelNode,
};

function ReactFlowDiagram({
  diagram,
  compact = true,
  showControls = true,
  showMiniMap = false,
}: ReactFlowDiagramProps) {
  const { nodes, edges } = useMemo(
    () => convertToReactFlow(diagram),
    [diagram]
  );

  const onInit = useCallback(() => {
    // React Flow 초기화 완료
  }, []);

  return (
    <div className="flex flex-col space-y-4">
      {/* 다이어그램 헤더 */}
      <div className="text-center">
        <h3 className="mb-2 text-xl font-bold text-white">{diagram.title}</h3>
        <p className="mx-auto max-w-2xl text-sm text-gray-300">
          {diagram.description}
        </p>
      </div>

      {/* React Flow 캔버스 */}
      <div
        className={`rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/50 ${
          compact ? 'h-[400px]' : 'h-[600px]'
        }`}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={onInit}
          fitView
          fitViewOptions={{
            padding: 0.2,
            minZoom: 0.5,
            maxZoom: 1.5,
          }}
          minZoom={0.3}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep',
          }}
          proOptions={{ hideAttribution: true }}
          className="react-flow-dark"
        >
          <Background color="rgba(255, 255, 255, 0.05)" gap={20} size={1} />
          {showControls && (
            <Controls
              className="!border-white/20 !bg-slate-800/80 [&>button]:!border-white/20 [&>button]:!bg-slate-700/80 [&>button:hover]:!bg-slate-600/80 [&>button>svg]:!fill-white/80"
              showInteractive={false}
            />
          )}
          {showMiniMap && (
            <MiniMap
              className="!border-white/20 !bg-slate-800/80"
              nodeColor={(node) => {
                const data = node.data as CustomNodeData;
                if (data?.nodeType === 'highlight')
                  return 'rgba(250, 204, 21, 0.8)';
                if (data?.nodeType === 'primary')
                  return 'rgba(255, 255, 255, 0.6)';
                return 'rgba(255, 255, 255, 0.3)';
              }}
              maskColor="rgba(0, 0, 0, 0.8)"
            />
          )}
        </ReactFlow>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap justify-center gap-4 border-t border-white/10 pt-4">
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
        <div className="flex items-center gap-2">
          <div className="h-4 w-6 border-t-2 border-dashed border-purple-400/60" />
          <span className="text-xs text-gray-400">검증 흐름</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-6 border-t-2 border-white/40" />
          <span className="text-xs text-gray-400">데이터 흐름</span>
        </div>
      </div>
    </div>
  );
}

export default memo(ReactFlowDiagram);
