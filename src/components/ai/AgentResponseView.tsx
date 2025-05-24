'use client';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  serverId?: string;
}

interface AgentResponseViewProps {
  message: Message;
  isLoading: boolean;
}

export default function AgentResponseView({ message, isLoading }: AgentResponseViewProps) {
  const formatContent = (content: string) => {
    // 마크다운 스타일 간단 변환
    const formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>')              // *italic*
      .replace(/^###\s(.*?)$/gm, '<h3 class="text-lg font-semibold text-gray-900 mt-3 mb-2">$1</h3>')  // ### 헤딩
      .replace(/^##\s(.*?)$/gm, '<h2 class="text-xl font-semibold text-gray-900 mt-4 mb-2">$1</h2>')   // ## 헤딩
      .replace(/^#\s(.*?)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-4 mb-3">$1</h1>')       // # 헤딩
      .replace(/^\-\s(.*?)$/gm, '<li class="ml-4">• $1</li>')  // - 리스트
      .replace(/^\d+\.\s(.*?)$/gm, '<li class="ml-4">$1</li>') // 1. 리스트
      .replace(/\n\n/g, '<br><br>')  // 줄바꿈
      .replace(/\n/g, '<br>');       // 단일 줄바꿈

    return formatted;
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (message.type === 'user') {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="max-w-[80%]">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-3">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {formatTimestamp(message.timestamp)}
            {message.serverId && (
              <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                {message.serverId}
              </span>
            )}
          </div>
        </div>
        <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white text-sm">
          <i className="fas fa-user"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm">
        <i className="fas fa-brain"></i>
      </div>
      <div className="flex-1 max-w-[85%]">
        <div className="bg-gray-50 rounded-lg p-4">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-500">분석 중...</span>
            </div>
          ) : (
            <div 
              className="text-sm text-gray-800 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            />
          )}
        </div>
        
        {!isLoading && (
          <div className="flex items-center justify-between mt-1">
            <div className="text-xs text-gray-500">
              {formatTimestamp(message.timestamp)}
            </div>
            
            {/* 응답 액션 버튼들 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(message.content)}
                className="text-xs text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                title="복사"
              >
                <i className="fas fa-copy"></i>
              </button>
              <button
                className="text-xs text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                title="도움이 되었나요?"
              >
                <i className="fas fa-thumbs-up"></i>
              </button>
              <button
                className="text-xs text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                title="도움이 되지 않았나요?"
              >
                <i className="fas fa-thumbs-down"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 