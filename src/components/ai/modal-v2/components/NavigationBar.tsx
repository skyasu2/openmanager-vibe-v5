'use client';

import { useState } from 'react';

interface NavigationItem {
  id: string;
  type: 'question' | 'function' | 'history';
  title: string;
  data: any;
  timestamp: number;
}

interface NavigationBarProps {
  canGoBack: boolean;
  canGoForward: boolean;
  currentIndex: number;
  history: NavigationItem[];
  onGoBack: () => void;
  onGoForward: () => void;
  onGoToIndex: (index: number) => void;
}

export default function NavigationBar({
  canGoBack,
  canGoForward,
  currentIndex,
  history,
  onGoBack,
  onGoForward,
  onGoToIndex
}: NavigationBarProps) {
  const [showHistory, setShowHistory] = useState(false);

  const getItemIcon = (type: NavigationItem['type']) => {
    switch (type) {
      case 'question': return 'fas fa-question-circle';
      case 'function': return 'fas fa-cog';
      case 'history': return 'fas fa-history';
      default: return 'fas fa-circle';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getCurrentPageTitle = () => {
    if (currentIndex >= 0 && currentIndex < history.length) {
      return history[currentIndex].title;
    }
    return 'AI 에이전트';
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* 왼쪽 - 네비게이션 컨트롤 */}
        <div className="flex items-center gap-2">
          {/* 뒤로가기 버튼 */}
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            className={`p-2 rounded-lg transition-colors ${
              canGoBack 
                ? 'text-gray-700 hover:bg-gray-100 hover:text-purple-600' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="뒤로가기 (Alt + ←)"
          >
            <i className="fas fa-chevron-left text-sm"></i>
          </button>

          {/* 앞으로가기 버튼 */}
          <button
            onClick={onGoForward}
            disabled={!canGoForward}
            className={`p-2 rounded-lg transition-colors ${
              canGoForward 
                ? 'text-gray-700 hover:bg-gray-100 hover:text-purple-600' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="앞으로가기 (Alt + →)"
          >
            <i className="fas fa-chevron-right text-sm"></i>
          </button>

          {/* 구분선 */}
          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          {/* 히스토리 드롭다운 버튼 */}
          <div className="relative">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="네비게이션 히스토리"
            >
              <i className="fas fa-history"></i>
              <span className="hidden md:inline">히스토리</span>
              <i className={`fas fa-chevron-down text-xs transition-transform ${showHistory ? 'rotate-180' : ''}`}></i>
            </button>

            {/* 히스토리 드롭다운 */}
            {showHistory && (
              <div className="absolute left-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">네비게이션 히스토리</div>
                  <div className="text-xs text-gray-500 mt-1">{history.length}개 항목</div>
                </div>
                
                <div className="py-2">
                  {history.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500 text-center">
                      히스토리가 없습니다
                    </div>
                  ) : (
                    history.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onGoToIndex(index);
                          setShowHistory(false);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                          index === currentIndex ? 'bg-purple-50 border-r-2 border-purple-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <i className={`${getItemIcon(item.type)} text-xs ${
                            index === currentIndex ? 'text-purple-600' : 'text-gray-400'
                          }`}></i>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm truncate ${
                              index === currentIndex ? 'text-purple-900 font-medium' : 'text-gray-900'
                            }`}>
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTime(item.timestamp)}
                            </div>
                          </div>
                          {index === currentIndex && (
                            <div className="text-xs text-purple-600 font-medium">현재</div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 가운데 - 현재 페이지 제목 */}
        <div className="flex-1 mx-4 text-center">
          <div className="text-sm font-medium text-gray-900 truncate">
            {getCurrentPageTitle()}
          </div>
          {history.length > 0 && (
            <div className="text-xs text-gray-500">
              {currentIndex + 1} / {history.length}
            </div>
          )}
        </div>

        {/* 오른쪽 - 키보드 단축키 힌트 */}
        <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Alt</kbd>
            <span>+</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">←</kbd>
            <span>뒤로</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Alt</kbd>
            <span>+</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">→</kbd>
            <span>앞으로</span>
          </div>
        </div>
      </div>

      {/* 히스토리 드롭다운을 닫기 위한 오버레이 */}
      {showHistory && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowHistory(false)}
        />
      )}
    </div>
  );
} 