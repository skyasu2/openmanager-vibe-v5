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
  const [isExpanded, setIsExpanded] = useState(false); // 기본적으로 접힌 상태로 시작
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

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  useEffect(() => {
    if (isExpanded) {
      // 처음 펼쳐질 때는 맨 위에서 시작
      setTimeout(scrollToTop, 100);
    }
  }, [isExpanded]);

  if (!thinkingLogs.length) return null;

  return (
    <div className="my-3 border border-indigo-200 rounded-lg overflow-hidden shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50">
      {/* 컴팩트 한 줄 헤더 */}
      <div 
        className="bg-gradient-to-r from-indigo-100 to-purple-100 px-3 py-2 cursor-pointer hover:from-indigo-200 hover:to-purple-200 transition-all select-none"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ userSelect: 'none' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
              <i className="fas fa-chevron-right text-white text-xs"></i>
            </div>
            <i className="fas fa-brain text-purple-600 text-sm"></i>
            <span className="font-medium text-gray-800 text-sm">🤖 AI 사고 과정</span>
            <div className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              {thinkingLogs.length}단계
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">완료</span>
            </div>
            <div className="text-xs text-gray-500">
              {new Date(thinkingLogs[thinkingLogs.length - 1]?.timestamp).toLocaleTimeString('ko-KR')}
            </div>
          </div>
        </div>
      </div>

      {/* 펼쳐진 상태 - 로그 뷰어 */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* 컴팩트 툴바 */}
          <div className="bg-gray-800 px-3 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-xs font-mono text-gray-300">AI Thinking Process</span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={scrollToTop}
                className="text-gray-400 hover:text-white p-1 rounded text-xs"
                title="맨 위로"
              >
                <i className="fas fa-arrow-up"></i>
              </button>
              <button
                onClick={scrollToBottom}
                className="text-gray-400 hover:text-white p-1 rounded text-xs"
                title="맨 아래로"
              >
                <i className="fas fa-arrow-down"></i>
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
            className="bg-gray-900 text-gray-100 p-3 h-64 overflow-y-auto font-mono text-xs select-none"
            style={{ 
              userSelect: 'none',
              WebkitUserSelect: 'none',
              scrollbarWidth: 'thin',
              scrollbarColor: '#4b5563 #1f2937'
            }}
            onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
           >
             {/* 세션 헤더 */}
             <div className="border-b border-gray-700 pb-2 mb-3">
               <div className="text-blue-400 font-semibold text-xs">
                 [AI THINKING SESSION]
               </div>
               <div className="text-gray-500 text-xs">
                 Query: &quot;{question}&quot;
               </div>
            </div>

            {/* 처리 단계들 */}
            <div className="space-y-3">
              {thinkingLogs.map((step, index) => (
                <div key={index} className="border-l border-gray-600 pl-3">
                  {/* 단계 헤더 */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStepTypeColor(step.type)}`}>
                      <i className={`${getStepIcon(step.type)} mr-1`}></i>
                      {step.type.toUpperCase()}
                    </div>
                    <span className="text-blue-400 font-medium text-xs">
                      [{step.step}]
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(step.timestamp).toLocaleTimeString('ko-KR')}
                    </span>
                  </div>

                  {/* 단계 내용 */}
                  <div className="bg-gray-800 rounded p-2 ml-1">
                    <pre className="text-gray-300 whitespace-pre-wrap text-xs leading-tight">
                      {step.content}
                    </pre>
                  </div>

                  {/* 단계 완료 표시 */}
                  <div className="flex items-center gap-1 mt-1 ml-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-check text-white" style={{ fontSize: '6px' }}></i>
                    </div>
                    <span className="text-green-400 text-xs">완료</span>
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
            <div className="border-t border-gray-700 pt-2 mt-3">
              <div className="text-green-400 font-semibold text-xs">
                [SESSION COMPLETED]
              </div>
              <div className="text-gray-500 text-xs">
                Steps: {thinkingLogs.length} | Duration: {thinkingLogs.reduce((sum, step) => sum + (step.duration || 0), 0)}ms
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 