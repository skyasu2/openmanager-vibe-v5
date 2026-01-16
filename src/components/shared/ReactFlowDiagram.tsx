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
 * @version 5.89.0
 * @updated 2026-01-16 - Swimlane 레이아웃 개선 (왼쪽 라벨 + 오른쪽 콘텐츠 구분)
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
import type { ArchitectureDiagram as DiagramData } from '@/data/architecture-diagrams.data';

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
const NODE_HEIGHT = 48;
const NODE_GAP = 50;
const MAX_NODES_PER_ROW = 4; // 한 줄 최대 노드 수
const LABEL_AREA_WIDTH = 120; // Swimlane 라벨 영역 너비
const LABEL_CONTENT_GAP = 40; // 라벨과 콘텐츠 사이 간격
const SWIMLANE_PADDING = 16; // Swimlane 내부 패딩

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
        className={`flex min-w-[110px] max-w-[170px] items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-all duration-200 hover:scale-105 ${styles.bg} ${styles.border} ${styles.shadow}`}
        title={`${data.label}${data.sublabel ? `\n${data.sublabel}` : ''}`}
      >
        {data.icon && <span className="text-sm">{data.icon}</span>}
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-white">
            {data.label}
          </div>
          {data.sublabel && (
            <div className="truncate text-[10px] leading-tight text-white/60">
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
      <div className="relative flex items-center">
        {/* Swimlane 라벨 배경 (왼쪽 영역 표시) */}
        <div className="absolute -left-2 -top-3 -bottom-3 w-[120px] rounded-l-lg border-r border-white/15 bg-gradient-to-r from-white/[0.06] to-transparent" />
        {/* 라벨 뱃지 */}
        <div
          className={`relative z-10 rounded-full bg-gradient-to-r ${data.color} px-2.5 py-1 shadow-md`}
        >
          <span className="whitespace-nowrap text-[10px] font-bold text-white">
            {data.title}
          </span>
        </div>
      </div>
    );
  }
);

LayerLabelNode.displayName = 'LayerLabelNode';

// =============================================================================
// Swimlane Background Node Component
// =============================================================================

interface SwimlaneBgData extends Record<string, unknown> {
  width: number;
  height: number;
  color: string;
  title: string;
}

const SwimlaneBgNode = memo(({ data }: NodeProps<Node<SwimlaneBgData>>) => {
  return (
    <div
      className="pointer-events-none relative rounded-xl"
      style={{
        width: data.width,
        height: data.height,
      }}
    >
      {/* Swimlane 배경 */}
      <div className="absolute inset-0 rounded-xl border border-white/5 bg-white/[0.03]" />

      {/* 왼쪽 라벨 영역 배경 (구분선 역할) */}
      <div
        className="absolute left-0 top-0 bottom-0 rounded-l-xl border-r border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent"
        style={{ width: LABEL_AREA_WIDTH }}
      />
    </div>
  );
});

SwimlaneBgNode.displayName = 'SwimlaneBgNode';

// =============================================================================
// Conversion Utilities
// =============================================================================

/**
 * 기존 데이터 형식을 React Flow 노드/엣지로 변환
 * 노드가 많은 레이어는 2줄로 배치
 */
function convertToReactFlow(diagram: DiagramData): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodePositions: Record<string, { x: number; y: number }> = {};

  let currentY = 0;

  // 1. 콘텐츠 영역의 최대 너비 계산 (중앙 정렬 기준점 확보)
  let maxContentWidth = 0;
  diagram.layers.forEach((layer) => {
    const nodeCount = layer.nodes.length;
    const needsMultiRow = nodeCount > MAX_NODES_PER_ROW;
    const nodesPerRow = needsMultiRow ? Math.ceil(nodeCount / 2) : nodeCount;
    const contentWidth = nodesPerRow * (NODE_WIDTH + NODE_GAP) - NODE_GAP;
    if (contentWidth > maxContentWidth) maxContentWidth = contentWidth;
  });

  // 라벨의 X 위치 (모든 라벨이 이 위치로 고정되어 좌측 정렬 효과)
  // 콘텐츠는 X=0 기준 중앙 정렬, 라벨은 콘텐츠 왼쪽 바깥에 위치
  const fixedLabelX =
    -(maxContentWidth / 2) - LABEL_CONTENT_GAP - LABEL_AREA_WIDTH / 2;

  // 레이어별로 노드 생성
  diagram.layers.forEach((layer, layerIndex) => {
    const nodeCount = layer.nodes.length;
    const needsMultiRow = nodeCount > MAX_NODES_PER_ROW;
    const nodesPerRow = needsMultiRow ? Math.ceil(nodeCount / 2) : nodeCount;
    const rowCount = needsMultiRow ? 2 : 1;

    // 레이어 높이 계산
    const layerHeight =
      rowCount * NODE_HEIGHT + (rowCount - 1) * NODE_GAP + SWIMLANE_PADDING * 2;

    // 현재 레이어의 콘텐츠 너비
    const currentContentWidth =
      nodesPerRow * (NODE_WIDTH + NODE_GAP) - NODE_GAP;

    // Swimlane 배경 위치 계산 (라벨 + 콘텐츠 전체를 감싸는 박스)
    const bgLeft = fixedLabelX - LABEL_AREA_WIDTH / 2 - SWIMLANE_PADDING;
    const bgRight = maxContentWidth / 2 + SWIMLANE_PADDING;
    const bgWidth = bgRight - bgLeft;
    const bgCenterX = bgLeft + bgWidth / 2;

    nodes.push({
      id: `swimlane-bg-${layerIndex}`,
      type: 'swimlaneBg',
      position: { x: bgCenterX, y: currentY - SWIMLANE_PADDING },
      data: {
        width: bgWidth,
        height: layerHeight,
        color: layer.color,
        title: layer.title,
      } as SwimlaneBgData,
      draggable: false,
      selectable: false,
      zIndex: -1,
    });

    // 1. 레이어 라벨 (좌측 고정 위치)
    // vertical center에 위치
    const labelY = currentY + (layerHeight - SWIMLANE_PADDING * 2) / 2 - 10; // 높이 절반 - 텍스트보정

    nodes.push({
      id: `layer-${layerIndex}`,
      type: 'layerLabel',
      position: { x: fixedLabelX, y: labelY },
      data: { title: layer.title, color: layer.color },
      draggable: false,
      selectable: false,
    });

    // 콘텐츠 노드 (중앙 정렬, X=0 기준)
    const contentStartLeft = -(currentContentWidth / 2);

    layer.nodes.forEach((node, nodeIndex) => {
      const row = needsMultiRow ? Math.floor(nodeIndex / nodesPerRow) : 0;
      const col = needsMultiRow ? nodeIndex % nodesPerRow : nodeIndex;

      // 중앙 정렬된 배치를 위한 X 좌표
      const x = contentStartLeft + col * (NODE_WIDTH + NODE_GAP);
      const y = currentY + row * (NODE_HEIGHT + NODE_GAP);

      nodePositions[node.id] = {
        x: x + NODE_WIDTH / 2,
        y: y + NODE_HEIGHT / 2,
      }; // 연결선 계산용 중심 좌표 저장

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

    // 다음 레이어 Y 위치
    currentY += layerHeight + NODE_GAP;
  });

  // 연결선 생성
  if (diagram.connections) {
    diagram.connections.forEach((conn, index) => {
      const sourcePos = nodePositions[conn.from];
      const targetPos = nodePositions[conn.to];

      if (!sourcePos || !targetPos) return;

      // 같은 레이어인지 확인 (수평 연결)
      const isHorizontal = Math.abs(sourcePos.y - targetPos.y) < 10;

      edges.push({
        id: `edge-${index}`,
        source: conn.from,
        target: conn.to,
        sourceHandle: isHorizontal ? 'right' : undefined,
        targetHandle: isHorizontal ? 'left' : undefined,
        type: 'default', // smoothstep -> default (Bezier)
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
  swimlaneBg: SwimlaneBgNode,
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
            padding: 0.15,
            minZoom: 0.6,
            maxZoom: 1.2,
          }}
          minZoom={0.4}
          maxZoom={1.5}
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
      <div className="flex flex-wrap justify-center gap-3 border-t border-white/10 pt-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded bg-gradient-to-br from-yellow-500/40 to-amber-500/40 ring-1 ring-yellow-400/50" />
          <span className="text-[10px] text-gray-400">핵심</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded bg-white/15 ring-1 ring-white/30" />
          <span className="text-[10px] text-gray-400">주요</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded bg-white/5 ring-1 ring-white/10" />
          <span className="text-[10px] text-gray-400">보조</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-4 border-t border-dashed border-purple-400/60" />
          <span className="text-[10px] text-gray-400">검증</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-4 border-t border-white/40" />
          <span className="text-[10px] text-gray-400">데이터</span>
        </div>
      </div>
    </div>
  );
}

export default memo(ReactFlowDiagram);
