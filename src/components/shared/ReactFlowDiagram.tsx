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
 * @version 5.90.0
 * @updated 2026-01-17 - P2 개선: 에러 바운더리, 키보드 접근성 (Arrow 키)
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

// =============================================================================
// FitView 옵션 및 컴포넌트
// =============================================================================

/**
 * fitView 옵션 - 모든 노드가 화면에 보이도록 설정
 * padding: 15% 여백으로 노드가 가장자리에 닿지 않도록
 * includeHiddenNodes: 숨겨진 노드도 포함
 */
const FIT_VIEW_OPTIONS = {
  padding: 0.2, // 20% 여백 (노트북 화면 최적화)
  includeHiddenNodes: true,
  minZoom: 0.05, // 더 축소 가능하게
  maxZoom: 0.8, // fitView가 더 축소된 상태로 시작
};

/**
 * AutoFitView - 노드 초기화 완료 후 자동 fitView 실행
 *
 * 🔧 수정 (2026-01-17): useNodesInitialized + useReactFlow 조합 사용
 * - nodesInitialized가 true가 되면 모든 노드의 dimensions이 계산됨
 * - 이 시점에 fitView()를 호출하면 정확한 bounds 계산 가능
 */
function AutoFitView() {
  const nodesInitialized = useNodesInitialized();
  const { fitView } = useReactFlow();
  const hasFitted = useRef(false);

  useEffect(() => {
    // 노드가 초기화되고 아직 fitView를 실행하지 않았을 때만 실행
    if (nodesInitialized && !hasFitted.current) {
      // 약간의 지연 후 fitView 실행 (렌더링 완료 보장)
      const timer = setTimeout(() => {
        fitView({
          ...FIT_VIEW_OPTIONS,
          duration: 200, // 부드러운 애니메이션
        });
        hasFitted.current = true;
        console.log('[AutoFitView] fitView 실행 완료 (nodesInitialized)');
      }, 100);

      return () => clearTimeout(timer);
    }
    // TypeScript: 모든 경로에서 반환값 필요
    return undefined;
  }, [nodesInitialized, fitView]);

  return null;
}

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
 * - 개발 모드에서 상세 에러 정보 제공
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
    console.error('[ReactFlowDiagram] 렌더링 오류:', error);
    console.error(
      '[ReactFlowDiagram] 컴포넌트 스택:',
      errorInfo.componentStack
    );
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
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-2 max-w-full">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-400">
                기술적 세부정보 보기
              </summary>
              <pre className="mt-2 max-h-32 overflow-auto rounded bg-black/50 p-2 text-xs text-red-300">
                {this.state.error.message}
              </pre>
            </details>
          )}
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
 *
 * 📐 설계 결정 (node.measured vs 고정 크기):
 * - React Flow v12는 node.measured?.width/height를 제공하지만,
 *   Swimlane 레이아웃은 노드 렌더링 전에 배경 크기를 알아야 함
 * - 현재 CustomNode는 CSS로 크기 제한 (min-w-[120px] max-w-[180px])
 * - 텍스트는 truncate/line-clamp로 고정 높이 보장
 * - 결론: 예측 가능한 고정 크기가 Swimlane 구조에 더 적합
 *
 * 향후 동적 크기가 필요하면 useNodesInitialized() + 2-pass 렌더링 적용
 */
const NODE_WIDTH = 200;
const NODE_HEIGHT = 56;
const NODE_GAP = 24; // 30 → 24: 더 컴팩트한 레이아웃으로 전체 높이 감소
const MAX_NODES_PER_ROW = 4; // 한 줄 최대 노드 수
const LABEL_AREA_WIDTH = 180; // Swimlane 라벨 영역 너비 (확장: 120 -> 180)
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

      {/* 노드 본체 - 더 큰 사이즈로 가독성 개선 */}
      <div
        className={`flex min-w-[120px] max-w-[180px] items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-200 hover:scale-105 ${styles.bg} ${styles.border} ${styles.shadow}`}
        title={`${data.label}${data.sublabel ? `\n${data.sublabel}` : ''}`}
      >
        {data.icon && <span className="text-base">{data.icon}</span>}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">
            {data.label}
          </div>
          {data.sublabel && (
            <div className="line-clamp-2 text-[10px] leading-tight text-white/70">
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
      // 🔧 P3: 중복 배경 제거 - SwimlaneBgNode에서 통합 관리
      <div className="relative flex items-center justify-end pr-4">
        {/* 라벨 뱃지 */}
        <div
          className={`relative z-10 flex w-full max-w-[150px] flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/60 p-3 text-center shadow-lg shadow-white/10 backdrop-blur-md transition-transform hover:scale-105`}
        >
          {/* 장식용 라인 */}
          <div className={`h-1 w-6 rounded-full ${data.color}`} />
          <div className="w-full break-words text-xs font-bold leading-snug text-white">
            {data.title}
          </div>
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

      {/* 왼쪽 라벨 영역 배경 (구분선 역할) - 🔧 정렬 수정: Padding 만큼 이동하여 LabelNode와 위치 일치시킴 */}
      <div
        className="absolute top-0 bottom-0 rounded-l-xl border-r border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent"
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

  // 🔧 상단 여백 추가 (fitView가 노드 중심 기준 계산 → 시각적 콘텐츠 잘림 방지)
  // 80px 여백으로 User Query 노드가 완전히 보이도록 함
  let currentY = 80;

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
  // React Flow 좌표계는 노드의 Left를 기준점으로 하므로, 라벨 영역의 전체 너비를 빼주어야 함 (중심점이 아님)
  const fixedLabelX =
    -(maxContentWidth / 2) - LABEL_CONTENT_GAP - LABEL_AREA_WIDTH;

  // 레이어별로 노드 생성
  diagram.layers.forEach((layer, layerIndex) => {
    const nodeCount = layer.nodes.length;
    const needsMultiRow = nodeCount > MAX_NODES_PER_ROW;
    const nodesPerRow = needsMultiRow ? Math.ceil(nodeCount / 2) : nodeCount;
    const rowCount = needsMultiRow ? 2 : 1;

    // 레이어 높이 계산
    const layerHeight =
      rowCount * NODE_HEIGHT + (rowCount - 1) * NODE_GAP + SWIMLANE_PADDING * 2;

    // 현재 레이어의 콘텐츠 너비 (노드 배치에 사용)
    const currentContentWidth =
      nodesPerRow * (NODE_WIDTH + NODE_GAP) - NODE_GAP;

    // 🔧 모든 레이어의 배경을 maxContentWidth 기준으로 통일 (일관된 레이아웃)
    // 콘텐츠는 X=0 기준 중앙 정렬, 배경은 maxContentWidth를 감싸도록 설정

    // Swimlane 배경 위치 계산
    const bgLeft = fixedLabelX - SWIMLANE_PADDING;
    // 콘텐츠 영역의 오른쪽 끝 = maxContentWidth/2 + 패딩
    const bgRight = maxContentWidth / 2 + SWIMLANE_PADDING;
    const bgWidth = bgRight - bgLeft;

    nodes.push({
      id: `swimlane-bg-${layerIndex}`,
      type: 'swimlaneBg',
      position: { x: bgLeft, y: currentY - SWIMLANE_PADDING },
      data: {
        width: bgWidth,
        height: layerHeight,
        color: layer.color,
        title: layer.title,
      } as SwimlaneBgData,
      draggable: false,
      selectable: false,
      focusable: false,
      zIndex: -1,
      // React Flow 12에서 fitView가 이 노드를 포함하도록 width/height 직접 설정
      width: bgWidth,
      height: layerHeight,
    });

    // 1. 레이어 라벨 (좌측 고정 위치)
    // vertical center에 위치
    const labelY = currentY + (layerHeight - SWIMLANE_PADDING * 2) / 2 - 10; // 높이 절반 - 텍스트보정

    nodes.push({
      id: `layer-${layerIndex}`,
      type: 'layerLabel',
      position: { x: fixedLabelX, y: labelY },
      // 🔧 라벨 노드에 명시적 width 설정 (180px)
      style: { width: LABEL_AREA_WIDTH },
      width: LABEL_AREA_WIDTH,
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

// 🔧 P0: AriaLabelConfig (WCAG AA 접근성)
const ariaLabelConfig = {
  'node.ariaLabel': '노드: {label}',
  'edge.ariaLabel': '연결: {sourceLabel}에서 {targetLabel}로',
  'controls.ariaLabel': '다이어그램 컨트롤',
  'controls.zoomIn.ariaLabel': '확대',
  'controls.zoomOut.ariaLabel': '축소',
  'controls.fitView.ariaLabel': '화면에 맞춤',
  'controls.lock.ariaLabel': '인터랙션 잠금',
  'minimap.ariaLabel': '미니맵 - 다이어그램 전체 보기',
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

  // 🔧 P1: defaultEdgeOptions 메모이제이션 (렌더링 최적화)
  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      style: { stroke: 'rgba(255, 255, 255, 0.4)', strokeWidth: 2 },
    }),
    []
  );

  // 🔧 fitView는 AutoFitView 컴포넌트에서 nodesInitialized 기반으로 처리

  return (
    <div className="flex flex-col space-y-4">
      {/* 다이어그램 헤더 */}
      <div className="text-center">
        <h3 className="mb-2 text-xl font-bold text-white">{diagram.title}</h3>
        <p className="mx-auto max-w-2xl text-sm text-gray-300">
          {diagram.description}
        </p>
      </div>

      {/* React Flow 캔버스 (🔧 P2: 에러 바운더리로 보호) */}
      <DiagramErrorBoundary diagramTitle={diagram.title}>
        <div
          className={`rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/50 ${
            compact
              ? 'h-[60dvh] sm:h-[65dvh] lg:h-[70dvh] max-h-[600px] lg:max-h-[700px]'
              : 'h-[65dvh] sm:h-[70dvh] lg:h-[75dvh] max-h-[650px] lg:max-h-[750px]'
          }`}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            // 🔧 fitView: 초기 로드 시 모든 노드가 보이도록 자동 맞춤
            // minZoom을 0.1로 낮춰 충분히 축소 가능하게 설정
            fitView
            fitViewOptions={{
              padding: 0.2, // 20% 여백 (노트북 최적화)
              minZoom: 0.05,
              maxZoom: 0.8, // 더 축소된 상태로 시작
              includeHiddenNodes: true,
            }}
            minZoom={0.05}
            maxZoom={2.5}
            defaultEdgeOptions={defaultEdgeOptions}
            proOptions={{ hideAttribution: true }}
            // 🔧 P2: 키보드 접근성 - Tab으로 노드/엣지 포커스, Arrow 키로 이동
            nodesFocusable
            edgesFocusable
            className="react-flow-dark"
            aria-label={`${diagram.title} 아키텍처 다이어그램`}
          >
            {/* 🔧 AutoFitView: 500ms 후 Fit View 버튼 자동 클릭 */}
            <AutoFitView />
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
          </ReactFlow>
        </div>
      </DiagramErrorBoundary>

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
