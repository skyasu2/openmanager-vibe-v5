'use client';

import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { motion } from 'framer-motion';
import { BarChart3, Bot, Loader2, Play, X, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, memo } from 'react';

interface SystemControlsProps {
  isGitHubUser: boolean;
  systemStartCountdown: number;
  isSystemStarting: boolean;
  isLoading: boolean;
  onSystemToggle: () => void;
  onDashboardClick: () => void;
}

const SystemControls = memo(function SystemControls({
  isGitHubUser,
  systemStartCountdown,
  isSystemStarting,
  isLoading,
  onSystemToggle,
  onDashboardClick,
}: SystemControlsProps) {
  const router = useRouter();
  const { isSystemStarted } = useUnifiedAdminStore();
  const { status: multiUserStatus, isLoading: statusLoading } =
    useSystemStatus();

  // 버튼 설정 메모이제이션
  const buttonConfig = useMemo(() => {
    if (systemStartCountdown > 0) {
      return {
        text: `시작 취소 (${systemStartCountdown}초)`,
        icon: <X className='w-5 h-5' />,
        className:
          'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-400/50 relative overflow-hidden',
      };
    }

    if (isSystemStarting) {
      return {
        text: '시스템 시작 중...',
        icon: <Loader2 className='w-5 h-5 animate-spin' />,
        className:
          'bg-gradient-to-r from-purple-500 to-blue-600 text-white border-purple-400/50 cursor-not-allowed',
      };
    }

    if (isLoading || statusLoading) {
      return {
        text: '시스템 초기화 중...',
        icon: <Loader2 className='w-5 h-5 animate-spin' />,
        className:
          'bg-gray-500 text-white border-gray-400/50 cursor-not-allowed',
      };
    }

    if (multiUserStatus?.isRunning || isSystemStarted) {
      return {
        text: `📊 대시보드 이동 (사용자: ${multiUserStatus?.userCount || 0}명)`,
        icon: <BarChart3 className='w-5 h-5' />,
        className:
          'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-green-400/50',
      };
    }

    return {
      text: '🚀 시스템 시작',
      icon: <Play className='w-5 h-5' />,
      className:
        'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-blue-400/50',
    };
  }, [
    systemStartCountdown,
    isSystemStarting,
    isLoading,
    statusLoading,
    multiUserStatus,
    isSystemStarted,
  ]);

  if (!isSystemStarted) {
    return (
      <div className='max-w-2xl mx-auto text-center'>
        <div className='flex flex-col items-center mb-6 space-y-4'>
          {isGitHubUser ? (
            <>
              <motion.button
                onClick={onSystemToggle}
                disabled={isLoading || isSystemStarting}
                className={`w-64 h-16 flex items-center justify-center gap-3 rounded-xl font-semibold transition-all duration-300 border shadow-xl ${buttonConfig.className}`}
                whileHover={
                  !isLoading && systemStartCountdown === 0
                    ? { scale: 1.05 }
                    : {}
                }
                whileTap={!isLoading ? { scale: 0.95 } : {}}
              >
                {systemStartCountdown > 0 && (
                  <motion.div
                    className='absolute inset-0 rounded-xl overflow-hidden'
                    style={{ transformOrigin: 'left' }}
                  >
                    <motion.div
                      className='h-full bg-gradient-to-r from-red-600/40 via-red-500/40 to-red-400/40'
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 3, ease: 'linear' }}
                    />
                  </motion.div>
                )}
                <div className='relative z-10 flex items-center gap-3'>
                  {buttonConfig.icon}
                  <span className='text-lg'>{buttonConfig.text}</span>
                </div>
              </motion.button>

              <div className='mt-2 flex flex-col items-center gap-1'>
                <span
                  className={`text-sm font-medium opacity-80 transition-all duration-300 ${
                    systemStartCountdown > 0
                      ? 'text-orange-300'
                      : isSystemStarting
                        ? 'text-purple-300'
                        : multiUserStatus?.isRunning
                          ? 'text-green-300'
                          : 'text-white'
                  }`}
                >
                  {systemStartCountdown > 0
                    ? '⚠️ 시작 예정 - 취소하려면 클릭'
                    : isSystemStarting
                      ? '🚀 시스템 부팅 중...'
                      : multiUserStatus?.isRunning || isSystemStarted
                        ? '✅ 시스템 가동 중 - 대시보드로 이동'
                        : '클릭하여 시작하기'}
                </span>
              </div>
            </>
          ) : (
            <div className='text-center'>
              <div className='mb-4 p-6 rounded-xl border bg-blue-500/10 border-blue-400/30'>
                <LogIn className='w-12 h-12 text-blue-400 mx-auto mb-3' />
                <h3 className='text-lg font-semibold text-white mb-2'>
                  GitHub 로그인이 필요합니다
                </h3>
                <p className='text-sm text-blue-100 mb-4'>
                  시스템 시작 기능은 GitHub 인증된 사용자만 사용할 수 있습니다.
                </p>
                <motion.button
                  onClick={() => router.push('/login')}
                  className='px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  로그인 페이지로 이동
                </motion.button>
              </div>
            </div>
          )}
        </div>

        <div className='flex justify-center text-sm'>
          <div className='p-3 rounded-lg bg-white/5 max-w-md'>
            <div className='flex items-center gap-2 mb-1 justify-center'>
              <Bot className='w-4 h-4 text-purple-400' />
              <span className='font-semibold'>AI 어시스턴트</span>
            </div>
            <p className='text-white/70 text-center'>
              시스템 시작 후 대시보드에서 AI 사이드바 이용 가능
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 시스템 활성 상태
  return (
    <motion.div
      className='max-w-4xl mx-auto text-center'
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className='flex justify-center mb-6'>
        <div className='flex flex-col items-center'>
          {isGitHubUser ? (
            <motion.button
              onClick={onDashboardClick}
              className='w-64 h-16 flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 border bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/50 shadow-xl'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BarChart3 className='w-5 h-5' />
              <span className='text-lg'>📊 대시보드 열기</span>
            </motion.button>
          ) : (
            <div className='text-center'>
              <p className='text-sm text-gray-400 mb-2'>
                시스템이 다른 사용자에 의해 실행 중입니다
              </p>
              <p className='text-xs text-gray-500'>
                GitHub 로그인 후 대시보드 접근이 가능합니다
              </p>
            </div>
          )}
        </div>
      </div>

      <p className='text-white/60 text-xs mt-4 text-center'>
        시스템이 활성화되어 있습니다. 대시보드에서 상세 모니터링을 확인하세요.
      </p>
    </motion.div>
  );
});

export default SystemControls;
