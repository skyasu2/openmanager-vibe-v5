/**
 * 🎨 AI Sidebar Header - 반응형 접근성 적용
 *
 * ✅ 모바일/노트북/데스크톱 대응
 * ✅ 시맨틱 HTML 적용
 * ✅ 키보드 네비게이션 지원
 */

'use client';

// React import 제거 - Next.js 15 자동 JSX Transform 사용
import { Brain, X } from 'lucide-react';
import type { FC } from 'react';
import BasicTyping from '@/components/ui/BasicTyping';

interface AISidebarHeaderProps {
  onClose: () => void;
}

export const AISidebarHeader: FC<AISidebarHeaderProps> = ({
  onClose,
}: AISidebarHeaderProps) => {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-linear-to-r from-purple-50 to-blue-50 p-3 sm:p-4">
      <div className="flex min-w-0 items-center space-x-2 sm:space-x-3">
        {/* AI 아이콘 - 반응형 크기 */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-r from-purple-500 to-blue-600 sm:h-10 sm:w-10">
          <Brain
            className="h-4 w-4 text-white sm:h-5 sm:w-5"
            aria-hidden="true"
          />
        </div>

        {/* 제목 및 설명 - 시맨틱 구조 */}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-gray-800 sm:text-lg">
            <BasicTyping text="AI 어시스턴트" speed="fast" showCursor={false} />
          </h1>
          <p className="truncate text-xs text-gray-600 sm:text-sm">
            AI와 자연어로 시스템 질의
          </p>
        </div>
      </div>

      {/* 닫기 버튼 - 접근성 강화 */}
      <button
        onClick={onClose}
        className="shrink-0 rounded-lg p-2 transition-colors hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        title="AI 어시스턴트 닫기"
        aria-label="AI 어시스턴트 사이드바 닫기"
        type="button"
      >
        <X className="h-5 w-5 text-gray-500" aria-hidden="true" />
      </button>
    </header>
  );
};
