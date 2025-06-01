'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  Eye,
  EyeOff,
  Check,
  Loader2,
  Shield
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';
import { useToast } from '@/components/ui/ToastNotification';

interface UnifiedProfileComponentProps {
  userName?: string;
  userAvatar?: string;
}

// 통합 설정 패널 컴포넌트
const UnifiedSettingsPanel = ({ 
  isOpen, 
  onClose, 
  buttonRef 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'generator' | 'monitor' | 'general'>('ai');
  const [aiPassword, setAiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const { 
    aiAgent, 
    isSystemStarted,
    authenticateAIAgent, 
    disableAIAgent,
    attempts,
    isLocked,
    getRemainingLockTime
  } = useUnifiedAdminStore();
  
  const { success, error, info, warning } = useToast();

  // AI 에이전트 인증 처리
  const handleAIAuthentication = async () => {
    if (!aiPassword.trim()) {
      warning('비밀번호를 입력해주세요.');
      return;
    }

    setIsAuthenticating(true);
    
    try {
      // 실제 인증 처리
      const result = authenticateAIAgent(aiPassword);
      
      if (result.success) {
        success('🤖 AI 에이전트 모드가 활성화되었습니다!');
        setAiPassword('');
        setActiveTab('general');
      } else {
        error(result.message);
        if (isLocked) {
          const remainingTime = getRemainingLockTime();
          error(`계정이 잠겼습니다. ${Math.ceil(remainingTime / 1000)}초 후 다시 시도하세요.`);
        }
      }
    } catch (err: any) {
      error('인증 처리 중 오류가 발생했습니다.');
      console.error('AI 인증 오류:', err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // AI 에이전트 비활성화
  const handleAIDisable = () => {
    disableAIAgent();
    success('AI 에이전트가 비활성화되었습니다.');
    setActiveTab('general');
  };

  // 서버 데이터 생성기 상태 확인
  const handleGeneratorCheck = async () => {
    try {
      info('서버 데이터 생성기 상태를 확인하고 있습니다...');
      // 실제 API 호출로 대체 예정
      const response = await fetch('/api/data-generator');
      if (response.ok) {
        success('서버 데이터 생성기가 정상 동작중입니다.');
      } else {
        warning('서버 데이터 생성기 상태 확인에 실패했습니다.');
      }
    } catch (err: any) {
      error('서버 데이터 생성기 연결에 실패했습니다.');
    }
  };

  // 서버 모니터링 상태 확인
  const handleMonitorCheck = async () => {
    try {
      info('서버 모니터링 시스템을 확인하고 있습니다...');
      // 실제 API 호출로 대체 예정
      const response = await fetch('/api/health');
      if (response.ok) {
        success('서버 모니터링 시스템이 정상 동작중입니다.');
      } else {
        warning('서버 모니터링 상태 확인에 실패했습니다.');
      }
    } catch (err: any) {
      error('서버 모니터링 시스템 연결에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">시스템 설정</h2>
                <p className="text-gray-400">AI 모드, 데이터 생성기, 모니터링 제어</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-700/50 bg-gray-800/30">
          {[
            { id: 'ai', label: 'AI 모드', icon: Bot },
            { id: 'generator', label: '데이터 생성기', icon: Database },
            { id: 'monitor', label: '모니터링', icon: Monitor },
            { id: 'general', label: '일반 설정', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 p-4 transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* AI 모드 탭 */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  aiAgent.isEnabled
                    ? 'bg-gradient-to-br from-purple-500 to-pink-600'
                    : 'bg-gray-600'
                }`}>
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  AI 에이전트 모드
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {aiAgent.isEnabled 
                    ? 'AI 에이전트가 활성화되어 고급 분석 기능을 사용할 수 있습니다.' 
                    : 'AI 에이전트를 활성화하여 지능형 서버 분석 기능을 사용하세요.'
                  }
                </p>
              </div>

              {!aiAgent.isEnabled ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      관리자 비밀번호
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={aiPassword}
                        onChange={(e) => setAiPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAIAuthentication()}
                        className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="비밀번호를 입력하세요..."
                        disabled={isLocked}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {isLocked && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <p className="text-red-300 text-sm">
                        ⚠️ 계정이 잠겼습니다. {Math.ceil(getRemainingLockTime() / 1000)}초 후 다시 시도하세요.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleAIAuthentication}
                    disabled={isAuthenticating || isLocked || !aiPassword.trim()}
                    className="w-full p-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        인증 중...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        AI 모드 활성화
                      </>
                    )}
                  </button>

                  <div className="text-xs text-gray-500 text-center">
                    잘못된 시도 {attempts}/5회. 5회 실패 시 10초간 잠깁니다.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-green-300 mb-2">
                      <Check className="w-4 h-4" />
                      <span className="font-medium">AI 에이전트 활성화됨</span>
                    </div>
                    <p className="text-green-200 text-sm">
                      자연어 질의, 예측 분석, 이상 탐지 등 모든 AI 기능을 사용할 수 있습니다.
                    </p>
                  </div>

                  <button
                    onClick={handleAIDisable}
                    className="w-full p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg font-medium hover:bg-red-500/30 transition-colors"
                  >
                    AI 모드 비활성화
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 데이터 생성기 탭 */}
          {activeTab === 'generator' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-4">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  서버 데이터 생성기
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  시뮬레이션용 서버 메트릭 데이터를 생성하고 관리합니다.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleGeneratorCheck}
                  className="w-full p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <h4 className="text-white font-medium mb-2">생성기 상태 확인</h4>
                  <p className="text-blue-200 text-sm text-left">
                    현재 서버 데이터 생성기의 동작 상태를 확인합니다.
                  </p>
                </button>

                <div className="p-4 bg-gray-800/30 rounded-lg">
                  <h4 className="text-white font-medium mb-2">시뮬레이션 정보</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>활성 서버:</span>
                      <span className="text-green-400">16개</span>
                    </div>
                    <div className="flex justify-between">
                      <span>데이터 생성 주기:</span>
                      <span className="text-blue-400">5초</span>
                    </div>
                    <div className="flex justify-between">
                      <span>상태 분포:</span>
                      <span className="text-gray-400">70% 정상, 20% 경고, 10% 심각</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 모니터링 탭 */}
          {activeTab === 'monitor' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                  <Monitor className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  서버 모니터링
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  실시간 서버 모니터링 시스템의 상태를 확인하고 관리합니다.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleMonitorCheck}
                  className="w-full p-4 bg-green-500/20 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  <h4 className="text-white font-medium mb-2">모니터링 상태 확인</h4>
                  <p className="text-green-200 text-sm text-left">
                    헬스 체크 API와 모니터링 시스템의 동작 상태를 확인합니다.
                  </p>
                </button>

                <div className="p-4 bg-gray-800/30 rounded-lg">
                  <h4 className="text-white font-medium mb-2">모니터링 정보</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>헬스 체크 주기:</span>
                      <span className="text-green-400">60초</span>
                    </div>
                    <div className="flex justify-between">
                      <span>알림 상태:</span>
                      <span className="text-blue-400">활성화</span>
                    </div>
                    <div className="flex justify-between">
                      <span>데이터 보관 기간:</span>
                      <span className="text-gray-400">24시간</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 일반 설정 탭 */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center mb-4">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  일반 설정
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  시스템 환경 설정 및 기타 옵션을 관리합니다.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => info('알림 설정 기능이 곧 추가될 예정입니다.')}
                  className="w-full p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-colors"
                >
                  <h4 className="text-white font-medium mb-2">알림 설정</h4>
                  <p className="text-orange-200 text-sm text-left">
                    시스템 알림 및 경고 메시지 설정을 관리합니다.
                  </p>
                </button>

                <button
                  onClick={() => info('테마 설정 기능이 곧 추가될 예정입니다.')}
                  className="w-full p-4 bg-indigo-500/20 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors"
                >
                  <h4 className="text-white font-medium mb-2">테마 설정</h4>
                  <p className="text-indigo-200 text-sm text-left">
                    다크/라이트 모드 및 색상 테마를 설정합니다.
                  </p>
                </button>

                <button
                  onClick={() => info('백업 설정 기능이 곧 추가될 예정입니다.')}
                  className="w-full p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors"
                >
                  <h4 className="text-white font-medium mb-2">백업 설정</h4>
                  <p className="text-purple-200 text-sm text-left">
                    데이터 백업 주기 및 복원 설정을 관리합니다.
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function UnifiedProfileComponent({ 
  userName = "사용자", 
  userAvatar
}: UnifiedProfileComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    isSystemStarted,
    aiAgent,
    isLocked,
    startSystem,
    stopSystem,
    disableAIAgent,
    logout
  } = useUnifiedAdminStore();

  const { success, info } = useToast();

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSystemToggle = () => {
    if (isSystemStarted) {
      stopSystem();
    } else {
      startSystem();
    }
    setIsOpen(false);
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
                      {getModeDisplayText()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 제어 영역 */}
              <div className="p-4 border-b border-gray-700/50">
                <div className="space-y-3">
                  {/* 시스템 제어 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSystemStarted 
                          ? 'bg-green-500/20' 
                          : 'bg-red-500/20'
                      }`}>
                        <Power className={`w-4 h-4 ${
                          isSystemStarted ? 'text-green-400' : 'text-red-400'
                        }`} />
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">시스템 제어</div>
                        <div className={`text-xs ${
                          isSystemStarted ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {isSystemStarted ? '실행 중' : '정지됨'}
                        </div>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSystemToggle}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        isSystemStarted
                          ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                          : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      }`}
                    >
                      {isSystemStarted ? '정지' : '시작'}
                    </motion.button>
                  </div>

                  {/* AI 에이전트 표시 */}
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
                    {aiAgent.isEnabled && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          disableAIAgent();
                          info('AI 에이전트가 비활성화되었습니다.');
                          setIsOpen(false);
                        }}
                        className="px-3 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                      >
                        비활성화
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>

              {/* 메뉴 아이템들 */}
              <div className="space-y-2">
                {/* AI 관리자 페이지 버튼 - AI 모드 활성화 시에만 표시 */}
                {aiAgent.isEnabled && aiAgent.isAuthenticated && (
                  <Link href="/admin/ai-agent">
                    <motion.button
                      whileHover={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Shield className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">🧠 AI 관리자 페이지</div>
                        <div className="text-gray-400 text-xs">AI 로그, 컨텍스트, A/B 테스트 관리</div>
                      </div>
                    </motion.button>
                  </Link>
                )}

                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  onClick={() => {
                    setShowSettingsPanel(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                >
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Settings className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">통합 설정</div>
                    <div className="text-gray-400 text-xs">AI 모드, 데이터 생성기, 모니터링 제어</div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  onClick={() => {
                    logout();
                    info('로그아웃되었습니다.');
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                >
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <LogOut className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">로그아웃</div>
                    <div className="text-gray-400 text-xs">현재 세션을 종료합니다</div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 통합 설정 패널 */}
      <AnimatePresence>
        {showSettingsPanel && (
          <UnifiedSettingsPanel
            isOpen={showSettingsPanel}
            onClose={() => setShowSettingsPanel(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
} 