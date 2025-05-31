'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSystemControl } from '../hooks/useSystemControl';
import ProfileDropdown from '../components/ProfileDropdown';
import { FeatureCardsGrid } from '../components/home/FeatureCardsGrid';
import { 
  Server, 
  MessageCircle, 
  SearchCheck, 
  FileText, 
  Brain, 
  Code, 
  Play, 
  Loader2, 
  Gauge, 
  StopCircle,
  Power,
  CheckCircle,
  Lightbulb,
  Cpu,
  X
} from 'lucide-react';

// 동적 렌더링 강제 (HTML 파일 생성 방지)
export const dynamic = 'force-dynamic';

// 토스트 알림 타입 정의
interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
}

export default function HomePage() {
  const router = useRouter();
  const [showVibeCoding, setShowVibeCoding] = useState(false);
  const [showMainFeature, setShowMainFeature] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 개선된 시스템 제어
  const {
    state,
    isSystemActive,
    isSystemPaused,
    formattedTime,
    aiAgent,
    startFullSystem,
    stopFullSystem,
    resumeFullSystem,
    isUserSession,
    pauseReason
  } = useSystemControl();

  // 데이터 생성기 상태 관리
  const [dataGeneratorStatus, setDataGeneratorStatus] = useState<{
    isGenerating: boolean;
    remainingTime: number;
    currentPattern: 'normal' | 'high-load' | 'maintenance' | null;
    patterns: string[];
  }>({
    isGenerating: false,
    remainingTime: 0,
    currentPattern: null,
    patterns: []
  });

  // 토스트 알림 상태
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [showDashboardChoice, setShowDashboardChoice] = useState(false);
  const [autoRedirectCountdown, setAutoRedirectCountdown] = useState(0);

  // 데이터 생성기 상태 업데이트 함수를 useCallback으로 최적화
  const updateGeneratorStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/data-generator');
      if (response.ok) {
        const data = await response.json();
        setDataGeneratorStatus(data.data.generation);
      }
    } catch (error) {
      console.error('Failed to fetch generator status:', error);
    }
  }, []);

  useEffect(() => {
    // 페이지 로딩 애니메이션
    const elements = document.querySelectorAll('.fade-in-up');
    elements.forEach((element: Element) => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.opacity = '1';
      htmlElement.style.transform = 'translateY(0)';
    });
    
    // 초기 데이터 생성기 상태 로드
    updateGeneratorStatus();
    
    // 활성 모드일 때 주기적으로 상태 업데이트
    let statusInterval: NodeJS.Timeout;
    if (isSystemActive || (dataGeneratorStatus && dataGeneratorStatus.isGenerating)) {
      statusInterval = setInterval(() => {
        updateGeneratorStatus();
      }, 1000); // 1초마다 업데이트
    }
    
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [isSystemActive, dataGeneratorStatus?.isGenerating, updateGeneratorStatus]);

  // 토스트 알림 추가
  const addToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastNotification = {
      id,
      autoClose: true,
      duration: 5000,
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    
    if (newToast.autoClose) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  };

  // 토스트 알림 제거
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 🚀 사용자 세션 시작 함수 (Vercel 최적화)
  const handleStartFullSystem = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('🚀 [Vercel] 빠른 시스템 시작...');
    
    try {
      // 타임아웃 설정 (Vercel 함수 제한 고려)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃
      
      const result = await startFullSystem({
        mode: 'fast',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (result.success) {
        // 성공 토스트 알림
        addToast({
          type: 'success',
          title: '🎉 시스템 시작 완료!',
          message: result.message,
          duration: 4000
        });
        
        // Fallback 모드 알림 (필요한 경우)
        if (result.fallback && result.errors && result.errors.length > 0) {
          addToast({
            type: 'warning',
            title: '🔄 일부 기능 제한',
            message: '일부 기능이 Fallback 모드로 동작하고 있습니다.',
            duration: 6000
          });
        }
        
        // 자동 리다이렉트 설정 (15초 후)
        setAutoRedirectCountdown(15);
        setShowDashboardChoice(true);
        
        const countdownInterval = setInterval(() => {
          setAutoRedirectCountdown(prev => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              setShowDashboardChoice(false);
              router.push('/dashboard/realtime');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
      } else {
        // 오류 토스트 알림
        addToast({
          type: 'error',
          title: '❌ 시스템 시작 실패',
          message: result.message || '시스템을 시작할 수 없습니다.',
          duration: 6000
        });
      }
    } catch (error: any) {
      console.error('시스템 시작 오류:', error);
      
      addToast({
        type: 'error',
        title: '🔌 연결 오류',
        message: error.name === 'AbortError' ? '요청 시간 초과' : '네트워크 연결을 확인해주세요.',
        duration: 6000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 시스템 중지 함수
  const handleStopFullSystem = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const result = await stopFullSystem();
      
      if (result.success) {
        addToast({
          type: 'success',
          title: '⏹️ 시스템 중지 완료',
          message: result.message,
          duration: 3000
        });
        
        setShowDashboardChoice(false);
        setAutoRedirectCountdown(0);
      } else {
        addToast({
          type: 'error',
          title: '❌ 시스템 중지 실패',
          message: result.message || '시스템을 중지할 수 없습니다.',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('시스템 중지 오류:', error);
      addToast({
        type: 'error',
        title: '🔌 연결 오류',
        message: '네트워크 연결을 확인해주세요.',
        duration: 4000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 시스템 재시작 함수
  const handleResumeSystem = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const result = await resumeFullSystem();
      
      if (result.success) {
        addToast({
          type: 'success',
          title: '▶️ 시스템 재시작 완료',
          message: result.message,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('시스템 재시작 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    setShowDashboardChoice(false);
    router.push('/dashboard/realtime');
  };

  const openVibeCodingModal = () => {
    setShowVibeCoding(true);
  };

  const closeVibeCodingModal = () => {
    setShowVibeCoding(false);
  };

  const openMainFeatureModal = () => {
    setShowMainFeature(true);
  };

  const closeMainFeatureModal = () => {
    setShowMainFeature(false);
  };

  const renderIcon = (iconName: string, className?: string) => {
    const iconProps = { className: className || "w-5 h-5" };
    
    switch (iconName) {
      case 'MessageCircle': return <MessageCircle {...iconProps} />;
      case 'SearchCheck': return <SearchCheck {...iconProps} />;
      case 'FileText': return <FileText {...iconProps} />;
      case 'Brain': return <Brain {...iconProps} />;
      case 'Code': return <Code {...iconProps} />;
      case 'Server': return <Server {...iconProps} />;
      case 'Lightbulb': return <Lightbulb {...iconProps} />;
      case 'Cpu': return <Cpu {...iconProps} />;
      default: return <Server {...iconProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      {/* 배경 애니메이션 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      {/* 헤더 */}
      <header className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-cyan-500 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">OpenManager</h1>
            <p className="text-sm text-green-300">AI-Powered Server Monitoring</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <ProfileDropdown />
        </div>
      </header>

      <div className="container mx-auto px-6 pb-12">
        {/* 메인 타이틀 */}
        <div className="text-center mb-16 fade-in-up">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI 기반
            </span>
            <br />
            서버 모니터링
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            <span className="hidden sm:inline">자연어로 질의하고 AI가 실시간으로 분석하는</span>
            <span className="sm:hidden">AI가 실시간으로 분석하는</span>
            <br />
            <strong className="text-cyan-300">차세대 서버 관리 솔루션</strong>
          </p>
        </div>

        {/* 시스템 상태 및 제어 */}
        <div className="max-w-2xl mx-auto mb-16 fade-in-up">
          {!isSystemActive && !isSystemPaused ? (
            /* 시스템 시작 상태 */
            <div className="text-center">
              <div className="p-8 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="mb-6">
                  <Power className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">시스템이 준비되었습니다</h2>
                  <p className="text-white/70">
                    AI 에이전트와 데이터 생성기를 시작하여 모든 기능을 체험해보세요
                  </p>
                </div>
                
                <button 
                  className="btn-primary"
                  onClick={handleStartFullSystem}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                  <span className="text-lg font-semibold">
                    {isLoading ? '시작 중...' : '🚀 AI 시스템 시작하기'}
                  </span>
                </button>
                
                <p className="text-white/50 text-sm mt-4">
                  Vercel 무료 플랜에 최적화된 빠른 시작
                </p>
              </div>
            </div>
          ) : isSystemPaused ? (
            /* 시스템 일시중지 상태 */
            <div className="text-center">
              <div className="p-6 rounded-2xl bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30">
                <div className="mb-4">
                  <StopCircle className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                  <h2 className="text-xl font-bold text-white mb-2">시스템 일시중지</h2>
                  <p className="text-white/80 text-sm">
                    사유: {pauseReason || '알 수 없음'}
                  </p>
                </div>
                
                <button 
                  className="btn-secondary"
                  onClick={handleResumeSystem}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  <span>{isLoading ? '재시작 중...' : '▶️ 시스템 재시작'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* 시스템 활성 상태 */
            <div className="text-center">
              <div className="p-6 rounded-2xl bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30">
                <div className="mb-4">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                  <h2 className="text-xl font-bold text-white mb-2">시스템 활성화</h2>
                  <p className="text-white/80 text-sm">
                    실행 시간: {formattedTime} | AI 에이전트: 
                    <span className={aiAgent.isActive ? 'text-emerald-300' : 'text-red-300'}>
                      {aiAgent.isActive ? ' 활성' : ' 비활성'}
                    </span>
                  </p>
                </div>
                
                {showDashboardChoice ? (
                  <div className="mb-4">
                    <p className="text-white/90 mb-3">
                      {autoRedirectCountdown}초 후 자동으로 대시보드로 이동합니다
                    </p>
                    <button 
                      className="btn-primary"
                      onClick={handleGoToDashboard}
                    >
                      <Gauge className="w-5 h-5" />
                      <span>📊 지금 대시보드 보기</span>
                    </button>
                  </div>
                ) : (
                  /* 대시보드 이동 버튼 (기본 상태) */
                  <div className="mb-4">
                    <button 
                      className="btn-primary"
                      onClick={handleGoToDashboard}
                    >
                      <Gauge className="w-5 h-5" />
                      <span>📊 대시보드 들어가기</span>
                    </button>
                  </div>
                )}
                
                {/* 시스템 중지 버튼 */}
                <div className="text-center">
                  <button 
                    className="btn-secondary"
                    onClick={handleStopFullSystem}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <StopCircle className="w-5 h-5" />
                    )}
                    <span>{isLoading ? '중지 중...' : '⏹️ 시스템 중지'}</span>
                  </button>
                </div>
                
                <p className="text-white/60 text-xs mt-2">
                  60분 후 자동 종료됩니다. 다시 시작하려면 위의 중지 버튼을 누른 후 시작 버튼을 눌러주세요.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 새로운 4개 기능 카드 그리드 */}
        <div className="fade-in-up my-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              핵심 <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">기능</span>
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              AI 기반 서버 모니터링의 모든 것을 경험해보세요
            </p>
          </div>
          
          <FeatureCardsGrid className="mb-8" />
        </div>

        {/* Vibe Coding 기술 강조 */}
        <div className="vibe-coding-section fade-in-up">
          <div className="vibe-badge" onClick={openVibeCodingModal}>
            {renderIcon('Code')}
            <span>Vibe Coding</span>
          </div>
          <p className="vibe-description">
            <span className="hidden sm:inline">GPT/Claude + Cursor AI 협업으로 개발된 차세대 AI 에이전트 시스템</span>
            <span className="sm:hidden">GPT/Claude + Cursor AI 협업 개발</span>
            <br />
            <strong>경량화 AI (No LLM Cost)</strong> • <strong>도메인 특화</strong> • <strong className="hidden sm:inline">확장 가능</strong><strong className="sm:hidden">확장성</strong>
          </p>
        </div>

        {/* 푸터 */}
        <div className="footer-info fade-in-up">
          <p>
            <span className="hidden sm:inline">Copyright(c) 저작자. All rights reserved.</span>
            <span className="sm:hidden">Copyright(c) 저작자</span>
          </p>
        </div>
      </div>

      {/* 토스트 알림 컨테이너 */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              p-4 rounded-lg shadow-lg backdrop-blur-sm border-l-4 animate-slide-in-right
              ${toast.type === 'success' ? 'bg-green-500/90 border-green-400 text-white' : ''}
              ${toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-500/90 border-yellow-400 text-black' : ''}
              ${toast.type === 'info' ? 'bg-blue-500/90 border-blue-400 text-white' : ''}
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="font-semibold text-sm">{toast.title}</div>
                <div className="text-sm mt-1 opacity-90">{toast.message}</div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/70 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Vibe Coding 상세 모달 */}
      {showVibeCoding && (
        <div className="modal-overlay" onClick={closeVibeCodingModal}>
          <div className="modal-content vibe-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeVibeCodingModal();
              }}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label="모달 닫기"
            >
              ×
            </button>
            
            <div className="modal-header">
              <div className="modal-emoji">🚀</div>
              <h2 className="modal-title">Vibe Coding 개발 방식</h2>
              <p className="modal-description">AI 협업을 통한 차세대 개발 방법론</p>
            </div>

            <div className="modal-benefits">
              <h4>🚀 핵심 특징</h4>
              <ul className="benefits-list">
                <li>
                  <i className="fas fa-brain benefit-icon"></i>
                  <span><strong>GPT/Claude 브레인스토밍</strong> - 아이디어 구체화 후 정확한 프롬프트 작성</span>
                </li>
                <li>
                  <i className="fas fa-code benefit-icon"></i>
                  <span><strong>Cursor AI 개발</strong> - 완성된 프롬프트로 실시간 코드 구현</span>
                </li>
                <li>
                  <i className="fas fa-upload benefit-icon"></i>
                  <span><strong>GitHub 자동 배포</strong> - 개발 완료 즉시 자동으로 라이브 반영</span>
                </li>
              </ul>

              <div className="vibe-stats">
                <div className="stat-item">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">AI 생성 코드</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">실시간</span>
                  <span className="stat-label">자동 배포</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">AI 프롬프트</span>
                  <span className="stat-label">정확도 향상</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 AI 에이전트 상세 모달 */}
      {showMainFeature && (
        <div className="modal-overlay" onClick={closeMainFeatureModal}>
          <div className="modal-content vibe-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeMainFeatureModal();
              }}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label="모달 닫기"
            >
              ×
            </button>
            
            <div className="modal-header">
              <div className="modal-emoji">🧠</div>
              <h2 className="modal-title">지능형 AI 에이전트</h2>
              <p className="modal-description">LLM 없이도 지능형 응답하는 차세대 서버 관리 솔루션</p>
            </div>

            <div className="modal-benefits">
              <h4>⚡ 핵심 기능</h4>
              <ul className="benefits-list">
                <li>
                  <i className="fas fa-microchip benefit-icon"></i>
                  <span><strong>경량 AI 추론</strong> - LLM 비용 없는 실시간 AI 추론</span>
                </li>
                <li>
                  <i className="fas fa-comments benefit-icon"></i>
                  <span><strong>자연어 인터페이스</strong> - 일상 대화로 서버 관리</span>
                </li>
                <li>
                  <i className="fas fa-search-plus benefit-icon"></i>
                  <span><strong>지능형 분석</strong> - 근본원인 분석 및 예측 알림</span>
                </li>
                <li>
                  <i className="fas fa-user-cog benefit-icon"></i>
                  <span><strong>스마트한 두 번째 엔지니어</strong> - 지능형 보조 인력 효과</span>
                </li>
              </ul>

              <div className="vibe-stats">
                <div className="stat-item">
                  <span className="stat-number">0원</span>
                  <span className="stat-label">LLM 비용</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">실시간</span>
                  <span className="stat-label">AI 응답</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">모니터링</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .fade-in-up {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .btn-primary {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 1rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(6, 182, 212, 0.3);
          margin: 0 auto;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(6, 182, 212, 0.4);
        }
        
        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        
        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          margin: 0 auto;
        }
        
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
        
        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .vibe-coding-section {
          margin: 1.5rem 0;
          text-align: center;
          z-index: 1;
        }
        
        .vibe-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          color: #1a1a1a;
          font-size: 1rem;
          font-weight: 700;
          padding: 0.8rem 1.5rem;
          border-radius: 25px;
          box-shadow: 0 10px 30px rgba(251, 191, 36, 0.3);
          margin-bottom: 1rem;
          animation: pulse 2s ease-in-out infinite;
          cursor: pointer;
          transition: all 0.3s ease;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        .vibe-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(251, 191, 36, 0.4);
          background: linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%);
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .vibe-description {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .vibe-description strong {
          color: white;
          font-weight: 600;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }
        
        .footer-info {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          text-align: center;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
          z-index: 1;
        }
        
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
        }
        
        .modal-content {
          position: relative;
          width: 100%;
          max-width: 28rem;
          max-height: 85vh;
          overflow: hidden;
          border-radius: 1.5rem;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(167, 85, 247, 0.9) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }
        
        .vibe-modal {
          max-width: 34rem;
        }
        
        .modal-close {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          z-index: 10;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1.25rem;
          font-weight: bold;
        }
        
        .modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }
        
        .modal-header {
          padding: 2rem;
          text-align: center;
        }
        
        .modal-emoji {
          font-size: 4rem;
          margin-bottom: 1rem;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }
        
        .modal-title {
          font-size: 2rem;
          font-weight: bold;
          color: white;
          margin-bottom: 1rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .modal-description {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .modal-benefits {
          padding: 0 2rem 2rem;
        }
        
        .modal-benefits h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .benefits-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .benefits-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 0;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.9);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .benefits-list li:last-child {
          border-bottom: none;
        }
        
        .benefit-icon {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.1rem;
          margin-top: 0.125rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .vibe-stats {
          display: flex;
          justify-content: space-around;
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(167, 85, 247, 0.3) 100%);
          border-radius: 1rem;
          color: white;
          backdrop-filter: blur(10px);
        }
        
        .stat-item {
          text-align: center;
          flex: 1;
        }
        
        .stat-number {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .stat-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.8);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
} 