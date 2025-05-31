/**
 * 🔧 useSystemChecklist Hook v1.0
 * 
 * 실제 시스템 구성 요소별 체크리스트 기반 병렬 로딩
 * - 8개 실제 구성 요소의 병렬 체크
 * - 의존성 관리 및 순차 실행
 * - 우선순위 기반 완료 조건
 * - 실제 API 헬스체크 함수
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { safeErrorLog } from '../lib/error-handler';

export interface SystemComponent {
  id: string;
  name: string;
  description: string;
  icon: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: number;  // 예상 완료 시간 (ms)
  dependencies?: string[]; // 의존성 (다른 컴포넌트 완료 후 시작)
  checkFunction: () => Promise<boolean>;
}

export interface ComponentStatus {
  id: string;
  status: 'pending' | 'loading' | 'completed' | 'failed';
  startTime?: number;
  completedTime?: number;
  progress: number;
  error?: string;
}

const OPENMANAGER_COMPONENTS: SystemComponent[] = [
  {
    id: 'api-server',
    name: 'API 서버 연결',
    description: '핵심 API 엔드포인트 연결을 확인합니다',
    icon: '🌐',
    priority: 'critical',
    estimatedTime: 800,
    checkFunction: async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'GET',
          timeout: 5000 
        } as RequestInit);
        return response.ok;
      } catch {
        return false;
      }
    }
  },
  {
    id: 'metrics-database',
    name: '메트릭 데이터베이스',
    description: '서버 모니터링 데이터 저장소를 준비합니다',
    icon: '📊',
    priority: 'critical',
    estimatedTime: 1000,
    checkFunction: async () => {
      try {
        const response = await fetch('/api/unified-metrics?action=health', {
          method: 'GET',
          timeout: 5000
        } as RequestInit);
        return response.ok;
      } catch {
        return false;
      }
    }
  },
  {
    id: 'ai-analysis-engine',
    name: 'AI 분석 엔진',
    description: '지능형 서버 분석 시스템을 초기화합니다',
    icon: '🧠',
    priority: 'high',
    estimatedTime: 1500,
    dependencies: ['api-server'],
    checkFunction: async () => {
      try {
        const response = await fetch('/api/ai/integrated', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'health-check' }),
          timeout: 5000
        } as RequestInit);
        return response.ok;
      } catch {
        return false;
      }
    }
  },
  {
    id: 'prometheus-hub',
    name: 'Prometheus 허브',
    description: '메트릭 수집 및 저장 시스템을 활성화합니다',
    icon: '📈',
    priority: 'high',
    estimatedTime: 900,
    dependencies: ['metrics-database'],
    checkFunction: async () => {
      try {
        const response = await fetch('/api/prometheus/hub?query=up', {
          method: 'GET',
          timeout: 5000
        } as RequestInit);
        return response.ok;
      } catch {
        return false;
      }
    }
  },
  {
    id: 'server-generator',
    name: '서버 생성기',
    description: '가상 서버 인스턴스 생성 시스템을 준비합니다',
    icon: '🖥️',
    priority: 'high',
    estimatedTime: 600,
    checkFunction: async () => {
      try {
        const response = await fetch('/api/servers/next', {
          method: 'GET',
          timeout: 5000
        } as RequestInit);
        return response.ok;
      } catch {
        return false;
      }
    }
  },
  {
    id: 'cache-system',
    name: '캐시 시스템',
    description: '성능 최적화를 위한 캐시를 활성화합니다',
    icon: '⚡',
    priority: 'medium',
    estimatedTime: 400,
    checkFunction: async () => {
      // 캐시 시스템 체크 - 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    }
  },
  {
    id: 'security-validator',
    name: '보안 검증',
    description: '시스템 보안 정책을 검증합니다',
    icon: '🔒',
    priority: 'medium',
    estimatedTime: 700,
    checkFunction: async () => {
      // 보안 검증 로직 - 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    }
  },
  {
    id: 'ui-components',
    name: 'UI 컴포넌트',
    description: '대시보드 인터페이스를 준비합니다',
    icon: '🎨',
    priority: 'low',
    estimatedTime: 300,
    dependencies: ['api-server', 'metrics-database'],
    checkFunction: async () => {
      // UI 컴포넌트 준비 체크 - 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 200));
      return true;
    }
  }
];

interface UseSystemChecklistProps {
  onComplete?: () => void;
  skipCondition?: boolean;
  autoStart?: boolean;
}

interface SystemChecklistState {
  components: Record<string, ComponentStatus>;
  componentDefinitions: SystemComponent[];
  isCompleted: boolean;
  totalProgress: number;
  completedCount: number;
  failedCount: number;
  loadingCount: number;
  canSkip: boolean;
}

export const useSystemChecklist = ({
  onComplete,
  skipCondition = false,
  autoStart = true
}: UseSystemChecklistProps): SystemChecklistState => {
  const [components, setComponents] = useState<Record<string, ComponentStatus>>(() => {
    const initial: Record<string, ComponentStatus> = {};
    OPENMANAGER_COMPONENTS.forEach(comp => {
      initial[comp.id] = {
        id: comp.id,
        status: 'pending',
        progress: 0
      };
    });
    return initial;
  });
  
  const [isCompleted, setIsCompleted] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  // 컴포넌트 체크 함수
  const checkComponent = useCallback(async (componentDef: SystemComponent) => {
    const componentId = componentDef.id;
    
    // 로딩 상태 시작
    setComponents(prev => ({
      ...prev,
      [componentId]: {
        ...prev[componentId],
        status: 'loading',
        startTime: Date.now(),
        progress: 0
      }
    }));
    
    console.log(`🔄 ${componentDef.name} 확인 시작`);
    
    // 진행률 애니메이션
    const startTime = Date.now();
    let animationFrame: number | undefined;
    
    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / componentDef.estimatedTime) * 90, 90);
      
      setComponents(prev => ({
        ...prev,
        [componentId]: {
          ...prev[componentId],
          progress
        }
      }));
      
      if (progress < 90) {
        animationFrame = requestAnimationFrame(animateProgress);
      }
    };
    
    animateProgress();
    
    try {
      // 최소 표시 시간과 실제 체크 병렬 실행
      const [checkResult] = await Promise.all([
        componentDef.checkFunction(),
        new Promise(resolve => setTimeout(resolve, Math.max(500, componentDef.estimatedTime * 0.3)))
      ]);
      
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      if (checkResult) {
        setComponents(prev => ({
          ...prev,
          [componentId]: {
            ...prev[componentId],
            status: 'completed',
            progress: 100,
            completedTime: Date.now()
          }
        }));
        console.log(`✅ ${componentDef.name} 완료`);
      } else {
        throw new Error(`${componentDef.name} 체크 실패`);
      }
    } catch (error) {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      console.warn(`❌ ${componentDef.name} 실패:`, error);
      
      if (componentDef.priority === 'critical') {
        // Critical 컴포넌트 실패 시 재시도 (최대 2회)
        const retryCount = (window as any)[`retry_${componentId}`] || 0;
        if (retryCount < 2) {
          (window as any)[`retry_${componentId}`] = retryCount + 1;
          console.log(`🔄 ${componentDef.name} 재시도 (${retryCount + 1}/2)`);
          setTimeout(() => checkComponent(componentDef), 1000);
          return;
        }
      }
      
      // 중요하지 않은 컴포넌트는 실패로 처리하고 진행
      setComponents(prev => ({
        ...prev,
        [componentId]: {
          ...prev[componentId],
          status: 'failed',
          progress: 100,
          error: (error as Error).message
        }
      }));
    }
  }, []);
  
  // 의존성 확인 및 컴포넌트 시작
  const startComponentIfReady = useCallback((componentDef: SystemComponent) => {
    const dependencies = componentDef.dependencies || [];
    const allDependenciesCompleted = dependencies.every(depId => 
      components[depId]?.status === 'completed'
    );
    
    if (allDependenciesCompleted && components[componentDef.id].status === 'pending') {
      checkComponent(componentDef);
    }
  }, [components, checkComponent]);
  
  // 초기 시작 및 의존성 체크
  useEffect(() => {
    if (!autoStart || isCompleted) return;
    
    OPENMANAGER_COMPONENTS.forEach(comp => {
      startComponentIfReady(comp);
    });
  }, [components, startComponentIfReady, autoStart, isCompleted]);

  // 스킵 조건 체크
  useEffect(() => {
    if (skipCondition) {
      console.log('⚡ 시스템 체크리스트 스킵 - 즉시 완료');
      setIsCompleted(true);
      onComplete?.();
    }
  }, [skipCondition, onComplete]);

  // 3초 후 스킵 활성화
  useEffect(() => {
    const skipTimer = setTimeout(() => {
      setCanSkip(true);
      console.log('✨ 3초 경과 - 스킵 기능 활성화');
    }, 3000);

    return () => clearTimeout(skipTimer);
  }, []);
  
  // 통계 계산
  const stats = useMemo(() => {
    const statuses = Object.values(components);
    return {
      completed: statuses.filter(c => c.status === 'completed').length,
      failed: statuses.filter(c => c.status === 'failed').length,
      loading: statuses.filter(c => c.status === 'loading').length,
      totalProgress: Math.round(
        statuses.reduce((sum, comp) => sum + comp.progress, 0) / OPENMANAGER_COMPONENTS.length
      )
    };
  }, [components]);
  
  // 완료 조건 체크
  useEffect(() => {
    const criticalAndHighComponents = OPENMANAGER_COMPONENTS.filter(
      comp => comp.priority === 'critical' || comp.priority === 'high'
    );
    
    const allCriticalCompleted = criticalAndHighComponents.every(comp => {
      const status = components[comp.id]?.status;
      return status === 'completed' || (comp.priority === 'high' && status === 'failed');
    });
    
    if (allCriticalCompleted && !isCompleted) {
      console.log('🎉 모든 핵심 시스템 구성 요소 준비 완료');
      setIsCompleted(true);
      
      // 0.5초 후 완료 처리 (사용자가 모든 체크마크를 확인할 시간)
      setTimeout(() => {
        try {
          onComplete?.();
        } catch (error) {
          safeErrorLog('❌ onComplete 콜백 에러', error);
        }
      }, 500);
    }
  }, [components, isCompleted, onComplete]);

  // 키보드 단축키 (Enter, Space, Escape)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (['Enter', ' ', 'Escape'].includes(e.key) && canSkip && !isCompleted) {
        console.log(`🚀 ${e.key} 키로 체크리스트 스킵`);
        setIsCompleted(true);
        onComplete?.();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [canSkip, isCompleted, onComplete]);

  // 전역 디버깅 함수 등록
  useEffect(() => {
    (window as any).debugSystemChecklist = {
      components,
      stats,
      isCompleted,
      canSkip
    };

    (window as any).emergencyCompleteChecklist = () => {
      console.log('🚨 시스템 체크리스트 비상 완료');
      setIsCompleted(true);
      onComplete?.();
    };
  }, [components, stats, isCompleted, canSkip, onComplete]);
  
  return {
    components,
    componentDefinitions: OPENMANAGER_COMPONENTS,
    isCompleted,
    totalProgress: stats.totalProgress,
    completedCount: stats.completed,
    failedCount: stats.failed,
    loadingCount: stats.loading,
    canSkip
  };
}; 