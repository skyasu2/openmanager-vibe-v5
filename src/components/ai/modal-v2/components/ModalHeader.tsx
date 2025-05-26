'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ModalHeaderProps {
  onClose: () => void;
}

export default function ModalHeader({ onClose }: ModalHeaderProps) {
  const router = useRouter();
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  const handleAdminAccess = (path: string) => {
    console.log('🔧 관리자 페이지 접근:', path);
    
    try {
      // 관리자 세션 정보 설정
      const timestamp = Date.now();
      localStorage.setItem('admin_session_id', `ai_admin_${timestamp}`);
      localStorage.setItem('admin_auth_token', `ai_admin_${timestamp}`);
      sessionStorage.setItem('admin_authorized', 'true');
      sessionStorage.setItem('admin_access_source', 'ai_agent_modal');
      
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

  return (
    <div className="bg-gradient-to-r from-indigo-700 to-purple-700 h-16 flex items-center justify-between px-6 text-white shadow-md">
      {/* 로고 및 제목 */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
          <i className="fas fa-robot text-white text-xl"></i>
        </div>
        <h2 className="text-xl font-bold">AI 에이전트</h2>
      </div>

      {/* 헤더 아이콘 */}
      <div className="flex items-center gap-3">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={toggleAdminDropdown}
            className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors hover:scale-110 transform"
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
                    <div className="font-medium text-sm">AI 에이전트 통합 관리</div>
                    <div className="text-xs text-gray-500">모니터링, 분석, 로그 관리</div>
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
          onClick={onClose}
          className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-red-500/80 transition-colors"
          title="닫기"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
} 