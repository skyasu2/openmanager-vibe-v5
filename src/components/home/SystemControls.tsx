'use client';

import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useSystemStatus } from '@/hooks/useSystemStatus';
// framer-motion 제거 - CSS 애니메이션 사용
import { BarChart3, Bot, Loader2, Play, X, LogIn, Shield, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, memo, useState } from 'react';

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
  const { isSystemStarted, adminMode, authenticateAdmin } = useUnifiedAdminStore();
  const { status: multiUserStatus, isLoading: statusLoading } =
    useSystemStatus();

  // 숨겨진 관리자 모드 상태
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 관리자 인증 처리
  const handleAdminAuth = async () => {
    if (!adminPassword.trim()) {
      setAuthMessage('비밀번호를 입력해주세요.');
      return;
    }

    setIsAuthenticating(true);
    setAuthMessage('');

    try {
      const result = await authenticateAdmin(adminPassword);
      
      if (result.success) {
        setAuthMessage('✅ 관리자 인증 성공! 모든 기능이 활성화되었습니다.');
        setTimeout(() => {
          setShowAdminAuth(false);
          setAdminPassword('');
          setAuthMessage('');
        }, 2000);
      } else {
        setAuthMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setAuthMessage('❌ 인증 처리 중 오류가 발생했습니다.');
    }

    setIsAuthenticating(false);
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdminAuth();
    }
  };

  // 버튼 설정 메모이제이션
  const buttonConfig = useMemo(() => {
    if (systemStartCountdown > 0) {
      return {
        text: `시작 취소 (${systemStartCountdown}초)`,
        icon: <X className="h-5 w-5" />,
        className:
          'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-400/50 relative overflow-hidden',
      };
    }

    if (isSystemStarting) {
      return {
        text: '시스템 시작 중...',
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
        className:
          'bg-gradient-to-r from-purple-500 to-blue-600 text-white border-purple-400/50 cursor-not-allowed',
      };
    }

    if (isLoading || statusLoading) {
      return {
        text: '시스템 초기화 중...',
        icon: <Loader2 className="h-5 w-5 animate-spin" />,
        className:
          'bg-gray-500 text-white border-gray-400/50 cursor-not-allowed',
      };
    }

    if (multiUserStatus?.isRunning || isSystemStarted) {
      return {
        text: `📊 대시보드 이동 (사용자: ${multiUserStatus?.userCount || 0}명)`,
        icon: <BarChart3 className="h-5 w-5" />,
        className:
          'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-green-400/50',
      };
    }

    return {
      text: '🚀 시스템 시작',
      icon: <Play className="h-5 w-5" />,
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
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-6 flex flex-col items-center space-y-4">
          {isGitHubUser ? (
            <>
              <button
                onClick={onSystemToggle}
                disabled={isLoading || isSystemStarting}
                className={`flex h-16 w-64 items-center justify-center gap-3 rounded-xl border font-semibold shadow-xl transition-all duration-300 ${buttonConfig.className}`}
              >
                {systemStartCountdown > 0 && (
                  <div
                    className="absolute inset-0 overflow-hidden rounded-xl"
                    style={{ transformOrigin: 'left' }}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-red-600/40 via-red-500/40 to-red-400/40"
                    />
                  </div>
                )}
                <div className="relative z-10 flex items-center gap-3">
                  {buttonConfig.icon}
                  <span className="text-lg">{buttonConfig.text}</span>
                </div>
              </button>

              <div className="mt-2 flex flex-col items-center gap-1">
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
            <div className="text-center">
              {/* GitHub 로그인 또는 관리자 모드가 아닌 경우 */}
              {!adminMode.isAuthenticated && !showAdminAuth && (
                <div className="mb-4 rounded-xl border border-blue-400/30 bg-blue-500/10 p-6">
                  <LogIn className="mx-auto mb-3 h-12 w-12 text-blue-400" />
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    GitHub 로그인이 필요합니다
                  </h3>
                  <p className="mb-4 text-sm text-blue-100">
                    시스템 시작 기능은 GitHub 인증된 사용자만 사용할 수 있습니다.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push('/login')}
                      className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      로그인 페이지로 이동
                    </button>
                    
                    {/* 숨겨진 관리자 모드 버튼 */}
                    <button
                      onClick={() => setShowAdminAuth(true)}
                      className="mx-2 rounded-lg bg-gray-700/50 px-3 py-1 text-xs text-gray-300 opacity-30 transition-all hover:opacity-100 hover:bg-gray-600/50"
                      title="관리자 모드"
                    >
                      <Shield className="inline h-3 w-3 mr-1" />
                      Admin
                    </button>
                  </div>
                </div>
              )}

              {/* 관리자 인증 패널 */}
              {showAdminAuth && !adminMode.isAuthenticated && (
                <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-6">
                  <Shield className="mx-auto mb-3 h-10 w-10 text-amber-400" />
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    관리자 인증
                  </h3>
                  <p className="mb-4 text-sm text-amber-100">
                    관리자 비밀번호를 입력하세요
                  </p>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="관리자 비밀번호"
                        className="w-full rounded-lg bg-gray-800/50 border border-gray-600 px-3 py-2 pr-10 text-white placeholder-gray-400 focus:border-amber-500 focus:outline-none"
                        disabled={isAuthenticating}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {authMessage && (
                      <div className={`text-sm p-2 rounded ${
                        authMessage.includes('✅') 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {authMessage}
                      </div>
                    )}
                    
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={handleAdminAuth}
                        disabled={isAuthenticating || !adminPassword.trim()}
                        className="rounded-lg bg-amber-600 px-4 py-2 text-white font-medium disabled:opacity-50 hover:bg-amber-700 transition-colors"
                      >
                        {isAuthenticating ? (
                          <>
                            <Loader2 className="inline h-4 w-4 mr-1 animate-spin" />
                            인증 중...
                          </>
                        ) : (
                          '인증하기'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowAdminAuth(false);
                          setAdminPassword('');
                          setAuthMessage('');
                        }}
                        className="rounded-lg bg-gray-600 px-4 py-2 text-white font-medium hover:bg-gray-700 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 관리자 인증 완료 시 시스템 컨트롤 표시 */}
              {adminMode.isAuthenticated && (
                <>
                  <button
                    onClick={onSystemToggle}
                    disabled={isLoading || isSystemStarting}
                    className={`flex h-16 w-64 items-center justify-center gap-3 rounded-xl border font-semibold shadow-xl transition-all duration-300 ${buttonConfig.className}`}
                  >
                    {systemStartCountdown > 0 && (
                      <div
                        className="absolute inset-0 overflow-hidden rounded-xl"
                        style={{ transformOrigin: 'left' }}
                      >
                        <div
                          className="h-full bg-gradient-to-r from-red-600/40 via-red-500/40 to-red-400/40"
                        />
                      </div>
                    )}
                    <div className="relative z-10 flex items-center gap-3">
                      {buttonConfig.icon}
                      <span className="text-lg">{buttonConfig.text}</span>
                    </div>
                  </button>

                  <div className="mt-2 flex flex-col items-center gap-1">
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
                            : '🎯 관리자 모드: 모든 기능 사용 가능'}
                    </span>
                    <span className="text-xs text-amber-400 opacity-70">
                      👑 관리자 권한으로 실행 중
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center text-sm">
          <div className="max-w-md rounded-lg bg-white/5 p-3">
            <div className="mb-1 flex items-center justify-center gap-2">
              <Bot className="h-4 w-4 text-purple-400" />
              <span className="font-semibold">AI 어시스턴트</span>
            </div>
            <p className="text-center text-white/70">
              시스템 시작 후 대시보드에서 AI 사이드바 이용 가능
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 시스템 활성 상태
  return (
    <div
      className="mx-auto max-w-4xl text-center"
    >
      <div className="mb-6 flex justify-center">
        <div className="flex flex-col items-center">
          {isGitHubUser || adminMode.isAuthenticated ? (
            <>
              <button
                onClick={onDashboardClick}
                className="flex h-16 w-64 items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-600 font-semibold text-white shadow-xl transition-all duration-200 hover:bg-emerald-700"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="text-lg">📊 대시보드 열기</span>
              </button>
              {adminMode.isAuthenticated && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-amber-400">
                    👑 관리자 권한으로 접근 중
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <p className="mb-2 text-sm text-gray-400">
                시스템이 다른 사용자에 의해 실행 중입니다
              </p>
              <p className="text-xs text-gray-500">
                GitHub 로그인 후 대시보드 접근이 가능합니다
              </p>
              
              {/* 숨겨진 관리자 모드 버튼 (시스템 활성화 시에도 표시) */}
              {!showAdminAuth && (
                <button
                  onClick={() => setShowAdminAuth(true)}
                  className="mt-2 rounded-lg bg-gray-700/30 px-3 py-1 text-xs text-gray-400 opacity-20 transition-all hover:opacity-80 hover:bg-gray-600/50"
                  title="관리자 모드"
                >
                  <Shield className="inline h-3 w-3 mr-1" />
                  Admin
                </button>
              )}

              {/* 관리자 인증 패널 (시스템 활성화 시) */}
              {showAdminAuth && !adminMode.isAuthenticated && (
                <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
                  <Shield className="mx-auto mb-2 h-8 w-8 text-amber-400" />
                  <h4 className="mb-2 text-sm font-semibold text-white">
                    관리자 인증
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="관리자 비밀번호"
                        className="w-full rounded bg-gray-800/50 border border-gray-600 px-2 py-1 pr-8 text-sm text-white placeholder-gray-400 focus:border-amber-500 focus:outline-none"
                        disabled={isAuthenticating}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                    
                    {authMessage && (
                      <div className={`text-xs p-2 rounded ${
                        authMessage.includes('✅') 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {authMessage}
                      </div>
                    )}
                    
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={handleAdminAuth}
                        disabled={isAuthenticating || !adminPassword.trim()}
                        className="rounded bg-amber-600 px-3 py-1 text-xs text-white font-medium disabled:opacity-50 hover:bg-amber-700 transition-colors"
                      >
                        {isAuthenticating ? '인증 중...' : '인증'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAdminAuth(false);
                          setAdminPassword('');
                          setAuthMessage('');
                        }}
                        className="rounded bg-gray-600 px-3 py-1 text-xs text-white font-medium hover:bg-gray-700 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-white/60">
        시스템이 활성화되어 있습니다. 대시보드에서 상세 모니터링을 확인하세요.
      </p>
    </div>
  );
});

export default SystemControls;
