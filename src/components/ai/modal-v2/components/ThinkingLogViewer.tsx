'use client';

import { useState, useRef, useEffect } from 'react';

interface ThinkingStep {
  timestamp: string;
  step: string;
  content: string;
  type: 'analysis' | 'reasoning' | 'data_processing' | 'pattern_matching' | 'response_generation';
  duration?: number;
}

interface ThinkingLogViewerProps {
  thinkingLogs: ThinkingStep[];
  question: string;
}

export default function ThinkingLogViewer({ thinkingLogs, question }: ThinkingLogViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getStepTypeColor = (type: ThinkingStep['type']) => {
    const colors = {
      analysis: 'text-green-400 bg-green-900/20',
      reasoning: 'text-purple-400 bg-purple-900/20',
      data_processing: 'text-blue-400 bg-blue-900/20',
      pattern_matching: 'text-orange-400 bg-orange-900/20',
      response_generation: 'text-indigo-400 bg-indigo-900/20'
    };
    return colors[type] || 'text-gray-400 bg-gray-900/20';
  };

  const getStepIcon = (type: ThinkingStep['type']) => {
    const icons = {
      analysis: 'fas fa-search',
      reasoning: 'fas fa-brain', 
      data_processing: 'fas fa-database',
      pattern_matching: 'fas fa-project-diagram',
      response_generation: 'fas fa-pen'
    };
    return icons[type] || 'fas fa-cog';
  };

  const copyToClipboard = (content: string) => {
    // 복사 방지를 위해 빈 문자열 복사
    navigator.clipboard.writeText('');
    console.log('복사가 제한되어 있습니다.');
  };

  // 자동 스크롤
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isExpanded) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isExpanded]);

  if (!thinkingLogs.length) return null;

  return (
    <div className="mt-4 border-2 border-indigo-200 rounded-xl overflow-hidden shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50">
      {/* 헤더 - 접힌 상태 */}
      <div 
        className="bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-4 cursor-pointer hover:from-indigo-200 hover:to-purple-200 transition-all select-none border-b border-indigo-200"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ userSelect: 'none' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                <i className="fas fa-chevron-right text-white text-xs"></i>
              </div>
              <div className="flex items-center gap-2">
                <i className="fas fa-brain text-purple-600 text-lg"></i>
                <span className="font-bold text-gray-800">🤖 AI 사고 과정 로그</span>
              </div>
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
              {thinkingLogs.length}단계 완료
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
              {new Date(thinkingLogs[thinkingLogs.length - 1]?.timestamp).toLocaleTimeString('ko-KR')}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">분석 완료</span>
            </div>
          </div>
        </div>
        
        {!isExpanded && (
          <div className="mt-3 p-3 bg-white/60 rounded-lg">
            <div className="text-sm text-gray-700 font-medium mb-2">
              💭 AI가 이렇게 생각했습니다:
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">질의분석</span>
              <i className="fas fa-arrow-right text-gray-400 text-xs"></i>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">데이터처리</span>
              <i className="fas fa-arrow-right text-gray-400 text-xs"></i>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">패턴매칭</span>
              <i className="fas fa-arrow-right text-gray-400 text-xs"></i>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">추론</span>
              <i className="fas fa-arrow-right text-gray-400 text-xs"></i>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs">응답생성</span>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
              <i className="fas fa-info-circle"></i>
              <span>클릭하면 상세한 분석 과정을 확인할 수 있습니다</span>
            </div>
          </div>
        )}
      </div>

      {/* 펼쳐진 상태 - 로그 뷰어 */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* 툴바 */}
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-sm font-mono text-gray-300">AI Thinking Process Log</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={scrollToBottom}
                className="text-gray-400 hover:text-white p-1 rounded text-xs"
                title="맨 아래로"
              >
                <i className="fas fa-arrow-down"></i>
              </button>
              <button
                onClick={() => copyToClipboard('')}
                className="text-gray-400 hover:text-white p-1 rounded text-xs"
                title="복사 (제한됨)"
              >
                <i className="fas fa-copy"></i>
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white p-1 rounded text-xs"
                title="접기"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

                    {/* 로그 컨텐츠 */}
          <div 
            ref={scrollRef}
            className="bg-gray-900 text-gray-100 p-4 h-80 overflow-y-auto font-mono text-sm select-none"
            style={{ 
              userSelect: 'none',
              WebkitUserSelect: 'none',
              scrollbarWidth: 'thin',
              scrollbarColor: '#4b5563 #1f2937'
            }}
            onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
           >
             {/* 세션 헤더 */}
             <div className="border-b border-gray-700 pb-3 mb-4">
               <div className="text-blue-400 font-semibold">
                 [AI THINKING SESSION START]
               </div>
               <div className="text-gray-500 text-xs mt-1">
                 Query: &quot;{question}&quot;
               </div>
              <div className="text-gray-500 text-xs">
                Session ID: {Date.now()}_{Math.random().toString(36).substr(2, 9)}
              </div>
            </div>

            {/* 처리 단계들 */}
            <div className="space-y-4">
              {thinkingLogs.map((step, index) => (
                <div key={index} className="border-l-2 border-gray-600 pl-4">
                  {/* 단계 헤더 */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${getStepTypeColor(step.type)}`}>
                      <i className={`${getStepIcon(step.type)} mr-1`}></i>
                      {step.type.toUpperCase()}
                    </div>
                    <span className="text-blue-400 font-semibold">
                      [{step.step}]
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(step.timestamp).toLocaleTimeString('ko-KR')}
                    </span>
                  </div>

                  {/* 단계 내용 */}
                  <div className="bg-gray-800 rounded p-3 ml-2">
                    <pre className="text-gray-300 whitespace-pre-wrap text-xs leading-relaxed">
                      {step.content}
                    </pre>
                  </div>

                  {/* 단계 완료 표시 */}
                  <div className="flex items-center gap-2 mt-2 ml-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-check text-white text-xs"></i>
                    </div>
                    <span className="text-green-400 text-xs">단계 완료</span>
                    {step.duration && (
                      <span className="text-gray-500 text-xs">
                        ({step.duration}ms)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 세션 종료 */}
            <div className="border-t border-gray-700 pt-3 mt-4">
              <div className="text-green-400 font-semibold">
                [AI THINKING SESSION COMPLETED]
              </div>
              <div className="text-gray-500 text-xs mt-1">
                Total Steps: {thinkingLogs.length} | 
                Total Duration: {thinkingLogs.reduce((sum, step) => sum + (step.duration || 0), 0)}ms
              </div>
            </div>
          </div>

          {/* 하단 상태바 */}
          <div className="bg-gray-100 px-4 py-2 text-xs text-gray-600 flex items-center justify-between">
            <span>⚠️ 이 로그는 복사 및 드래그가 제한됩니다</span>
            <span>Scroll: {scrollRef.current?.scrollTop || 0}px</span>
          </div>
        </div>
      )}
    </div>
  );
} 