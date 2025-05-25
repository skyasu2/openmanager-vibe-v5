'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

  const handleAdminMode = async () => {
    setIsOpen(false);
    
    // 관리자 인증 모달 표시
    const credentials = await showAdminAuthModal();
    if (credentials) {
      try {
        const response = await fetch('/api/auth/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
            totpCode: credentials.totpCode,
            ipAddress: await getClientIP(),
            userAgent: navigator.userAgent
          })
        });

        const result = await response.json();
        
        if (result.success) {
          // 관리자 세션 저장
          localStorage.setItem('admin_session_id', result.sessionId);
          localStorage.setItem('admin_auth_token', result.sessionId);
          sessionStorage.setItem('admin_authorized', 'true');
          
          // 관리자 페이지로 이동
          router.push('/admin/ai-agent');
        } else {
          alert(`인증 실패: ${result.error}`);
        }
      } catch (error) {
        alert('관리자 인증 중 오류가 발생했습니다.');
      }
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

  const showAdminAuthModal = (): Promise<{ username: string; password: string; totpCode: string } | null> => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-96 max-w-90vw">
          <div class="flex items-center space-x-2 mb-4">
            <div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">관리자 인증</h3>
          </div>
          
          <form id="adminAuthForm" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">사용자명</label>
              <input 
                type="text" 
                id="username" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input 
                type="password" 
                id="password" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="비밀번호 입력"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">2FA 코드</label>
              <input 
                type="text" 
                id="totpCode" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123456 (데모용)"
                maxlength="6"
                required
              />
            </div>
            
            <div class="bg-blue-50 p-3 rounded-lg">
              <p class="text-sm text-blue-700">
                <strong>데모 계정:</strong><br/>
                사용자명: admin<br/>
                비밀번호: admin123!@#<br/>
                2FA 코드: 123456
              </p>
            </div>
            
            <div class="flex space-x-3 pt-4">
              <button 
                type="submit" 
                class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                인증
              </button>
              <button 
                type="button" 
                id="cancelAuth"
                class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(modal);

      const form = modal.querySelector('#adminAuthForm') as HTMLFormElement;
      const cancelBtn = modal.querySelector('#cancelAuth') as HTMLButtonElement;

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = (modal.querySelector('#username') as HTMLInputElement).value;
        const password = (modal.querySelector('#password') as HTMLInputElement).value;
        const totpCode = (modal.querySelector('#totpCode') as HTMLInputElement).value;
        
        document.body.removeChild(modal);
        resolve({ username, password, totpCode });
      });

      cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(null);
      });

      // ESC 키로 닫기
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          document.body.removeChild(modal);
          document.removeEventListener('keydown', handleEsc);
          resolve(null);
        }
      };
      document.addEventListener('keydown', handleEsc);
    });
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
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
              <span>관리자 모드</span>
            </button>

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