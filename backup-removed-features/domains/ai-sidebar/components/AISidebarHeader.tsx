/**
 * 🎨 AI Sidebar Header - 반응형 접근성 적용
 *
 * ✅ 모바일/노트북/데스크톱 대응
 * ✅ 시맨틱 HTML 적용
 * ✅ 키보드 네비게이션 지원
 */

'use client';

import React from 'react';
import { X, Brain } from 'lucide-react';
import BasicTyping from '@/components/ui/BasicTyping';

interface AISidebarHeaderProps {
  onClose: () => void;
}

export const AISidebarHeader: React.FC<AISidebarHeaderProps> = ({
  onClose,
}) => {
  return (
    <header className='flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50'>
      <div className='flex items-center space-x-2 sm:space-x-3 min-w-0'>
        {/* AI 아이콘 - 반응형 크기 */}
        <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center'>
          <Brain
            className='w-4 h-4 sm:w-5 sm:h-5 text-white'
            aria-hidden='true'
          />
        </div>

        {/* 제목 및 설명 - 시맨틱 구조 */}
        <div className='min-w-0 flex-1'>
          <h1 className='text-base sm:text-lg font-bold text-gray-800 truncate'>
            <BasicTyping text='AI 어시스턴트' speed='fast' showCursor={false} />
          </h1>
          <p className='text-xs sm:text-sm text-gray-600 truncate'>
            AI와 자연어로 시스템 질의
          </p>
        </div>
      </div>

      {/* 닫기 버튼 - 접근성 강화 */}
      <button
        onClick={onClose}
        className='p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
        title='AI 어시스턴트 닫기'
        aria-label='AI 어시스턴트 사이드바 닫기'
        type='button'
      >
        <X className='w-5 h-5 text-gray-500' aria-hidden='true' />
      </button>
    </header>
  );
};
