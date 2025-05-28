'use client';

import { useState, useRef } from 'react';

interface QuestionInputProps {
  isLoading: boolean;
  onSendQuestion: (question: string) => void;
  placeholder?: string;
}

export default function QuestionInput({
  isLoading,
  onSendQuestion,
  placeholder = "질문을 입력하세요..."
}: QuestionInputProps) {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    onSendQuestion(query.trim());
    setQuery('');
    
    // 텍스트 영역 높이 리셋
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    
    // 자동 높이 조절 (최대 3줄)
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 108) + 'px';
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-h-[52px] max-h-[120px] text-gray-800 placeholder-gray-500 shadow-sm hover:shadow-md focus:shadow-lg"
          rows={1}
          disabled={isLoading}
        />
        
        {/* 입력 힌트 - 개선된 위치와 스타일 */}
        {!query && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded shadow-sm">
            💡 Enter: 전송 | Shift+Enter: 줄바꿈
          </div>
        )}
      </div>
      
      <button
        type="submit"
        disabled={!query.trim() || isLoading}
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${
          query.trim() && !isLoading
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:scale-105 shadow-md hover:from-purple-700 hover:to-blue-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
        title={query.trim() ? "메시지 전송" : "질문을 입력하세요"}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        ) : (
          <i className="fas fa-paper-plane text-sm"></i>
        )}
      </button>
    </form>
  );
} 