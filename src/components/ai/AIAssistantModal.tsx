'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssistantSession } from '../../hooks/useAssistantSession';
import ResultCard, { ResultCardData } from './ResultCard';
import PatternSelector, { PatternOption } from './PatternSelector';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: 'urgent' | 'warning' | 'normal' | 'recommendation';
}

// 마우스 제스처 인터페이스
interface MouseGesture {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isTracking: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
}

export default function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'patterns' | 'history'>('analysis');
  const [resultCards, setResultCards] = useState<ResultCardData[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 마우스 제스처 상태
  const [mouseGesture, setMouseGesture] = useState<MouseGesture>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isTracking: false,
    direction: null,
    distance: 0
  });
  const [gestureIndicator, setGestureIndicator] = useState<{
    show: boolean;
    direction: string;
    intensity: number;
  }>({
    show: false,
    direction: '',
    intensity: 0
  });

  const [patterns, setPatterns] = useState<PatternOption[]>([
    {
      id: 'normal',
      name: '정상 운영',
      description: '안정적인 서버 운영 상태',
      icon: 'fas fa-check-circle',
      color: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
      active: true
    },
    {
      id: 'high-load',
      name: '고부하',
      description: '높은 트래픽 및 리소스 사용',
      icon: 'fas fa-fire',
      color: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
      active: false
    },
    {
      id: 'maintenance',
      name: '유지보수',
      description: '시스템 점검 및 업데이트',
      icon: 'fas fa-tools',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
      active: false
    }
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { autoActivate, getSessionInfo, isSystemActive } = useAssistantSession();

  // 서버 데이터 상태
  const [serverData, setServerData] = useState<any>(null);
  const [isServerDataLoaded, setIsServerDataLoaded] = useState(false);
  const [aiEngineStatus, setAiEngineStatus] = useState<'initializing' | 'ready' | 'error'>('initializing');

  // 빠른 액션 버튼들
  const quickActions: QuickAction[] = [
    {
      id: 'server-status',
      title: '서버 상태 요약',
      description: '전체 서버 현황 분석',
      icon: 'fas fa-server',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      category: 'normal'
    },
    {
      id: 'security-check',
      title: '보안 점검',
      description: '보안 취약점 스캔',
      icon: 'fas fa-shield-alt',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      category: 'recommendation'
    },
    {
      id: 'auto-report',
      title: '자동 리포트 생성',
      description: '종합 분석 보고서',
      icon: 'fas fa-file-alt',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      category: 'recommendation'
    },
    {
      id: 'performance-analysis',
      title: '성능 분석',
      description: '시스템 성능 최적화',
      icon: 'fas fa-tachometer-alt',
      color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
      category: 'warning'
    },
    {
      id: 'emergency-scan',
      title: '긴급 스캔',
      description: '즉시 문제 탐지',
      icon: 'fas fa-exclamation-triangle',
      color: 'bg-gradient-to-r from-red-500 to-red-600',
      category: 'urgent'
    },
    {
      id: 'resource-optimization',
      title: '리소스 최적화',
      description: '메모리/CPU 최적화',
      icon: 'fas fa-microchip',
      color: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      category: 'recommendation'
    }
  ];

  // 마우스 제스처 이벤트 핸들러들
  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseGesture({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isTracking: true,
      direction: null,
      distance: 0
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseGesture.isTracking) return;

    const deltaX = e.clientX - mouseGesture.startX;
    const deltaY = e.clientY - mouseGesture.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    
    // 최소 거리 임계값 (30px)
    if (distance > 30) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
    }

    setMouseGesture(prev => ({
      ...prev,
      currentX: e.clientX,
      currentY: e.clientY,
      direction,
      distance
    }));

    // 제스처 인디케이터 업데이트
    if (direction && distance > 30) {
      const intensity = Math.min(distance / 100, 1); // 최대 100px에서 100% 강도
      setGestureIndicator({
        show: true,
        direction: getGestureDirectionText(direction),
        intensity
      });

      // 모달에 시각적 피드백 적용
      if (modalRef.current) {
        const transform = getModalTransform(direction, intensity);
        modalRef.current.style.transform = transform;
        modalRef.current.style.transition = 'transform 0.1s ease-out';
      }
    } else {
      setGestureIndicator(prev => ({ ...prev, show: false }));
      if (modalRef.current) {
        modalRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    }
  };

  const handleMouseUp = () => {
    if (!mouseGesture.isTracking) return;

    const { direction, distance } = mouseGesture;
    
    // 제스처 완료 처리 (거리가 80px 이상일 때)
    if (direction && distance > 80) {
      handleGestureComplete(direction);
    }

    // 상태 초기화
    setMouseGesture(prev => ({ ...prev, isTracking: false }));
    setGestureIndicator({ show: false, direction: '', intensity: 0 });
    
    // 모달 위치 복원
    if (modalRef.current) {
      modalRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
      modalRef.current.style.transition = 'transform 0.3s ease-out';
    }
  };

  // 제스처 방향 텍스트 변환
  const getGestureDirectionText = (direction: 'left' | 'right' | 'up' | 'down'): string => {
    const directionMap = {
      left: '← 이전 탭',
      right: '다음 탭 →',
      up: '↑ 새로고침',
      down: '↓ 닫기'
    };
    return directionMap[direction];
  };

  // 모달 변형 효과 계산
  const getModalTransform = (direction: 'left' | 'right' | 'up' | 'down', intensity: number): string => {
    const baseTransform = 'translate(-50%, -50%)';
    const maxOffset = 20; // 최대 이동 거리
    const maxScale = 0.05; // 최대 스케일 변화
    
    switch (direction) {
      case 'left':
        return `${baseTransform} translateX(-${intensity * maxOffset}px) scale(${1 - intensity * maxScale})`;
      case 'right':
        return `${baseTransform} translateX(${intensity * maxOffset}px) scale(${1 - intensity * maxScale})`;
      case 'up':
        return `${baseTransform} translateY(-${intensity * maxOffset}px) scale(${1 + intensity * maxScale})`;
      case 'down':
        return `${baseTransform} translateY(${intensity * maxOffset}px) scale(${1 - intensity * maxScale})`;
      default:
        return baseTransform;
    }
  };

  // 제스처 완료 처리
  const handleGestureComplete = (direction: 'left' | 'right' | 'up' | 'down') => {
    switch (direction) {
      case 'left':
        // 이전 탭으로 이동
        if (activeTab === 'patterns') setActiveTab('analysis');
        else if (activeTab === 'history') setActiveTab('patterns');
        break;
      case 'right':
        // 다음 탭으로 이동
        if (activeTab === 'analysis') setActiveTab('patterns');
        else if (activeTab === 'patterns') setActiveTab('history');
        break;
      case 'up':
        // 새로고침 (기본 카드 재생성)
        generateDefaultCards();
        break;
      case 'down':
        // 모달 닫기
        onClose();
        break;
    }
  };

  // 서버 데이터 로드
  const loadServerData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setServerData(data);
        setIsServerDataLoaded(true);
      }
    } catch (error) {
      console.warn('서버 데이터 로드 실패:', error);
      setIsServerDataLoaded(false);
    }
  };

  // AI 엔진 상태 확인
  const checkAIEngineStatus = async () => {
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' })
      });
      
      if (response.ok) {
        setAiEngineStatus('ready');
      } else {
        setAiEngineStatus('error');
      }
    } catch (error) {
      console.warn('AI 엔진 상태 확인 실패:', error);
      setAiEngineStatus('error');
    }
  };

  // 모달 열림 시 포커스 및 기본 카드 생성
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      
      // 서버 데이터 로드 및 AI 엔진 상태 확인
      loadServerData();
      checkAIEngineStatus();
      
      // 기본 카드 3개 생성
      if (resultCards.length === 0) {
        generateDefaultCards();
      }
    }
  }, [isOpen]);

  // 기본 카드 생성
  const generateDefaultCards = () => {
    const defaultCards: ResultCardData[] = [
      {
        id: 'default-server-status',
        title: '서버 상태 요약',
        category: 'normal',
        content: '현재 20개 서버가 모니터링 중입니다. 18개 서버가 정상 상태이며, 2개 서버에서 경고가 발생했습니다.',
        timestamp: new Date(),
        metrics: [
          { label: '총 서버', value: '20대', status: 'good' },
          { label: '정상', value: '18대', status: 'good' },
          { label: '경고', value: '2대', status: 'warning' },
          { label: '오프라인', value: '0대', status: 'good' }
        ],
        actions: [
          {
            label: '상세 분석',
            action: () => executeQuickAction('server-status'),
            variant: 'primary'
          }
        ],
        expandable: true
      },
      {
        id: 'default-security',
        title: '보안 점검 결과',
        category: 'recommendation',
        content: '마지막 보안 스캔에서 중요한 취약점은 발견되지 않았습니다. 정기적인 보안 업데이트가 권장됩니다.',
        timestamp: new Date(),
        metrics: [
          { label: '취약점', value: '0개', status: 'good' },
          { label: '업데이트', value: '3개 대기', status: 'warning' },
          { label: '방화벽', value: '활성', status: 'good' }
        ],
        actions: [
          {
            label: '전체 스캔',
            action: () => executeQuickAction('security-check'),
            variant: 'primary'
          }
        ]
      },
      {
        id: 'default-report',
        title: '자동 리포트 준비',
        category: 'recommendation',
        content: '시스템 분석을 위한 종합 리포트를 생성할 수 있습니다. 성능, 보안, 리소스 사용량을 포함합니다.',
        timestamp: new Date(),
        actions: [
          {
            label: '리포트 생성',
            action: () => executeQuickAction('auto-report'),
            variant: 'primary'
          }
        ]
      }
    ];
    
    setResultCards(defaultCards);
  };

  // 빠른 액션 실행
  const executeQuickAction = async (actionId: string) => {
    const action = quickActions.find(a => a.id === actionId);
    if (!action) return;

    await autoActivate();
    setIsProcessing(true);

    try {
      // Enhanced AI Agent API 호출
      const query = `${action.title}: ${action.description}에 대한 상세 분석을 수행해주세요.`;
      
      const response = await fetch('/api/ai-agent/smart-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          sessionId: `modal_${Date.now()}`,
          userId: 'user',
          forceMode: action.category === 'urgent' ? 'advanced' : undefined,
          serverData: serverData
        })
      });

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'AI 분석 실패');
      }

      // 새 결과 카드 생성
      const newCard: ResultCardData = {
        id: `action-${actionId}-${Date.now()}`,
        title: action.title,
        category: action.category,
        content: result.data?.response || '분석이 완료되었습니다.',
        timestamp: new Date(),
        metrics: generateMockMetrics(actionId),
        actions: [
          {
            label: '새로고침',
            action: () => executeQuickAction(actionId),
            variant: 'secondary'
          },
          {
            label: '상세 분석',
            action: () => handleAnalysisInput(`${action.title}에 대한 더 자세한 분석을 해주세요`),
            variant: 'primary'
          }
        ],
        expandable: true
      };

      // 기존 카드 교체 또는 추가
      setResultCards(prev => {
        const existingIndex = prev.findIndex(card => card.title === action.title);
        if (existingIndex >= 0) {
          // 기존 카드 교체
          const updated = [...prev];
          updated[existingIndex] = newCard;
          return updated;
        } else {
          // 새 카드 추가 (최대 6개)
          return [newCard, ...prev].slice(0, 6);
        }
      });

    } catch (error) {
      console.error('빠른 액션 실행 실패:', error);
      
      // 에러 카드 생성
      const errorCard: ResultCardData = {
        id: `error-${actionId}-${Date.now()}`,
        title: `${action.title} - 오류`,
        category: 'urgent',
        content: `분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp: new Date(),
        actions: [
          {
            label: '다시 시도',
            action: () => executeQuickAction(actionId),
            variant: 'primary'
          }
        ]
      };
      
      setResultCards(prev => [errorCard, ...prev].slice(0, 6));
    } finally {
      setIsProcessing(false);
    }
  };

  // 입력창에서 분석 실행
  const handleAnalysisInput = async (query: string) => {
    if (!query.trim()) return;

    await autoActivate();
    setIsProcessing(true);
    setInputValue('');

    try {
      // Enhanced AI Agent API 호출
      const response = await fetch('/api/ai-agent/smart-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          sessionId: `modal_input_${Date.now()}`,
          userId: 'user',
          serverData: serverData
        })
      });

      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'AI 분석 실패');
      }
      
      const newCard: ResultCardData = {
        id: `input-${Date.now()}`,
        title: '사용자 질의 분석',
        category: 'normal',
        content: result.data?.response || '분석이 완료되었습니다.',
        timestamp: new Date(),
        actions: [
          {
            label: '관련 분석',
            action: () => executeQuickAction('server-status'),
            variant: 'secondary'
          },
          {
            label: '추가 질문',
            action: () => {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            },
            variant: 'primary'
          }
        ],
        expandable: true
      };

      setResultCards(prev => [newCard, ...prev].slice(0, 6));

    } catch (error) {
      console.error('분석 실행 실패:', error);
      
      // 에러 카드 생성
      const errorCard: ResultCardData = {
        id: `input-error-${Date.now()}`,
        title: '질의 분석 - 오류',
        category: 'urgent',
        content: `분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
        timestamp: new Date(),
        actions: [
          {
            label: '다시 시도',
            action: () => handleAnalysisInput(query),
            variant: 'primary'
          }
        ]
      };
      
      setResultCards(prev => [errorCard, ...prev].slice(0, 6));
    } finally {
      setIsProcessing(false);
    }
  };

  // 패턴 변경
  const handlePatternChange = async (patternId: string) => {
    try {
      const response = await fetch('/api/data-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change-pattern', pattern: patternId })
      });

      if (response.ok) {
        setPatterns(prev => prev.map(p => ({
          ...p,
          active: p.id === patternId
        })));
      }
    } catch (error) {
      console.error('패턴 변경 실패:', error);
    }
  };

  // 카드 제거
  const removeCard = (cardId: string) => {
    setResultCards(prev => prev.filter(card => card.id !== cardId));
  };

  // 모든 카드 초기화
  const clearAllCards = () => {
    setResultCards([]);
    generateDefaultCards();
  };

  // 관리자 드롭다운 상태
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const adminDropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 관리자 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setShowAdminDropdown(false);
      }
    };

    if (showAdminDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdminDropdown]);

  // 관리자 접근 함수
  const handleAdminAccess = (path: string) => {
    console.log('🔧 관리자 페이지 접근:', path);
    
    try {
      // 관리자 세션 정보 설정
      const timestamp = Date.now();
      localStorage.setItem('admin_session_id', `ai_admin_${timestamp}`);
      localStorage.setItem('admin_auth_token', `ai_admin_${timestamp}`);
      sessionStorage.setItem('admin_authorized', 'true');
      sessionStorage.setItem('admin_access_source', 'ai_assistant_modal');
      
      console.log('✅ 관리자 세션 설정 완료');
      console.log('📍 현재 경로:', window.location.pathname);
      console.log('🎯 이동할 경로:', path);
      
      // 드롭다운 닫기
      setShowAdminDropdown(false);
      
      // 모달 닫기
      onClose();
      
      // 관리자 페이지로 이동 (더 확실한 방법 사용)
      setTimeout(() => {
        console.log('🚀 관리자 페이지로 이동 시도:', path);
        
        try {
          router.push(path);
          console.log('✅ router.push 성공');
        } catch (routerError) {
          console.error('Router.push 실패, window.location.href 사용:', routerError);
          window.location.href = path;
        }
      }, 300);
      
    } catch (error) {
      console.error('❌ 관리자 접근 중 에러:', error);
      // 에러 발생 시 직접 이동
      setShowAdminDropdown(false);
      onClose();
      setTimeout(() => {
        console.log('🔄 fallback으로 window.location.href 사용:', path);
        window.location.href = path;
      }, 300);
    }
  };

  const toggleAdminDropdown = () => {
    setShowAdminDropdown(!showAdminDropdown);
  };

  // 모의 메트릭 생성
  const generateMockMetrics = (actionId: string) => {
    switch (actionId) {
      case 'server-status':
        return [
          { label: 'CPU 평균', value: '45%', status: 'good' as const },
          { label: '메모리', value: '67%', status: 'warning' as const },
          { label: '응답시간', value: '120ms', status: 'good' as const }
        ];
      case 'security-check':
        return [
          { label: '스캔 완료', value: '100%', status: 'good' as const },
          { label: '위험도', value: '낮음', status: 'good' as const },
          { label: '업데이트', value: '3개', status: 'warning' as const }
        ];
      case 'performance-analysis':
        return [
          { label: '성능 점수', value: '85/100', status: 'good' as const },
          { label: '병목구간', value: '2개', status: 'warning' as const },
          { label: '최적화율', value: '78%', status: 'good' as const }
        ];
      default:
        return [];
    }
  };

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sessionInfo = getSessionInfo();

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-md">
      {/* 제스처 인디케이터 */}
      {gestureIndicator.show && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-60 pointer-events-none">
          <div 
            className="bg-black/80 text-white px-6 py-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl"
            style={{
              opacity: gestureIndicator.intensity,
              transform: `scale(${0.8 + gestureIndicator.intensity * 0.4})`
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fas fa-hand-pointer text-sm"></i>
              </div>
              <span className="font-medium text-lg">{gestureIndicator.direction}</span>
            </div>
          </div>
        </div>
      )}
      
      <div 
        ref={modalRef}
        className="bg-white rounded-3xl shadow-2xl w-[95%] max-w-7xl h-[90vh] flex flex-col overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: 'translate(-50%, -50%) scale(1)',
          position: 'absolute',
          top: '50%',
          left: '50%'
        }}
      >
        
        {/* 모달 헤더 */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-white/10"></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <i className="fas fa-brain text-2xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI 스마트 명령센터</h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                    isSystemActive() 
                      ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                      : 'bg-red-500/20 text-red-100 border border-red-400/30'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${isSystemActive() ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                    {sessionInfo.status}
                  </div>
                  <div className="text-sm opacity-80">
                    세션: {sessionInfo.duration}
                  </div>
                  <div className="text-xs opacity-70 bg-white/10 px-2 py-1 rounded-lg">
                    <i className="fas fa-hand-pointer mr-1"></i>
                    마우스 제스처 지원
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${
                    aiEngineStatus === 'ready' ? 'bg-green-500/20 text-green-100' :
                    aiEngineStatus === 'error' ? 'bg-red-500/20 text-red-100' :
                    'bg-yellow-500/20 text-yellow-100'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      aiEngineStatus === 'ready' ? 'bg-green-400' :
                      aiEngineStatus === 'error' ? 'bg-red-400' :
                      'bg-yellow-400'
                    } ${aiEngineStatus === 'initializing' ? 'animate-pulse' : ''}`}></div>
                    {aiEngineStatus === 'ready' ? 'AI 준비완료' :
                     aiEngineStatus === 'error' ? 'AI 연결오류' :
                     'AI 초기화중'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative" ref={adminDropdownRef}>
                <button
                  onClick={toggleAdminDropdown}
                  className="w-10 h-10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20 hover:scale-110 transform"
                  title="관리자 설정"
                >
                  <i className="fas fa-cog"></i>
                </button>
                
                {/* 관리자 드롭다운 메뉴 */}
                {showAdminDropdown && (
                  <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                    {/* 드롭다운 헤더 */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
                      <h3 className="text-white font-bold text-sm flex items-center gap-2">
                        <i className="fas fa-user-shield"></i>
                        관리자 페이지
                      </h3>
                    </div>
                    
                    {/* 드롭다운 옵션들 */}
                    <div className="py-2">
                      <button
                        onClick={() => handleAdminAccess('/admin/ai-agent')}
                        className="w-full px-4 py-3 text-left text-gray-700 hover:bg-indigo-50 transition-colors flex items-center gap-3"
                      >
                        <i className="fas fa-robot text-indigo-600 w-4"></i>
                        <div>
                          <div className="font-medium text-sm">AI 에이전트 관리</div>
                          <div className="text-xs text-gray-500">AI 설정 및 성능 분석</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleAdminAccess('/admin/ai-analysis')}
                        className="w-full px-4 py-3 text-left text-gray-700 hover:bg-purple-50 transition-colors flex items-center gap-3"
                      >
                        <i className="fas fa-chart-line text-purple-600 w-4"></i>
                        <div>
                          <div className="font-medium text-sm">AI 분석 대시보드</div>
                          <div className="text-xs text-gray-500">성능 지표 및 로그 분석</div>
                        </div>
                      </button>
                      
                      <hr className="my-2 border-gray-200" />
                      
                      <button
                        onClick={() => {
                          setShowAdminDropdown(false);
                          console.log('🔧 시스템 설정 기능 준비 중...');
                        }}
                        className="w-full px-4 py-3 text-left text-gray-400 cursor-not-allowed flex items-center gap-3"
                      >
                        <i className="fas fa-cogs text-gray-400 w-4"></i>
                        <div>
                          <div className="font-medium text-sm">시스템 설정</div>
                          <div className="text-xs text-gray-400">준비 중...</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowAdminDropdown(false);
                          console.log('📊 리포트 관리 기능 준비 중...');
                        }}
                        className="w-full px-4 py-3 text-left text-gray-400 cursor-not-allowed flex items-center gap-3"
                      >
                        <i className="fas fa-file-alt text-gray-400 w-4"></i>
                        <div>
                          <div className="font-medium text-sm">리포트 관리</div>
                          <div className="text-xs text-gray-400">준비 중...</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowAdminDropdown(false);
                          console.log('🔐 보안 설정 기능 준비 중...');
                        }}
                        className="w-full px-4 py-3 text-left text-gray-400 cursor-not-allowed flex items-center gap-3"
                      >
                        <i className="fas fa-shield-alt text-gray-400 w-4"></i>
                        <div>
                          <div className="font-medium text-sm">보안 설정</div>
                          <div className="text-xs text-gray-400">준비 중...</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={clearAllCards}
                className="w-10 h-10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20"
                title="카드 초기화"
              >
                <i className="fas fa-refresh"></i>
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 hover:bg-red-500/30 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm border border-white/20"
                title="모달 닫기"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <div className="flex gap-1">
            {[
              { id: 'analysis', label: '분석 결과', icon: 'fas fa-chart-line' },
              { id: 'patterns', label: '시스템 패턴', icon: 'fas fa-cogs' },
              { id: 'history', label: `히스토리 (${resultCards.length})`, icon: 'fas fa-history' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-600 shadow-sm border border-indigo-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <i className={tab.icon}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 입력창 (상단 고정) */}
        <div className="p-6 bg-white border-b border-gray-200">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAnalysisInput(inputValue);
                  }
                }}
                placeholder="AI에게 분석을 요청하세요... (Enter로 실행)"
                className="w-full p-4 pr-12 border-2 border-gray-200 rounded-2xl outline-none text-sm transition-all duration-200 bg-gray-50 focus:border-indigo-500 focus:bg-white focus:shadow-lg placeholder-gray-400"
                disabled={isProcessing}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <i className="fas fa-search text-sm"></i>
              </div>
            </div>
            <button
              onClick={() => handleAnalysisInput(inputValue)}
              disabled={!inputValue.trim() || isProcessing}
              className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <i className="fas fa-paper-plane text-lg"></i>
              )}
            </button>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'analysis' && (
            <div className="h-full flex flex-col">
              {/* 빠른 액션 버튼들 */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="fas fa-bolt text-indigo-600"></i>
                  빠른 분석 실행
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => executeQuickAction(action.id)}
                      disabled={isProcessing}
                      className={`group relative p-4 ${action.color} text-white rounded-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                    >
                      <div className="text-center">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
                          <i className={`${action.icon} text-lg`}></i>
                        </div>
                        <h4 className="font-bold text-sm mb-1">{action.title}</h4>
                        <p className="text-xs opacity-90">{action.description}</p>
                      </div>
                      
                      <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 결과 카드들 */}
              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-white">
                {resultCards.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <i className="fas fa-brain text-4xl text-indigo-600"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">AI 분석 준비 완료!</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                      위의 빠른 분석 버튼을 클릭하거나 직접 질문을 입력하여 AI 분석을 시작하세요.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {resultCards.map((card) => (
                      <ResultCard
                        key={card.id}
                        data={card}
                        onRemove={removeCard}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'patterns' && (
            <div className="p-6 bg-gradient-to-br from-gray-50 to-white h-full overflow-y-auto">
              <PatternSelector
                patterns={patterns}
                onPatternChange={handlePatternChange}
                className="mb-6"
              />
              
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="fas fa-info-circle text-blue-600"></i>
                  패턴 설명
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">정상 운영</h4>
                    <p className="text-green-700 text-sm">안정적인 서버 운영 상태로 일반적인 트래픽과 리소스 사용량을 시뮬레이션합니다.</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">고부하</h4>
                    <p className="text-red-700 text-sm">높은 트래픽과 리소스 사용량으로 시스템 부하 상황을 시뮬레이션합니다.</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">유지보수</h4>
                    <p className="text-blue-700 text-sm">시스템 점검 및 업데이트 상황을 시뮬레이션합니다.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-6 bg-gradient-to-br from-gray-50 to-white h-full overflow-y-auto">
              {resultCards.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-history text-2xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">분석 히스토리가 없습니다</h3>
                  <p className="text-gray-500">빠른 분석이나 직접 질문으로 분석을 시작해보세요.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">분석 히스토리</h3>
                    <span className="text-sm text-gray-500">총 {resultCards.length}개</span>
                  </div>
                  
                  <div className="space-y-4">
                    {resultCards.map((card) => (
                      <div key={card.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{card.title}</h4>
                          <span className="text-xs text-gray-500">
                            {card.timestamp.toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm line-clamp-2">{card.content}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            card.category === 'urgent' ? 'bg-red-100 text-red-700' :
                            card.category === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            card.category === 'normal' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {card.category}
                          </span>
                          {card.metrics && (
                            <span className="text-xs text-gray-500">
                              {card.metrics.length}개 메트릭
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 