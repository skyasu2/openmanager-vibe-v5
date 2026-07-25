'use client';

/**
 * AutoFitView Component
 * @description 노드 초기화 완료 후 자동 fitView 실행
 *
 * 모달 트랜지션 완료 대기를 위해 긴 지연 시간 사용
 * - 모달 CSS 트랜지션(300ms)이 완료된 후 fitView 실행
 * - 여러 시점에서 실행하여 안정적인 뷰 맞춤 보장
 */

import { useNodesInitialized, useReactFlow } from '@xyflow/react';
import { useEffect, useRef } from 'react';

import { FIT_VIEW_OPTIONS } from '../constants';

export function AutoFitView() {
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
