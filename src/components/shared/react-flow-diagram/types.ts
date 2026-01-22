/**
 * ReactFlowDiagram Types
 * @description React Flow 다이어그램 관련 타입 정의
 */

import type { ArchitectureDiagram } from '@/data/architecture-diagrams.data';

export interface ReactFlowDiagramProps {
  diagram: ArchitectureDiagram;
  /** 컴팩트 모드 (모달 내부용) */
  compact?: boolean;
  /** 컨트롤 표시 여부 */
  showControls?: boolean;
  /** 미니맵 표시 여부 */
  showMiniMap?: boolean;
}

export interface CustomNodeData extends Record<string, unknown> {
  label: string;
  sublabel?: string;
  icon?: string;
  nodeType: 'primary' | 'secondary' | 'tertiary' | 'highlight';
  /** @description 레이어 색상 (디버깅/확장용) */
  layerColor: string;
  /** @description 레이어 제목 (디버깅/확장용) */
  layerTitle: string;
}

export interface SwimlaneBgData extends Record<string, unknown> {
  width: number;
  height: number;
  color: string;
  title: string;
}

export interface LayerLabelData extends Record<string, unknown> {
  title: string;
  color: string;
}

export interface LayoutOptions {
  direction?: 'TB' | 'LR';
  nodesep?: number;
  ranksep?: number;
  nodeLayerMap?: Map<string, number>;
}
