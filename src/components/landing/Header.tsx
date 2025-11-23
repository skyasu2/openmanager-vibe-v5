'use client';

import { useState, useEffect } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import { Moon, Sun, Menu, X } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onThemeToggle: () => void;
}

export default function Header({ isDark, onThemeToggle }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: '홈', href: '#home' },
    { name: '기능', href: '#features' },
  ];

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'border-b border-white/10 bg-white/10 shadow-xl backdrop-blur-lg'
          : 'bg-transparent'
      } `}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* 로고 & 브랜딩 */}
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
              <span className="text-lg font-bold text-white">OM</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white">OpenManager</h1>
              <p className="text-xs text-gray-300">V5.0</p>
            </div>
          </div>

          {/* 네비게이션 (데스크탑) */}
          <nav className="hidden items-center space-x-8 md:flex">
            {navItems.map((item, _index) => (
              <a
                key={item.name}
                href={item.href}
                className="font-medium text-gray-300 transition-colors duration-200 hover:text-white"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* 우측 액션 영역 */}
          <div className="flex items-center space-x-4">
            {/* 다크모드 토글 */}
            <button
              onClick={onThemeToggle}
              className="rounded-lg bg-white/10 p-2 backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-blue-400" />
              )}
            </button>

            {/* 모바일 메뉴 버튼 */}
            <button
              className="rounded-lg bg-white/10 p-2 backdrop-blur-sm transition-colors hover:bg-white/20 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-white" />
              ) : (
                <Menu className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      <div
        className={`overflow-hidden border-t border-white/10 bg-black/20 backdrop-blur-lg transition-all duration-300 md:hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="space-y-4 px-4 py-6">
          {navItems.map((item, _index) => (
            <a
              key={item.name}
              href={item.href}
              className="block font-medium text-gray-300 transition-colors hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.name}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
