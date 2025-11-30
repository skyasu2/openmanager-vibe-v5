/**
 * 🔧 useSystemChecklist Hook v3.0 (Refactored)
 *
 * 모듈화된 시스템 체크리스트 훅
 * - 타입 정의 분리
 * - 네트워크 추적 유틸리티 분리
 * - 시스템 컴포넌트 설정 분리
 * - 메인 로직만 포함
 *
 * @created 2025-06-09
 * @author AI Assistant
 * @version 3.0.0 (모듈화 완성)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { systemComponents } from '../config/system-components';
import type {
  ComponentStatus,
  SystemChecklistState,
  SystemComponent,
  UseSystemChecklistProps,
} from '../types/system-checklist';

// 타입들을 re-export
export type {
  ComponentStatus,
  SystemChecklistState,
  SystemComponent,
  UseSystemChecklistProps,
} from '../types/system-checklist';

export const useSystemChecklist = ({
  onComplete,
  skipCondition = false,
  autoStart = true,
}: UseSystemChecklistProps): SystemChecklistState => {
  const [components, setComponents] = useState<Record<string, ComponentStatus>>(
    () => {
      const _initial: Record<string, ComponentStatus> = {};
      systemComponents.forEach((comp) => {
        _initial[comp.id] = {
          id: comp.id,
          status: 'pending',
          progress: 0,
        };
      });
      return _initial;
    }
  );

  const [isCompleted, setIsCompleted] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  // 🔍 강화된 컴포넌트 체크 함수
  const checkComponent = useCallback(
    async (componentDef: SystemComponent) => {
      const componentId = componentDef.id;

      // 로딩 상태 시작
      setComponents((prev) => {
        const existing = prev[componentId];
        return {
          ...prev,
          [componentId]: {
            id: componentId,
            status: 'loading' as const,
            startTime: Date.now(),
            progress: 0,
            ...(existing && {
              completedTime: existing.completedTime,
              error: existing.error,
              networkInfo: existing.networkInfo,
            }),
          },
        };
      });

      console.log(`🔄 ${componentDef.name} 체크 시작...`);

      let animationFrame: number;

      // 프로그레스 애니메이션
      const _animateProgress = () => {
        setComponents((prev) => {
          const current = prev[componentId];
          if (
            !current ||
            current.status !== 'loading' ||
            current.progress >= 90
          ) {
            return prev;
          }

          const increment = Math.random() * 15 + 5; // 5-20% 증가
          const newProgress = Math.min(current.progress + increment, 90);

          animationFrame = requestAnimationFrame(_animateProgress);

          return {
            ...prev,
            [componentId]: {
              ...current,
              progress: newProgress,
            },
          };
        });
      };

      // 애니메이션 시작
      animationFrame = requestAnimationFrame(_animateProgress);

      try {
        // 최소 표시 시간과 실제 체크 병렬 실행
        const [checkResult] = await Promise.all([
          componentDef.checkFunction(),
          new Promise((resolve) =>
            setTimeout(resolve, Math.max(500, componentDef.estimatedTime * 0.3))
          ),
        ]);

        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }

        if (checkResult) {
          setComponents((prev) => {
            const existing = prev[componentId];
            return {
              ...prev,
              [componentId]: {
                id: componentId,
                status: 'completed' as const,
                progress: 100,
                completedTime: Date.now(),
                ...(existing && {
                  startTime: existing.startTime,
                  error: existing.error,
                  networkInfo: existing.networkInfo,
                }),
              },
            };
          });
          console.log(
            `✅ ${componentDef.name} 완료 (${Date.now() - (components[componentId]?.startTime || Date.now())}ms)`
          );
        } else {
          throw new Error(`${componentDef.name} 체크 실패`);
        }
      } catch (error) {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }

        const errorMessage =
          error instanceof Error ? error.message : '알 수 없는 오류';

        setComponents((prev) => {
          const existing = prev[componentId];
          return {
            ...prev,
            [componentId]: {
              id: componentId,
              status: 'failed' as const,
              progress: 0,
              error: errorMessage,
              ...(existing && {
                startTime: existing.startTime,
                completedTime: existing.completedTime,
                networkInfo: existing.networkInfo,
              }),
            },
          };
        });

        console.error(`❌ ${componentDef.name} 실패:`, errorMessage);
        return; // Ensure all code paths return a value
      }
    },
    [components]
  );

  // 의존성 체크 함수
  const canStartComponent = useCallback(
    (componentDef: SystemComponent): boolean => {
      if (
        !componentDef.dependencies ||
        componentDef.dependencies.length === 0
      ) {
        return true;
      }

      return componentDef.dependencies.every((depId) => {
        const depStatus = components[depId];
        return depStatus && depStatus.status === 'completed';
      });
    },
    [components]
  );

  // 체크리스트 시작 함수
  const startChecklist = useCallback(async () => {
    console.log('🚀 시스템 체크리스트 시작');

    // 의존성이 없는 컴포넌트들 먼저 시작
    const independentComponents = systemComponents.filter(
      (comp) => !comp.dependencies || comp.dependencies.length === 0
    );

    // 병렬로 독립적인 컴포넌트들 체크
    await Promise.all(
      independentComponents.map((comp) => checkComponent(comp))
    );

    // 의존성이 있는 컴포넌트들 순차적으로 체크
    const dependentComponents = systemComponents.filter(
      (comp) => comp.dependencies && comp.dependencies.length > 0
    );

    for (const comp of dependentComponents) {
      // 의존성이 충족될 때까지 대기
      while (!canStartComponent(comp)) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await checkComponent(comp);
    }
  }, [checkComponent, canStartComponent]); // checkComponent, canStartComponent 함수 의존성 복구

  // 통계 계산
  const stats = useMemo(() => {
    const componentList = Object.values(components);
    const completedCount = componentList.filter(
      (c) => c.status === 'completed'
    ).length;
    const failedCount = componentList.filter(
      (c) => c.status === 'failed'
    ).length;
    const loadingCount = componentList.filter(
      (c) => c.status === 'loading'
    ).length;
    const totalProgress =
      componentList.reduce((sum, c) => sum + c.progress, 0) /
      componentList.length;

    return {
      completedCount,
      failedCount,
      loadingCount,
      totalProgress,
    };
  }, [components]);

  // 완료 조건 체크
  useEffect(() => {
    const criticalComponents = systemComponents.filter(
      (c) => c.priority === 'critical'
    );
    const criticalCompleted = criticalComponents.every(
      (comp) => components[comp.id]?.status === 'completed'
    );

    if (criticalCompleted && !isCompleted) {
      setIsCompleted(true);
      console.log('✅ 모든 중요 컴포넌트 완료 - 시스템 준비됨');
      onComplete?.();
    }
  }, [components, isCompleted, onComplete]); // onComplete 함수 의존성 복구

  // 스킵 조건 체크 (5초 후 활성화)
  useEffect(() => {
    if (skipCondition) {
      const timer = setTimeout(() => {
        setCanSkip(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [skipCondition]);

  // 자동 시작
  useEffect(() => {
    if (autoStart) {
      void startChecklist();
    }
  }, [autoStart, startChecklist]); // startChecklist 함수 의존성 복구

  // 키보드 이벤트 (스킵 기능)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && canSkip) {
        setIsCompleted(true);
        console.log('⏭️ 사용자가 체크리스트를 건너뛰었습니다');
        onComplete?.();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [canSkip, onComplete]); // onComplete 함수 의존성 복구

  return {
    components,
    componentDefinitions: systemComponents,
    isCompleted,
    totalProgress: stats.totalProgress,
    completedCount: stats.completedCount,
    failedCount: stats.failedCount,
    loadingCount: stats.loadingCount,
    canSkip,
  };
};
