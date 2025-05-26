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

  // 기능 데이터 로드 (실제 구현 시 API 호출 등으로 대체)
  const loadFunctionData = useCallback((functionType: FunctionType) => {
    dispatch({ 
      type: 'SET_LOADING', 
      payload: true 
    });

    // 임시 데이터 - 실제 구현에서는 API 호출로 대체
    setTimeout(() => {
      const mockData = getMockDataForFunction(functionType);
      
      dispatch({ 
        type: 'UPDATE_FUNCTION_DATA', 
        payload: { 
          type: functionType, 
          data: mockData 
        } 
      });
      
      dispatch({ 
        type: 'SET_LOADING', 
        payload: false 
      });
    }, 1000);
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

// 임시 데이터 생성 함수
function getMockDataForFunction(functionType: FunctionType): any[] {
  switch (functionType) {
    case 'auto-report':
      return [
        { id: 1, title: '서버 다운 장애', severity: 'critical', timestamp: new Date().toISOString() },
        { id: 2, title: '데이터베이스 연결 오류', severity: 'high', timestamp: new Date().toISOString() },
        { id: 3, title: '메모리 누수 감지', severity: 'medium', timestamp: new Date().toISOString() }
      ];
    
    case 'performance':
      return [
        { id: 1, name: 'Server-01', cpu: 87, memory: 92, disk: 65 },
        { id: 2, name: 'Server-02', cpu: 45, memory: 76, disk: 52 },
        { id: 3, name: 'Server-03', cpu: 32, memory: 41, disk: 28 }
      ];
    
    case 'log-analysis':
      return [
        { id: 1, level: 'ERROR', message: 'Database connection timeout', timestamp: new Date().toISOString() },
        { id: 2, level: 'ERROR', message: 'Invalid API key', timestamp: new Date().toISOString() },
        { id: 3, level: 'WARN', message: 'Cache miss rate high', timestamp: new Date().toISOString() }
      ];
    
    case 'trend-analysis':
      return [
        { id: 1, period: '1h', cpu: [45, 65, 75, 85, 65, 55], memory: [60, 65, 75, 85, 90, 92] },
        { id: 2, period: '1d', cpu: [35, 45, 65, 75, 45, 35], memory: [50, 55, 65, 75, 60, 55] },
        { id: 3, period: '1w', cpu: [25, 45, 35, 55, 65, 45], memory: [40, 45, 55, 65, 55, 45] }
      ];
    
    case 'quick-diagnosis':
      return [
        { id: 1, name: 'CPU 체크', status: 'warning', value: '85%' },
        { id: 2, name: '메모리 체크', status: 'critical', value: '92%' },
        { id: 3, name: '디스크 체크', status: 'good', value: '65%' },
        { id: 4, name: '네트워크 체크', status: 'good', value: '125ms' }
      ];
    
    case 'solutions':
      return [
        { id: 1, title: '메모리 최적화', description: '불필요한 프로세스 종료 및 메모리 정리', priority: 'high' },
        { id: 2, title: '캐시 설정 변경', description: '캐시 만료 시간 조정으로 부하 감소', priority: 'medium' },
        { id: 3, title: '서버 스케일 업', description: '리소스 한계에 도달, 서버 용량 증설 필요', priority: 'medium' }
      ];
    
    // 새로운 기능 타입에 대한 데이터
    case 'resource-usage':
      return [
        { id: 1, resource: 'CPU', value: '65%', trend: 'up' },
        { id: 2, resource: 'Memory', value: '78%', trend: 'stable' },
        { id: 3, resource: 'Disk', value: '42%', trend: 'down' }
      ];
      
    case 'security-check':
      return [
        { id: 1, check: '방화벽 설정', status: 'pass', details: '모든 규칙이 적절함' },
        { id: 2, check: '취약점 스캔', status: 'warning', details: '3개의 잠재적 취약점 발견' },
        { id: 3, check: '인증 로그', status: 'alert', details: '의심스러운 로그인 시도 감지' }
      ];
      
    // 기타 새로운 기능 타입에 대한 데이터는 간단하게 처리
    default:
      return [
        { id: 1, title: '데이터 샘플 1', description: '이 기능에 대한 데이터 샘플입니다.' },
        { id: 2, title: '데이터 샘플 2', description: '이 기능에 대한 데이터 샘플입니다.' },
        { id: 3, title: '데이터 샘플 3', description: '이 기능에 대한 데이터 샘플입니다.' }
      ];
  }
} 