'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSystemControl } from '../hooks/useSystemControl';
// 🔄 AI 관리자 모드 시스템 통합
import { useSystemStore } from '@/stores/useSystemStore';
import { ProfileButton } from '@/components/layout/ProfileButton';
import { PinModal } from '@/components/auth/PinModal';
import { modeTimerManager } from '@/utils/ModeTimerManager';
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
  X,
  Shield,
  Zap
} from 'lucide-react';
// 🤖 AI 기능 패널 추가
import { AIManagerSidebar } from '@/components/ai/AIManagerSidebar';

// 동적 렌더링 강제
export const dynamic = 'force-dynamic';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  autoClose?: boolean;
  duration?: number;
}

export default function IntegratedHomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // 🤖 AI 관리자 모드 상태
  const { 
    isAIAdminMode, 
    isAuthenticated, 
    isSystemStarted,
    showPinModal
  } = useSystemStore();
  
  // 기존 시스템 제어
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

  // 토스트 알림 상태
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // 🔄 모드 전환 효과 처리
  useEffect(() => {
    const handleModeChange = () => {
      console.log(`🔄 Mode changed: ${isAIAdminMode ? 'AI Admin' : 'Basic Monitoring'}`);
    };

    window.addEventListener('startAIMode', handleModeChange);
    window.addEventListener('startMonitoringMode', handleModeChange);

    return () => {
      window.removeEventListener('startAIMode', handleModeChange);
      window.removeEventListener('startMonitoringMode', handleModeChange);
    };
  }, [isAIAdminMode]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      modeTimerManager.cleanup();
    };
  }, []);

  // 토스트 알림 관리
  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const newToast: ToastNotification = {
      ...toast,
      id: Date.now().toString(),
      autoClose: toast.autoClose !== false,
      duration: toast.duration || 5000
    };
    
    setToasts(prev => [...prev, newToast]);
    
    if (newToast.autoClose) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, newToast.duration);
    }
  }, []);

  // 시스템 시작
  const handleStartFullSystem = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('🚀 통합 시스템 시작...');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const result = await startFullSystem({
        mode: 'fast',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (result.success) {
        addToast({
          type: 'success',
          title: '🎉 시스템 시작 완료!',
          message: isAIAdminMode ? 'AI 관리자 모드로 시작됨' : '기본 모니터링 모드로 시작됨',
          duration: 4000
        });
        
        // 모드에 따른 타이머 시작
        if (isAIAdminMode) {
          modeTimerManager.switchMode('ai');
        } else {
          modeTimerManager.switchMode('monitoring');
        }
        
      } else {
        addToast({
          type: 'error',
          title: '⚠️ 시스템 시작 실패',
          message: result.message,
          duration: 8000,
          autoClose: false
        });
      }
      
    } catch (error: any) {
      console.error('❌ 시스템 시작 실패:', error);
      
      let errorMessage = '시스템 시작에 실패했습니다.';
      if (error.name === 'AbortError') {
        errorMessage = '시작 시간이 초과되었습니다. 기본 대시보드는 사용 가능합니다.';
      }
      
      addToast({
        type: 'error',
        title: '❌ 오류',
        message: errorMessage,
        duration: 8000
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  // 시스템 정지
  const handleStopFullSystem = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    console.log('⏹️ 통합 시스템 정지...');
    
    try {
      await stopFullSystem();
      modeTimerManager.stopAll();
      
      addToast({
        type: 'info',
        title: '⏹️ 시스템 정지됨',
        message: '모든 모드의 시스템이 정지되었습니다',
        duration: 3000
      });
      
    } catch (error) {
      console.error('❌ 시스템 정지 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 대시보드로 이동
  const handleGoToDashboard = () => {
    if (isAIAdminMode) {
      router.push('/admin-test');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 🔄 AI 관리자 모드 PIN 모달 */}
      <PinModal />
      
      {/* 🔄 통합 헤더 - ProfileButton으로 AI 모드 제어 */}
      <div className="fixed top-4 right-4 z-50">
        <ProfileButton />
      </div>

      {/* 🔄 모드 상태 표시 */}
      <div className="fixed top-4 left-4 z-40">
        <div className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium ${
          isAIAdminMode 
            ? 'bg-purple-600/20 border border-purple-500/30 text-purple-300' 
            : 'bg-blue-600/20 border border-blue-500/30 text-blue-300'
        }`}>
          {isAIAdminMode ? (
            <>
              <Brain className="w-4 h-4" />
              AI 관리자 모드
              {isAuthenticated && <Shield className="w-3 h-3 text-green-400" />}
            </>
          ) : (
            <>
              <Gauge className="w-4 h-4" />
              기본 모니터링 모드
            </>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 - AI 모드일 때 우측 마진 추가 */}
      <div className={`container mx-auto px-4 py-16 transition-all duration-300 ${
        isAIAdminMode && isAuthenticated ? 'mr-96' : ''
      }`}>
        {/* 헤더 섹션 */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-purple-600/20 rounded-xl border border-purple-500/30">
              <Server className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-5xl font-bold">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                OpenManager
              </span>
              <span className="text-white ml-2">V5</span>
            </h1>
          </div>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            {isAIAdminMode ? (
              <>
                🤖 <strong className="text-purple-400">AI 관리자 모드</strong>로 운영 중입니다. 
                고급 AI 분석과 자동화된 서버 관리를 경험하세요.
              </>
            ) : (
              <>
                AI 기반 지능형 서버 모니터링과 자동화 솔루션으로 
                <strong className="text-blue-400"> 차세대 인프라 관리</strong>를 경험하세요
              </>
            )}
          </p>

          {/* 🔄 AI 모드별 기능 표시 */}
          {isAIAdminMode && isAuthenticated && (
            <div className="mb-8 p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
              <div className="flex items-center justify-center gap-4 text-sm text-purple-300">
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  AI 에이전트 활성
                </div>
                <div className="flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  고급 분석 사용 가능
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  보안 인증됨
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 시스템 제어 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          {!isSystemActive ? (
            <button
              onClick={handleStartFullSystem}
              disabled={isLoading}
              className={`
                px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 
                flex items-center gap-3 min-w-[200px] justify-center
                ${isLoading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : isAIAdminMode
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg hover:shadow-purple-500/25'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg hover:shadow-blue-500/25'
                }
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  시스템 시작 중...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {isAIAdminMode ? 'AI 시스템 시작' : '시스템 시작'}
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={handleGoToDashboard}
                className={`
                  px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 
                  flex items-center gap-3 min-w-[200px] justify-center
                  ${isAIAdminMode
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg hover:shadow-purple-500/25'
                    : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white shadow-lg hover:shadow-green-500/25'
                  }
                `}
              >
                <Gauge className="w-5 h-5" />
                {isAIAdminMode ? 'AI 대시보드' : '대시보드 열기'}
              </button>
              
              <button
                onClick={handleStopFullSystem}
                disabled={isLoading}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-semibold text-lg transition-all duration-300 flex items-center gap-3 min-w-[150px] justify-center shadow-lg hover:shadow-red-500/25"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <StopCircle className="w-5 h-5" />
                )}
                시스템 정지
              </button>
            </div>
          )}
        </div>

        {/* AI 모드별 기능 미리보기 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {isAIAdminMode ? (
            // AI 관리자 모드 기능들
            <>
              <div className="p-6 bg-purple-900/30 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-8 h-8 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">AI 에이전트</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  자연어로 서버 상태를 질의하고 실시간 분석 결과를 받아보세요.
                </p>
                <div className="text-sm text-purple-300">
                  • 패턴 매칭 기반 의도 분류<br/>
                  • 실시간 메트릭 연동<br/>
                  • 지능형 응답 생성
                </div>
              </div>

              <div className="p-6 bg-purple-900/30 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <SearchCheck className="w-8 h-8 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">고급 분석</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  AI 기반 근본원인 분석과 예측 알림으로 문제를 사전에 예방합니다.
                </p>
                <div className="text-sm text-purple-300">
                  • 근본원인 분석기<br/>
                  • 예측 알림 시스템<br/>
                  • 솔루션 추천 엔진
                </div>
              </div>

              <div className="p-6 bg-purple-900/30 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-8 h-8 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">자동 보고서</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  AI가 분석한 데이터로 자동 보고서를 생성하고 권장사항을 제공합니다.
                </p>
                <div className="text-sm text-purple-300">
                  • AI 기반 자동 분석<br/>
                  • 맞춤형 리포트<br/>
                  • 베스트 프랙티스 추천
                </div>
              </div>
            </>
          ) : (
            // 기본 모니터링 모드 기능들
            <>
              <div className="p-6 bg-blue-900/30 rounded-xl border border-blue-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Gauge className="w-8 h-8 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">실시간 모니터링</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  서버 상태를 실시간으로 모니터링하고 핵심 메트릭을 추적합니다.
                </p>
                <div className="text-sm text-blue-300">
                  • CPU, 메모리, 디스크 사용률<br/>
                  • 네트워크 트래픽<br/>
                  • 서비스 상태 확인
                </div>
              </div>

              <div className="p-6 bg-blue-900/30 rounded-xl border border-blue-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <Server className="w-8 h-8 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">서버 관리</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  다중 서버 환경을 효율적으로 관리하고 제어합니다.
                </p>
                <div className="text-sm text-blue-300">
                  • 다중 서버 지원<br/>
                  • 원격 제어<br/>
                  • 상태 알림
                </div>
              </div>

              <div className="p-6 bg-blue-900/30 rounded-xl border border-blue-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">기본 알림</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  임계치 기반 알림과 기본적인 문제 탐지를 제공합니다.
                </p>
                <div className="text-sm text-blue-300">
                  • 임계치 알림<br/>
                  • 이메일/슬랙 연동<br/>
                  • 기본 로그 분석
                </div>
              </div>
            </>
          )}
        </div>

        {/* 모드 전환 안내 */}
        <div className="mt-16 text-center">
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-4">
              {isAIAdminMode ? '기본 모드로 전환하기' : 'AI 관리자 모드 체험하기'}
            </h3>
            <p className="text-gray-300 mb-4">
              {isAIAdminMode ? (
                '기본 모니터링 모드로 전환하여 표준 서버 관리 기능을 사용해보세요.'
              ) : (
                '우측 상단 프로필 버튼에서 AI 관리자 모드로 전환하여 고급 AI 기능을 체험해보세요.'
              )}
            </p>
            <div className="text-sm text-gray-400">
              {!isAIAdminMode && '💡 PIN: 4231'}
            </div>
          </div>
        </div>
      </div>

      {/* 🤖 AI 사이드바 - 메인 콘텐츠 밖에서 렌더링 */}
      <AIManagerSidebar />

      {/* 토스트 알림 */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              px-6 py-3 rounded-lg shadow-lg border max-w-md
              ${toast.type === 'success' ? 'bg-green-900/90 border-green-500/30 text-green-100' : ''}
              ${toast.type === 'error' ? 'bg-red-900/90 border-red-500/30 text-red-100' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-900/90 border-yellow-500/30 text-yellow-100' : ''}
              ${toast.type === 'info' ? 'bg-blue-900/90 border-blue-500/30 text-blue-100' : ''}
            `}
          >
            <div className="font-semibold text-sm">{toast.title}</div>
            <div className="text-xs opacity-90">{toast.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 