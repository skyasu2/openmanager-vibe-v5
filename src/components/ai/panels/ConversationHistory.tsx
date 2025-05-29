'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Search, Trash2, MessageSquare, User, Bot } from 'lucide-react';

interface HistoryItem {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  confidence?: number;
}

export default function ConversationHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);

  // 샘플 대화 기록 로드
  useEffect(() => {
    const sampleHistory: HistoryItem[] = [
      {
        id: '1',
        question: 'CPU 사용률이 높은 서버들을 분석해줘',
        answer: '현재 web-prod-02와 api-prod-01 서버의 CPU 사용률이 80%를 초과하고 있습니다...',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        confidence: 0.92
      },
      {
        id: '2', 
        question: '메모리 최적화 방안을 추천해줘',
        answer: 'Redis 캐시 설정 조정과 Java heap 크기 최적화를 통해 메모리 사용량을 개선할 수 있습니다...',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        confidence: 0.87
      },
      {
        id: '3',
        question: '시스템 전체 상태를 요약해줘',
        answer: '전체 12대 서버 중 10대가 정상, 2대가 경고 상태입니다. 평균 CPU 55%, 메모리 68% 사용 중...',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        confidence: 0.95
      }
    ];
    
    setHistory(sampleHistory);
  }, []);

  // 검색 기능
  useEffect(() => {
    if (!searchTerm) {
      setFilteredHistory(history);
    } else {
      const filtered = history.filter(item =>
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHistory(filtered);
    }
  }, [history, searchTerm]);

  const handleClearHistory = () => {
    if (confirm('모든 대화 기록을 삭제하시겠습니까?')) {
      setHistory([]);
      setFilteredHistory([]);
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}일 전`;
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-800">대화 기록</h3>
          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
            {history.length}개
          </span>
        </div>
        
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 
                     hover:bg-red-50 px-2 py-1 rounded transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            전체 삭제
          </button>
        )}
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="대화 내용 검색..."
          className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* 대화 기록 목록 */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">
              {searchTerm ? '검색 결과가 없습니다' : '저장된 대화가 없습니다'}
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow"
            >
              {/* 질문 */}
              <div className="flex items-start gap-2 mb-2">
                <User className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">
                    {item.question}
                  </p>
                </div>
              </div>

              {/* 답변 */}
              <div className="flex items-start gap-2 mb-3">
                <Bot className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 line-clamp-3">
                    {item.answer}
                  </p>
                </div>
              </div>

              {/* 메타데이터 */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(item.timestamp)}
                </div>
                
                {item.confidence && (
                  <div className="flex items-center gap-1">
                    <span>신뢰도</span>
                    <span className={`font-medium ${
                      item.confidence > 0.9 ? 'text-green-600' :
                      item.confidence > 0.7 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* 정보 */}
      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
        💡 <strong>팁:</strong> 대화 기록은 브라우저에 로컬 저장되며, 24시간 후 자동 삭제됩니다.
      </div>
    </div>
  );
} 