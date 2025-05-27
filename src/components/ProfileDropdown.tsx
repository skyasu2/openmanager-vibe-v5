'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useSystemStore } from '../stores/systemStore';

interface ProfileDropdownProps {
  userName?: string;
  userAvatar?: string;
}

export default function ProfileDropdown({ 
  userName = "사용자", 
  userAvatar 
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    aiAgent, 
    toggleAIAgent,
    state: systemState 
  } = useSystemStore();

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
    if (systemState !== 'active') {
      alert('시스템이 활성화되어 있을 때만 AI 에이전트를 사용할 수 있습니다.');
      return;
    }
    
    await toggleAIAgent();
  };

  const getAIStatusText = () => {
    switch (aiAgent.state) {
      case 'enabled': return '활성화됨';
      case 'disabled': return '비활성화됨';
      case 'processing': return '처리 중...';
      case 'idle': return '대기 중';
      default: return '비활성화됨';
    }
  };

  const getAIStatusColor = () => {
    switch (aiAgent.state) {
      case 'enabled': return 'text-green-400';
      case 'disabled': return 'text-gray-400';
      case 'processing': return 'text-blue-400';
      case 'idle': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
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
          <div className={`text-xs ${getAIStatusColor()}`}>
            AI: {getAIStatusText()}
          </div>
        </div>
        
        {/* 드롭다운 아이콘 */}
        <i className={`fas fa-chevron-down text-white/70 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 rounded-xl shadow-2xl z-50">
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
                <div className="text-gray-400 text-sm">OpenManager AI 사용자</div>
              </div>
            </div>
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
                disabled={aiAgent.state === 'processing' || systemState !== 'active'}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                  aiAgent.isEnabled 
                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : 'bg-gray-600'
                } ${
                  aiAgent.state === 'processing' || systemState !== 'active' 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'cursor-pointer'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    aiAgent.isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* AI 에이전트 상태 정보 */}
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

            {/* 시스템 비활성화 시 알림 */}
            {systemState !== 'active' && (
              <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-300 text-xs">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>시스템 활성화 후 AI 에이전트를 사용할 수 있습니다</span>
                </div>
              </div>
            )}
          </div>

          {/* 메뉴 항목들 */}
          <div className="p-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors text-left">
              <i className="fas fa-user text-gray-400"></i>
              <span className="text-white text-sm">프로필 설정</span>
            </button>
            
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors text-left">
              <i className="fas fa-cog text-gray-400"></i>
              <span className="text-white text-sm">환경 설정</span>
            </button>
            
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors text-left">
              <i className="fas fa-question-circle text-gray-400"></i>
              <span className="text-white text-sm">도움말</span>
            </button>
            
            <hr className="border-gray-700/50 my-2" />
            
            <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/20 transition-colors text-left">
              <i className="fas fa-sign-out-alt text-red-400"></i>
              <span className="text-red-400 text-sm">로그아웃</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 