'use client';

import React, { useState, useEffect } from 'react';
import type { LogEntry } from '@/types/ai-assistant-input-schema';

interface ServerDetailLogsProps {
  serverId?: string | null;
}

const getLogLevelClass = (level: string) => {
  switch (level.toUpperCase()) {
    case 'ERROR':
      return 'bg-red-100 text-red-800';
    case 'WARN':
      return 'bg-yellow-100 text-yellow-800';
    case 'INFO':
      return 'bg-blue-100 text-blue-800';
    case 'DEBUG':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function ServerDetailLogs({ serverId }: ServerDetailLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serverId) return;

    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/servers/${serverId}/logs`);
        if (!response.ok) {
          throw new Error('로그 데이터를 가져오는 데 실패했습니다.');
        }
        const data = await response.json();
        setLogs(data.logs || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
    // 로그는 일반적으로 계속 쌓이므로, 실시간 업데이트가 필요하다면
    // 여기에 30초 간격의 인터벌을 추가할 수 있습니다.
  }, [serverId]);

  if (isLoading) {
    return <div className='text-center p-8'>로그를 불러오는 중...</div>;
  }

  if (error) {
    return <div className='text-center p-8 text-red-500'>오류: {error}</div>;
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>시스템 로그</h3>
        <button className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm'>
          <i className='fas fa-download mr-2'></i>
          로그 다운로드
        </button>
      </div>

      <div className='bg-gray-900 rounded-xl p-4 text-green-400 font-mono text-sm max-h-96 overflow-y-auto'>
        <div className='space-y-1'>
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className='flex'>
                <span
                  className={`inline-flex px-2 py-1 font-semibold rounded-full text-xs ${getLogLevelClass(log.level)}`}
                >
                  {log.level}
                </span>
                <span className='ml-2'>{log.message}</span>
              </div>
            ))
          ) : (
            <div className='text-center p-8 text-gray-500'>
              표시할 로그가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
