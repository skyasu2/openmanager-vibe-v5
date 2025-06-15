'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'interaction' | 'system' | 'error';
  title: string;
  content: string;
  metadata?: any;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'interaction' | 'system' | 'error'>('all');

  useEffect(() => {
    // 모의 로그 데이터 생성
    const mockLogs: LogEntry[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        type: 'interaction',
        title: 'AI 상호작용',
        content: '사용자가 "현재 서버 상태 요약해줘"라고 질문했습니다.',
        metadata: { responseTime: 234, confidence: 0.95 }
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        type: 'system',
        title: '시스템 시작',
        content: '시뮬레이션 엔진이 성공적으로 시작되었습니다.',
        metadata: { mode: 'fast' }
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        type: 'interaction',
        title: 'AI 상호작용',
        content: '사용자가 "CPU 사용률이 높은 서버 알려줘"라고 질문했습니다.',
        metadata: { responseTime: 456, confidence: 0.88 }
      }
    ];
    
    setLogs(mockLogs);
  }, []);

  const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.type === filter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'interaction': return '💬';
      case 'system': return '⚙️';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'interaction': return 'bg-blue-100 text-blue-800';
      case 'system': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <i className="fas fa-arrow-left"></i>
                <span>홈으로</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900">📋 시스템 로그</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                대시보드
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 로그 필터</h2>
          <div className="flex gap-2">
            {[
              { key: 'all', label: '전체', icon: '📝' },
              { key: 'interaction', label: 'AI 상호작용', icon: '💬' },
              { key: 'system', label: '시스템', icon: '⚙️' },
              { key: 'error', label: '오류', icon: '❌' }
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                  ${filter === item.key 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 로그 목록 */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">로그가 없습니다</h3>
              <p className="text-gray-600">선택한 필터에 해당하는 로그가 없습니다.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div 
                key={log.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-2xl">{getTypeIcon(log.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{log.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(log.type)}`}>
                          {log.type}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{log.content}</p>
                      {log.metadata && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">메타데이터:</h4>
                          <pre className="text-xs text-gray-600 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 ml-4">
                    {new Date(log.timestamp).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 푸터 정보 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">📊 로그 통계</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
              <div className="text-sm text-gray-600">총 로그</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {logs.filter(l => l.type === 'interaction').length}
              </div>
              <div className="text-sm text-gray-600">AI 상호작용</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {logs.filter(l => l.type === 'system').length}
              </div>
              <div className="text-sm text-gray-600">시스템 로그</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {logs.filter(l => l.type === 'error').length}
              </div>
              <div className="text-sm text-gray-600">오류</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 