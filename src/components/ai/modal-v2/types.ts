/**
 * AI 에이전트 모달 타입 정의
 */

export type FunctionType = 
  | 'auto-report'       // 자동 장애보고서
  | 'performance'       // 성능 분석
  | 'log-analysis'      // 로그 분석
  | 'trend-analysis'    // 트렌드 분석
  | 'quick-diagnosis'   // 빠른 진단
  | 'solutions'         // 해결책 제안
  | 'resource-usage'    // 리소스 사용량
  | 'security-check'    // 보안 점검
  | 'deployment-history' // 배포 이력
  | 'backup-status'     // 백업 상태
  | 'network-traffic'   // 네트워크 트래픽
  | 'config-checker'    // 설정 검사
  | 'api-monitor'       // API 모니터
  | 'database-health'   // DB 상태
  | 'user-activity'     // 사용자 활동
  | 'service-health'    // 서비스 상태
  | 'cost-analysis'     // 비용 분석
  | 'scheduled-tasks';  // 예약 작업

export interface FunctionCardProps {
  type: FunctionType;
  title: string;
  icon: string;
  isSelected: boolean;
  onClick: (type: FunctionType) => void;
}

export interface ModalState {
  // 질문-답변 관리
  currentQuestion: string;
  currentAnswer: string;
  isLoading: boolean;
  
  // 기능 패널 관리
  selectedFunction: FunctionType;
  functionData: Record<FunctionType, any>;
  
  // UI 상태
  isOpen: boolean;
  isMobile: boolean;
  
  // 히스토리 관리
  isHistoryOpen: boolean;
  history: HistoryItem[];
  
  // 모바일 바텀시트 상태
  bottomSheetState: BottomSheetState;
  
  // 프리셋 돌아가기 플로우
  showBackToPresets: boolean;
}

export type ModalAction = 
  | { type: 'SET_QUESTION'; payload: string }
  | { type: 'SET_ANSWER'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SELECT_FUNCTION'; payload: FunctionType }
  | { type: 'UPDATE_FUNCTION_DATA'; payload: { type: FunctionType; data: any } }
  | { type: 'TOGGLE_MODAL'; payload?: boolean }
  | { type: 'SET_MOBILE'; payload: boolean }
  | { type: 'TOGGLE_HISTORY'; payload?: boolean }
  | { type: 'ADD_HISTORY_ITEM'; payload: HistoryItem }
  | { type: 'SET_BOTTOM_SHEET_STATE'; payload: BottomSheetState }
  | { type: 'SET_BACK_TO_PRESETS'; payload: boolean };

// 히스토리 아이템 타입
export interface HistoryItem {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}

// 바텀시트 상태 타입
export type BottomSheetState = 
  | 'hidden'    // 완전 숨김 (플로팅 버튼만 보임)
  | 'peek'      // 살짝 보임 (기능 카드들만)
  | 'expanded'; // 완전 확장 (기능 카드 + 내용) 