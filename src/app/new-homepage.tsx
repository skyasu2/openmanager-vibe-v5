'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSystemControl } from '../hooks/useSystemControl';
import ProfileDropdown from '../components/ProfileDropdown';
import { FeatureCardsGrid } from '../components/home/FeatureCardsGrid';
import { 
  Server, 
  Power,
  Loader2, 
  CheckCircle,
  StopCircle,
  PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function NewHomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // 개선된 시스템 제어
  const {
    state,
    isSystemActive,
    isSystemPaused,
    formattedTime,
    startFullSystem,
    stopFullSystem,
    resumeFullSystem,
    isUserSession,
    pauseReason
  } = useSystemControl();

  // 토스트 알림 상태
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // 토스트 추가 함수
  const addToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    
    if (toast.autoClose !== false) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration || 5000);
    }
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
      } else {
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
        title: '⚠️ 시작 오류',
        message: '네트워크 문제가 발생했습니다.',
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
          type: 'info',
          title: '🛑 시스템 종료 완료',
          message: result.message,
          duration: 4000
        });
      } else {
        addToast({
          type: 'error',
          title: '❌ 종료 실패',
          message: result.message || '시스템을 종료할 수 없습니다.',
          duration: 6000
        });
      }
    } catch (error) {
      console.error('시스템 종료 오류:', error);
      addToast({
        type: 'error',
        title: '⚠️ 종료 오류',
        message: '시스템 종료 중 오류가 발생했습니다.',
        duration: 6000
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 시스템 재개 함수
  const handleResumeSystem = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const result = await resumeFullSystem();
      
      if (result.success) {
        addToast({
          type: 'success',
          title: '▶️ 시스템 재개 완료',
          message: result.message,
          duration: 4000
        });
      } else {
        addToast({
          type: 'error',
          title: '❌ 재개 실패',
          message: result.message || '시스템을 재개할 수 없습니다.',
          duration: 6000
        });
      }
    } catch (error) {
      console.error('시스템 재개 오류:', error);
      addToast({
        type: 'error',
        title: '⚠️ 재개 오류',
        message: '시스템 재개 중 오류가 발생했습니다.',
        duration: 6000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* 헤더 (기존 유지) */}
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-20">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Server className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">OpenManager</h2>
              <p className="text-xs text-white/70">AI 서버 모니터링</p>
            </div>
          </Link>
          
          {/* 프로필 드롭다운 */}
          <ProfileDropdown userName="관리자" />
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* 타이틀 섹션 */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              OpenManager <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              지능형 AI 에이전트로 서버 관리를 혁신합니다
            </p>

            {/* 시스템 상태 및 제어 */}
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {!isSystemActive ? (
                <div className="max-w-md mx-auto">
                  {/* 시스템 종료 상태 */}
                  <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-red-200 font-semibold">시스템 종료됨</span>
                    </div>
                    <p className="text-red-100 text-sm">
                      모든 서비스가 중지되었습니다.
                    </p>
                  </div>
                  
                  <motion.button 
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                    onClick={handleStartFullSystem}
                    disabled={isLoading}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Power className="w-5 h-5" />
                    )}
                    <span>{isLoading ? '시작 중...' : '🚀 시스템 시작'}</span>
                  </motion.button>
                </div>
              ) : isSystemPaused ? (
                <div className="max-w-md mx-auto">
                  {/* 시스템 일시정지 상태 */}
                  <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-yellow-200 font-semibold">시스템 일시정지됨</span>
                    </div>
                    <p className="text-yellow-100 text-sm">{pauseReason}</p>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <motion.button 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                      onClick={handleResumeSystem}
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <PlayCircle className="w-4 h-4" />
                      )}
                      재개
                    </motion.button>
                    
                    <motion.button 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                      onClick={handleStopFullSystem}
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <StopCircle className="w-4 h-4" />
                      )}
                      종료
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  {/* 시스템 활성 상태 */}
                  <div className="mb-6 p-4 bg-green-500/20 border border-green-400/30 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-200 font-semibold">시스템 활성화됨</span>
                    </div>
                    <p className="text-green-100 text-sm">
                      모든 서비스가 정상 작동 중입니다. (활성시간: {formattedTime})
                    </p>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <motion.button 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                      onClick={handleGoToDashboard}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Server className="w-4 h-4" />
                      대시보드
                    </motion.button>
                    
                    <motion.button 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                      onClick={handleStopFullSystem}
                      disabled={isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <StopCircle className="w-4 h-4" />
                      )}
                      종료
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* 새로운 기능 카드 그리드 */}
          <FeatureCardsGrid />
        </div>
      </div>

      {/* 토스트 알림 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`
              p-4 rounded-xl backdrop-blur-sm border shadow-xl max-w-sm
              ${toast.type === 'success' ? 'bg-green-500/20 border-green-400/30 text-green-100' : ''}
              ${toast.type === 'error' ? 'bg-red-500/20 border-red-400/30 text-red-100' : ''}
              ${toast.type === 'warning' ? 'bg-yellow-500/20 border-yellow-400/30 text-yellow-100' : ''}
              ${toast.type === 'info' ? 'bg-blue-500/20 border-blue-400/30 text-blue-100' : ''}
            `}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="font-semibold mb-1">{toast.title}</div>
            <div className="text-sm opacity-90">{toast.message}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 