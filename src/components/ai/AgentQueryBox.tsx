'use client';

import { useState, useRef } from 'react';

interface AgentQueryBoxProps {
  onSendMessage: (query: string, serverId?: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export default function AgentQueryBox({ onSendMessage, isLoading, placeholder = "질문을 입력하세요..." }: AgentQueryBoxProps) {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    onSendMessage(query.trim());
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
    
    // 자동 높이 조절
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
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
          className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-h-[48px] max-h-[120px]"
          rows={1}
          disabled={isLoading}
        />
        
        {/* 입력 힌트 */}
        {!query && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            Enter로 전송, Shift+Enter로 줄바꿈
          </div>
        )}
      </div>
      
      <button
        type="submit"
        disabled={!query.trim() || isLoading}
        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
          query.trim() && !isLoading
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:scale-105'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        ) : (
          <i className="fas fa-paper-plane text-sm bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"></i>
        )}
      </button>
    </form>
  );
} 