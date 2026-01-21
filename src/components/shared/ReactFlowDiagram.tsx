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
 * @version 5.92.2
 * @updated 2026-01-18 - Fixed layer positioning (layer-first algorithm)
 */

import Dagre from '@dagrejs/dagre';
import * as Tooltip from '@radix-ui/react-tooltip';
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
  useNodesInitialized,
  useReactFlow,
} from '@xyflow/react';
import React, {
  Component,
  memo,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import '@xyflow/react/dist/style.css';
import type { ArchitectureDiagram as DiagramData } from '@/data/architecture-diagrams.data';
import { logger } from '@/lib/logging';

// =============================================================================
// FitView 옵션 및 컴포넌트
// =============================================================================

/**
 * fitView 옵션 - 모든 노드가 화면에 보이도록 설정
 * padding: 12% 여백으로 노드가 가장자리에 닿지 않도록
 * includeHiddenNodes: 숨겨진 노드도 포함
 */
const FIT_VIEW_OPTIONS = {
  padding: 0.12,
  includeHiddenNodes: true,
  minZoom: 0.05,
  maxZoom: 0.85,
};

/**
 * 기본 뷰포트 설정 - fitView가 실패할 경우의 폴백
 */
const DEFAULT_VIEWPORT = {
  x: 550,
  y: 10,
  zoom: 0.75,
};

/**
 * AutoFitView - 노드 초기화 완료 후 자동 fitView 실행
 *
 * 🔧 수정 (2026-01-17): 모달 트랜지션 완료 대기를 위해 긴 지연 시간 사용
 * - 모달 CSS 트랜지션(300ms)이 완료된 후 fitView 실행
 * - 여러 시점에서 실행하여 안정적인 뷰 맞춤 보장
 */
function AutoFitView() {
  const nodesInitialized = useNodesInitialized();
  const { fitView, getViewport } = useReactFlow();
  const hasCalledFitView = useRef(false);

  useEffect(() => {
    if (!nodesInitialized) return undefined;

    let cancelled = false;

    const executeFitView = () => {
      if (cancelled) return;
      const currentViewport = getViewport();
      // 아직 기본 zoom 상태이거나 한 번도 호출되지 않은 경우에만 실행
      if (currentViewport.zoom >= 0.95 || !hasCalledFitView.current) {
        hasCalledFitView.current = true;
        fitView({
          ...FIT_VIEW_OPTIONS,
          duration: 300,
        });
      }
    };

    // 모달 트랜지션 완료 후 실행 (500ms, 800ms, 1200ms)
    // 초기 실행은 건너뛰고 트랜지션 완료 후에만 실행
    const timer1 = setTimeout(executeFitView, 500);
    const timer2 = setTimeout(executeFitView, 800);
    const timer3 = setTimeout(executeFitView, 1200);

    return () => {
      cancelled = true;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [nodesInitialized, fitView, getViewport]);

  return null;
}

// =============================================================================
// Types
// =============================================================================

export interface ReactFlowDiagramProps {
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
  /** @description 레이어 색상 (디버깅/확장용, 현재 UI 미사용) */
  layerColor: string;
  /** @description 레이어 제목 (디버깅/확장용, 현재 UI 미사용) */
  layerTitle: string;
}

// =============================================================================
// Error Boundary (P2: React Flow 렌더링 오류 격리)
// =============================================================================

interface DiagramErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  diagramTitle?: string;
}

interface DiagramErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 🔧 P2: React Flow 전용 에러 바운더리
 * - 다이어그램 렌더링 실패 시 전체 앱 크래시 방지
 * - 사용자 친화적 오류 메시지 표시
 */
class DiagramErrorBoundary extends Component<
  DiagramErrorBoundaryProps,
  DiagramErrorBoundaryState
> {
  constructor(props: DiagramErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): DiagramErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('[ReactFlowDiagram] 렌더링 오류:', error);
    logger.error('[ReactFlowDiagram] 컴포넌트 스택:', errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 p-8">
          <div className="mb-4 text-4xl">⚠️</div>
          <h3 className="mb-2 text-lg font-semibold text-red-400">
            다이어그램 로드 실패
          </h3>
          <p className="mb-4 text-center text-sm text-gray-400">
            {this.props.diagramTitle
              ? `"${this.props.diagramTitle}" 다이어그램을 표시할 수 없습니다.`
              : '다이어그램을 표시할 수 없습니다.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// Constants
// =============================================================================

/**
 * 레이아웃 상수
 * 📐 Dagre.js 기반 자동 레이아웃
 */
const NODE_WIDTH = 180; // 노드 너비
const NODE_HEIGHT = 52; // 노드 높이

const LABEL_AREA_WIDTH = 160; // Swimlane 라벨 영역 너비
const LABEL_NODE_HEIGHT = 36; // 라벨 노드 높이
const LABEL_CONTENT_GAP = 32; // 라벨과 콘텐츠 사이 간격
const SWIMLANE_PADDING = 24; // Swimlane 내부 패딩 (넉넉하게)

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
    bg: 'bg-linear-to-br from-yellow-500/25 to-amber-500/25 backdrop-blur-sm',
    border: 'border-yellow-400/50',
    shadow: 'shadow-lg shadow-yellow-500/10',
  },
};

// =============================================================================
// Custom Node Component
// =============================================================================

const CustomNode = memo(({ data }: NodeProps<Node<CustomNodeData>>) => {
  const styles = NODE_STYLES[data.nodeType];

  // 툴팁 내용 생성
  const tooltipContent = (
    <div className="max-w-[200px] space-y-1">
      <div className="flex items-center gap-2">
        {data.icon && <span className="text-base">{data.icon}</span>}
        <span className="font-semibold text-white">{data.label}</span>
      </div>
      {data.sublabel && (
        <p className="text-xs leading-relaxed text-gray-300">{data.sublabel}</p>
      )}
      <div className="mt-1.5 flex items-center gap-1.5 border-t border-white/10 pt-1.5">
        <span className="text-[10px] text-gray-400">Layer:</span>
        <span className="text-[10px] text-gray-300">{data.layerTitle}</span>
      </div>
    </div>
  );

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div className="relative">
          {/* 입력 핸들 (상단) - 투명화로 깔끔하게 */}
          <Handle
            type="target"
            position={Position.Top}
            className="!h-1.5 !w-1.5 !border !border-white/30 !bg-white/10"
          />

          {/* 노드 본체 - 컴팩트 사이즈 */}
          <div
            className={`flex min-w-[110px] max-w-[170px] cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all duration-200 hover:scale-[1.03] ${styles.bg} ${styles.border} ${styles.shadow}`}
          >
            {data.icon && <span className="text-sm">{data.icon}</span>}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[clamp(10px,2.5vw,12px)] font-semibold text-white">
                {data.label}
              </div>
              {data.sublabel && (
                <div className="line-clamp-2 text-[clamp(8px,2vw,9px)] leading-tight text-white/70">
                  {data.sublabel}
                </div>
              )}
            </div>
          </div>

          {/* 출력 핸들 (하단) */}
          <Handle
            type="source"
            position={Position.Bottom}
            className="!h-1.5 !w-1.5 !border !border-white/30 !bg-white/10"
          />

          {/* 좌우 핸들 (수평 연결용) */}
          <Handle
            type="target"
            position={Position.Left}
            id="left"
            className="!h-1.5 !w-1.5 !border !border-white/30 !bg-white/10"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            className="!h-1.5 !w-1.5 !border !border-white/30 !bg-white/10"
          />
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="z-[100] rounded-lg border border-white/10 bg-slate-800/95 px-3 py-2 shadow-xl backdrop-blur-sm animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          sideOffset={8}
          side="top"
        >
          {tooltipContent}
          <Tooltip.Arrow className="fill-slate-800/95" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
});

CustomNode.displayName = 'CustomNode';

// =============================================================================
// Layer Label Node Component
// =============================================================================

const LayerLabelNode = memo(
  ({ data }: NodeProps<Node<{ title: string; color: string }>>) => {
    return (
      <div className="group flex h-full w-full flex-col justify-center pr-4 text-right transition-opacity">
        <div className="relative z-10" title={data.title}>
          <span className="block truncate text-xs font-bold leading-tight text-white/90 transition-colors group-hover:text-white">
            {data.title}
          </span>
          <div
            className={`ml-auto mt-1 h-0.5 w-6 rounded-full opacity-80 transition-all duration-200 group-hover:w-10 group-hover:opacity-100 bg-linear-to-r ${data.color}`}
          />
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

      {/* 왼쪽 라벨 영역 배경 (Unified Sidebar Style) */}
      <div
        className="absolute top-0 bottom-0 rounded-l-xl border-r border-white/10 bg-slate-900/40 backdrop-blur-sm"
        style={{
          left: SWIMLANE_PADDING,
          width: LABEL_AREA_WIDTH,
        }}
      />
    </div>
  );
});

SwimlaneBgNode.displayName = 'SwimlaneBgNode';

// =============================================================================
// Dagre Layout Engine (React Flow Best Practice)
// =============================================================================

/**
 * 📐 레이어 우선 레이아웃 알고리즘
 *
 * Dagre의 rank 제약이 그래프 구조를 오버라이드하지 못하므로,
 * 레이어 인덱스 기반으로 Y 위치를 직접 계산하고
 * 각 레이어 내에서 X 위치를 균등 분배합니다.
 *
 * @param nodeLayerMap - 노드 ID → 레이어 인덱스 매핑
 */
function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: {
    direction?: 'TB' | 'LR';
    nodesep?: number;
    ranksep?: number;
    nodeLayerMap?: Map<string, number>;
  } = {}
): { nodes: Node[]; edges: Edge[] } {
  const {
    direction = 'TB',
    nodesep = 60,
    ranksep = 80,
    nodeLayerMap,
  } = options;
  const isHorizontal = direction === 'LR';

  // 레이어 정보가 없으면 Dagre 폴백
  if (!nodeLayerMap || nodeLayerMap.size === 0) {
    return fallbackDagreLayout(nodes, edges, {
      direction,
      nodesep,
      ranksep,
    });
  }

  // 레이어별 노드 그룹화
  const layerNodes: Map<number, Node[]> = new Map();
  nodes.forEach((node) => {
    if (node.type !== 'customNode') return;
    const layerIndex = nodeLayerMap.get(node.id);
    if (layerIndex === undefined) return;

    const existing = layerNodes.get(layerIndex) || [];
    existing.push(node);
    layerNodes.set(layerIndex, existing);
  });

  // 2. 레이어 메타데이터 계산 (높이, 행 수, Wrapping)
  const layerMeta = new Map<
    number,
    { startY: number; nodesPerRow: number; rowCount: number }
  >();
  let currentY = 0;
  // 레이어 인덱스가 0부터 순차적이라고 가정 (안전하게 키 정렬)
  const sortedLayerIndices = Array.from(layerNodes.keys()).sort(
    (a, b) => a - b
  );

  sortedLayerIndices.forEach((layerIndex) => {
    const nodesInLayer = layerNodes.get(layerIndex) || [];
    const count = nodesInLayer.length;

    // Smart Grid: 8개 이상(예: MCP)은 4개씩, 그 외는 최대 5개씩
    const nodesPerRow = count >= 8 ? 4 : 5;
    const rowCount = Math.ceil(count / nodesPerRow);

    layerMeta.set(layerIndex, { startY: currentY, nodesPerRow, rowCount });

    // 레이어 높이: 노드 높이 * 줄 수 + 줄 간격(ranksep/2) + 다음 레이어 간격(ranksep)
    const rowGap = ranksep * 0.4;
    const layerHeight = rowCount * NODE_HEIGHT + (rowCount - 1) * rowGap;

    currentY += layerHeight + ranksep;
  });

  // 3. 전체 최대 너비 계산 (Wrapping 고려)
  let maxRowWidth = 0;
  sortedLayerIndices.forEach((layerIndex) => {
    const nodesInLayer = layerNodes.get(layerIndex) || [];
    const meta = layerMeta.get(layerIndex)!;

    // 가장 넓은 행(꽉 찬 행) 기준으로 너비 계산
    const effectiveCols = Math.min(nodesInLayer.length, meta.nodesPerRow);
    const width = effectiveCols * (NODE_WIDTH + nodesep) - nodesep;
    if (width > maxRowWidth) maxRowWidth = width;
  });
  const totalWidth = maxRowWidth;

  // 4. 노드 위치 매핑
  const layoutedNodes = nodes.map((node) => {
    if (node.type !== 'customNode') return node;

    const layerIndex = nodeLayerMap.get(node.id);
    if (layerIndex === undefined) return node;

    const nodesInLayer = layerNodes.get(layerIndex) || [];
    const nodeIndexInLayer = nodesInLayer.findIndex((n) => n.id === node.id);
    const meta = layerMeta.get(layerIndex);

    if (!meta) return node;

    // Grid 위치 (Row, Col)
    const row = Math.floor(nodeIndexInLayer / meta.nodesPerRow);
    const col = nodeIndexInLayer % meta.nodesPerRow;

    // 마지막 줄 중앙 정렬 로직
    const isLastRow = row === meta.rowCount - 1;
    const itemsInLastRow =
      nodesInLayer.length % meta.nodesPerRow || meta.nodesPerRow;
    const itemsInCurrentRow = isLastRow ? itemsInLastRow : meta.nodesPerRow;

    const rowWidth = itemsInCurrentRow * (NODE_WIDTH + nodesep) - nodesep;
    // 전체 중앙 정렬: (전체폭 - 현재행폭) / 2
    const rowStartX = (totalWidth - rowWidth) / 2;

    const x = rowStartX + col * (NODE_WIDTH + nodesep);

    // Y 위치
    const rowGap = ranksep * 0.4;
    const y = meta.startY + row * (NODE_HEIGHT + rowGap);

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: { x, y },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Dagre 폴백 레이아웃 (레이어 정보 없을 때)
 */
function fallbackDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: { direction: string; nodesep: number; ranksep: number }
): { nodes: Node[]; edges: Edge[] } {
  const { direction, nodesep, ranksep } = options;
  const isHorizontal = direction === 'LR';

  const dagreGraph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep,
    ranksep,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    if (node.type === 'customNode') {
      dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  Dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    if (node.type !== 'customNode') return node;
    const pos = dagreGraph.node(node.id);
    if (!pos) return node;

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });

  return { nodes: layoutedNodes, edges };
}

// =============================================================================
// Conversion Utilities (Hybrid: Swimlane + Dagre)
// =============================================================================

/**
 * 기존 데이터 형식을 React Flow 노드/엣지로 변환
 * 📐 하이브리드 레이아웃: Swimlane 배경 + Dagre 자동 배치
 *
 * 1단계: 콘텐츠 노드와 엣지 생성
 * 2단계: Dagre 레이아웃 적용
 * 3단계: 레이아웃 결과 기반 Swimlane 배경 생성
 */
function convertToReactFlow(diagram: DiagramData): {
  nodes: Node[];
  edges: Edge[];
} {
  const contentNodes: Node[] = [];
  const edges: Edge[] = [];

  // 레이어별 노드 ID 매핑 (Swimlane 생성용)
  const layerNodeIds: Map<number, string[]> = new Map();
  // 노드 ID → 레이어 인덱스 매핑 (Dagre rank 제약용)
  const nodeLayerMap: Map<string, number> = new Map();

  // 1단계: 콘텐츠 노드 생성
  diagram.layers.forEach((layer, layerIndex) => {
    const nodeIds: string[] = [];

    layer.nodes.forEach((node) => {
      nodeIds.push(node.id);
      nodeLayerMap.set(node.id, layerIndex); // 레이어 매핑 추가
      contentNodes.push({
        id: node.id,
        type: 'customNode',
        position: { x: 0, y: 0 }, // Dagre가 계산할 예정
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

    layerNodeIds.set(layerIndex, nodeIds);
  });

  // 엣지 생성
  if (diagram.connections) {
    // 유효한 노드 ID 집합 생성 (존재하지 않는 노드 참조 필터링용)
    const validNodeIds = new Set(contentNodes.map((n) => n.id));

    // 팬아웃/팬인 감지: 동일 소스/타겟에서 여러 연결
    const sourceConnectionCount: Record<string, number> = {};
    const targetConnectionCount: Record<string, number> = {};
    diagram.connections.forEach((conn) => {
      sourceConnectionCount[conn.from] =
        (sourceConnectionCount[conn.from] || 0) + 1;
      targetConnectionCount[conn.to] =
        (targetConnectionCount[conn.to] || 0) + 1;
    });

    diagram.connections.forEach((conn, index) => {
      // 유효성 검사: source와 target 노드가 모두 존재하는지 확인
      if (!validNodeIds.has(conn.from) || !validNodeIds.has(conn.to)) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[ReactFlowDiagram] Invalid connection skipped:', conn);
        }
        return; // 유효하지 않은 연결은 생략
      }

      const isFanOut = (sourceConnectionCount[conn.from] ?? 0) >= 4;
      const isFanIn = (targetConnectionCount[conn.to] ?? 0) >= 3;
      const isConverging = isFanOut || isFanIn; // 연결선이 밀집되는 경우

      // 🚀 데이터 흐름 강조: 모든 연결선에 애니메이션 적용 (흐름 표현)
      // 실선은 느리게(데이터 흐름), 점선은 빠르게(비동기/이벤트)
      const animateEdge = true;
      const animationSpeed = conn.type === 'dashed' ? 1.5 : 3; // 숫자가 작을수록 빠름 (s)

      // 🎨 연결선 스타일 계산 (Fan-in/Fan-out 시 투명도/두께 조절)
      const getStrokeColor = () => {
        if (conn.type === 'dashed') return 'rgba(167, 139, 250, 0.5)'; // 점선: 보라색 (Fan-in 고려 투명도↓)
        if (isConverging) return 'rgba(255, 255, 255, 0.35)'; // 밀집: 더 투명하게
        return 'rgba(255, 255, 255, 0.6)';
      };

      const getMarkerColor = () => {
        if (conn.type === 'dashed') return 'rgba(167, 139, 250, 0.7)';
        if (isConverging) return 'rgba(255, 255, 255, 0.45)';
        return 'rgba(255, 255, 255, 0.8)';
      };

      edges.push({
        id: `edge-${index}`,
        source: conn.from,
        target: conn.to,
        type: 'smoothstep', // Dagre와 호환성 좋음
        animated: animateEdge,
        style: {
          stroke: getStrokeColor(),
          strokeWidth: isConverging ? 1.2 : 2, // 밀집 시 더 얇게
          strokeDasharray: conn.type === 'dashed' ? '5 5' : undefined,
          animationDuration: `${animationSpeed}s`, // CSS animation duration
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: isConverging ? 10 : 15, // 밀집 시 화살표 축소
          height: isConverging ? 10 : 15,
          color: getMarkerColor(),
        },
        // 팬아웃 시 라벨 간소화 (첫 번째만 표시)
        label: isFanOut && index > 0 ? undefined : conn.label,
        labelStyle: {
          fill: 'rgba(255, 255, 255, 0.9)',
          fontSize: 10,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: 'rgba(15, 23, 42, 0.9)',
          fillOpacity: 0.9,
        },
        labelBgPadding: [4, 4] as [number, number],
        labelBgBorderRadius: 4,
      });
    });
  }

  // 2단계: 동적 Dagre 파라미터 계산
  const maxNodesInLayer = Math.max(
    ...diagram.layers.map((layer) => layer.nodes.length)
  );

  // 노드가 많을수록 간격 축소 (동적 파라미터)
  const dynamicNodesep =
    maxNodesInLayer > 6
      ? 30 // 7개 이상: 좁은 간격
      : maxNodesInLayer > 4
        ? 45 // 5-6개: 중간 간격
        : 60; // 4개 이하: 넓은 간격

  const dynamicRanksep =
    maxNodesInLayer > 6
      ? 60 // 레이어 간 간격도 축소
      : 80;

  // 3단계: Dagre 레이아웃 적용
  const { nodes: layoutedContentNodes } = getLayoutedElements(
    contentNodes,
    edges,
    {
      direction: 'TB',
      nodesep: dynamicNodesep,
      ranksep: dynamicRanksep,
      nodeLayerMap,
    }
  );

  // 4단계: Swimlane 배경 및 라벨 생성 (레이아웃 결과 기반)
  const allNodes: Node[] = [];

  // 레이어별 bounds 계산
  const layerBounds: Map<
    number,
    { minX: number; maxX: number; minY: number; maxY: number }
  > = new Map();

  layoutedContentNodes.forEach((node) => {
    if (node.type !== 'customNode') return;

    // 어느 레이어에 속하는지 찾기
    for (const [layerIndex, nodeIds] of layerNodeIds.entries()) {
      if (nodeIds.includes(node.id)) {
        const bounds = layerBounds.get(layerIndex) ?? {
          minX: Infinity,
          maxX: -Infinity,
          minY: Infinity,
          maxY: -Infinity,
        };

        bounds.minX = Math.min(bounds.minX, node.position.x);
        bounds.maxX = Math.max(bounds.maxX, node.position.x + NODE_WIDTH);
        bounds.minY = Math.min(bounds.minY, node.position.y);
        bounds.maxY = Math.max(bounds.maxY, node.position.y + NODE_HEIGHT);

        layerBounds.set(layerIndex, bounds);
        break;
      }
    }
  });

  // 전체 콘텐츠 영역 계산 (Swimlane 폭 통일)
  let globalMinX = Infinity;
  let globalMaxX = -Infinity;

  layerBounds.forEach((bounds) => {
    globalMinX = Math.min(globalMinX, bounds.minX);
    globalMaxX = Math.max(globalMaxX, bounds.maxX);
  });

  // Swimlane 배경 및 라벨 생성
  diagram.layers.forEach((layer, layerIndex) => {
    const bounds = layerBounds.get(layerIndex);
    if (!bounds) return;

    const bgLeft =
      globalMinX - SWIMLANE_PADDING - LABEL_AREA_WIDTH - LABEL_CONTENT_GAP;
    const bgRight = globalMaxX + SWIMLANE_PADDING;
    const bgWidth = bgRight - bgLeft;
    const bgHeight = bounds.maxY - bounds.minY + SWIMLANE_PADDING * 2;

    // Swimlane 배경
    allNodes.push({
      id: `swimlane-bg-${layerIndex}`,
      type: 'swimlaneBg',
      position: { x: bgLeft, y: bounds.minY - SWIMLANE_PADDING },
      data: {
        width: bgWidth,
        height: bgHeight,
        color: layer.color,
        title: layer.title,
      } as SwimlaneBgData,
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: -1,
      width: bgWidth,
      height: bgHeight,
    });

    // 레이어 라벨 (Swimlane 좌측)
    const labelX = bgLeft + SWIMLANE_PADDING;
    const labelY =
      bounds.minY + (bounds.maxY - bounds.minY) / 2 - LABEL_NODE_HEIGHT / 2;

    allNodes.push({
      id: `layer-${layerIndex}`,
      type: 'layerLabel',
      position: { x: labelX, y: labelY },
      style: { width: LABEL_AREA_WIDTH, height: LABEL_NODE_HEIGHT },
      data: { title: layer.title, color: layer.color },
      draggable: false,
      selectable: false,
    });
  });

  // 콘텐츠 노드 추가
  allNodes.push(...layoutedContentNodes);

  return { nodes: allNodes, edges };
}

// =============================================================================
// Main Component
// =============================================================================

const nodeTypes = {
  customNode: CustomNode,
  layerLabel: LayerLabelNode,
  swimlaneBg: SwimlaneBgNode,
};

// 🔧 P0: AriaLabelConfig (WCAG AA 접근성)
const ariaLabelConfig = {
  'node.ariaLabel': '노드: {label}',
  'edge.ariaLabel': '연결: {sourceLabel}에서 {targetLabel}로',
  'controls.ariaLabel': '다이어그램 컨트롤',
  'controls.zoomIn.ariaLabel': '확대',
  'controls.zoomOut.ariaLabel': '축소',
  'controls.fitView.ariaLabel': '화면에 맞춤',
  'minimap.ariaLabel': '미니맵 - 다이어그램 전체 보기',
};

function ReactFlowDiagram({
  diagram,
  compact = true,
  showControls = true,
  showMiniMap = false,
}: ReactFlowDiagramProps) {
  // 🔧 onInit setTimeout 클린업용 ref (언마운트 시 메모리 누수 방지)
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  const { nodes, edges } = useMemo(
    () => convertToReactFlow(diagram),
    [diagram]
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      style: { stroke: 'rgba(255, 255, 255, 0.4)', strokeWidth: 2 },
    }),
    []
  );

  return (
    <Tooltip.Provider delayDuration={300}>
      <div className="flex flex-col space-y-4">
        {/* 다이어그램 헤더 */}
        <div className="text-center">
          <h3 className="mb-2 text-xl font-bold text-white">{diagram.title}</h3>
          <p className="mx-auto max-w-2xl text-sm text-gray-300">
            {diagram.description}
          </p>
        </div>

        {/* React Flow 캔버스 */}
        <DiagramErrorBoundary diagramTitle={diagram.title}>
          <div
            className={`rounded-xl border border-white/10 bg-linear-to-br from-slate-900/50 to-slate-800/50 ${
              compact
                ? 'h-[48dvh] sm:h-[50dvh] lg:h-[52dvh] max-h-[380px] sm:max-h-[400px] lg:max-h-[440px]'
                : 'h-[52dvh] sm:h-[55dvh] lg:h-[58dvh] max-h-[420px] sm:max-h-[460px] lg:max-h-[520px]'
            }`}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              defaultViewport={DEFAULT_VIEWPORT}
              fitView
              fitViewOptions={FIT_VIEW_OPTIONS}
              onInit={(instance) => {
                // 모달 트랜지션 완료 후 확실하게 맞춤 (클린업 가능하도록 ref 저장)
                if (initTimeoutRef.current)
                  clearTimeout(initTimeoutRef.current);
                initTimeoutRef.current = setTimeout(
                  () => instance.fitView(FIT_VIEW_OPTIONS),
                  800
                );
              }}
              minZoom={0.05}
              maxZoom={2.5}
              defaultEdgeOptions={defaultEdgeOptions}
              proOptions={{ hideAttribution: true }}
              nodesFocusable
              edgesFocusable
              className="react-flow-dark"
              aria-label={`${diagram.title} 아키텍처 다이어그램`}
            >
              <Background color="rgba(255, 255, 255, 0.05)" gap={20} size={1} />
              {showControls && (
                <Controls
                  className="!border-white/20 !bg-slate-800/80 [&>button]:!border-white/20 [&>button]:!bg-slate-700/80 [&>button:hover]:!bg-slate-600/80 [&>button>svg]:!fill-white/80"
                  showInteractive={false}
                  aria-label={ariaLabelConfig['controls.ariaLabel']}
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
                  aria-label={ariaLabelConfig['minimap.ariaLabel']}
                />
              )}
              <AutoFitView />
            </ReactFlow>
          </div>
        </DiagramErrorBoundary>

        {/* 범례 */}
        <div className="flex flex-wrap justify-center gap-3 border-t border-white/10 pt-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded bg-linear-to-br from-yellow-500/40 to-amber-500/40 ring-1 ring-yellow-400/50" />
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
    </Tooltip.Provider>
  );
}

export default memo(ReactFlowDiagram);
