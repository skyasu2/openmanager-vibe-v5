'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useSystemStore } from '../stores/systemStore';
import { useAdminMode } from '../hooks/useAdminMode';
import { AdminPasswordModal } from './AdminPasswordModal';
import { Shield, ShieldCheck, ShieldX } from 'lucide-react';

interface ProfileDropdownProps {
  userName?: string;
  userAvatar?: string;
  onToast?: (toast: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
}

export default function ProfileDropdown({ 
  userName = "사용자", 
  userAvatar,
  onToast
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    aiAgent, 
    toggleAIAgent,
    state: systemState 
  } = useSystemStore();

  const {
    isAdminMode,
    isLocked,
    attempts,
    authenticateAdmin,
    exitAdminMode,
    getRemainingLockTime
  } = useAdminMode();

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

  const handleToggleAI = async () => {
    if (!isAdminMode) {
      onToast?.({
        type: 'warning',
        title: '관리자 모드 필요',
        message: 'AI 에이전트를 사용하려면 관리자 모드를 활성화해주세요.'
      });
      return;
    }

    if (systemState !== 'active') {
      onToast?.({
        type: 'warning',
        title: '시스템 비활성',
        message: '시스템이 활성화되어 있을 때만 AI 에이전트를 사용할 수 있습니다.'
      });
      return;
    }
    
    await toggleAIAgent();
  };

  const handleAdminModeToggle = () => {
    if (isAdminMode) {
      exitAdminMode();
      onToast?.({
        type: 'info',
        title: '관리자 모드 종료',
        message: '일반 모드로 전환되었습니다. 서버 모니터링 기능만 사용할 수 있습니다.'
      });
    } else {
      if (isLocked) {
        const remainingTime = getRemainingLockTime();
        onToast?.({
          type: 'error',
          title: '계정 잠김',
          message: `5번 틀려서 잠겼습니다. ${Math.ceil(remainingTime / 1000)}초 후 다시 시도하세요.`
        });
        return;
      }
      setShowPasswordModal(true);
    }
    setIsOpen(false);
  };

  const handlePasswordSubmit = (password: string) => {
    const result = authenticateAdmin(password);
    
    if (result.success) {
      onToast?.({
        type: 'success',
        title: '관리자 모드 활성화',
        message: 'AI 에이전트 기능을 사용할 수 있습니다.'
      });
    } else {
      onToast?.({
        type: 'error',
        title: '인증 실패',
        message: result.message
      });
    }

    return result;
  };

  const getAIStatusText = () => {
    if (!isAdminMode) return '관리자 모드 필요';
    switch (aiAgent.state) {
      case 'enabled': return '활성화됨';
      case 'disabled': return '비활성화됨';
      case 'processing': return '처리 중...';
      case 'idle': return '대기 중';
      default: return '비활성화됨';
    }
  };

  const getAIStatusColor = () => {
    if (!isAdminMode) return 'text-orange-400';
    switch (aiAgent.state) {
      case 'enabled': return 'text-green-400';
      case 'disabled': return 'text-gray-400';
      case 'processing': return 'text-blue-400';
      case 'idle': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getModeDisplayText = () => {
    return isAdminMode ? 'AI 관리자 모드' : '서버 모니터링 모드';
  };

  const getModeStatusColor = () => {
    return isAdminMode ? 'text-purple-400' : 'text-cyan-400';
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* 프로필 버튼 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200"
        >
          {/* 아바타 */}
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
            {userAvatar ? (
              <Image src={userAvatar} alt="Avatar" width={32} height={32} className="w-full h-full rounded-full object-cover" />
            ) : (
              <i className="fas fa-user text-white text-sm"></i>
            )}
          </div>
          
          {/* 사용자 정보 */}
          <div className="text-left hidden sm:block">
            <div className="text-white text-sm font-medium">{userName}</div>
            <div className={`text-xs ${getModeStatusColor()}`}>
              {getModeDisplayText()}
            </div>
          </div>
          
          {/* 드롭다운 아이콘 */}
          <i className={`fas fa-chevron-down text-white/70 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
        </button>

        {/* 드롭다운 메뉴 */}
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-80 sm:w-80 w-screen max-w-sm bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 rounded-xl shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-200">
            {/* 헤더 */}
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  {userAvatar ? (
                    <Image src={userAvatar} alt="Avatar" width={48} height={48} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <i className="fas fa-user text-white"></i>
                  )}
                </div>
                <div>
                  <div className="text-white font-medium">{userName}</div>
                  <div className={`text-sm ${getModeStatusColor()}`}>
                    {getModeDisplayText()}
                  </div>
                </div>
              </div>
            </div>

            {/* 관리자 모드 토글 섹션 */}
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isAdminMode 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                      : 'bg-gradient-to-br from-gray-600 to-gray-700'
                  }`}>
                    {isAdminMode ? (
                      <ShieldCheck className="w-4 h-4 text-white" />
                    ) : (
                      <Shield className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">관리자 모드</div>
                    <div className={`text-xs ${isAdminMode ? 'text-purple-400' : 'text-gray-400'}`}>
                      {isAdminMode ? 'AI 에이전트 사용 가능' : 'AI 기능 제한됨'}
                    </div>
                  </div>
                </div>
                
                {/* 토글 스위치 */}
                <button
                  onClick={handleAdminModeToggle}
                  disabled={isLocked}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    isAdminMode 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600' 
                      : 'bg-gray-600'
                  } ${
                    isLocked 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      isAdminMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 잠금 상태 알림 */}
              {isLocked && (
                <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-red-300 text-xs">
                    <ShieldX className="w-4 h-4" />
                    <span>5번 틀려서 잠김 - {Math.ceil(getRemainingLockTime() / 1000)}초 후 재시도</span>
                  </div>
                </div>
              )}

              {/* 시도 횟수 표시 */}
              {attempts > 0 && !isLocked && (
                <div className="mt-2 text-xs text-yellow-400">
                  실패 횟수: {attempts}/5
                </div>
              )}
            </div>

            {/* AI 에이전트 토글 섹션 */}
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <i className="fas fa-brain text-white text-sm"></i>
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">AI 에이전트</div>
                    <div className={`text-xs ${getAIStatusColor()}`}>
                      {getAIStatusText()}
                    </div>
                  </div>
                </div>
                
                {/* 토글 스위치 */}
                <button
                  onClick={handleToggleAI}
                  disabled={!isAdminMode || aiAgent.state === 'processing' || systemState !== 'active'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    aiAgent.isEnabled && isAdminMode
                      ? 'bg-gradient-to-r from-green-500 to-green-600' 
                      : 'bg-gray-600'
                  } ${
                    !isAdminMode || aiAgent.state === 'processing' || systemState !== 'active'
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'cursor-pointer'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                      aiAgent.isEnabled && isAdminMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* AI 에이전트 상태 정보 */}
              {isAdminMode && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>MCP 연결:</span>
                    <span className={
                      aiAgent.mcpStatus === 'connected' ? 'text-green-400' :
                      aiAgent.mcpStatus === 'error' ? 'text-red-400' : 'text-gray-400'
                    }>
                      {aiAgent.mcpStatus === 'connected' ? '연결됨' :
                       aiAgent.mcpStatus === 'error' ? '오류' : '연결 안됨'}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>총 질의 수:</span>
                    <span className="text-white">{aiAgent.totalQueries}회</span>
                  </div>
                  {aiAgent.lastActivated && (
                    <div className="flex justify-between text-gray-400">
                      <span>마지막 활성화:</span>
                      <span className="text-white">
                        {new Date(aiAgent.lastActivated).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 관리자 모드 필요 알림 */}
              {!isAdminMode && (
                <div className="mt-3 p-2 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-300 text-xs">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>AI 에이전트를 사용하려면 관리자 모드를 활성화해주세요</span>
                  </div>
                </div>
              )}

              {/* 시스템 비활성화 시 알림 */}
              {isAdminMode && systemState !== 'active' && (
                <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-300 text-xs">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>시스템 활성화 후 AI 에이전트를 사용할 수 있습니다</span>
                  </div>
                </div>
              )}
            </div>

            {/* 시스템 통계 섹션 */}
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center gap-2 mb-3">
                <i className="fas fa-chart-bar text-blue-400 text-sm"></i>
                <span className="text-white font-medium text-sm">시스템 상태</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-gray-400 mb-1">시스템</div>
                  <div className={`font-medium ${
                    systemState === 'active' ? 'text-green-400' : 
                    systemState === 'paused' ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    {systemState === 'active' ? '활성화' : 
                     systemState === 'paused' ? '일시정지' : '비활성화'}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2">
                  <div className="text-gray-400 mb-1">접속 시간</div>
                  <div className="text-white font-medium">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>

            {/* 메뉴 항목들 */}
            <div className="p-2">
              <button 
                onClick={() => {
                  alert('프로필 설정은 곧 제공될 예정입니다.');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors text-left"
              >
                <i className="fas fa-user text-gray-400"></i>
                <span className="text-white text-sm">프로필 설정</span>
                <i className="fas fa-chevron-right text-gray-600 text-xs ml-auto"></i>
              </button>
              
              <button 
                onClick={() => {
                  alert('환경 설정은 곧 제공될 예정입니다.');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors text-left"
              >
                <i className="fas fa-cog text-gray-400"></i>
                <span className="text-white text-sm">환경 설정</span>
                <i className="fas fa-chevron-right text-gray-600 text-xs ml-auto"></i>
              </button>
              
              <button 
                onClick={() => {
                  window.open('https://github.com/openmanager-ai/docs', '_blank');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors text-left"
              >
                <i className="fas fa-question-circle text-gray-400"></i>
                <span className="text-white text-sm">도움말 & 문서</span>
                <i className="fas fa-external-link-alt text-gray-600 text-xs ml-auto"></i>
              </button>
              
              <button 
                onClick={() => {
                  window.open('/dashboard', '_self');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-500/20 transition-colors text-left"
              >
                <i className="fas fa-tachometer-alt text-blue-400"></i>
                <span className="text-blue-400 text-sm">대시보드로 이동</span>
                <i className="fas fa-chevron-right text-blue-600 text-xs ml-auto"></i>
              </button>
              
              <hr className="border-gray-700/50 my-2" />
              
              <button 
                onClick={() => {
                  if (confirm('정말 로그아웃하시겠습니까?')) {
                    alert('로그아웃 기능은 곧 제공될 예정입니다.');
                    setIsOpen(false);
                  }
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/20 transition-colors text-left"
              >
                <i className="fas fa-sign-out-alt text-red-400"></i>
                <span className="text-red-400 text-sm">로그아웃</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 비밀번호 모달 */}
      <AdminPasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordSubmit}
        isLocked={isLocked}
        attempts={attempts}
      />
    </>
  );
} 