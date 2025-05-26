'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Settings, 
  Shield, 
  LogOut, 
  ChevronDown,
  Bell,
  HelpCircle,
  Moon,
  Sun
} from 'lucide-react';

interface ProfileDropdownProps {
  className?: string;
}

export default function ProfileDropdown({ className = '' }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdminMode = () => {
    console.log('🔐 관리자 모드 버튼 클릭됨');
    setIsOpen(false);
    
    try {
      // 관리자 세션 정보 설정 (간소화된 접근)
      const timestamp = Date.now();
      localStorage.setItem('admin_session_id', `admin_${timestamp}`);
      localStorage.setItem('admin_auth_token', `admin_${timestamp}`);
      sessionStorage.setItem('admin_authorized', 'true');
      
      console.log('✅ 관리자 세션 정보 설정 완료');
      
      // 관리자 페이지로 바로 이동
      console.log('🚀 관리자 페이지로 이동 시도:', '/admin/ai-agent');
      router.push('/admin/ai-agent');
      
      // 대안으로 window.location 사용
      setTimeout(() => {
        if (window.location.pathname !== '/admin/ai-agent') {
          console.log('⚠️ router.push 실패, window.location으로 재시도');
          window.location.href = '/admin/ai-agent';
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ 관리자 모드 전환 중 에러:', error);
      // 에러 발생 시 직접 이동
      window.location.href = '/admin/ai-agent';
    }
  };

  const handleLogout = () => {
    setIsOpen(false);
    
    // 모든 인증 정보 삭제
    localStorage.clear();
    sessionStorage.clear();
    
    // 홈으로 이동
    router.push('/');
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // 다크모드 구현 로직 추가
    document.documentElement.classList.toggle('dark');
  };



  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 프로필 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* 사용자 정보 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-gray-900">데모 사용자</p>
                <p className="text-sm text-gray-500">demo@openmanager.com</p>
              </div>
            </div>
          </div>

          {/* 메뉴 항목들 */}
          <div className="py-2">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>설정</span>
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>알림</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{isDarkMode ? '라이트 모드' : '다크 모드'}</span>
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>도움말</span>
            </button>

            {/* 구분선 */}
            <div className="border-t border-gray-100 my-2"></div>

            {/* 관리자 모드 */}
            <button
              onClick={handleAdminMode}
              className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>관리자 모드 (JS)</span>
            </button>
            
            {/* 관리자 모드 대안 (Link) */}
            <Link 
              href="/admin/ai-agent"
              onClick={() => {
                setIsOpen(false);
                const timestamp = Date.now();
                localStorage.setItem('admin_session_id', `admin_${timestamp}`);
                localStorage.setItem('admin_auth_token', `admin_${timestamp}`);
                sessionStorage.setItem('admin_authorized', 'true');
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>관리자 모드 (Link)</span>
            </Link>

            {/* 로그아웃 */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 