'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { 
  User, 
  Bot, 
  Monitor, 
  AlertTriangle, 
  Power,
  Settings,
  LogOut,
  ChevronDown,
  Database,
  X
} from 'lucide-react';
import Image from 'next/image';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useToast } from '@/components/ui/ToastNotification';

// Dynamic imports for modal components
const UnifiedAuthModal = dynamic(() => import('./UnifiedAuthModal'), {
  loading: () => <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div></div>,
  ssr: false
});

const ServerGeneratorModal = dynamic(() => import('./ServerGeneratorModal'), {
  loading: () => <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>,
  ssr: false
});

const ServerMonitorModal = dynamic(() => import('./ServerMonitorModal'), {
  loading: () => <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"><div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div></div>,
  ssr: false
});

// 환경설정 모달을 위한 간단한 컴포넌트
const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />
        <motion.div
          className="w-full max-w-md bg-gray-900/98 backdrop-blur-xl border border-gray-700/70 rounded-2xl shadow-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className="p-6 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">시스템 설정</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <h3 className="text-white font-medium mb-2">환경설정</h3>
                <p className="text-blue-200 text-sm">
                  시스템 환경설정 기능이 곧 추가될 예정입니다.
                </p>
              </div>
              <div className="p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                <h3 className="text-white font-medium mb-2">AI 설정</h3>
                <p className="text-purple-200 text-sm">
                  AI 에이전트 고급 설정 기능이 곧 추가될 예정입니다.
                </p>
              </div>
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <h3 className="text-white font-medium mb-2">알림 설정</h3>
                <p className="text-green-200 text-sm">
                  알림 및 경고 설정 기능이 곧 추가될 예정입니다.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

interface UnifiedProfileComponentProps {
  userName?: string;
  userAvatar?: string;
}

export default function UnifiedProfileComponent({ 
  userName = "사용자", 
  userAvatar
}: UnifiedProfileComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showServerGeneratorModal, setShowServerGeneratorModal] = useState(false);
  const [showServerMonitorModal, setShowServerMonitorModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    isSystemStarted,
    aiAgent,
    attempts,
    isLocked,
    lockoutEndTime,
    startSystem,
    stopSystem,
    authenticateAIAgent,
    disableAIAgent,
    toggleAIProcessing,
    checkLockStatus,
    getRemainingLockTime,
    logout
  } = useUnifiedAdminStore();

  const { success, error, warning, info } = useToast();

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSystemToggle = () => {
    if (isSystemStarted) {
      stopSystem();
      info('시스템이 정지되었습니다.');
    } else {
      startSystem();
      success('시스템이 시작되었습니다.');
    }
    setIsOpen(false);
  };

  const handleAIAgentToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('🤖 AI 에이전트 버튼 클릭됨', { isEnabled: aiAgent.isEnabled, isLocked });
    
    if (aiAgent.isEnabled) {
      disableAIAgent();
      info('AI 에이전트가 비활성화되었습니다. 기본 모니터링 모드로 전환됩니다.');
    } else {
      // 클릭 위치 캡처
      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      console.log('📍 클릭 위치:', { x, y });
      setClickPosition({ x, y });

      if (isLocked) {
        const remainingTime = getRemainingLockTime();
        error(`계정이 잠겼습니다. ${Math.ceil(remainingTime / 1000)}초 후 다시 시도하세요.`);
        return;
      }
      
      console.log('🔓 모달 열기 시도');
      setShowAuthModal(true);
    }
    setIsOpen(false);
  };

  const handleAIProcessingToggle = async () => {
    // 이 함수는 더 이상 사용하지 않음
    return;
  };

  const handleAuthSubmit = (password: string) => {
    const result = authenticateAIAgent(password);
    
    if (result.success) {
      success('AI 에이전트 모드가 활성화되었습니다.');
    } else {
      error(result.message);
    }

    return result;
  };

  const getModeDisplayText = () => {
    return aiAgent.isEnabled ? 'AI 에이전트 모드' : '기본 모니터링 모드';
  };

  const getModeStatusColor = () => {
    return aiAgent.isEnabled ? 'text-purple-400' : 'text-cyan-400';
  };

  const getSystemStatusColor = () => {
    if (isLocked) return 'text-red-400';
    if (!isSystemStarted) return 'text-gray-400';
    return aiAgent.isEnabled ? 'text-purple-400' : 'text-cyan-400';
  };

  const getAIStatusText = () => {
    if (!aiAgent.isEnabled) return 'AI 에이전트 모드 필요';
    switch (aiAgent.state) {
      case 'enabled': return '활성화됨';
      case 'disabled': return '비활성화됨';
      case 'processing': return '처리 중...';
      case 'idle': return '대기 중';
      default: return '비활성화됨';
    }
  };

  const getAIStatusColor = () => {
    if (!aiAgent.isEnabled) return 'text-orange-400';
    switch (aiAgent.state) {
      case 'enabled': return 'text-green-400';
      case 'disabled': return 'text-gray-400';
      case 'processing': return 'text-blue-400';
      case 'idle': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* 프로필 버튼 */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-3 p-2 rounded-xl backdrop-blur-sm border transition-all duration-200 ${
            isLocked
              ? 'bg-red-500/20 border-red-500/50 shadow-red-500/20 shadow-lg'
              : aiAgent.isEnabled
              ? 'bg-purple-500/20 border-purple-500/50 shadow-purple-500/20 shadow-lg'
              : 'bg-white/10 border-white/20 hover:bg-white/20'
          }`}
        >
          {/* 아바타 */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isLocked
              ? 'bg-gradient-to-br from-red-500 to-orange-600'
              : aiAgent.isEnabled
              ? 'bg-gradient-to-br from-purple-500 to-pink-600'
              : 'bg-gradient-to-br from-cyan-500 to-blue-600'
          }`}>
            {userAvatar ? (
              <Image 
                src={userAvatar} 
                alt="Avatar" 
                width={32} 
                height={32} 
                className="w-full h-full rounded-full object-cover" 
              />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          
          {/* 사용자 정보 */}
          <div className="text-left hidden sm:block">
            <div className="text-white text-sm font-medium">{userName}</div>
            <div className={`text-xs ${getModeStatusColor()}`}>
              {getModeDisplayText()}
            </div>
          </div>
          
          {/* 상태 인디케이터 */}
          <div className="flex items-center gap-1">
            {/* AI 에이전트 상태 */}
            {aiAgent.isEnabled && aiAgent.state === 'processing' && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
            
            {/* 잠금 상태 */}
            {isLocked && (
              <AlertTriangle className="w-3 h-3 text-red-400" />
            )}
            
            {/* 드롭다운 아이콘 */}
            <ChevronDown className={`w-3 h-3 text-white/70 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} />
          </div>
        </motion.button>

        {/* 드롭다운 메뉴 */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 rounded-xl shadow-2xl z-50"
            >
              {/* 헤더 */}
              <div className="p-4 border-b border-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isLocked
                      ? 'bg-gradient-to-br from-red-500 to-orange-600'
                      : aiAgent.isEnabled
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                      : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                  }`}>
                    {isLocked ? (
                      <AlertTriangle className="w-6 h-6 text-white" />
                    ) : aiAgent.isEnabled ? (
                      <Bot className="w-6 h-6 text-white" />
                    ) : (
                      <Monitor className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium">{userName}</div>
                    <div className={`text-sm ${getSystemStatusColor()}`}>
                      {isLocked ? '계정 잠김' : getModeDisplayText()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 시스템 상태 */}
              <div className="p-4 border-b border-gray-700/50">
                <div className="space-y-3">
                  {/* 시스템 토글 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSystemStarted ? 'bg-green-500/20' : 'bg-gray-500/20'
                      }`}>
                        <Power className={`w-4 h-4 ${
                          isSystemStarted ? 'text-green-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">시스템</div>
                        <div className={`text-xs ${
                          isSystemStarted ? 'text-green-400' : 'text-gray-400'
                        }`}>
                          {isSystemStarted ? '실행 중' : '정지됨'}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSystemToggle}
                      disabled={isLocked}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                        isSystemStarted
                          ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                          : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      }`}
                    >
                      {isSystemStarted ? '정지' : '시작'}
                    </motion.button>
                  </div>

                  {/* AI 에이전트 토글 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        aiAgent.isEnabled 
                          ? 'bg-purple-500/20' 
                          : 'bg-gray-500/20'
                      }`}>
                        <Bot className={`w-4 h-4 ${
                          aiAgent.isEnabled ? 'text-purple-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">AI 에이전트</div>
                        <div className={`text-xs ${
                          aiAgent.isEnabled ? 'text-purple-400' : 'text-gray-400'
                        }`}>
                          {aiAgent.isEnabled ? '활성화됨' : '비활성화됨'}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAIAgentToggle}
                      disabled={isLocked}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                        aiAgent.isEnabled
                          ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                          : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                      }`}
                    >
                      {aiAgent.isEnabled ? '비활성화' : '활성화'}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* 메뉴 아이템들 */}
              <div className="p-2">
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  onClick={() => {
                    setShowSettingsModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                >
                  <div className="p-2 rounded-lg bg-gray-500/20">
                    <Settings className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">설정</div>
                    <div className="text-gray-400 text-xs">시스템 설정 및 환경설정</div>
                  </div>
                </motion.button>

                {/* AI 모드에서만 표시되는 서버 데이터 생성기 설정 */}
                {aiAgent.isEnabled && (
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    onClick={() => {
                      setShowServerGeneratorModal(true);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Database className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">서버 데이터 생성기 설정</div>
                      <div className="text-gray-400 text-xs">시뮬레이터 상태 확인 및 제어</div>
                    </div>
                  </motion.button>
                )}

                {/* AI 모드에서만 표시되는 서버 모니터링 상태 확인 */}
                {aiAgent.isEnabled && (
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    onClick={() => {
                      setShowServerMonitorModal(true);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Monitor className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">서버 모니터링 상태 확인</div>
                      <div className="text-gray-400 text-xs">실시간 모니터링 상태 및 제어</div>
                    </div>
                  </motion.button>
                )}

                {aiAgent.isEnabled && (
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    onClick={() => {
                      disableAIAgent();
                      info('AI 에이전트 모드가 종료되었습니다. 기본 모니터링 모드로 전환됩니다.');
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <LogOut className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">종료</div>
                      <div className="text-gray-400 text-xs">AI 에이전트 모드 종료</div>
                    </div>
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 환경설정 모달 */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* 인증 모달 */}
      <UnifiedAuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setClickPosition(undefined);
        }}
        onSubmit={handleAuthSubmit}
        isLocked={isLocked}
        attempts={attempts}
        lockoutEndTime={lockoutEndTime}
        clickPosition={clickPosition}
      />

      {/* 서버 데이터 생성기 모달 */}
      <ServerGeneratorModal
        isOpen={showServerGeneratorModal}
        onClose={() => setShowServerGeneratorModal(false)}
      />

      {/* 서버 모니터링 모달 */}
      <ServerMonitorModal
        isOpen={showServerMonitorModal}
        onClose={() => setShowServerMonitorModal(false)}
      />
    </>
  );
} 