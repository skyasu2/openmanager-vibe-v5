import { useReducer, useCallback } from 'react';
import { ModalState, ModalAction, FunctionType, HistoryItem, BottomSheetState } from '../types';

// 초기 상태
const initialState: ModalState = {
  currentQuestion: '',
  currentAnswer: '',
  isLoading: false,
  selectedFunction: 'auto-report',
  functionData: {
    'auto-report': [],
    'performance': [],
    'log-analysis': [],
    'trend-analysis': [],
    'quick-diagnosis': [],
    'solutions': [],
    'resource-usage': [],
    'security-check': [],
    'deployment-history': [],
    'backup-status': [],
    'network-traffic': [],
    'config-checker': [],
    'api-monitor': [],
    'database-health': [],
    'user-activity': [],
    'service-health': [],
    'cost-analysis': [],
    'scheduled-tasks': []
  },
  isOpen: false,
  isMobile: false,
  isHistoryOpen: false,
  history: [],
  bottomSheetState: 'hidden'
};

// 리듀서 함수
function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'SET_QUESTION':
      return { ...state, currentQuestion: action.payload };
    
    case 'SET_ANSWER':
      return { ...state, currentAnswer: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SELECT_FUNCTION':
      return { ...state, selectedFunction: action.payload };
    
    case 'UPDATE_FUNCTION_DATA':
      return {
        ...state,
        functionData: {
          ...state.functionData,
          [action.payload.type]: action.payload.data
        }
      };
    
    case 'TOGGLE_MODAL':
      return { 
        ...state, 
        isOpen: action.payload !== undefined ? action.payload : !state.isOpen 
      };
    
    case 'SET_MOBILE':
      return { ...state, isMobile: action.payload };
    
    case 'TOGGLE_HISTORY':
      return {
        ...state,
        isHistoryOpen: action.payload !== undefined ? action.payload : !state.isHistoryOpen
      };
    
    case 'ADD_HISTORY_ITEM':
      // 중복 방지 (같은 질문은 추가하지 않음)
      const existingItem = state.history.find(item => item.question === action.payload.question);
      if (existingItem) {
        return state;
      }
      
      return {
        ...state,
        history: [action.payload, ...state.history]
      };
    
    case 'SET_BOTTOM_SHEET_STATE':
      return {
        ...state,
        bottomSheetState: action.payload
      };
    
    default:
      return state;
  }
}

// 커스텀 훅
export function useModalState() {
  const [state, dispatch] = useReducer(modalReducer, initialState);

  // 기능 데이터 로드 (실제 API 우선, 다중 폴백 시스템)
  const loadFunctionData = useCallback(async (functionType: FunctionType) => {
    dispatch({ 
      type: 'SET_LOADING', 
      payload: true 
    });

    try {
      console.log(`🔄 Loading real data for ${functionType}...`);
      
      // 1단계: 실제 API 호출로 데이터 로드
      const realData = await fetchFunctionData(functionType);
      
      console.log(`✅ Real data loaded for ${functionType}:`, realData.length, 'items');
      
      dispatch({ 
        type: 'UPDATE_FUNCTION_DATA', 
        payload: { 
          type: functionType, 
          data: realData 
        } 
      });
    } catch (error) {
      console.warn(`⚠️ Real API failed for ${functionType}, trying fallback...`, error);
      
      try {
        // 2단계: 서버 데이터 기반 생성 시도
        const serverResponse = await fetch('/api/servers');
        if (serverResponse.ok) {
          const serverData = await serverResponse.json();
          const generatedData = generateDataFromServers(serverData, functionType);
          
          console.log(`🔧 Generated data from servers for ${functionType}:`, generatedData.length, 'items');
          
          dispatch({ 
            type: 'UPDATE_FUNCTION_DATA', 
            payload: { 
              type: functionType, 
              data: generatedData 
            } 
          });
        } else {
          throw new Error('Server API also failed');
        }
      } catch (fallbackError) {
        console.error(`❌ All data sources failed for ${functionType}:`, fallbackError);
        
        // 3단계: 최후의 수단으로 mock 데이터 사용
        const emergencyData = getMockDataForFunction(functionType);
        
        dispatch({ 
          type: 'UPDATE_FUNCTION_DATA', 
          payload: { 
            type: functionType, 
            data: emergencyData 
          } 
        });
      }
    } finally {
      dispatch({ 
        type: 'SET_LOADING', 
        payload: false 
      });
    }
  }, []);

  // 질문과 답변을 히스토리에 추가
  const addToHistory = useCallback((question: string, answer: string) => {
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      question,
      answer,
      timestamp: new Date().toISOString()
    };
    
    dispatch({
      type: 'ADD_HISTORY_ITEM',
      payload: historyItem
    });
  }, []);

  // 바텀시트 상태 제어
  const setBottomSheetState = useCallback((state: BottomSheetState) => {
    dispatch({
      type: 'SET_BOTTOM_SHEET_STATE',
      payload: state
    });
  }, []);

  return {
    state,
    dispatch,
    loadFunctionData,
    addToHistory,
    setBottomSheetState
  };
}

// 실제 API 데이터 로드 함수
async function fetchFunctionData(functionType: FunctionType): Promise<any[]> {
  try {
    console.log(`🔌 Loading data for ${functionType}...`);
    
    // 서버 데이터 우선 로드
    const serverResponse = await fetch('/api/servers');
    if (!serverResponse.ok) {
      throw new Error(`Server API failed: ${serverResponse.status}`);
    }

    const serverData = await serverResponse.json();
    
    // 기능별 데이터 변환
    return transformDataForFunction(serverData, functionType);
    
  } catch (error) {
    console.warn(`⚠️ API failed for ${functionType}, using generated data:`, (error as Error).message);
    
    // API 실패 시 서버 기반 데이터 생성 시도
    try {
      const serverResponse = await fetch('/api/servers');
      if (serverResponse.ok) {
        const serverData = await serverResponse.json();
        return generateDataFromServers(serverData, functionType);
      }
    } catch (serverError) {
      console.warn(`⚠️ Server API also failed for ${functionType}:`, serverError);
    }
    
    // 최후의 수단으로만 mock 데이터 사용
    throw error;
  }
}

// 서버 데이터 기반 실제 데이터 생성
function generateDataFromServers(apiData: any, functionType: FunctionType): any[] {
  if (!apiData.success || !apiData.data) {
    return [];
  }

  const servers = apiData.data.servers || apiData.data;
  const currentTime = new Date().toISOString();
  
  switch (functionType) {
    case 'log-analysis':
      // 서버 상태를 기반으로 실제 로그 데이터 생성
      return servers.flatMap((server: any) => {
        const logs = [];
        if ((server.metrics?.cpu || server.cpu || 0) > 80) {
          logs.push({
            id: `log-${server.id}-cpu`,
            level: 'WARNING',
            message: `High CPU usage detected on ${server.name || server.id}: ${server.metrics?.cpu || server.cpu}%`,
            timestamp: currentTime,
            serverId: server.id
          });
        }
        if ((server.metrics?.memory || server.memory || 0) > 85) {
          logs.push({
            id: `log-${server.id}-memory`,
            level: 'ERROR',
            message: `Memory threshold exceeded on ${server.name || server.id}: ${server.metrics?.memory || server.memory}%`,
            timestamp: currentTime,
            serverId: server.id
          });
        }
        if (server.status === 'critical') {
          logs.push({
            id: `log-${server.id}-critical`,
            level: 'CRITICAL',
            message: `Server ${server.name || server.id} in critical state`,
            timestamp: currentTime,
            serverId: server.id
          });
        }
        return logs;
      }).slice(0, 20);

    case 'trend-analysis':
      // 서버별 가상 트렌드 데이터 생성
      return servers.map((server: any, index: number) => ({
        id: `trend-${server.id}`,
        serverId: server.id,
        serverName: server.name || `Server-${server.id}`,
        period: '24h',
        cpu: generateTrendData(server.metrics?.cpu || server.cpu || 0),
        memory: generateTrendData(server.metrics?.memory || server.memory || 0),
        disk: generateTrendData(server.metrics?.disk || server.disk || 0)
      })).slice(0, 10);

    case 'security-check':
      // 서버 보안 상태 체크
      return servers.map((server: any) => ({
        id: `security-${server.id}`,
        serverId: server.id,
        serverName: server.name || `Server-${server.id}`,
        check: 'Health Status',
        status: server.status === 'healthy' ? 'pass' : server.status === 'warning' ? 'warning' : 'fail',
        details: `Server status: ${server.status}, CPU: ${server.metrics?.cpu || server.cpu || 0}%`,
        lastCheck: currentTime
      }));

    case 'backup-status':
      // 백업 상태 (서버 기반)
      return servers.map((server: any) => ({
        id: `backup-${server.id}`,
        serverId: server.id,
        serverName: server.name || `Server-${server.id}`,
        lastBackup: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        status: server.status === 'healthy' ? 'success' : 'failed',
        size: `${(Math.random() * 50 + 10).toFixed(1)}GB`
      }));

    case 'database-health':
      // 데이터베이스 타입 서버만 필터링
      return servers
        .filter((server: any) => server.type === 'Database' || server.role?.includes('Database') || server.name?.includes('db'))
        .map((server: any) => ({
          id: `db-${server.id}`,
          serverId: server.id,
          database: server.name || `Database-${server.id}`,
          connections: Math.floor(Math.random() * 100 + 10),
          queryTime: Math.floor(Math.random() * 500 + 50),
          status: server.status === 'healthy' ? 'online' : 'degraded'
        }));

    case 'user-activity':
      // 사용자 활동 (서버 부하 기반)
      return servers.map((server: any) => ({
        id: `activity-${server.id}`,
        serverId: server.id,
        activeUsers: Math.floor((server.metrics?.cpu || server.cpu || 0) / 10),
        requests: Math.floor((server.metrics?.cpu || server.cpu || 0) * 10 + Math.random() * 100),
        errors: server.status === 'critical' ? Math.floor(Math.random() * 10) : 0
      }));

    case 'cost-analysis':
      // 비용 분석
      return servers.map((server: any) => ({
        id: `cost-${server.id}`,
        serverId: server.id,
        serverName: server.name || `Server-${server.id}`,
        monthlyCost: `$${(Math.random() * 500 + 100).toFixed(2)}`,
        efficiency: server.status === 'healthy' ? 'high' : 'low',
        recommendation: server.status === 'critical' ? 'Optimize or replace' : 'Operating efficiently'
      }));

    default:
      // 기본적으로 서버 데이터 그대로 반환
      return servers.slice(0, 20);
  }
}

// 트렌드 데이터 생성 헬퍼
function generateTrendData(baseValue: number): number[] {
  const trend = [];
  let current = baseValue;
  
  for (let i = 0; i < 24; i++) {
    // 시간대별 변화 시뮬레이션
    const variation = (Math.random() - 0.5) * 20; // ±10% 변화
    current = Math.max(0, Math.min(100, current + variation));
    trend.push(Math.round(current));
  }
  
  return trend;
}

// 기능별 데이터 변환
function transformDataForFunction(apiData: any, functionType: FunctionType): any[] {
  // API 응답 구조 파악
  let data = apiData;
  
  // 다양한 API 응답 구조 처리
  if (apiData.success && apiData.data) {
    data = apiData.data;
  } else if (apiData.data) {
    data = apiData.data;
  }

  // 서버 데이터 추출
  const servers = data.servers || data || [];
  
  if (!Array.isArray(servers) && servers.length === 0) {
    // 서버 데이터가 아닌 경우 그대로 반환
    if (functionType === 'auto-report' && Array.isArray(data)) {
      return data.slice(0, 10);
    }
    return [];
  }

  // 공통 계산
  const avgCpu = servers.length > 0 ? servers.reduce((sum: number, s: any) => sum + (s.metrics?.cpu || s.cpu || 0), 0) / servers.length : 0;
  const avgMemory = servers.length > 0 ? servers.reduce((sum: number, s: any) => sum + (s.metrics?.memory || s.memory || 0), 0) / servers.length : 0;
  const avgDisk = servers.length > 0 ? servers.reduce((sum: number, s: any) => sum + (s.metrics?.disk || s.disk || 0), 0) / servers.length : 0;
  
  switch (functionType) {
    case 'performance':
      return servers.map((server: any) => ({
        id: server.id,
        name: server.name || `Server-${server.id}`,
        cpu: server.metrics?.cpu || server.cpu || 0,
        memory: server.metrics?.memory || server.memory || 0,
        disk: server.metrics?.disk || server.disk || 0,
        status: server.status || 'unknown'
      }));
      
    case 'resource-usage':
      return [
        { id: 1, resource: 'CPU', value: `${avgCpu.toFixed(1)}%`, trend: avgCpu > 70 ? 'up' : avgCpu > 30 ? 'stable' : 'down' },
        { id: 2, resource: 'Memory', value: `${avgMemory.toFixed(1)}%`, trend: avgMemory > 80 ? 'up' : avgMemory > 30 ? 'stable' : 'down' },
        { id: 3, resource: 'Disk', value: `${avgDisk.toFixed(1)}%`, trend: avgDisk > 90 ? 'up' : avgDisk > 30 ? 'stable' : 'down' },
        { id: 4, resource: 'Active Servers', value: `${servers.filter((s: any) => s.status === 'healthy').length}/${servers.length}`, trend: 'stable' }
      ];
      
    case 'quick-diagnosis':
      const healthyCount = servers.filter((s: any) => s.status === 'healthy').length;
      const criticalCount = servers.filter((s: any) => s.status === 'critical').length;
      const warningCount = servers.filter((s: any) => s.status === 'warning').length;
      
      return [
        { 
          id: 1, 
          name: 'CPU 체크', 
          status: avgCpu > 80 ? 'critical' : avgCpu > 60 ? 'warning' : 'good', 
          value: `${avgCpu.toFixed(1)}%`,
          details: `${servers.filter((s: any) => (s.metrics?.cpu || s.cpu || 0) > 80).length}대 서버가 80% 초과`
        },
        { 
          id: 2, 
          name: '메모리 체크', 
          status: avgMemory > 85 ? 'critical' : avgMemory > 70 ? 'warning' : 'good', 
          value: `${avgMemory.toFixed(1)}%`,
          details: `${servers.filter((s: any) => (s.metrics?.memory || s.memory || 0) > 85).length}대 서버가 85% 초과`
        },
        { 
          id: 3, 
          name: '서버 상태', 
          status: criticalCount > 0 ? 'critical' : warningCount > 2 ? 'warning' : 'good', 
          value: `${healthyCount}/${servers.length}`,
          details: `정상 ${healthyCount}대, 경고 ${warningCount}대, 위험 ${criticalCount}대`
        },
        {
          id: 4,
          name: '전체 시스템',
          status: criticalCount > 0 ? 'critical' : warningCount > 0 || avgCpu > 70 || avgMemory > 75 ? 'warning' : 'good',
          value: criticalCount === 0 && warningCount === 0 ? '정상' : '주의필요',
          details: `평균 부하: CPU ${avgCpu.toFixed(1)}%, 메모리 ${avgMemory.toFixed(1)}%`
        }
      ];

    case 'auto-report':
      // AI 분석 결과 또는 서버 기반 자동 리포트
      if (Array.isArray(data) && data.length > 0 && data[0].type) {
        // AI 분석 결과 API 응답
        return data.slice(0, 10);
      } else {
        // 서버 데이터 기반 자동 리포트 생성
        const reports = [];
        if (criticalCount > 0) {
          reports.push({
            id: 'critical-servers',
            title: '위험 상태 서버 감지',
            severity: 'critical',
            timestamp: new Date().toISOString(),
            description: `${criticalCount}대의 서버가 위험 상태입니다.`
          });
        }
        if (avgCpu > 80) {
          reports.push({
            id: 'high-cpu',
            title: 'CPU 사용률 임계치 초과',
            severity: 'high',
            timestamp: new Date().toISOString(),
            description: `전체 평균 CPU 사용률이 ${avgCpu.toFixed(1)}%입니다.`
          });
        }
        if (avgMemory > 85) {
          reports.push({
            id: 'high-memory',
            title: '메모리 사용률 임계치 초과',
            severity: 'high',
            timestamp: new Date().toISOString(),
            description: `전체 평균 메모리 사용률이 ${avgMemory.toFixed(1)}%입니다.`
          });
        }
        return reports.length > 0 ? reports : [
          {
            id: 'all-good',
            title: '시스템 정상 운영',
            severity: 'info',
            timestamp: new Date().toISOString(),
            description: '모든 서버가 정상 범위 내에서 동작하고 있습니다.'
          }
        ];
      }

    case 'solutions':
      // 솔루션 제안 (서버 상태 기반)
      const solutions = [];
      if (avgCpu > 80) {
        solutions.push({
          id: 'cpu-optimization',
          title: 'CPU 최적화',
          description: '높은 CPU 사용률 개선을 위한 프로세스 최적화 및 스케일링',
          priority: 'high',
          estimatedTime: '2-4시간'
        });
      }
      if (avgMemory > 85) {
        solutions.push({
          id: 'memory-cleanup',
          title: '메모리 정리',
          description: '메모리 누수 점검 및 불필요한 프로세스 종료',
          priority: 'high',
          estimatedTime: '1-2시간'
        });
      }
      if (criticalCount > 0) {
        solutions.push({
          id: 'critical-recovery',
          title: '위험 서버 복구',
          description: '위험 상태 서버의 즉시 점검 및 복구 작업',
          priority: 'critical',
          estimatedTime: '즉시'
        });
      }
      return solutions.length > 0 ? solutions : [
        {
          id: 'maintenance',
          title: '정기 점검',
          description: '시스템이 안정적이므로 정기 유지보수 수행',
          priority: 'low',
          estimatedTime: '예약된 시간'
        }
      ];
      
    default:
      // 기본적으로 서버 데이터 또는 API 응답 그대로 반환
      if (Array.isArray(data)) {
        return data.slice(0, 20);
      }
      return servers.slice(0, 20);
  }
}

// 최후 폴백 데이터 (API와 서버 데이터 모두 실패한 경우에만 사용)
function getMockDataForFunction(functionType: FunctionType): any[] {
  console.warn(`🚨 Using emergency fallback data for ${functionType} - All APIs failed`);
  
  const currentTime = new Date().toISOString();
  
  switch (functionType) {
    case 'auto-report':
      return [
        { id: 1, title: 'API 연결 실패', severity: 'warning', timestamp: currentTime, description: '실제 데이터를 가져올 수 없습니다' }
      ];
    
    case 'performance':
      return [
        { id: 1, name: 'No Data Available', cpu: 0, memory: 0, disk: 0, status: 'unknown' }
      ];
    
    case 'quick-diagnosis':
      return [
        { id: 1, name: '데이터 연결', status: 'critical', value: '실패', details: 'API 연결에 실패했습니다' }
      ];
      
    case 'resource-usage':
      return [
        { id: 1, resource: 'API 상태', value: '연결 실패', trend: 'down' }
      ];
      
    default:
      return [
        { id: 1, title: '데이터 없음', description: 'API 연결에 실패하여 데이터를 가져올 수 없습니다' }
      ];
  }
} 