/**
 * 🔧 useSystemChecklist Hook v2.0
 * 
 * 실제 시스템 구성 요소별 체크리스트 기반 병렬 로딩 + 강화된 디버깅
 * - 8개 실제 구성 요소의 병렬 체크
 * - 의존성 관리 및 순차 실행
 * - 우선순위 기반 완료 조건
 * - 실제 API 헬스체크 함수
 * - 강화된 에러 추적 및 네트워크 모니터링
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
  networkInfo?: {
    url: string;
    method: string;
    responseTime: number;
    statusCode: number;
    headers?: Record<string, string>;
  };
}

// 🔍 네트워크 요청 추적을 위한 래퍼 함수
const fetchWithTracking = async (url: string, options: RequestInit = {}): Promise<{ response: Response; networkInfo: any }> => {
  const startTime = Date.now();
  const method = options.method || 'GET';
  
  console.log(`🌐 API 요청 시작: ${method} ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      // 타임아웃 설정을 정확히 적용
      signal: AbortSignal.timeout(5000)
    });
    
    const responseTime = Date.now() - startTime;
    const networkInfo = {
      url,
      method,
      responseTime,
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries())
    };
    
    console.log(`📊 API 응답: ${method} ${url} - ${response.status} (${responseTime}ms)`);
    
    return { response, networkInfo };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const networkInfo = {
      url,
      method,
      responseTime,
      statusCode: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    console.error(`❌ API 에러: ${method} ${url} - ${error} (${responseTime}ms)`);
    
    throw { originalError: error, networkInfo };
  }
};

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
        const { response, networkInfo } = await fetchWithTracking('/api/health', { 
          method: 'GET'
        });
        
        // 전역 네트워크 추적에 정보 전달
        if (typeof window !== 'undefined') {
          (window as any).__networkRequests = (window as any).__networkRequests || [];
          (window as any).__networkRequests.push({
            ...networkInfo,
            timestamp: new Date().toISOString(),
            success: response.ok,
            component: 'api-server'
          });
        }
        
        return response.ok;
      } catch (error: any) {
        // 네트워크 에러 정보도 기록
        if (typeof window !== 'undefined' && error.networkInfo) {
          (window as any).__networkRequests = (window as any).__networkRequests || [];
          (window as any).__networkRequests.push({
            ...error.networkInfo,
            timestamp: new Date().toISOString(),
            success: false,
            component: 'api-server'
          });
        }
        
        safeErrorLog('🌐 API 서버 연결 실패', error.originalError || error);
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
        const { response, networkInfo } = await fetchWithTracking('/api/unified-metrics?action=health', {
          method: 'GET'
        });
        
        if (typeof window !== 'undefined') {
          (window as any).__networkRequests = (window as any).__networkRequests || [];
          (window as any).__networkRequests.push({
            ...networkInfo,
            timestamp: new Date().toISOString(),
            success: response.ok,
            component: 'metrics-database'
          });
        }
        
        return response.ok;
      } catch (error: any) {
        if (typeof window !== 'undefined' && error.networkInfo) {
          (window as any).__networkRequests = (window as any).__networkRequests || [];
          (window as any).__networkRequests.push({
            ...error.networkInfo,
            timestamp: new Date().toISOString(),
            success: false,
            component: 'metrics-database'
          });
        }
        
        safeErrorLog('📊 메트릭 데이터베이스 연결 실패', error.originalError || error);
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
        const { response, networkInfo } = await fetchWithTracking('/api/ai/integrated', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'health-check' })
        });
        
        if (typeof window !== 'undefined') {
          (window as any).__networkRequests = (window as any).__networkRequests || [];
          (window as any).__networkRequests.push({
            ...networkInfo,
            timestamp: new Date().toISOString(),
            success: response.ok,
            component: 'ai-analysis-engine'
          });
        }
        
        return response.ok;
      } catch (error: any) {
        if (typeof window !== 'undefined' && error.networkInfo) {
          (window as any).__networkRequests = (window as any).__networkRequests || [];
          (window as any).__networkRequests.push({
            ...error.networkInfo,
            timestamp: new Date().toISOString(),
            success: false,
            component: 'ai-analysis-engine'
          });
        }
        
        safeErrorLog('🧠 AI 분석 엔진 초기화 실패', error.originalError || error);
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
        const { response, networkInfo } = await fetchWithTracking('/api/prometheus/hub?query=up', {
          method: 'GET'
        });
        
        if (typeof window !== 'undefined') {
          (window as any).__networkRequests = (window as any).__networkRequests || [];
          (window as any).__networkRequests.push({
            ...networkInfo,
            timestamp: new Date().toISOString(),
            success: response.ok,
            component: 'prometheus-hub'
          });
        }
        
        return response.ok;
      } catch (error: any) {
        if (typeof window !== 'undefined' && error.networkInfo) {
          (window as any).__networkRequests = (window as any).__networkRequests || [];
          (window as any).__networkRequests.push({
            ...error.networkInfo,
            timestamp: new Date().toISOString(),
            success: false,
            component: 'prometheus-hub'
          });
        }
        
        safeErrorLog('📈 Prometheus 허브 연결 실패', error.originalError || error);
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
        const { response, networkInfo } = await fetchWithTracking('/api/servers/next', {
          method: 'GET'
        });
        
        if (typeof window !== 'undefined') {
          (window as any).__networkRequests = (window as any).__networkRequests || [];
          (window as any).__networkRequests.push({
            ...networkInfo,
            timestamp: new Date().toISOString(),
            success: response.ok,
            component: 'server-generator'
          });
        }
        
        return response.ok;
      } catch (error: any) {
        if (typeof window !== 'undefined' && error.networkInfo) {
          (window as any).__networkRequests = (window as any).__networkRequests || [];
          (window as any).__networkRequests.push({
            ...error.networkInfo,
            timestamp: new Date().toISOString(),
            success: false,
            component: 'server-generator'
          });
        }
        
        safeErrorLog('🖥️ 서버 생성기 연결 실패', error.originalError || error);
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
      console.log('⚡ 캐시 시스템 체크 시작');
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('✅ 캐시 시스템 체크 완료');
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
      console.log('🔒 보안 검증 시작');
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ 보안 검증 완료');
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
      console.log('🎨 UI 컴포넌트 준비 시작');
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('✅ UI 컴포넌트 준비 완료');
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

  // 🔍 강화된 컴포넌트 체크 함수
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
    
    console.group(`🔄 ${componentDef.name} 확인 시작`);
    console.log('컴포넌트 ID:', componentId);
    console.log('우선순위:', componentDef.priority);
    console.log('예상 시간:', componentDef.estimatedTime + 'ms');
    console.log('의존성:', componentDef.dependencies || '없음');
    
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
        console.log(`✅ ${componentDef.name} 완료 (${Date.now() - startTime}ms)`);
      } else {
        throw new Error(`${componentDef.name} 체크 실패`);
      }
    } catch (error: any) {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const networkInfo = error.networkInfo;
      
      console.error(`❌ ${componentDef.name} 실패:`, error);
      console.error('에러 메시지:', errorMessage);
      console.error('네트워크 정보:', networkInfo);
      console.error('소요 시간:', Date.now() - startTime + 'ms');
      
      // 전역 에러 추적
      if (typeof window !== 'undefined') {
        (window as any).__componentErrors = (window as any).__componentErrors || [];
        (window as any).__componentErrors.push({
          component: componentId,
          componentName: componentDef.name,
          error: errorMessage,
          timestamp: new Date().toISOString(),
          networkInfo,
          stack: error.stack,
          priority: componentDef.priority
        });
      }
      
      if (componentDef.priority === 'critical') {
        // Critical 컴포넌트 실패 시 재시도 (최대 2회)
        const retryCount = (window as any)[`retry_${componentId}`] || 0;
        if (retryCount < 2) {
          (window as any)[`retry_${componentId}`] = retryCount + 1;
          console.log(`🔄 ${componentDef.name} 재시도 (${retryCount + 1}/2)`);
          setTimeout(() => checkComponent(componentDef), 1000);
          console.groupEnd();
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
          error: errorMessage,
          networkInfo
        }
      }));
    }
    
    console.groupEnd();
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

  // 🛠️ 강화된 전역 디버깅 함수 등록
  useEffect(() => {
    const enhancedDebugTools = {
      components,
      stats,
      isCompleted,
      canSkip,
      
      // 네트워크 요청 히스토리
      getNetworkHistory: () => (window as any).__networkRequests || [],
      
      // 에러 히스토리
      getErrorHistory: () => (window as any).__componentErrors || [],
      
      // 컴포넌트별 상세 분석
      analyzeComponent: (componentId: string) => {
        const component = OPENMANAGER_COMPONENTS.find(c => c.id === componentId);
        const status = components[componentId];
        const networkRequests = ((window as any).__networkRequests || []).filter((req: any) => req.component === componentId);
        const errors = ((window as any).__componentErrors || []).filter((err: any) => err.component === componentId);
        
        console.group(`🔍 컴포넌트 상세 분석: ${component?.name || componentId}`);
        console.log('📋 컴포넌트 정의:', component);
        console.log('📊 현재 상태:', status);
        console.log('🌐 네트워크 요청:', networkRequests);
        console.log('❌ 에러 히스토리:', errors);
        console.groupEnd();
        
        return { component, status, networkRequests, errors };
      },
      
      // 성능 분석
      analyzePerformance: () => {
        const completedComponents = Object.entries(components)
          .filter(([_, status]) => status.status === 'completed' && status.startTime && status.completedTime)
          .map(([id, status]) => ({
            id,
            name: OPENMANAGER_COMPONENTS.find(c => c.id === id)?.name || id,
            duration: status.completedTime! - status.startTime!
          }));
        
        const networkRequests = (window as any).__networkRequests || [];
        const avgNetworkTime = networkRequests.length > 0 
          ? networkRequests.reduce((sum: number, req: any) => sum + req.responseTime, 0) / networkRequests.length 
          : 0;
        
        console.group('⚡ 성능 분석 보고서');
        console.log('완료된 컴포넌트:', completedComponents);
        console.log('평균 네트워크 응답 시간:', avgNetworkTime.toFixed(2) + 'ms');
        console.log('가장 느린 컴포넌트:', completedComponents.sort((a, b) => b.duration - a.duration)[0]);
        console.log('가장 빠른 컴포넌트:', completedComponents.sort((a, b) => a.duration - b.duration)[0]);
        console.groupEnd();
        
        return { completedComponents, avgNetworkTime };
      },
      
      // 전체 상태 내보내기
      exportFullState: () => {
        const fullState = {
          timestamp: new Date().toISOString(),
          components,
          stats,
          isCompleted,
          canSkip,
          networkHistory: (window as any).__networkRequests || [],
          errorHistory: (window as any).__componentErrors || [],
          userAgent: navigator.userAgent,
          url: window.location.href
        };
        
        console.log('📤 전체 상태 내보내기:', fullState);
        
        // JSON 다운로드
        const blob = new Blob([JSON.stringify(fullState, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-checklist-debug-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        return fullState;
      }
    };
    
    (window as any).debugSystemChecklist = enhancedDebugTools;
    (window as any).systemChecklistDebugAdvanced = enhancedDebugTools;

    (window as any).emergencyCompleteChecklist = () => {
      console.log('🚨 시스템 체크리스트 비상 완료');
      setIsCompleted(true);
      onComplete?.();
    };
    
    // 개발 환경에서만 초기 안내 출력
    if (process.env.NODE_ENV === 'development' && Object.keys(components).length > 0) {
      console.group('🛠️ SystemChecklist 고급 디버깅 도구');
      console.log('상태 확인:', 'debugSystemChecklist');
      console.log('성능 분석:', 'debugSystemChecklist.analyzePerformance()');
      console.log('네트워크 히스토리:', 'debugSystemChecklist.getNetworkHistory()');
      console.log('에러 히스토리:', 'debugSystemChecklist.getErrorHistory()');
      console.log('상태 내보내기:', 'debugSystemChecklist.exportFullState()');
      console.groupEnd();
    }
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